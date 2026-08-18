"use client";

import { useEffect, useMemo, useState } from "react";
import { Input, Label, Select, Card } from "@/components/ui";
import { SortHeader, FilterDropdown, type SortDir } from "@/components/data-table";
import { formatLKR, formatDate } from "@/lib/utils";

type Invoice = {
  id: string;
  invoiceNumber: string;
  sid: string;
  studentName: string;
  period: string;
  session: string;
  subjects: string[];
  totalAmount: number;
  status: string;
  createdAt: string;
  paidAt: string | null;
};

type SortKey =
  | "invoiceNumber"
  | "createdAt"
  | "studentName"
  | "period"
  | "session"
  | "subjects"
  | "totalAmount"
  | "paidAt"
  | "status";

function sortValue(inv: Invoice, key: SortKey): string | number {
  switch (key) {
    case "invoiceNumber":
      return inv.invoiceNumber;
    case "createdAt":
      return inv.createdAt;
    case "studentName":
      return inv.studentName;
    case "period":
      return inv.period;
    case "session":
      return inv.session;
    case "subjects":
      return inv.subjects.join(", ");
    case "totalAmount":
      return inv.totalAmount;
    case "paidAt":
      return inv.paidAt ?? "";
    case "status":
      return inv.status;
  }
}

export default function AdminInvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/invoices")
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && data.invoices) setInvoices(data.invoices);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const rows = useMemo(() => {
    let result = invoices;

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((inv) =>
        [
          inv.invoiceNumber,
          inv.sid,
          inv.studentName,
          inv.period,
          inv.session,
          inv.subjects.join(", "),
          inv.status,
          inv.createdAt ? formatDate(inv.createdAt) : "",
          inv.paidAt ? formatDate(inv.paidAt) : "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(q)
      );
    }
    if (filterStatus) result = result.filter((inv) => inv.status === filterStatus);

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
  }, [invoices, search, filterStatus, sortKey, sortDir]);

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
        <h1 className="text-2xl font-bold text-slate-900">Invoices</h1>
        <div className="flex gap-2">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search invoice, SID, name…"
            className="w-64"
          />
          <FilterDropdown active={filterStatus !== ""}>
            <div>
              <Label>Status</Label>
              <Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">All</option>
                <option value="PENDING_PAYMENT">Pending Payment</option>
                <option value="PAID">Paid</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="EXPIRED">Expired</option>
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
                <th className="py-2 pr-3">{header("invoiceNumber", "Invoice")}</th>
                <th className="py-2 pr-3">{header("createdAt", "Invoice Date")}</th>
                <th className="py-2 pr-3">{header("studentName", "Student")}</th>
                <th className="py-2 pr-3">{header("period", "Period")}</th>
                <th className="py-2 pr-3">{header("session", "Session")}</th>
                <th className="py-2 pr-3">{header("subjects", "Subjects")}</th>
                <th className="py-2 pr-3">{header("totalAmount", "Amount")}</th>
                <th className="py-2 pr-3">{header("paidAt", "Payment Date")}</th>
                <th className="py-2">{header("status", "Status")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-6 text-center text-slate-500">
                    No invoices found.
                  </td>
                </tr>
              ) : (
                rows.map((inv) => {
                  const isPaid = inv.status === "PAID";
                  return (
                    <tr key={inv.id} className="border-b border-slate-100">
                      <td className="py-3 font-mono">{inv.invoiceNumber}</td>
                      <td className="py-3">{formatDate(inv.createdAt)}</td>
                      <td className="py-3">{inv.studentName} ({inv.sid})</td>
                      <td className="py-3">{inv.period}</td>
                      <td className="py-3">{inv.session}</td>
                      <td className="py-3">{inv.subjects.join(", ")}</td>
                      <td className="py-3">{formatLKR(inv.totalAmount)}</td>
                      <td className="py-3">
                        {isPaid && inv.paidAt ? formatDate(inv.paidAt) : "—"}
                      </td>
                      <td className="py-3">
                        <span
                          className={
                            isPaid ? "text-emerald-600" : "text-amber-600"
                          }
                        >
                          {inv.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
