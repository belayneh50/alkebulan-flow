import { describe, expect, it } from "vitest";
import { buildReportHtml, toCsv } from "./export";

describe("export helpers", () => {
  it("escapes quotes, commas, and newlines in CSV cells", () => {
    const csv = toCsv(["name", "note"], [["Plain", "fine"], ['He said "hi"', "a,b"], ["line\nbreak", "c"]]);
    const rows = csv.replace(/^\uFEFF/, "").split("\r\n");
    expect(rows[0]).toBe("name,note");
    expect(rows[1]).toBe("Plain,fine");
    expect(rows[2]).toBe('"He said ""hi""","a,b"');
    expect(rows[3]).toBe('"line\nbreak",c');
  });

  it("produces CRLF line endings and a BOM for Excel compatibility", () => {
    const csv = toCsv(["a"], [["1"]]);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv).toContain("\r\n");
  });

  it("escapes HTML-sensitive characters in the report body", () => {
    const html = buildReportHtml({
      projectName: '<script>alert("x")</script>',
      clientName: "Amara & Sons",
      status: "Review",
      progress: 50,
      due: "2026-09-18",
      budget: 9000,
      summary: "Keep <b>bold</b> out",
      risks: ['Quote " risk & <tag>'],
      nextActions: ["Do the thing"],
      clientUpdate: "Update with 'single' and \"double\" quotes",
      generatedAt: "Sep 15, 2026, 10:00 AM",
      provider: "gemini",
    });
    expect(html).not.toContain("<script>alert");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("Amara &amp; Sons");
    expect(html).toContain("Quote &quot; risk &amp; &lt;tag&gt;");
    expect(html).toContain("Keep &lt;b&gt;bold&lt;/b&gt; out");
  });
});
