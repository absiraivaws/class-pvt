"use client";

import { useEffect, useState } from "react";
import { Card, Alert } from "@/components/ui";
import { formatLKR } from "@/lib/utils";

type Exception = {
  id: string;
  reference: string;
  providerTxnId: string | null;
  sid: string;
  studentName: string;
  invoiceNumber: string;
  invoiceAmount: number;
  paymentAmount: number;
  status: string;
};

export default function AdminReconciliationPage() {
  const [exceptions, setExceptions] = useState<Exception[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/reconciliation")
      .then((r) => r.json())
      .then((d) => setExceptions(d.exceptions ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Reconciliation</h1>
      <p className="mt-1 text-sm text-slate-500">
        Payments where the confirmed amount did not match the invoice amount.
      </p>

      <Card className="mt-4">
        {loading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : exceptions.length === 0 ? (
          <Alert type="success">No reconciliation exceptions.</Alert>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="py-2 font-medium">Reference</th>
                  <th className="py-2 font-medium">Student</th>
                  <th className="py-2 font-medium">Invoice</th>
                  <th className="py-2 font-medium">Invoice Amt</th>
                  <th className="py-2 font-medium">Paid Amt</th>
                  <th className="py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {exceptions.map((e) => (
                  <tr key={e.id} className="border-b border-slate-100">
                    <td className="py-3 font-mono">{e.reference}</td>
                    <td className="py-3">{e.studentName} ({e.sid})</td>
                    <td className="py-3 font-mono">{e.invoiceNumber}</td>
                    <td className="py-3">{formatLKR(e.invoiceAmount)}</td>
                    <td className="py-3 text-red-600">{formatLKR(e.paymentAmount)}</td>
                    <td className="py-3">{e.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
