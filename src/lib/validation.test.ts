import { describe,expect,it } from "vitest";
import { passwordSchema,projectSchema,taskSchema } from "./validation";
import { validateUploadMetadata } from "./uploads/validation";
describe("request validation",()=>{
 it("requires a strong password",()=>{expect(passwordSchema.safeParse("short").success).toBe(false);expect(passwordSchema.safeParse("LongEnough123").success).toBe(true)});
 it("rejects invalid project progress and task status",()=>{expect(projectSchema.safeParse({clientId:"c1",name:"Project",status:"Planning",progress:101,due:"2026-01-01",budget:0,color:"#166534"}).success).toBe(false);expect(taskSchema.safeParse({title:"Task",projectId:"p1",status:"Unknown",priority:"Low",assignee:"Maya",due:"Soon"}).success).toBe(false)});
 it("rejects oversized and mismatched uploads",()=>{expect(validateUploadMetadata({name:"safe.pdf",type:"application/pdf",size:100})).toBeNull();expect(validateUploadMetadata({name:"fake.exe",type:"application/pdf",size:100})).toMatch(/Unsupported/);expect(validateUploadMetadata({name:"large.pdf",type:"application/pdf",size:6*1024*1024})).toMatch(/5 MB/)})
});
