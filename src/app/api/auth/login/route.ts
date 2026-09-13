import { NextRequest,NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { createSession, sameOrigin, secureCookie, SESSION_COOKIE } from "@/lib/auth/session";
import { allowAttempt } from "@/lib/auth/rate-limit";
import { loginSchema } from "@/lib/validation";

export async function POST(request:NextRequest){
 if(!sameOrigin(request))return Response.json({error:"Invalid origin"},{status:403});
 const key=request.headers.get("x-forwarded-for")??"local"; if(!allowAttempt(`login:${key}`))return Response.json({error:"Try again shortly"},{status:429});
 const parsed=loginSchema.safeParse(await request.json().catch(()=>null)); if(!parsed.success)return Response.json({error:"Invalid credentials"},{status:400});
 const db=getDatabase(); const user=db.prepare("SELECT id,email,password_hash passwordHash FROM users WHERE email=?").get(parsed.data.email) as {id:string;email:string;passwordHash:string}|undefined;
 if(!user||!verifyPassword(parsed.data.password,user.passwordHash))return Response.json({error:"Invalid credentials"},{status:401});
 const membership=db.prepare("SELECT workspace_id workspaceId FROM memberships WHERE user_id=? ORDER BY CASE role WHEN 'owner' THEN 1 WHEN 'admin' THEN 2 ELSE 3 END LIMIT 1").get(user.id) as {workspaceId:string};
 const session=createSession(db,user.id,membership.workspaceId); const response=NextResponse.json({ok:true}); response.cookies.set(SESSION_COOKIE,session.token,secureCookie(session.expires)); return response;
}
