import { NextRequest,NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import { revokeSession,sameOrigin,SESSION_COOKIE } from "@/lib/auth/session";
export async function POST(request:NextRequest){if(!sameOrigin(request))return Response.json({error:"Invalid origin"},{status:403});const token=request.cookies.get(SESSION_COOKIE)?.value;if(token)revokeSession(getDatabase(),token);const response=NextResponse.json({ok:true});response.cookies.set(SESSION_COOKIE,"",{httpOnly:true,sameSite:"strict",secure:process.env.NODE_ENV==="production",path:"/",maxAge:0});return response}
