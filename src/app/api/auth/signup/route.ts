import { randomUUID } from "node:crypto";
import { NextRequest,NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { createSession,sameOrigin,secureCookie,SESSION_COOKIE } from "@/lib/auth/session";
import { signupSchema } from "@/lib/validation";

export async function POST(request:NextRequest){
 if(!sameOrigin(request))return Response.json({error:"Invalid origin"},{status:403});
 const parsed=signupSchema.safeParse(await request.json().catch(()=>null)); if(!parsed.success)return Response.json({error:parsed.error.issues[0]?.message??"Invalid input"},{status:400});
 const db=await getDatabase(); const userId=randomUUID(),workspaceId=randomUUID();
 try{await db.transaction(async()=>{await db.prepare("INSERT INTO users(id,name,email,password_hash) VALUES(?,?,?,?)").run(userId,parsed.data.name,parsed.data.email,hashPassword(parsed.data.password));await db.prepare("INSERT INTO workspaces(id,name,slug) VALUES(?,?,?)").run(workspaceId,parsed.data.workspaceName,`${parsed.data.workspaceName.toLowerCase().replace(/[^a-z0-9]+/g,"-")}-${workspaceId.slice(0,6)}`);await db.prepare("INSERT INTO memberships(user_id,workspace_id,role) VALUES(?,?,?)").run(userId,workspaceId,"owner")});}catch{return Response.json({error:"An account with that email already exists"},{status:409})}
 const session=await createSession(db,userId,workspaceId);const response=NextResponse.json({ok:true},{status:201});response.cookies.set(SESSION_COOKIE,session.token,secureCookie(session.expires));return response;
}
