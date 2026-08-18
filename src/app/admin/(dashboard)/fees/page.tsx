"use client";

import { useEffect, useState } from "react";
import { Button, Input, Label, Select, Alert, Card } from "@/components/ui";

type Period = { id: string; displayName: string };
type Session = { id: string; name: string };
type FeeRow = {
  subjectId: string;
  code: string;
  name: string;
  amount: number | null;
};

export default function AdminFeesPage() {
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
      <h1 className="text-2xl font-bold text-slate-900">Fee Management</h1>

      <Card className="mt-4">
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
