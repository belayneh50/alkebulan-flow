"use client";

import { useCallback, useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Badge, Button, Card, Input } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

function Heading({ title, copy }: { title: string; copy: string }) {
  return <div className="mb-6"><h1 className="text-2xl font-bold tracking-tight md:text-3xl">{title}</h1><p className="mt-1 text-sm text-muted-foreground">{copy}</p></div>;
}

type AuditRow = { id: string; actor: string; action: string; target: string; kind: string; createdAt: string };

const KIND_STYLES: Record<string, string> = {
  task: "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300",
  file: "bg-violet-50 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300",
  project: "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300",
  message: "bg-muted text-muted-foreground",
};

const KINDS = ["", "task", "file", "project", "message"];

export function AuditView({ role }: { role: "owner" | "admin" | "team" }) {
  const [rows, setRows] = useState<AuditRow[] | null>(null);
  const [actor, setActor] = useState("");
  const [action, setAction] = useState("");
  const [kind, setKind] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (actor.trim()) params.set("actor", actor.trim());
      if (action.trim()) params.set("action", action.trim());
      if (kind) params.set("kind", kind);
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      const response = await fetch(`/api/audit?${params.toString()}`);
      if (!response.ok) throw new Error((await response.json()).error ?? "Could not load the audit log");
      setRows(await response.json());
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load the audit log");
      setRows([]);
    }
  }, [actor, action, kind, from, to]);

  useEffect(() => {
    const timer = setTimeout(() => { void load(); }, 250);
    return () => clearTimeout(timer);
  }, [load]);

  const reset = () => { setActor(""); setAction(""); setKind(""); setFrom(""); setTo(""); };
  const fmt = (value: string) => new Date(value.replace(" ", "T") + "Z").toLocaleString("en", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

  if (role === "team") {
    return <div className="animate-rise"><Heading title="Audit log" copy="Owner or admin access required." /><Card className="mx-auto max-w-3xl p-8 text-center text-sm text-muted-foreground">Your role does not include audit access.</Card></div>;
  }

  return (
    <div className="animate-rise">
      <Heading title="Audit log" copy="Every recorded workspace change, filterable by actor, action, type, and date." />
      <Card className="mb-4 p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <Input aria-label="Filter by actor" placeholder="Actor" className="border bg-card pl-9" value={actor} onChange={e => setActor(e.target.value)} />
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <Input aria-label="Filter by action" placeholder="Action" className="border bg-card pl-9" value={action} onChange={e => setAction(e.target.value)} />
          </div>
          <select aria-label="Filter by kind" value={kind} onChange={e => setKind(e.target.value)} className="min-h-10 rounded-xl border bg-card px-3 text-sm">
            {KINDS.map(k => <option key={k || "all"} value={k}>{k ? `Kind: ${k}` : "All kinds"}</option>)}
          </select>
          <Input aria-label="From date" type="date" className="border bg-card" value={from} onChange={e => setFrom(e.target.value)} />
          <Input aria-label="To date" type="date" className="border bg-card" value={to} onChange={e => setTo(e.target.value)} />
        </div>
        <div className="mt-3 flex items-center justify-between">
          <p className="text-xs text-muted-foreground" role="status">{rows === null ? "Loading…" : `${rows.length} entr${rows.length === 1 ? "y" : "ies"} (newest first, max 200)`}</p>
          <Button className="border bg-card text-foreground hover:bg-muted" onClick={reset}>Clear filters</Button>
        </div>
      </Card>
      {error && <p className="mb-3 text-sm text-red-700 dark:text-red-300" role="alert">{error}</p>}
      <Card className="overflow-hidden">
        <div className="grid grid-cols-[130px_110px_1fr_160px] gap-3 border-b bg-muted/60 px-5 py-3 text-xs font-bold text-muted-foreground">
          <span>When</span><span>Kind</span><span>Event</span><span>Target</span>
        </div>
        <div className="max-h-[62vh] overflow-y-auto">
          {rows === null ? <p className="p-8 text-center text-sm text-muted-foreground">Loading…</p>
            : rows.length ? rows.map(r => (
              <div key={r.id} className="grid grid-cols-[130px_110px_1fr_160px] items-center gap-3 px-5 py-3 text-sm not-last:border-b">
                <span className="text-xs text-muted-foreground">{fmt(r.createdAt)}</span>
                <Badge className={cn("justify-center", KIND_STYLES[r.kind] ?? KIND_STYLES.message)}>{r.kind}</Badge>
                <span className="min-w-0"><b>{r.actor}</b> <span className="text-muted-foreground">{r.action}</span></span>
                <span className="truncate text-xs text-muted-foreground">{r.target}</span>
              </div>
            ))
            : <p className="p-8 text-center text-sm text-muted-foreground">No entries match these filters.</p>}
        </div>
      </Card>
    </div>
  );
}
