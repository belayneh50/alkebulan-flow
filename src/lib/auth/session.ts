import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { getDatabase, type AppDatabase } from "@/lib/db";

export const SESSION_COOKIE="alkebulan_session";
export type SessionUser={id:string;name:string;email:string;workspaceId:string;workspaceName:string;role:"owner"|"admin"|"team"};
const tokenHash=(token:string)=>createHash("sha256").update(token).digest("hex");

export function createSession(db:AppDatabase,userId:string,workspaceId:string){
 const token=randomBytes(32).toString("base64url"); const expires=new Date(Date.now()+7*864e5);
 db.prepare("DELETE FROM sessions WHERE expires_at <= datetime('now')").run();
 db.prepare("INSERT INTO sessions(id_hash,user_id,workspace_id,expires_at) VALUES(?,?,?,?)").run(tokenHash(token),userId,workspaceId,expires.toISOString());
 return {token,expires};
}
export function revokeSession(db:AppDatabase,token:string){db.prepare("DELETE FROM sessions WHERE id_hash=?").run(tokenHash(token))}
export function findSession(db:AppDatabase,token?:string):SessionUser|null{
 if(!token)return null;
 return (db.prepare(`SELECT u.id,u.name,u.email,w.id workspaceId,w.name workspaceName,m.role
 FROM sessions s JOIN users u ON u.id=s.user_id JOIN workspaces w ON w.id=s.workspace_id
 JOIN memberships m ON m.user_id=u.id AND m.workspace_id=w.id
 WHERE s.id_hash=? AND s.expires_at>datetime('now')`).get(tokenHash(token)) as SessionUser|undefined)??null;
}
export async function currentSession(){return findSession(getDatabase(),(await cookies()).get(SESSION_COOKIE)?.value)}
export function requestSession(request:NextRequest){return findSession(getDatabase(),request.cookies.get(SESSION_COOKIE)?.value)}
export function requireRequestSession(request:NextRequest,roles?:SessionUser["role"][]){
 const session=requestSession(request); if(!session)return {error:Response.json({error:"Unauthorized"},{status:401})} as const;
 if(roles&&!roles.includes(session.role))return {error:Response.json({error:"Forbidden"},{status:403})} as const;
 return {session} as const;
}
export function secureCookie(expires:Date){return {httpOnly:true,sameSite:"strict" as const,secure:process.env.NODE_ENV==="production",path:"/",expires}}
export function sameOrigin(request:NextRequest){const origin=request.headers.get("origin");return !origin||origin===request.nextUrl.origin}
