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

export default function AdminPeriodsPage() {
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
      <h1 className="text-2xl font-bold text-slate-900">Class Periods</h1>

      <Card className="mt-4">
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
