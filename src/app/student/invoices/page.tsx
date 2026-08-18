"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Input, Card } from "@/components/ui";
import { formatLKR, formatDate } from "@/lib/utils";

type HistoryItem = {
  invoiceId: string;
  invoiceNumber: string;
  period: string;
  session: string;
  subjects: string[];
  amount: number;
  status: string;
  createdAt: string;
  paidAt: string | null;
  payment: {
    id: string;
    status: string;
    receiptNumber: string | null;
  } | null;
};

type SortKey =
  | "paidAt"
  | "period"
  | "session"
  | "subjects"
  | "amount"
  | "status";

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: "paidAt", label: "Transaction Date" },
  { key: "period", label: "Month" },
  { key: "session", label: "Session" },
  { key: "subjects", label: "Subjects" },
  { key: "amount", label: "Amount" },
  { key: "status", label: "Status" },
];

function sortValue(item: HistoryItem, key: SortKey): string | number {
  switch (key) {
    case "paidAt":
      return item.paidAt ?? "";
    case "period":
      return item.period;
    case "session":
      return item.session;
    case "subjects":
      return item.subjects.join(", ");
    case "amount":
      return item.amount;
    case "status":
      return item.status;
  }
}

export default function InvoicesPage() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/student/payment-history")
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setItems(d.history ?? []);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const rows = useMemo(() => {
    let result = items;

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((it) => {
        const haystack = [
          it.paidAt ? formatDate(it.paidAt) : "",
          it.period,
          it.session,
          it.subjects.join(", "),
          formatLKR(it.amount),
          it.status === "PAID" ? "paid" : "pending",
          it.invoiceNumber,
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(q);
      });
    }

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
  }, [items, search, sortKey, sortDir]);

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

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-slate-900">Payment History</h2>
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search payments…"
          className="w-64"
        />
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              {COLUMNS.map((col) => {
                const active = sortKey === col.key;
                return (
                  <th key={col.key} className="py-2 pr-3 font-medium">
                    <button
                      onClick={() => toggleSort(col.key)}
                      className={`inline-flex items-center gap-1 hover:text-slate-900 ${
                        active ? "text-indigo-600" : ""
                      }`}
                    >
                      {col.label}
                      <span
                        className={`text-xs ${
                          active ? "font-semibold" : "text-slate-300"
                        }`}
                      >
                        {active && sortDir === "asc" ? "A-Z" : active ? "Z-A" : "A-Z"}
                      </span>
                    </button>
                  </th>
                );
              })}
              <th className="py-2 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-6 text-center text-slate-500">
                  No payments yet.
                </td>
              </tr>
            ) : (
              rows.map((inv) => {
                const isPaid = inv.status === "PAID";
                return (
                  <tr key={inv.invoiceId} className="border-b border-slate-100">
                    <td className="py-3">
                      {isPaid && inv.paidAt ? formatDate(inv.paidAt) : "—"}
                    </td>
                    <td className="py-3">{inv.period}</td>
                    <td className="py-3">{inv.session}</td>
                    <td className="py-3">{inv.subjects.join(", ")}</td>
                    <td className="py-3">{formatLKR(inv.amount)}</td>
                    <td className="py-3">
                      <span
                        className={
                          isPaid
                            ? "font-medium text-emerald-600"
                            : "font-medium text-amber-600"
                        }
                      >
                        {isPaid ? "Paid" : "Pending"}
                      </span>
                    </td>
                    <td className="py-3">
                      {isPaid && inv.payment ? (
                        <Link
                          href={`/api/receipts/${inv.payment.id}/pdf`}
                          className="text-indigo-600 hover:underline"
                        >
                          Receipt
                        </Link>
                      ) : (
                        <Link
                          href={`/student/dashboard?invoiceId=${inv.invoiceId}`}
                          className="text-indigo-600 hover:underline"
                        >
                          Pay
                        </Link>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
