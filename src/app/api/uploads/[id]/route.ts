import { randomUUID } from "node:crypto";
import { readFile, unlink } from "node:fs/promises";
import { basename, join } from "node:path";
import { del, get } from "@vercel/blob";
import { NextRequest } from "next/server";
import { requireRequestSession, sameOrigin } from "@/lib/auth/session";
import { getDatabase } from "@/lib/db";

type Context = { params: Promise<{ id: string }> };
type FileRow = { originalName: string; storedName: string; mimeType: string };

export async function GET(request: NextRequest, { params }: Context) {
  const auth = await requireRequestSession(request);
  if ("error" in auth) return auth.error;
  const { id } = await params;
  const db = await getDatabase();
  const file = await db.prepare("SELECT original_name originalName,stored_name storedName,mime_type mimeType FROM uploaded_files WHERE id=? AND workspace_id=?").get<FileRow>(id, auth.session.workspaceId);
  if (!file) return Response.json({ error: "File not found" }, { status: 404 });
  try {
    const body = file.storedName.startsWith("https://") ? (await get(file.storedName, { access: "private" }))?.stream : await readFile(join(process.cwd(), "data", "uploads", file.storedName));
    if (!body) return Response.json({ error: "Stored file is unavailable" }, { status: 404 });
    const previewable = file.mimeType === "application/pdf" || file.mimeType.startsWith("image/");
    const safeName = file.originalName.replace(/["\\\r\n]/g, "_");
    return new Response(body, { headers: { "Content-Type": file.mimeType, "Content-Disposition": `${previewable ? "inline" : "attachment"}; filename="${safeName}"`, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
  } catch {
    return Response.json({ error: "Stored file is unavailable" }, { status: 404 });
  }
}

export async function DELETE(request: NextRequest, { params }: Context) {
  if (!sameOrigin(request)) return Response.json({ error: "Invalid origin" }, { status: 403 });
  const auth = await requireRequestSession(request, ["owner", "admin"]);
  if ("error" in auth) return auth.error;
  const { id } = await params;
  const db = await getDatabase();
  const file = await db.prepare("SELECT original_name originalName,stored_name storedName FROM uploaded_files WHERE id=? AND workspace_id=?").get<Pick<FileRow, "originalName" | "storedName">>(id, auth.session.workspaceId);
  if (!file) return Response.json({ error: "File not found" }, { status: 404 });
  if (!file.storedName.startsWith("https://") && basename(file.storedName) !== file.storedName) return Response.json({ error: "Invalid stored file" }, { status: 400 });
  await db.transaction(async () => {
    await db.prepare("DELETE FROM uploaded_files WHERE id=? AND workspace_id=?").run(id, auth.session.workspaceId);
    await db.prepare("INSERT INTO activities(id,workspace_id,actor,action,target,kind) VALUES(?,?,?,?,?,?)").run(randomUUID(), auth.session.workspaceId, auth.session.name, "deleted", file.originalName, "file");
  });
  if (file.storedName.startsWith("https://")) await del(file.storedName).catch(() => undefined);
  else await unlink(join(process.cwd(), "data", "uploads", file.storedName)).catch(() => undefined);
  return new Response(null, { status: 204 });
}
