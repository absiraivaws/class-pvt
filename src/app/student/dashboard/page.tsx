"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Select, Label, Alert, Card } from "@/components/ui";

type Period = { id: string; displayName: string };
type Session = { id: string; name: string };
type Subject = { id: string; name: string; amount: number; paid: boolean };

export default function DashboardPage() {
  const router = useRouter();

  const [periods, setPeriods] = useState<Period[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [periodId, setPeriodId] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/class-periods")
      .then((r) => r.json())
      .then((d) => {
        setPeriods(d.periods ?? []);
        if (d.periods?.length) setPeriodId(d.periods[0].id);
      })
      .catch(() => {});
    fetch("/api/class-sessions")
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
    fetch(`/api/fees?periodId=${periodId}&sessionId=${sessionId}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setLoading(false);
        if (data.error) {
          setError(data.error);
          setSubjects([]);
        } else {
          setSubjects(data.subjects ?? []);
        }
        setSelected(new Set());
      })
      .catch(() => {
        if (!cancelled) {
          setLoading(false);
          setError("Failed to load subjects.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [periodId, sessionId]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const total = subjects
    .filter((s) => selected.has(s.id))
    .reduce((sum, s) => sum + s.amount, 0);

  async function proceed() {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classPeriodId: periodId,
          sessionId,
          subjectIds: Array.from(selected),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create invoice.");
        return;
      }
      router.push(`/student/payment?invoiceId=${data.invoice.id}`);
    } catch {
      setError("Network error.");
    } finally {
      setSubmitting(false);
    }
  }

  const selectedSubjects = subjects.filter((s) => selected.has(s.id));

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <h2 className="text-xl font-semibold text-slate-900">Class Payment</h2>
        <p className="text-sm text-slate-500">
          Select a period, class time, and subjects to generate an invoice.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Month / Year</Label>
            <Select value={periodId} onChange={(e) => setPeriodId(e.target.value)}>
              {periods.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.displayName}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Class Time</Label>
            <Select
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
            >
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {error && (
          <div className="mt-4">
            <Alert type="error">{error}</Alert>
          </div>
        )}

        <div className="mt-6">
          <h3 className="mb-2 font-medium text-slate-700">Available Subjects</h3>
          {loading ? (
            <p className="text-sm text-slate-500">Loading subjects…</p>
          ) : subjects.length === 0 ? (
            <p className="text-sm text-slate-500">
              No subjects available for this period and session.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {subjects.map((s) => (
                <label
                  key={s.id}
                  className="flex items-center justify-between py-3"
                >
                  <span className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      disabled={s.paid}
                      checked={selected.has(s.id)}
                      onChange={() => toggle(s.id)}
                      className="h-4 w-4 rounded border-slate-300 text-indigo-600"
                    />
                    <span className={s.paid ? "text-slate-400" : "text-slate-800"}>
                      {s.name}
                    </span>
                  </span>
                  <span className="text-sm">
                    {s.paid ? (
                      <span className="font-semibold text-emerald-600">PAID ✓</span>
                    ) : (
                      <span className="text-slate-700">
                        Rs. {s.amount.toLocaleString("en-LK")}
                      </span>
                    )}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>
      </Card>

      <div className="space-y-4">
        <Card>
          <h3 className="font-medium text-slate-700">Selected Subjects</h3>
          {selectedSubjects.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">None selected.</p>
          ) : (
            <ul className="mt-2 space-y-1 text-sm">
              {selectedSubjects.map((s) => (
                <li key={s.id} className="flex justify-between">
                  <span>{s.name}</span>
                  <span className="text-slate-600">
                    Rs. {s.amount.toLocaleString("en-LK")}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-4 border-t border-slate-200 pt-3">
            <div className="flex justify-between font-semibold text-slate-900">
              <span>Total</span>
              <span>Rs. {total.toLocaleString("en-LK")}</span>
            </div>
          </div>
          <Button
            onClick={proceed}
            disabled={selected.size === 0 || submitting}
            className="mt-4 w-full"
          >
            {submitting ? "Creating invoice…" : "Proceed to Invoice"}
          </Button>
        </Card>
      </div>
    </div>
  );
}
