import { describe, expect, it } from "vitest";
import { buildDigestContext, createDigestFallback, digestSchema } from "./digest";

const projects = [
  { name: "Website launch", client: "Amara Studio", status: "Review", progress: 86, due: "2026-09-18" },
  { name: "Patient onboarding", client: "Solace Health", status: "Planning", progress: 18, due: "2026-10-21" },
];
const tasks = [
  { title: "Approve responsive homepage", project: "Website launch", status: "Review", priority: "High", due: "2020-01-01", overdue: true, dueSoon: false },
  { title: "Draft onboarding survey", project: "Patient onboarding", status: "In progress", priority: "Medium", due: "2026-09-20", overdue: false, dueSoon: true },
  { title: "Finished thing", project: "Website launch", status: "Done", priority: "Low", due: "2020-01-01", overdue: true, dueSoon: false },
];

describe("weekly digest", () => {
  it("validates the digest contract", () => {
    expect(digestSchema.safeParse({ headline: "Hi", attention: [] }).success).toBe(true);
    expect(digestSchema.safeParse({ headline: "", attention: [] }).success).toBe(false);
    expect(digestSchema.safeParse({ headline: "Hi", attention: ["x", "y", "z", "a", "b", "c", "d"] }).success).toBe(false);
  });

  it("caps attention items and ignores Done tasks", () => {
    const context = buildDigestContext({ projects, tasks });
    expect(context.overdueTasks.map(t => t.title)).toEqual(["Approve responsive homepage"]);
    expect(context.dueSoonTasks.map(t => t.title)).toEqual(["Draft onboarding survey"]);
    expect(context.projectsInReview.map(p => p.name)).toEqual(["Website launch"]);
  });

  it("builds an actionable fallback with counts in the headline", () => {
    const digest = createDigestFallback({ projects, tasks });
    const parsed = digestSchema.parse(digest);
    expect(parsed.headline).toContain("1 overdue task");
    expect(parsed.attention[0]).toContain("Overdue:");
    expect(parsed.attention.length).toBeGreaterThan(1);
    expect(parsed.attention.length).toBeLessThanOrEqual(6);
  });

  it("stays truthful when the workspace is calm", () => {
    const calm = createDigestFallback({
      projects: [{ name: "Quiet project", client: "C", status: "In progress", progress: 50, due: "2027-01-01" }],
      tasks: [{ title: "Remote task", project: "Quiet project", status: "Backlog", priority: "Low", due: "2027-01-01", overdue: false, dueSoon: false }],
    });
    expect(calm.headline).toContain("All clear");
    expect(calm.attention[0]).toContain("Nothing is overdue");
  });
});
