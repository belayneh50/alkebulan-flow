import { randomUUID } from "node:crypto";
import { NextRequest } from "next/server";
import { getDatabase } from "@/lib/db";
import { requireRequestSession,sameOrigin } from "@/lib/auth/session";
import { clientSchema } from "@/lib/validation";
export async function GET(request:NextRequest){const auth=requireRequestSession(request);if("error" in auth)return auth.error;return Response.json(getDatabase().prepare("SELECT id,name,company,industry,value,tone FROM clients WHERE workspace_id=? ORDER BY created_at").all(auth.session.workspaceId))}
export async function POST(request:NextRequest){if(!sameOrigin(request))return Response.json({error:"Invalid origin"},{status:403});const auth=requireRequestSession(request,["owner","admin"]);if("error" in auth)return auth.error;const parsed=clientSchema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return Response.json({error:parsed.error.issues[0]?.message??"Invalid client"},{status:400});const client={id:randomUUID(),...parsed.data,activeProjects:0};getDatabase().prepare("INSERT INTO clients(id,workspace_id,name,company,industry,value,tone) VALUES(?,?,?,?,?,?,?)").run(client.id,auth.session.workspaceId,client.name,client.company,client.industry,client.value,client.tone);return Response.json(client,{status:201})}
