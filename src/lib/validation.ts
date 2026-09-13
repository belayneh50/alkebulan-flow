import { z } from "zod";
export const emailSchema=z.string().trim().toLowerCase().email().max(254);
export const passwordSchema=z.string().min(12).max(128).regex(/[A-Z]/,"Add an uppercase letter").regex(/[a-z]/,"Add a lowercase letter").regex(/\d/,"Add a number");
export const loginSchema=z.object({email:emailSchema,password:z.string().min(1).max(128)});
export const signupSchema=z.object({name:z.string().trim().min(2).max(80),workspaceName:z.string().trim().min(2).max(80),email:emailSchema,password:passwordSchema});
export const taskSchema=z.object({title:z.string().trim().min(2).max(160),projectId:z.string().min(1),status:z.enum(["Backlog","In progress","Review","Done"]).default("Backlog"),priority:z.enum(["Low","Medium","High"]).default("Medium"),assignee:z.string().trim().min(1).max(80),due:z.string().trim().min(1).max(30)});
export const taskPatchSchema=taskSchema.partial().refine(v=>Object.keys(v).length>0,"No changes provided");
export const clientSchema=z.object({name:z.string().trim().min(2).max(100),company:z.string().trim().min(2).max(120),industry:z.string().trim().max(80).default(""),value:z.number().int().min(0).max(100_000_000).default(0),tone:z.string().trim().max(120).default("")});
export const projectSchema=z.object({clientId:z.string().min(1),name:z.string().trim().min(2).max(140),status:z.enum(["Planning","In progress","Review","Completed","On hold"]).default("Planning"),progress:z.number().int().min(0).max(100).default(0),due:z.string().date(),budget:z.number().int().min(0).max(100_000_000).default(0),color:z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#166534")});
