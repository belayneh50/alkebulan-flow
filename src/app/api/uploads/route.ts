import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { del, put } from "@vercel/blob";
import { NextRequest } from "next/server";
import { getDatabase } from "@/lib/db";
import { requireRequestSession, sameOrigin } from "@/lib/auth/session";
import { ALLOWED_UPLOADS, validateUploadMetadata } from "@/lib/uploads/validation";

export async function GET(request: NextRequest) {
  const auth = await requireRequestSession(request);
  if ("error" in auth) return auth.error;
  const db = await getDatabase();
  return Response.json(await db.prepare("SELECT id,project_id projectId,original_name originalName,mime_type mimeType,size,created_at createdAt FROM uploaded_files WHERE workspace_id=? ORDER BY created_at DESC").all(auth.session.workspaceId));
}

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return Response.json({ error: "Invalid origin" }, { status: 403 });
  const auth = await requireRequestSession(request);
  if ("error" in auth) return auth.error;
  const form = await request.formData();
  const file = form.get("file");
  const projectId = String(form.get("projectId") || "") || null;
  if (!(file instanceof File)) return Response.json({ error: "File is required" }, { status: 400 });
  const validationError = validateUploadMetadata(file);
  if (validationError) return Response.json({ error: validationError }, { status: 400 });
  const expectedExt = ALLOWED_UPLOADS.get(file.type)!;
  const db = await getDatabase();
  if (projectId && !await db.prepare("SELECT id FROM projects WHERE id=? AND workspace_id=?").get(projectId, auth.session.workspaceId)) return Response.json({ error: "Project not found" }, { status: 404 });
  const id = randomUUID();
  const fileName = `${id}${expectedExt}`;
  let storedName = fileName;
  try {
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const blob = await put(`workspaces/${auth.session.workspaceId}/${fileName}`, file, { access: "private", addRandomSuffix: false });
      storedName = blob.url;
    } else {
      const dir = join(process.cwd(), "data", "uploads");
      await mkdir(dir, { recursive: true });
      await writeFile(join(dir, fileName), Buffer.from(await file.arrayBuffer()), { flag: "wx" });
    }
    await db.transaction(async () => {
      await db.prepare("INSERT INTO uploaded_files(id,workspace_id,project_id,uploader_id,original_name,stored_name,mime_type,size) VALUES(?,?,?,?,?,?,?,?)").run(id, auth.session.workspaceId, projectId, auth.session.id, file.name, storedName, file.type, file.size);
      await db.prepare("INSERT INTO activities(id,workspace_id,actor,action,target,kind) VALUES(?,?,?,?,?,?)").run(randomUUID(), auth.session.workspaceId, auth.session.name, "uploaded", file.name, "file");
    });
    return Response.json({ id, projectId, originalName: file.name, mimeType: file.type, size: file.size }, { status: 201 });
  } catch (error) {
    if (storedName.startsWith("https://")) await del(storedName).catch(() => undefined);
    console.error("[uploads] Failed to persist file:", error);
    return Response.json({ error: "Unable to store this file" }, { status: 500 });
  }
}
