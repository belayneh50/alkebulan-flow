import { NextRequest } from "next/server";
import { z } from "zod";
import { createDemoBrief } from "@/lib/ai/project-brief";
import { projectBriefSchema } from "@/lib/ai/project-brief";
import { requireRequestSession, sameOrigin } from "@/lib/auth/session";
import { getWorkspaceData } from "@/lib/db/queries";
import { generateText, Output } from "ai";
import { google } from "@ai-sdk/google";

const requestSchema=z.object({projectId:z.string().min(1)});

export async function POST(request:NextRequest){
 if(!sameOrigin(request))return Response.json({error:"Invalid origin"},{status:403});
 const auth=requireRequestSession(request);if("error" in auth)return auth.error;
 const parsed=requestSchema.safeParse(await request.json().catch(()=>null));
 if(!parsed.success)return Response.json({error:"Invalid request"},{status:400});
 if(process.env.GOOGLE_GENERATIVE_AI_API_KEY){
  try{const data=getWorkspaceData(auth.session.workspaceId);const project=data.projects.find(p=>p.id===parsed.data.projectId);if(!project)return Response.json({...createDemoBrief(parsed.data.projectId),provider:"fallback"});const client=data.clients.find(c=>c.id===project.clientId);const tasks=data.tasks.filter(t=>t.projectId===project.id).map(t=>({title:t.title,status:t.status,priority:t.priority,due:t.due}));const context=JSON.stringify({project:{name:project.name,status:project.status,progress:project.progress,due:project.due,budget:project.budget},client:client?.company,tasks});const result=await generateText({model:google(process.env.GEMINI_MODEL||"gemini-3.6-flash"),output:Output.object({schema:projectBriefSchema}),system:"You are Flow AI. Write a concise, strictly factual operations brief from the supplied project data only. Never invent facts, names, dates, or contact details.",prompt:`Project data: ${context}\n\nReturn a factual summary of current state, two realistic risks grounded in the tasks and deadline, three concrete next actions, and a professional client update addressed to ${client?.company??"the client"}.`});return Response.json({...result.output,provider:"gemini"})}catch(error){console.error("[ai/brief] Gemini request failed, serving deterministic fallback:",error);return Response.json({...createDemoBrief(parsed.data.projectId),provider:"fallback"})}
 }
 return Response.json({...createDemoBrief(parsed.data.projectId),provider:"fallback"});
}
