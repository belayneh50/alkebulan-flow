import { z } from "zod";

export const projectBriefSchema=z.object({summary:z.string(),risks:z.array(z.string()),nextActions:z.array(z.string()),clientUpdate:z.string()});
export type ProjectBrief=z.infer<typeof projectBriefSchema>;

export function createDemoBrief(projectId:string):ProjectBrief{
 const context=projectId==="p2"?"Website launch":"Selected project";
 return {summary:`The ${context} is 86% complete and has moved into final review. Core design and content work are finished; responsive approval and accessibility review are the remaining delivery gates.`,risks:["Two review tasks are due within 48 hours.","Final client approval may affect the planned launch window."],nextActions:["Confirm homepage approval with Amara Studio.","Resolve accessibility notes and record the decision.","Prepare the production launch checklist."],clientUpdate:"Hi Amara team — the website launch is now 86% complete and in final review. This week we finished the brand asset package and moved the responsive homepage into approval. Our next focus is closing accessibility notes and preparing the launch checklist. We remain on track for the September 18 target, pending final homepage approval."};
}
