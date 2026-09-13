import { describe, expect, it } from "vitest";
import { createDemoBrief, projectBriefSchema } from "./project-brief";

describe("project brief fallback",()=>{
 it("returns a valid structured brief",()=>{expect(projectBriefSchema.safeParse(createDemoBrief("p2")).success).toBe(true)});
 it("includes actionable recommendations",()=>{expect(createDemoBrief("p2").nextActions.length).toBeGreaterThanOrEqual(3)});
 it("does not expose public contact details",()=>{expect(JSON.stringify(createDemoBrief("p2"))).not.toMatch(/\+\d{7,}|@[\w.-]+\.(com|net|org)/)});
});
