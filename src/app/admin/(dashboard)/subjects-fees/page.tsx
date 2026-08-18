"use client";

import { useEffect, useState } from "react";
import { Button, Input, Label, Select, Alert, Card } from "@/components/ui";

type Subject = { id: string; code: string; name: string; status: boolean };
type Period = { id: string; displayName: string };
type Session = { id: string; name: string };
type FeeRow = {
  subjectId: string;
  code: string;
  name: string;
  amount: number | null;
};

function SubjectsSection() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/subjects")
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && data.subjects) setSubjects(data.subjects);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/admin/subjects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, name }),
    });
    const data = await res.json();
    if (!res.ok) setError(data.error || "Failed to create subject.");
    else {
      setCode("");
      setName("");
      setRefresh((r) => r + 1);
    }
  }

  async function toggle(s: Subject) {
    await fetch(`/api/admin/subjects/${s.id}`, {
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
            <Label>Code</Label>
            <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="CHEM" required />
          </div>
          <div>
            <Label>Subject Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Chemistry" required />
          </div>
          <Button type="submit">Add Subject</Button>
        </form>
      </Card>

      <Card className="mt-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              <th className="py-2 font-medium">Code</th>
              <th className="py-2 font-medium">Subject</th>
              <th className="py-2 font-medium">Status</th>
              <th className="py-2 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {subjects.map((s) => (
              <tr key={s.id} className="border-b border-slate-100">
                <td className="py-3 font-mono">{s.code}</td>
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

function FeesSection() {
  const [periods, setPeriods] = useState<Period[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [periodId, setPeriodId] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [rows, setRows] = useState<FeeRow[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/periods")
      .then((r) => r.json())
      .then((d) => {
        setPeriods(d.periods ?? []);
        if (d.periods?.length) setPeriodId(d.periods[0].id);
      })
      .catch(() => {});
    fetch("/api/admin/sessions")
      .then((r) => r.json())
      .then((d) => {
        setSessions(d.sessions ?? []);
        if (d.sessions?.length) setSessionId(d.sessions[0].id);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!periodId || !sessionId) return;
    let cancelled = false;
    fetch(`/api/admin/fees?periodId=${periodId}&sessionId=${sessionId}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data.error) setError(data.error);
        else setRows(data.fees ?? []);
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load fees.");
      });
    return () => {
      cancelled = true;
    };
  }, [periodId, sessionId]);

  function setAmount(subjectId: string, value: string) {
    setRows((prev) =>
      prev.map((r) =>
        r.subjectId === subjectId ? { ...r, amount: value === "" ? null : Number(value) } : r
      )
    );
  }

  async function save() {
    setError("");
    setMessage("");
    const fees = rows
      .filter((r) => r.amount !== null && r.amount > 0)
      .map((r) => ({ subjectId: r.subjectId, amount: r.amount as number }));
    const res = await fetch("/api/admin/fees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ periodId, sessionId, fees }),
    });
    const data = await res.json();
    if (!res.ok) setError(data.error || "Failed to save fees.");
    else setMessage("Fees saved.");
  }

  return (
    <div>
      <Card>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <Label>Month</Label>
            <Select value={periodId} onChange={(e) => setPeriodId(e.target.value)}>
              {periods.map((p) => (
                <option key={p.id} value={p.id}>{p.displayName}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Session</Label>
            <Select value={sessionId} onChange={(e) => setSessionId(e.target.value)}>
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </Select>
          </div>
          <Button onClick={save}>Save Fees</Button>
        </div>
        {message && (
          <div className="mt-3">
            <Alert type="success">{message}</Alert>
          </div>
        )}
        {error && (
          <div className="mt-3">
            <Alert type="error">{error}</Alert>
          </div>
        )}
      </Card>

      <Card className="mt-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              <th className="py-2 font-medium">Code</th>
              <th className="py-2 font-medium">Subject</th>
              <th className="py-2 font-medium">Fee (Rs.)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.subjectId} className="border-b border-slate-100">
                <td className="py-3 font-mono">{r.code}</td>
                <td className="py-3">{r.name}</td>
                <td className="py-3">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={r.amount ?? ""}
                    onChange={(e) => setAmount(r.subjectId, e.target.value)}
                    className="w-40"
                    placeholder="Not set"
                  />
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
  { key: "subjects", label: "Subjects" },
  { key: "fees", label: "Fees" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function SubjectsFeesPage() {
  const [tab, setTab] = useState<TabKey>("subjects");

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Subjects &amp; Fees</h1>
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
        {tab === "subjects" ? <SubjectsSection /> : <FeesSection />}
      </div>
    </div>
  );
}
