"use client";

import { useEffect, useState } from "react";
import { Button, Input, Select, Card } from "@/components/ui";
import { formatLKR } from "@/lib/utils";

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
};

export default function AdminInvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [draftSearch, setDraftSearch] = useState("");
  const [draftStatus, setDraftStatus] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (status) params.set("status", status);
    fetch(`/api/admin/invoices?${params}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && data.invoices) setInvoices(data.invoices);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [search, status]);

  function apply() {
    setSearch(draftSearch);
    setStatus(draftStatus);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Invoices</h1>

      <Card className="mt-4">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <Input
              value={draftSearch}
              onChange={(e) => setDraftSearch(e.target.value)}
              placeholder="Search invoice, SID, name…"
              className="w-64"
            />
          </div>
          <div>
            <Select value={draftStatus} onChange={(e) => setDraftStatus(e.target.value)}>
              <option value="">All statuses</option>
              <option value="PENDING_PAYMENT">Pending Payment</option>
              <option value="PAID">Paid</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="EXPIRED">Expired</option>
            </Select>
          </div>
          <Button variant="secondary" onClick={apply}>Apply</Button>
        </div>
      </Card>

      <Card className="mt-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="py-2 font-medium">Invoice</th>
                <th className="py-2 font-medium">Student</th>
                <th className="py-2 font-medium">Period</th>
                <th className="py-2 font-medium">Session</th>
                <th className="py-2 font-medium">Subjects</th>
                <th className="py-2 font-medium">Amount</th>
                <th className="py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-500">
                    No invoices found.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-slate-100">
                    <td className="py-3 font-mono">{inv.invoiceNumber}</td>
                    <td className="py-3">{inv.studentName} ({inv.sid})</td>
                    <td className="py-3">{inv.period}</td>
                    <td className="py-3">{inv.session}</td>
                    <td className="py-3">{inv.subjects.join(", ")}</td>
                    <td className="py-3">{formatLKR(inv.totalAmount)}</td>
                    <td className="py-3">
                      <span
                        className={
                          inv.status === "PAID" ? "text-emerald-600" : "text-amber-600"
                        }
                      >
                        {inv.status}
                      </span>
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
