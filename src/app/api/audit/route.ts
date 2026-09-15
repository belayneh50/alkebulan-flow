import { NextRequest } from "next/server";
import { getDatabase } from "@/lib/db";
import { requireRequestSession } from "@/lib/auth/session";

const KINDS = ["task", "file", "project", "message"] as const;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(request: NextRequest) {
  const auth = await requireRequestSession(request, ["owner", "admin"]);
  if ("error" in auth) return auth.error;
  const { searchParams } = new URL(request.url);
  const actor = (searchParams.get("actor") ?? "").trim().toLowerCase();
  const action = (searchParams.get("action") ?? "").trim().toLowerCase();
  const kind = (searchParams.get("kind") ?? "").trim();
  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";

  const where: string[] = ["workspace_id=?"];
  const args: unknown[] = [auth.session.workspaceId];
  if (actor) { where.push("lower(actor) LIKE ?"); args.push(`%${actor}%`); }
  if (action) { where.push("lower(action) LIKE ?"); args.push(`%${action}%`); }
  if ((KINDS as readonly string[]).includes(kind)) { where.push("kind=?"); args.push(kind); }
  if (ISO_DATE.test(from)) { where.push("date(created_at)>=?"); args.push(from); }
  if (ISO_DATE.test(to)) { where.push("date(created_at)<=?"); args.push(to); }

  const db = await getDatabase();
  const rows = await db.prepare(`SELECT id,actor,action,target,kind,created_at createdAt FROM activities WHERE ${where.join(" AND ")} ORDER BY created_at DESC LIMIT 200`).all(...args);
  return Response.json(rows);
}
