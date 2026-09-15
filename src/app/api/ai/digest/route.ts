import { NextRequest } from "next/server";
import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { getDatabase } from "@/lib/db";
import { requireRequestSession, sameOrigin } from "@/lib/auth/session";
import { buildDigestContext, createDigestFallback, digestSchema } from "@/lib/ai/digest";

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return Response.json({ error: "Invalid origin" }, { status: 403 });
  const auth = requireRequestSession(request);
  if ("error" in auth) return auth.error;

  const data = getWorkspaceSnapshot(auth.session.workspaceId);
  const fallback = createDigestFallback(data);
  const key = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!key) return Response.json({ ...fallback, provider: "fallback" });

  try {
    const context = buildDigestContext(data);
    const result = await generateText({
      model: google(process.env.GEMINI_MODEL || "gemini-3.6-flash"),
      system: 'You are Flow AI writing a Monday-morning operations digest for a small service business. Use only the supplied workspace context; never invent projects, tasks, dates, or numbers. Reply with ONLY a raw JSON object of shape {"headline": string under 160 characters, "attention": array of at most 6 strings} — no markdown, no code fences, no prose before or after. Each attention item is one concrete action sentence referencing real names and dates from the context.',
      prompt: `Workspace week context: ${JSON.stringify(context)}\n\nWrite the weekly digest.`,
    });
    const raw = result.text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
    const parsed = digestSchema.safeParse(JSON.parse(raw));
    if (parsed.success) return Response.json({ ...parsed.data, provider: "gemini" });
    console.error("[ai/digest] Gemini output failed validation, serving fallback");
    return Response.json({ ...fallback, provider: "fallback" });
  } catch (error) {
    console.error("[ai/digest] Gemini request failed, serving deterministic fallback:", error);
    return Response.json({ ...fallback, provider: "fallback" });
  }
}

type ProjectRow = { id: string; name: string; status: string; progress: number; due: string; clientId: string };
type TaskRow = { id: string; title: string; projectId: string; status: string; priority: string; due: string };

function getWorkspaceSnapshot(workspaceId: string) {
  const db = getDatabase();
  const projects = db.prepare("SELECT id,name,status,progress,due,client_id clientId FROM projects WHERE workspace_id=?").all(workspaceId) as ProjectRow[];
  const clients = db.prepare("SELECT id,company FROM clients WHERE workspace_id=?").all(workspaceId) as Array<{ id: string; company: string }>;
  const tasks = db.prepare("SELECT id,title,project_id projectId,status,priority,due FROM tasks WHERE workspace_id=?").all(workspaceId) as TaskRow[];
  const today = new Date();
  const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const weekIso = (() => { const d = new Date(today); d.setDate(d.getDate() + 7); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; })();
  return {
    projects: projects.map(p => ({ name: p.name, client: clients.find(c => c.id === p.clientId)?.company ?? "Workspace", status: p.status, progress: p.progress, due: p.due })),
    tasks: tasks.map(t => ({ title: t.title, project: projects.find(p => p.id === t.projectId)?.name ?? "Workspace", status: t.status, priority: t.priority, due: t.due, overdue: t.status !== "Done" && t.due < todayIso, dueSoon: t.status !== "Done" && t.due >= todayIso && t.due <= weekIso })),
  };
}
