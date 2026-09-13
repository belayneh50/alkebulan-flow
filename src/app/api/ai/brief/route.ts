import { NextRequest } from "next/server";
import { z } from "zod";
import { createDemoBrief } from "@/lib/ai/project-brief";
import { projectBriefSchema } from "@/lib/ai/project-brief";
import { requireRequestSession, sameOrigin } from "@/lib/auth/session";
import { generateText, Output } from "ai";
import { google } from "@ai-sdk/google";

const requestSchema=z.object({projectId:z.string().min(1)});

export async function POST(request:NextRequest){
 if(!sameOrigin(request))return Response.json({error:"Invalid origin"},{status:403});
 const auth=requireRequestSession(request);if("error" in auth)return auth.error;
 const parsed=requestSchema.safeParse(await request.json().catch(()=>null));
 if(!parsed.success)return Response.json({error:"Invalid request"},{status:400});
 if(process.env.GOOGLE_GENERATIVE_AI_API_KEY){
  try{const result=await generateText({model:google(process.env.GEMINI_MODEL||"gemini-2.5-flash"),output:Output.object({schema:projectBriefSchema}),prompt:`Create a concise operations brief for project ${parsed.data.projectId}. Return a factual summary, two risks, three next actions, and a professional client update. Do not invent contact details.`});return Response.json({...result.output,provider:"gemini"})}catch{return Response.json({...createDemoBrief(parsed.data.projectId),provider:"fallback"})}
 }
 return Response.json({...createDemoBrief(parsed.data.projectId),provider:"fallback"});
}
