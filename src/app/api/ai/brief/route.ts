import { NextRequest } from "next/server";
import { z } from "zod";
import { createDemoBrief } from "@/lib/ai/project-brief";

const requestSchema=z.object({projectId:z.string().min(1)});

export async function POST(request:NextRequest){
 const parsed=requestSchema.safeParse(await request.json().catch(()=>null));
 if(!parsed.success)return Response.json({error:"Invalid request"},{status:400});
 return Response.json(createDemoBrief(parsed.data.projectId));
}
