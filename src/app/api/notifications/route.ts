import { NextRequest } from "next/server";
import { getDatabase } from "@/lib/db";
import { requireRequestSession,sameOrigin } from "@/lib/auth/session";

export async function GET(request:NextRequest){const auth=await requireRequestSession(request);if("error" in auth)return auth.error;const db=await getDatabase();return Response.json(await db.prepare("SELECT id,message,read_at readAt,created_at createdAt FROM notifications WHERE user_id=? AND workspace_id=? ORDER BY created_at DESC").all(auth.session.id,auth.session.workspaceId))}
export async function PATCH(request:NextRequest){if(!sameOrigin(request))return Response.json({error:"Invalid origin"},{status:403});const auth=await requireRequestSession(request);if("error" in auth)return auth.error;const db=await getDatabase();await db.prepare("UPDATE notifications SET read_at=COALESCE(read_at,datetime('now')) WHERE user_id=? AND workspace_id=?").run(auth.session.id,auth.session.workspaceId);return Response.json({ok:true})}
