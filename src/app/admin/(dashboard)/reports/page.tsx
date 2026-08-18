"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, Input, Select, Label, Card } from "@/components/ui";
import { SortHeader, FilterDropdown, type SortDir } from "@/components/data-table";
import { formatLKR, formatDate } from "@/lib/utils";

type Period = { id: string; displayName: string };

type Payment = {
  id: string;
  reference: string;
  providerTxnId: string | null;
  receiptNumber: string | null;
  sid: string;
  student: string;
  stream: string;
  invoiceNumber: string;
  period: string;
  session: string;
  subjects: string[];
  amount: number;
  status: string;
  reconciliationStatus: string;
  paymentMethod: string | null;
  initiatedAt: string;
  paidAt: string | null;
};

type SortKey =
  | "reference"
  | "providerTxnId"
  | "student"
  | "stream"
  | "invoiceNumber"
  | "period"
  | "session"
  | "subjects"
  | "amount"
  | "paymentMethod"
  | "status"
  | "paidAt";

function sortValue(p: Payment, key: SortKey): string | number {
  switch (key) {
    case "reference":
      return p.reference;
    case "providerTxnId":
      return p.providerTxnId ?? "";
    case "student":
      return p.student;
    case "stream":
      return p.stream;
    case "invoiceNumber":
      return p.invoiceNumber;
    case "period":
      return p.period;
    case "session":
      return p.session;
    case "subjects":
      return p.subjects.join(", ");
    case "amount":
      return p.amount;
    case "paymentMethod":
      return p.paymentMethod ?? "";
    case "status":
      return p.status;
    case "paidAt":
      return p.paidAt ?? "";
  }
}

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

  const [payments, setPayments] = useState<Payment[]>([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterRecon, setFilterRecon] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  useEffect(() => {
    fetch("/api/admin/periods")
      .then((r) => r.json())
      .then((d) => {
        setPeriods(d.periods ?? []);
        if (d.periods?.length) setOutPeriod(d.periods[0].id);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/reports/payments")
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setPayments(d.payments ?? []);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const rows = useMemo(() => {
    let result = payments;

    const fromDate = from ? new Date(`${from}T00:00:00`) : null;
    const toDate = to ? new Date(`${to}T23:59:59`) : null;

    if (fromDate || toDate) {
      result = result.filter((p) => {
        if (!p.paidAt) return false;
        const d = new Date(p.paidAt);
        if (fromDate && d < fromDate) return false;
        if (toDate && d > toDate) return false;
        return true;
      });
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((p) =>
        [
          p.reference,
          p.providerTxnId ?? "",
          p.receiptNumber ?? "",
          p.sid,
          p.student,
          p.stream,
          p.invoiceNumber,
          p.period,
          p.session,
          p.subjects.join(", "),
          p.paymentMethod ?? "",
          p.status,
          p.reconciliationStatus,
          p.paidAt ? formatDate(p.paidAt) : "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(q)
      );
    }
    if (filterStatus) result = result.filter((p) => p.status === filterStatus);
    if (filterRecon)
      result = result.filter((p) => p.reconciliationStatus === filterRecon);

    if (sortKey) {
      result = [...result].sort((a, b) => {
        const av = sortValue(a, sortKey);
        const bv = sortValue(b, sortKey);
        let cmp: number;
        if (typeof av === "number" && typeof bv === "number") {
          cmp = av - bv;
        } else {
          cmp = String(av).localeCompare(String(bv));
        }
        return sortDir === "asc" ? cmp : -cmp;
      });
    }
    return result;
  }, [payments, search, filterStatus, filterRecon, from, to, sortKey, sortDir]);

  const totalAmount = rows.reduce((s, p) => s + p.amount, 0);

  function toggleSort(key: SortKey) {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir("asc");
    } else if (sortDir === "asc") {
      setSortDir("desc");
    } else {
      setSortKey(null);
    }
  }

  function header(key: SortKey, label: string) {
    return (
      <SortHeader
        label={label}
        active={sortKey === key}
        dir={sortDir}
        onToggle={() => toggleSort(key)}
      />
    );
  }

  async function loadDaily() {
    const res = await fetch(`/api/admin/reports/daily?date=${dailyDate}`);
    setDaily(await res.json());
  }

  async function loadOutstanding() {
    const res = await fetch(`/api/admin/reports/outstanding?periodId=${outPeriod}`);
    setOutstanding(await res.json());
  }

  const exportParams = new URLSearchParams({
    ...(from ? { from } : {}),
    ...(to ? { to } : {}),
    ...(filterStatus ? { status: filterStatus } : {}),
    format: "xlsx",
  });

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-slate-900">Reports</h1>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-900">Payments Report</h2>
          <a
            href={`/api/admin/reports/payments?${exportParams}`}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Export Excel
          </a>
        </div>

        <div className="mt-3 flex flex-wrap items-end gap-3">
          <div>
            <Label>From</Label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <Label>To</Label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div className="grow">
            <Label>Search</Label>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search reference, student, invoice…"
              className="w-full"
            />
          </div>
          <FilterDropdown active={filterStatus !== "" || filterRecon !== ""}>
            <div>
              <Label>Status</Label>
              <Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">All</option>
                <option value="SUCCESS">Success</option>
                <option value="PENDING">Pending</option>
                <option value="FAILED">Failed</option>
                <option value="QR_GENERATED">QR Generated</option>
              </Select>
            </div>
            <div>
              <Label>Reconciliation</Label>
              <Select
                value={filterRecon}
                onChange={(e) => setFilterRecon(e.target.value)}
              >
                <option value="">All</option>
                <option value="PENDING">Pending</option>
                <option value="MATCHED">Matched</option>
                <option value="EXCEPTION">Exception</option>
              </Select>
            </div>
          </FilterDropdown>
        </div>

        <p className="mt-4 text-sm text-slate-600">
          Total: <span className="font-semibold">{formatLKR(totalAmount)}</span> ·{" "}
          {rows.length} transactions
        </p>

        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="py-2 pr-3">{header("reference", "Reference")}</th>
                <th className="py-2 pr-3">{header("student", "Student")}</th>
                <th className="py-2 pr-3">{header("stream", "Stream")}</th>
                <th className="py-2 pr-3">{header("invoiceNumber", "Invoice")}</th>
                <th className="py-2 pr-3">{header("period", "Period")}</th>
                <th className="py-2 pr-3">{header("session", "Session")}</th>
                <th className="py-2 pr-3">{header("subjects", "Subjects")}</th>
                <th className="py-2 pr-3">{header("amount", "Amount")}</th>
                <th className="py-2 pr-3">{header("paymentMethod", "Method")}</th>
                <th className="py-2 pr-3">{header("status", "Status")}</th>
                <th className="py-2 pr-3">{header("paidAt", "Payment Date")}</th>
                <th className="py-2 font-medium">Receipt</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-6 text-center text-slate-500">
                    No payments found.
                  </td>
                </tr>
              ) : (
                rows.map((p) => (
                  <tr key={p.id} className="border-b border-slate-100">
                    <td className="py-2 font-mono">{p.reference}</td>
                    <td className="py-2">{p.student} ({p.sid})</td>
                    <td className="py-2">{p.stream}</td>
                    <td className="py-2 font-mono">{p.invoiceNumber}</td>
                    <td className="py-2">{p.period}</td>
                    <td className="py-2">{p.session}</td>
                    <td className="py-2">{p.subjects.join(", ")}</td>
                    <td className="py-2">{formatLKR(p.amount)}</td>
                    <td className="py-2">{p.paymentMethod ?? "—"}</td>
                    <td className="py-2">
                      <span
                        className={
                          p.status === "SUCCESS"
                            ? "text-emerald-600"
                            : p.status === "FAILED"
                              ? "text-red-600"
                              : "text-amber-600"
                        }
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="py-2">
                      {p.paidAt ? formatDate(p.paidAt) : "—"}
                    </td>
                    <td className="py-2">
                      {p.receiptNumber ? (
                        <a
                          href={`/api/receipts/${p.id}/pdf`}
                          className="text-indigo-600 hover:underline"
                        >
                          {p.receiptNumber}
                        </a>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

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
    </div>
  );
}
