import { z } from "zod";

export const digestSchema = z.object({
  headline: z.string().min(1).max(200),
  attention: z.array(z.string().min(1).max(240)).max(6),
});
export type WeeklyDigest = z.infer<typeof digestSchema>;

export type DigestInput = {
  projects: Array<{ name: string; client: string; status: string; progress: number; due: string }>;
  tasks: Array<{ title: string; project: string; status: string; priority: string; due: string; overdue: boolean; dueSoon: boolean }>;
};

const isoToday = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
const addDaysIso = (days: number) => { const d = new Date(); d.setDate(d.getDate() + days); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
const fmt = (iso: string) => { try { return new Date(`${iso}T00:00:00`).toLocaleDateString("en", { month: "short", day: "numeric" }); } catch { return iso; } };

export function buildDigestContext(input: DigestInput) {
  const today = isoToday();
  const weekAhead = addDaysIso(7);
  return {
    today,
    weekAhead,
    projects: input.projects,
    openTasks: input.tasks.filter(t => t.status !== "Done"),
    overdueTasks: input.tasks.filter(t => t.status !== "Done" && t.overdue),
    dueSoonTasks: input.tasks.filter(t => t.status !== "Done" && !t.overdue && t.due >= today && t.due <= weekAhead),
    projectsInReview: input.projects.filter(p => p.status === "Review"),
  };
}

export function createDigestFallback(input: DigestInput): WeeklyDigest {
  const c = buildDigestContext(input);
  const attention: string[] = [];
  for (const t of c.overdueTasks.slice(0, 3)) attention.push(`Overdue: “${t.title}” (${t.project}) was due ${fmt(t.due)} — reschedule or finish it today.`);
  for (const t of c.dueSoonTasks.slice(0, 3)) attention.push(`Due ${fmt(t.due)}: “${t.title}” (${t.project}), ${t.priority.toLowerCase()} priority.`);
  for (const p of c.projectsInReview.slice(0, 2)) attention.push(`“${p.name}” for ${p.client} is ${p.progress}% complete and waiting in review — chase approval to unlock delivery.`);
  if (!attention.length) attention.push("Nothing is overdue this week. Use the calm to pull one Backlog task forward.");
  const overdueCount = c.overdueTasks.length;
  const headline = overdueCount
    ? `${overdueCount} overdue task${overdueCount === 1 ? "" : "s"} and ${c.dueSoonTasks.length} due within 7 days across ${c.projects.length} active projects.`
    : c.dueSoonTasks.length
      ? `${c.dueSoonTasks.length} task${c.dueSoonTasks.length === 1 ? "" : "s"} due within 7 days — nothing overdue across ${c.projects.length} active projects.`
      : `All clear: no overdue or imminent deadlines across ${c.projects.length} active projects.`;
  return { headline, attention: attention.slice(0, 6) };
}
