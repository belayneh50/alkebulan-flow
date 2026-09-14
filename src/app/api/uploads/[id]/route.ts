import { randomUUID } from "node:crypto";
import { readFile, unlink } from "node:fs/promises";
import { basename, join } from "node:path";
import { NextRequest } from "next/server";
import { requireRequestSession, sameOrigin } from "@/lib/auth/session";
import { getDatabase } from "@/lib/db";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Context) {
  const auth = requireRequestSession(request);
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const file = getDatabase()
    .prepare("SELECT original_name originalName,stored_name storedName,mime_type mimeType FROM uploaded_files WHERE id=? AND workspace_id=?")
    .get(id, auth.session.workspaceId) as { originalName: string; storedName: string; mimeType: string } | undefined;
  if (!file) return Response.json({ error: "File not found" }, { status: 404 });

  try {
    const bytes = await readFile(join(process.cwd(), "data", "uploads", file.storedName));
    const previewable = file.mimeType === "application/pdf" || file.mimeType.startsWith("image/");
    const safeName = file.originalName.replace(/["\\\r\n]/g, "_");
    return new Response(bytes, {
      headers: {
        "Content-Type": file.mimeType,
        "Content-Disposition": `${previewable ? "inline" : "attachment"}; filename="${safeName}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return Response.json({ error: "Stored file is unavailable" }, { status: 404 });
  }
}

export async function DELETE(request: NextRequest, { params }: Context) {
  if (!sameOrigin(request)) return Response.json({ error: "Invalid origin" }, { status: 403 });
  const auth = requireRequestSession(request, ["owner", "admin"]);
  if ("error" in auth) return auth.error;
  const { id } = await params;
  const db = getDatabase();
  const file = db.prepare("SELECT original_name originalName,stored_name storedName FROM uploaded_files WHERE id=? AND workspace_id=?").get(id, auth.session.workspaceId) as { originalName: string; storedName: string } | undefined;
  if (!file) return Response.json({ error: "File not found" }, { status: 404 });
  if (basename(file.storedName) !== file.storedName) return Response.json({ error: "Invalid stored file" }, { status: 400 });
  db.transaction(() => {
    db.prepare("DELETE FROM uploaded_files WHERE id=? AND workspace_id=?").run(id, auth.session.workspaceId);
    db.prepare("INSERT INTO activities(id,workspace_id,actor,action,target,kind) VALUES(?,?,?,?,?,?)").run(randomUUID(), auth.session.workspaceId, auth.session.name, "deleted", file.originalName, "file");
  })();
  await unlink(join(process.cwd(), "data", "uploads", file.storedName)).catch(() => undefined);
  return new Response(null, { status: 204 });
}
