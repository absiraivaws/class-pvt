"use client";

import { useEffect, useState } from "react";
import { Button, Input, Select, Card } from "@/components/ui";
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

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [draftSearch, setDraftSearch] = useState("");
  const [draftStatus, setDraftStatus] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (status) params.set("status", status);
    fetch(`/api/admin/payments?${params}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && data.payments) setPayments(data.payments);
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
      <h1 className="text-2xl font-bold text-slate-900">Payments</h1>

      <Card className="mt-4">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <Input
              value={draftSearch}
              onChange={(e) => setDraftSearch(e.target.value)}
              placeholder="Search ref, txn, SID…"
              className="w-64"
            />
          </div>
          <div>
            <Select value={draftStatus} onChange={(e) => setDraftStatus(e.target.value)}>
              <option value="">All statuses</option>
              <option value="SUCCESS">Success</option>
              <option value="PENDING">Pending</option>
              <option value="FAILED">Failed</option>
              <option value="QR_GENERATED">QR Generated</option>
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
                <th className="py-2 font-medium">Reference</th>
                <th className="py-2 font-medium">Student</th>
                <th className="py-2 font-medium">Invoice</th>
                <th className="py-2 font-medium">Amount</th>
                <th className="py-2 font-medium">Status</th>
                <th className="py-2 font-medium">Recon</th>
                <th className="py-2 font-medium">Receipt</th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-500">
                    No payments found.
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
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
