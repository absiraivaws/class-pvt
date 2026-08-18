"use client";

import { useEffect, useMemo, useState } from "react";
import { Input, Label, Select, Card } from "@/components/ui";
import { SortHeader, FilterDropdown, type SortDir } from "@/components/data-table";
import { formatLKR } from "@/lib/utils";

type Payment = {
  id: string;
  reference: string;
  providerTxnId: string | null;
  receiptNumber: string | null;
  sid: string;
  studentName: string;
  invoiceNumber: string;
  period: string;
  session: string;
  amount: number;
  status: string;
  reconciliationStatus: string;
  paymentMethod: string | null;
};

type SortKey =
  | "reference"
  | "studentName"
  | "invoiceNumber"
  | "amount"
  | "status"
  | "reconciliationStatus";

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterRecon, setFilterRecon] = useState("");
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/payments")
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && data.payments) setPayments(data.payments);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const rows = useMemo(() => {
    let result = payments;

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((p) =>
        [
          p.reference,
          p.providerTxnId ?? "",
          p.receiptNumber ?? "",
          p.sid,
          p.studentName,
          p.invoiceNumber,
          p.period,
          p.session,
          p.status,
          p.reconciliationStatus,
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
        const av = a[sortKey];
        const bv = b[sortKey];
        let cmp: number;
        if (typeof av === "number" && typeof bv === "number") {
          cmp = av - bv;
        } else {
          cmp = String(av ?? "").localeCompare(String(bv ?? ""));
        }
        return sortDir === "asc" ? cmp : -cmp;
      });
    }
    return result;
  }, [payments, search, filterStatus, filterRecon, sortKey, sortDir]);

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

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900">Payments</h1>
        <div className="flex gap-2">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search ref, txn, SID…"
            className="w-64"
          />
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
      </div>

      <Card className="mt-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="py-2 pr-3">{header("reference", "Reference")}</th>
                <th className="py-2 pr-3">{header("studentName", "Student")}</th>
                <th className="py-2 pr-3">{header("invoiceNumber", "Invoice")}</th>
                <th className="py-2 pr-3">{header("amount", "Amount")}</th>
                <th className="py-2 pr-3">{header("status", "Status")}</th>
                <th className="py-2 pr-3">{header("reconciliationStatus", "Recon")}</th>
                <th className="py-2 font-medium">Receipt</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-500">
                    No payments found.
                  </td>
                </tr>
              ) : (
                rows.map((p) => (
                  <tr key={p.id} className="border-b border-slate-100">
                    <td className="py-3 font-mono">{p.reference}</td>
                    <td className="py-3">{p.studentName} ({p.sid})</td>
                    <td className="py-3 font-mono">{p.invoiceNumber}</td>
                    <td className="py-3">{formatLKR(p.amount)}</td>
                    <td className="py-3">
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
                    <td className="py-3">{p.reconciliationStatus}</td>
                    <td className="py-3">
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
    </div>
  );
}
