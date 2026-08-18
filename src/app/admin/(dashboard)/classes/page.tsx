"use client";

import { useEffect, useState } from "react";
import { Button, Input, Label, Alert, Card, Select } from "@/components/ui";

type Period = {
  id: string;
  displayName: string;
  month: number;
  year: number;
  status: string;
  feeCount: number;
};
type Session = { id: string; name: string; status: boolean };

function PeriodsSection() {
  const [periods, setPeriods] = useState<Period[]>([]);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/periods")
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && data.periods) setPeriods(data.periods);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/admin/periods", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ month, year }),
    });
    const data = await res.json();
    if (!res.ok) setError(data.error || "Failed to create period.");
    else setRefresh((r) => r + 1);
  }

  async function toggle(p: Period) {
    await fetch(`/api/admin/periods/${p.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: p.status === "ACTIVE" ? "CLOSED" : "ACTIVE",
      }),
    });
    setRefresh((r) => r + 1);
  }

  return (
    <div>
      <Card>
        <form onSubmit={create} className="flex flex-wrap items-end gap-3">
          {error && (
            <div className="w-full">
              <Alert type="error">{error}</Alert>
            </div>
          )}
          <div>
            <Label>Month</Label>
            <Select value={month} onChange={(e) => setMonth(Number(e.target.value))}>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Year</Label>
            <Input
              type="number"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="w-32"
            />
          </div>
          <Button type="submit">Create Period</Button>
        </form>
      </Card>

      <Card className="mt-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              <th className="py-2 font-medium">Period</th>
              <th className="py-2 font-medium">Fees</th>
              <th className="py-2 font-medium">Status</th>
              <th className="py-2 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {periods.map((p) => (
              <tr key={p.id} className="border-b border-slate-100">
                <td className="py-3">{p.displayName}</td>
                <td className="py-3">{p.feeCount}</td>
                <td className="py-3">
                  <span
                    className={
                      p.status === "ACTIVE" ? "text-emerald-600" : "text-slate-400"
                    }
                  >
                    {p.status}
                  </span>
                </td>
                <td className="py-3">
                  <Button variant="secondary" size="sm" onClick={() => toggle(p)}>
                    {p.status === "ACTIVE" ? "Close" : "Reopen"}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function SessionsSection() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/sessions")
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && data.sessions) setSessions(data.sessions);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/admin/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    if (!res.ok) setError(data.error || "Failed to create session.");
    else {
      setName("");
      setRefresh((r) => r + 1);
    }
  }

  async function toggle(s: Session) {
    await fetch(`/api/admin/sessions/${s.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: !s.status }),
    });
    setRefresh((r) => r + 1);
  }

  return (
    <div>
      <Card>
        <form onSubmit={create} className="flex flex-wrap items-end gap-3">
          {error && (
            <div className="w-full">
              <Alert type="error">{error}</Alert>
            </div>
          )}
          <div>
            <Label>Session Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <Button type="submit">Add Session</Button>
        </form>
      </Card>

      <Card className="mt-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              <th className="py-2 font-medium">Name</th>
              <th className="py-2 font-medium">Status</th>
              <th className="py-2 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((s) => (
              <tr key={s.id} className="border-b border-slate-100">
                <td className="py-3">{s.name}</td>
                <td className="py-3">
                  <span className={s.status ? "text-emerald-600" : "text-slate-400"}>
                    {s.status ? "Active" : "Disabled"}
                  </span>
                </td>
                <td className="py-3">
                  <Button variant="secondary" size="sm" onClick={() => toggle(s)}>
                    {s.status ? "Disable" : "Enable"}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

const TABS = [
  { key: "periods", label: "Periods" },
  { key: "sessions", label: "Sessions" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function ClassesPage() {
  const [tab, setTab] = useState<TabKey>("periods");

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Classes</h1>
      <div className="mt-4 flex gap-1 border-b border-slate-200">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium ${
              tab === t.key
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="mt-6">
        {tab === "periods" ? <PeriodsSection /> : <SessionsSection />}
      </div>
    </div>
  );
}
