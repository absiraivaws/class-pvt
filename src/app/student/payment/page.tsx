"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import QRCode from "qrcode";
import { Button, Card, Alert } from "@/components/ui";

type InvoiceData = {
  id: string;
  invoiceNumber: string;
  status: string;
  totalAmount: number;
  period: string;
  session: string;
  student: { sid: string; name: string };
  items: { subjectName: string; amount: number }[];
};

type PaymentData = {
  id: string;
  reference: string;
  status: string;
  amount: number;
  qrExpiry: string | null;
  qrData: string | null;
};

function PaymentFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const invoiceId = searchParams.get("invoiceId") ?? "";

  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [payment, setPayment] = useState<PaymentData | null>(null);
  const [qrUrl, setQrUrl] = useState("");
  const [error, setError] = useState(invoiceId ? "" : "No invoice specified.");
  const [loading, setLoading] = useState(Boolean(invoiceId));
  const [showQr, setShowQr] = useState(false);
  const [paid, setPaid] = useState(false);
  const [receiptNumber, setReceiptNumber] = useState("");
  const [now, setNow] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!invoiceId) return;
    let cancelled = false;
    fetch(`/api/invoices/${invoiceId}`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        if (d.error) {
          setError(d.error);
        } else {
          setInvoice(d.invoice);
          if (d.invoice.status === "PAID") setPaid(true);
        }
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load invoice.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [invoiceId]);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const renderQr = useCallback(async (qrData: string) => {
    const url = await QRCode.toDataURL(qrData, {
      margin: 1,
      width: 300,
    });
    setQrUrl(url);
  }, []);

  async function payNow() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create payment.");
        return;
      }
      setPayment(data.payment);
      setShowQr(true);
      if (data.payment.qrData) await renderQr(data.payment.qrData);
      startPolling(data.payment.id);
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }

  function startPolling(paymentId: string) {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      const res = await fetch(`/api/payments/${paymentId}/status`);
      const data = await res.json();
      if (data.status === "SUCCESS") {
        if (pollRef.current) clearInterval(pollRef.current);
        setPaid(true);
        setReceiptNumber(data.receiptNumber ?? "");
        setInvoice((prev) =>
          prev ? { ...prev, status: "PAID" } : prev
        );
      } else if (data.status === "FAILED") {
        if (pollRef.current) clearInterval(pollRef.current);
        setError("Payment failed. Please try again.");
      }
    }, 3000);
  }

  async function checkStatus() {
    if (!payment) return;
    const res = await fetch(`/api/payments/${payment.id}/status`);
    const data = await res.json();
    if (data.status === "SUCCESS") {
      setPaid(true);
      setReceiptNumber(data.receiptNumber ?? "");
    } else {
      setError(
        data.status === "FAILED"
          ? "Payment failed."
          : "Payment not yet confirmed."
      );
    }
  }

  async function regenerateQr() {
    if (!payment) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/payments/${payment.id}/generate-qr`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to generate QR.");
        return;
      }
      setPayment(data.payment);
      if (data.payment.qrData) await renderQr(data.payment.qrData);
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }

  async function simulate() {
    if (!payment) return;
    setError("");
    try {
      const res = await fetch(`/api/payments/${payment.id}/simulate`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Simulation failed.");
        return;
      }
      await checkStatus();
    } catch {
      setError("Network error.");
    }
  }

  if (loading) {
    return (
      <Card>
        <p className="text-sm text-slate-500">Loading…</p>
      </Card>
    );
  }

  if (error && !invoice) {
    return (
      <Card>
        <Alert type="error">{error}</Alert>
        <div className="mt-4">
          <Link href="/student/dashboard" className="text-indigo-600 hover:underline">
            ← Back to dashboard
          </Link>
        </div>
      </Card>
    );
  }

  if (paid && invoice) {
    return (
      <Card className="mx-auto max-w-lg text-center">
        <div className="text-4xl">✓</div>
        <h2 className="mt-2 text-2xl font-bold text-emerald-600">
          PAYMENT SUCCESSFUL
        </h2>
        <div className="mt-4 space-y-1 text-left text-sm text-slate-700">
          <p><span className="font-medium">Student:</span> {invoice.student.name}</p>
          <p><span className="font-medium">SID:</span> {invoice.student.sid}</p>
          <p><span className="font-medium">Invoice:</span> {invoice.invoiceNumber}</p>
          <p><span className="font-medium">Amount:</span> Rs. {invoice.totalAmount.toLocaleString("en-LK")}</p>
          {receiptNumber && (
            <p><span className="font-medium">Receipt:</span> {receiptNumber}</p>
          )}
        </div>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          {payment && (
            <Link
              href={`/api/receipts/${payment.id}/pdf`}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Download Receipt
            </Link>
          )}
          <Button variant="secondary" onClick={() => router.push("/student/dashboard")}>
            Back to Dashboard
          </Button>
        </div>
      </Card>
    );
  }

  if (!invoice) return null;

  if (!showQr) {
    return (
      <Card className="mx-auto max-w-2xl">
        <h2 className="text-xl font-bold text-slate-900">
          PRIVATE CLASS STUDENT PAYMENT
        </h2>
        <div className="mt-4 space-y-1 text-sm text-slate-700">
          <p><span className="font-medium">Invoice No:</span> {invoice.invoiceNumber}</p>
          <p><span className="font-medium">Status:</span> {invoice.status}</p>
          <p><span className="font-medium">Student:</span> {invoice.student.name} ({invoice.student.sid})</p>
          <p><span className="font-medium">Month/Year:</span> {invoice.period}</p>
          <p><span className="font-medium">Session:</span> {invoice.session}</p>
        </div>

        <div className="mt-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="py-2 font-medium">Subject</th>
                <th className="py-2 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((i) => (
                <tr key={i.subjectName} className="border-b border-slate-100">
                  <td className="py-2">{i.subjectName}</td>
                  <td className="py-2 text-right">
                    Rs. {i.amount.toLocaleString("en-LK")}
                  </td>
                </tr>
              ))}
              <tr>
                <td className="py-2 font-semibold">Total</td>
                <td className="py-2 text-right font-semibold">
                  Rs. {invoice.totalAmount.toLocaleString("en-LK")}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {error && (
          <div className="mt-4">
            <Alert type="error">{error}</Alert>
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <Button onClick={payNow}>PAY NOW</Button>
          <Button variant="secondary" onClick={() => router.push("/student/dashboard")}>
            Cancel
          </Button>
        </div>
      </Card>
    );
  }

  const qrExpired =
    payment?.qrExpiry && now > 0 && new Date(payment.qrExpiry).getTime() < now;

  return (
    <Card className="mx-auto max-w-lg text-center">
      <h2 className="text-xl font-bold text-slate-900">PAY YOUR CLASS FEE</h2>
      <div className="mt-3 space-y-1 text-left text-sm text-slate-700">
        <p><span className="font-medium">Invoice:</span> {invoice.invoiceNumber}</p>
        <p><span className="font-medium">Student:</span> {invoice.student.name}</p>
        <p><span className="font-medium">SID:</span> {invoice.student.sid}</p>
        <p><span className="font-medium">Amount:</span> Rs. {payment?.amount.toLocaleString("en-LK")}</p>
      </div>

      {error && (
        <div className="mt-4">
          <Alert type="error">{error}</Alert>
        </div>
      )}

      {qrExpired ? (
        <div className="my-8">
          <div className="text-2xl font-bold text-red-600">QR EXPIRED</div>
          <Button onClick={regenerateQr} className="mt-4">
            Generate New QR
          </Button>
        </div>
      ) : (
        <div className="my-6 flex justify-center">
          {qrUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qrUrl} alt="Payment QR" className="h-64 w-64 rounded-lg border" />
          ) : (
            <div className="h-64 w-64 animate-pulse rounded-lg bg-slate-100" />
          )}
        </div>
      )}

      {payment && (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <a
            href={`/api/payments/${payment.id}/qr.png`}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
          >
            Download QR
          </a>
          <a
            href={`/api/payments/${payment.id}/qr.pdf`}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
          >
            Download PDF
          </a>
          <Button variant="secondary" size="sm" onClick={checkStatus}>
            Check Status
          </Button>
          <Button variant="ghost" size="sm" onClick={simulate}>
            Simulate Payment (dev)
          </Button>
        </div>
      )}

      <p className="mt-4 text-xs text-slate-500">
        Scan using a supported banking/payment application. The amount is fixed
        and validated on the server.
      </p>
    </Card>
  );
}

export default function PaymentPage() {
  return (
    <Suspense>
      <PaymentFlow />
    </Suspense>
  );
}
