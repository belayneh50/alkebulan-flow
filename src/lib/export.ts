// Client-side export helpers: CSV downloads and a print-ready PDF report window.

// Built via fromCharCode so bundlers/minifiers cannot strip the BOM the way they strip a literal U+FEFF.
const EXCEL_BOM = String.fromCharCode(0xfeff);

export function toCsv(headers: string[], rows: Array<Array<string | number>>): string {
  const escape = (value: string | number) => {
    const s = String(value);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return `${EXCEL_BOM}${[headers, ...rows].map(row => row.map(escape).join(",")).join("\r\n")}`;
}

export function downloadCsv(filename: string, headers: string[], rows: Array<Array<string | number>>) {
  const blob = new Blob([toCsv(headers, rows)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function downloadJson(filename: string, data: string) {
  const blob = new Blob([data], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export type ReportInput = {
  projectName: string;
  clientName: string;
  status: string;
  progress: number;
  due: string;
  budget: number;
  summary: string;
  risks: string[];
  nextActions: string[];
  clientUpdate: string;
  generatedAt: string;
  provider: string;
};

export function buildReportHtml(report: ReportInput): string {
  const fmtDate = (iso: string) => {
    try { return new Date(`${iso}T00:00:00`).toLocaleDateString("en", { year: "numeric", month: "long", day: "numeric" }); }
    catch { return iso; }
  };
  const list = (items: string[]) => items.map(item => `<li>${escapeHtml(item)}</li>`).join("");
  const budget = `$${report.budget.toLocaleString("en")}`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${escapeHtml(report.projectName)} — project report</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body { font: 14px/1.65 ui-sans-serif, system-ui, "Segoe UI", sans-serif; color: #14201a; max-width: 720px; margin: 40px auto; padding: 0 24px; }
  header { border-bottom: 3px solid #059669; padding-bottom: 16px; margin-bottom: 24px; }
  .eyebrow { font-size: 11px; letter-spacing: .16em; text-transform: uppercase; color: #047857; font-weight: 700; margin: 0 0 6px; }
  h1 { font-size: 26px; margin: 0 0 4px; }
  h2 { font-size: 15px; margin: 28px 0 8px; color: #065f46; }
  .meta { display: flex; flex-wrap: wrap; gap: 18px; margin-top: 14px; font-size: 13px; color: #3f5449; }
  .meta b { display: block; font-size: 11px; text-transform: uppercase; letter-spacing: .08em; color: #6b7f74; font-weight: 700; }
  ul { margin: 6px 0; padding-left: 20px; }
  li { margin: 4px 0; }
  .update { background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 12px; padding: 14px 16px; white-space: pre-wrap; }
  footer { margin-top: 36px; padding-top: 12px; border-top: 1px solid #d7e2dc; font-size: 11px; color: #6b7f74; }
  .bar { background: #d1fae5; border-radius: 99px; height: 8px; overflow: hidden; margin-top: 6px; max-width: 320px; }
  .bar span { display: block; height: 100%; background: #059669; }
  @media print { body { margin: 12mm auto; } }
</style>
</head>
<body>
<header>
  <p class="eyebrow">Alkebulan Flow — project report</p>
  <h1>${escapeHtml(report.projectName)}</h1>
  <div class="meta">
    <span><b>Client</b>${escapeHtml(report.clientName)}</span>
    <span><b>Status</b>${escapeHtml(report.status)}</span>
    <span><b>Progress</b>${report.progress}%<span class="bar"><span style="width:${report.progress}%"></span></span></span>
    <span><b>Due</b>${fmtDate(report.due)}</span>
    <span><b>Budget</b>${escapeHtml(budget)}</span>
  </div>
</header>
<h2>Summary</h2>
<p>${escapeHtml(report.summary)}</p>
<h2>Risks</h2>
<ul>${list(report.risks)}</ul>
<h2>Next actions</h2>
<ul>${list(report.nextActions)}</ul>
<h2>Client-ready update</h2>
<div class="update">${escapeHtml(report.clientUpdate)}</div>
<footer>Generated ${escapeHtml(report.generatedAt)} · ${escapeHtml(report.provider)} · Data source: live workspace records</footer>
<script>window.addEventListener("load", () => setTimeout(() => window.print(), 150));</script>
</body>
</html>`;
}

export function openPrintReport(report: ReportInput) {
  const win = window.open("", "_blank", "width=820,height=920");
  if (!win) return false;
  win.document.write(buildReportHtml(report));
  win.document.close();
  return true;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]!);
}
