"use client";

import { useEffect, useState } from "react";
import { Button, Input, Select, Label, Card } from "@/components/ui";
import { formatLKR } from "@/lib/utils";

type Period = { id: string; displayName: string };

export default function AdminReportsPage() {
  const [periods, setPeriods] = useState<Period[]>([]);
  const [dailyDate, setDailyDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [daily, setDaily] = useState<{ rows: { subjectName: string; total: number }[]; total: number } | null>(null);

  const [outPeriod, setOutPeriod] = useState("");
  const [outstanding, setOutstanding] = useState<
    { rows: { sid: string; name: string; stream: string; paidCount: number; totalSubjects: number; outstanding: number }[] } | null
  >(null);

  const [payFrom, setPayFrom] = useState("");
  const [payTo, setPayTo] = useState("");
  const [payStatus, setPayStatus] = useState("");
  const [payments, setPayments] = useState<{ total: number; payments: unknown[] } | null>(null);

  useEffect(() => {
    fetch("/api/admin/periods")
      .then((r) => r.json())
      .then((d) => {
        setPeriods(d.periods ?? []);
        if (d.periods?.length) setOutPeriod(d.periods[0].id);
      })
      .catch(() => {});
  }, []);

  async function loadDaily() {
    const res = await fetch(`/api/admin/reports/daily?date=${dailyDate}`);
    setDaily(await res.json());
  }

  async function loadOutstanding() {
    const res = await fetch(`/api/admin/reports/outstanding?periodId=${outPeriod}`);
    setOutstanding(await res.json());
  }

  async function loadPayments() {
    const params = new URLSearchParams();
    if (payFrom) params.set("from", payFrom);
    if (payTo) params.set("to", payTo);
    if (payStatus) params.set("status", payStatus);
    const res = await fetch(`/api/admin/reports/payments?${params}`);
    setPayments(await res.json());
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-slate-900">Reports</h1>

      <Card>
        <h2 className="text-lg font-semibold text-slate-900">Daily Collection</h2>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <div>
            <Label>Date</Label>
            <Input type="date" value={dailyDate} onChange={(e) => setDailyDate(e.target.value)} />
          </div>
          <Button onClick={loadDaily}>View</Button>
          <a
            href={`/api/admin/reports/daily?date=${dailyDate}&format=xlsx`}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Export Excel
          </a>
        </div>
        {daily && (
          <table className="mt-4 w-full max-w-md text-sm">
            <tbody>
              {daily.rows.map((r) => (
                <tr key={r.subjectName} className="border-b border-slate-100">
                  <td className="py-2">{r.subjectName}</td>
                  <td className="py-2 text-right">{formatLKR(r.total)}</td>
                </tr>
              ))}
              <tr>
                <td className="py-2 font-semibold">Total</td>
                <td className="py-2 text-right font-semibold">{formatLKR(daily.total)}</td>
              </tr>
            </tbody>
          </table>
        )}
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-slate-900">Outstanding Students</h2>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <div>
            <Label>Period</Label>
            <Select value={outPeriod} onChange={(e) => setOutPeriod(e.target.value)}>
              {periods.map((p) => (
                <option key={p.id} value={p.id}>{p.displayName}</option>
              ))}
            </Select>
          </div>
          <Button onClick={loadOutstanding}>View</Button>
          <a
            href={`/api/admin/reports/outstanding?periodId=${outPeriod}&format=xlsx`}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Export Excel
          </a>
        </div>
        {outstanding && (
          <table className="mt-4 w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="py-2 font-medium">SID</th>
                <th className="py-2 font-medium">Name</th>
                <th className="py-2 font-medium">Stream</th>
                <th className="py-2 font-medium">Paid</th>
                <th className="py-2 font-medium">Outstanding</th>
              </tr>
            </thead>
            <tbody>
              {outstanding.rows.map((r) => (
                <tr key={r.sid} className="border-b border-slate-100">
                  <td className="py-2">{r.sid}</td>
                  <td className="py-2">{r.name}</td>
                  <td className="py-2">{r.stream}</td>
                  <td className="py-2">{r.paidCount}/{r.totalSubjects}</td>
                  <td className="py-2">{r.outstanding}</td>
                </tr>
              ))}
              {outstanding.rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-slate-500">
                    No outstanding students.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-slate-900">Payments Report</h2>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <div>
            <Label>From</Label>
            <Input type="date" value={payFrom} onChange={(e) => setPayFrom(e.target.value)} />
          </div>
          <div>
            <Label>To</Label>
            <Input type="date" value={payTo} onChange={(e) => setPayTo(e.target.value)} />
          </div>
          <div>
            <Label>Status</Label>
            <Select value={payStatus} onChange={(e) => setPayStatus(e.target.value)}>
              <option value="">All</option>
              <option value="SUCCESS">Success</option>
              <option value="FAILED">Failed</option>
            </Select>
          </div>
          <Button onClick={loadPayments}>View</Button>
          <a
            href={`/api/admin/reports/payments?${new URLSearchParams({
              ...(payFrom ? { from: payFrom } : {}),
              ...(payTo ? { to: payTo } : {}),
              ...(payStatus ? { status: payStatus } : {}),
              format: "xlsx",
            })}`}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Export Excel
          </a>
        </div>
        {payments && (
          <p className="mt-4 text-sm text-slate-600">
            Total: <span className="font-semibold">{formatLKR(payments.total)}</span> ·{" "}
            {payments.payments.length} transactions
          </p>
        )}
      </Card>
    </div>
  );
}
