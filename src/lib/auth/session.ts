import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { getDatabase, type RuntimeDatabase } from "@/lib/db";

export const SESSION_COOKIE="alkebulan_session";
export type SessionUser={id:string;name:string;email:string;workspaceId:string;workspaceName:string;role:"owner"|"admin"|"team"};
const tokenHash=(token:string)=>createHash("sha256").update(token).digest("hex");

export async function createSession(db:RuntimeDatabase,userId:string,workspaceId:string){
 const token=randomBytes(32).toString("base64url"); const expires=new Date(Date.now()+7*864e5);
 await db.prepare("DELETE FROM sessions WHERE expires_at <= datetime('now')").run();
 await db.prepare("INSERT INTO sessions(id_hash,user_id,workspace_id,expires_at) VALUES(?,?,?,?)").run(tokenHash(token),userId,workspaceId,expires.toISOString());
 return {token,expires};
}
export async function revokeSession(db:RuntimeDatabase,token:string){await db.prepare("DELETE FROM sessions WHERE id_hash=?").run(tokenHash(token))}
export async function findSession(db:RuntimeDatabase,token?:string):Promise<SessionUser|null>{
 if(!token)return null;
 return (await db.prepare(`SELECT u.id,u.name,u.email,w.id workspaceId,w.name workspaceName,m.role
 FROM sessions s JOIN users u ON u.id=s.user_id JOIN workspaces w ON w.id=s.workspace_id
 JOIN memberships m ON m.user_id=u.id AND m.workspace_id=w.id
 WHERE s.id_hash=? AND s.expires_at>datetime('now')`).get<SessionUser>(tokenHash(token)))??null;
}
export async function currentSession(){return findSession(await getDatabase(),(await cookies()).get(SESSION_COOKIE)?.value)}
export async function requestSession(request:NextRequest){return findSession(await getDatabase(),request.cookies.get(SESSION_COOKIE)?.value)}
export async function requireRequestSession(request:NextRequest,roles?:SessionUser["role"][]){
 const session=await requestSession(request); if(!session)return {error:Response.json({error:"Unauthorized"},{status:401})} as const;
 if(roles&&!roles.includes(session.role))return {error:Response.json({error:"Forbidden"},{status:403})} as const;
 return {session} as const;
}
export function secureCookie(expires:Date){return {httpOnly:true,sameSite:"strict" as const,secure:process.env.NODE_ENV==="production",path:"/",expires}}
export function sameOrigin(request:NextRequest){const origin=request.headers.get("origin");return !origin||origin===request.nextUrl.origin}
