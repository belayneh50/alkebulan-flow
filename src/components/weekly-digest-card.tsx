"use client";

import { useState } from "react";
import { CalendarClock, Copy, Download, Sparkles } from "lucide-react";
import { Badge, Button, Card } from "@/components/ui/primitives";
import { openPrintReport } from "@/lib/export";

type Digest = { headline: string; attention: string[]; provider?: string };

async function fetchDigest(): Promise<Digest> {
  const response = await fetch("/api/ai/digest", { method: "POST" });
  return response.json();
}

function digestReport(digest: Digest) {
  return {
    projectName: "Weekly operations digest",
    clientName: "Internal — all clients",
    status: "",
    progress: 0,
    due: "",
    budget: 0,
    summary: digest.headline,
    risks: [] as string[],
    nextActions: digest.attention,
    clientUpdate: [digest.headline, "", ...digest.attention.map(a => `• ${a}`)].join("\n"),
    generatedAt: new Date().toLocaleString("en", { dateStyle: "medium", timeStyle: "short" }),
    provider: digest.provider === "gemini" ? "Generated with Gemini from live workspace data" : "Deterministic fallback (no AI key)",
  };
}

export function WeeklyDigestCard() {
  const [digest, setDigest] = useState<Digest | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setDigest(await fetchDigest());
    } finally {
      setLoading(false);
    }
  };

  const downloadPdf = async () => {
    setLoading(true);
    try {
      openPrintReport(digestReport(await fetchDigest()));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mt-6 p-5 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-bold"><CalendarClock className="size-5 text-emerald-700 dark:text-emerald-400" />Weekly AI digest</h2>
          <p className="text-xs text-muted-foreground">Monday-morning priorities across every active project, grounded in live workspace data.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={load} disabled={loading}>{loading ? "Analyzing…" : digest ? "Refresh digest" : "Generate digest"}{loading ? undefined : <Sparkles className="size-4" />}</Button>
          {digest && <>
            <Button className="border bg-card text-foreground hover:bg-muted" onClick={downloadPdf}><Download className="size-4" />PDF</Button>
            <Button className="border bg-card text-foreground hover:bg-muted" onClick={async () => { await navigator.clipboard.writeText([digest.headline, "", ...digest.attention.map(a => `• ${a}`)].join("\n")); setCopied(true); setTimeout(() => setCopied(false), 2000); }}><Copy className="size-4" />{copied ? "Copied!" : "Copy"}</Button>
          </>}
        </div>
      </div>
      {digest && (
        <div className="mt-5">
          <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">{digest.provider === "gemini" ? "Gemini · live workspace data" : "Deterministic fallback"}</Badge>
          <p className="mt-3 text-sm font-semibold leading-6">{digest.headline}</p>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
            {digest.attention.map((item, i) => <li key={i}>• {item}</li>)}
          </ul>
        </div>
      )}
    </Card>
  );
}
