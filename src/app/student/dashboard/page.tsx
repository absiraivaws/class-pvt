"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import QRCode from "qrcode";
import { Button, Select, Label, Alert, Card } from "@/components/ui";

type Period = { id: string; displayName: string };
type Session = { id: string; name: string };
type Subject = { id: string; name: string; amount: number; paid: boolean };
type StudentProfile = {
  sid: string;
  name: string;
  nic: string;
  stream: string;
  phone: string;
  email: string;
};
type Invoice = {
  id: string;
  invoiceNumber: string;
  status: string;
  totalAmount: number;
};
type Payment = {
  id: string;
  reference: string;
  status: string;
  amount: number;
  qrExpiry: string | null;
  qrData: string | null;
};

function DashboardInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const invoiceIdParam = searchParams.get("invoiceId") ?? "";

  const [periods, setPeriods] = useState<Period[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [periodId, setPeriodId] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [qrUrl, setQrUrl] = useState("");
  const [paymentError, setPaymentError] = useState("");
  const [busy, setBusy] = useState(false);
  const [paid, setPaid] = useState(false);
  const [receiptNumber, setReceiptNumber] = useState("");
  const [now, setNow] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetch("/api/class-periods")
      .then((r) => r.json())
      .then((d) => {
        setPeriods(d.periods ?? []);
        if (d.periods?.length) setPeriodId(d.periods[0].id);
      })
      .catch(() => {});
    fetch("/api/class-sessions")
      .then((r) => r.json())
      .then((d) => {
        setSessions(d.sessions ?? []);
        if (d.sessions?.length) setSessionId(d.sessions[0].id);
      })
      .catch(() => {});
    fetch("/api/student/profile")
      .then((r) => r.json())
      .then((d) => setProfile(d))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!periodId || !sessionId) return;
    let cancelled = false;
    fetch(`/api/fees?periodId=${periodId}&sessionId=${sessionId}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setLoading(false);
        if (data.error) {
          setError(data.error);
          setSubjects([]);
        } else {
          setSubjects(data.subjects ?? []);
        }
        setSelected(new Set());
      })
      .catch(() => {
        if (!cancelled) {
          setLoading(false);
          setError("Failed to load subjects.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [periodId, sessionId]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  useEffect(() => {
    if (!invoiceIdParam) return;
    let cancelled = false;
    fetch(`/api/invoices/${invoiceIdParam}`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        if (d.error) {
          setPaymentError(d.error);
          return;
        }
        const inv = d.invoice;
        setInvoice({
          id: inv.id,
          invoiceNumber: inv.invoiceNumber,
          status: inv.status,
          totalAmount: inv.totalAmount,
        });
        if (inv.status === "PAID") setPaid(true);
      })
      .catch(() => {
        if (!cancelled) setPaymentError("Failed to load invoice.");
      });
    return () => {
      cancelled = true;
    };
  }, [invoiceIdParam]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const selectedSubjects = subjects.filter((s) => selected.has(s.id));
  const total = selectedSubjects.reduce((sum, s) => sum + s.amount, 0);
  const selectedPeriod = periods.find((p) => p.id === periodId);
  const selectedSession = sessions.find((s) => s.id === sessionId);

  async function proceed() {
    setBusy(true);
    setError("");
    setPaymentError("");
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classPeriodId: periodId,
          sessionId,
          subjectIds: Array.from(selected),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create invoice.");
        return;
      }
      setInvoice(data.invoice);
      setPaid(false);
      setPayment(null);
      setQrUrl("");
      router.replace("/student/dashboard");
    } catch {
      setError("Network error.");
    } finally {
      setBusy(false);
    }
  }

  async function renderQr(qrData: string) {
    const url = await QRCode.toDataURL(qrData, { margin: 1, width: 300 });
    setQrUrl(url);
  }

  async function payNow() {
    if (!invoice) return;
    setPaymentError("");
    setBusy(true);
    try {
      const res = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId: invoice.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPaymentError(data.error || "Failed to create payment.");
        return;
      }
      setPayment(data.payment);
      if (data.payment.qrData) await renderQr(data.payment.qrData);
      startPolling(data.payment.id);
    } catch {
      setPaymentError("Network error.");
    } finally {
      setBusy(false);
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
      } else if (data.status === "FAILED") {
        if (pollRef.current) clearInterval(pollRef.current);
        setPaymentError("Payment failed. Please try again.");
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
      setPaymentError(
        data.status === "FAILED" ? "Payment failed." : "Payment not yet confirmed."
      );
    }
  }

  async function regenerateQr() {
    if (!payment) return;
    setPaymentError("");
    setBusy(true);
    try {
      const res = await fetch(`/api/payments/${payment.id}/generate-qr`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setPaymentError(data.error || "Failed to generate QR.");
        return;
      }
      setPayment(data.payment);
      if (data.payment.qrData) await renderQr(data.payment.qrData);
    } catch {
      setPaymentError("Network error.");
    } finally {
      setBusy(false);
    }
  }

  async function simulate() {
    if (!payment) return;
    setPaymentError("");
    try {
      const res = await fetch(`/api/payments/${payment.id}/simulate`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setPaymentError(data.error || "Simulation failed.");
        return;
      }
      await checkStatus();
    } catch {
      setPaymentError("Network error.");
    }
  }

  function cancel() {
    setInvoice(null);
    setPayment(null);
    setQrUrl("");
    setPaymentError("");
    setPaid(false);
    setReceiptNumber("");
    if (pollRef.current) clearInterval(pollRef.current);
    router.replace("/student/dashboard");
  }

  const qrExpired =
    payment?.qrExpiry && now > 0 && new Date(payment.qrExpiry).getTime() < now;

  return (
    <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-4">
      <Card>
        <h2 className="text-xl font-semibold text-slate-900">Class Payment</h2>
        <p className="text-sm text-slate-500">
          Select a period, class time, and subjects.
        </p>

        <div className="mt-6 grid gap-4">
          <div>
            <Label>Month / Year</Label>
            <Select value={periodId} onChange={(e) => setPeriodId(e.target.value)}>
              {periods.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.displayName}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Class Time</Label>
            <Select value={sessionId} onChange={(e) => setSessionId(e.target.value)}>
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {error && (
          <div className="mt-4">
            <Alert type="error">{error}</Alert>
          </div>
        )}

        <div className="mt-6">
          <h3 className="mb-2 font-medium text-slate-700">Available Subjects</h3>
          {loading ? (
            <p className="text-sm text-slate-500">Loading subjects…</p>
          ) : subjects.length === 0 ? (
            <p className="text-sm text-slate-500">
              No subjects available for this period and session.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {subjects.map((s) => (
                <label key={s.id} className="flex items-center justify-between py-3">
                  <span className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      disabled={s.paid}
                      checked={selected.has(s.id)}
                      onChange={() => toggle(s.id)}
                      className="h-4 w-4 rounded border-slate-300 text-indigo-600"
                    />
                    <span className={s.paid ? "text-slate-400" : "text-slate-800"}>
                      {s.name}
                    </span>
                  </span>
                  <span className="text-sm">
                    {s.paid ? (
                      <span className="font-semibold text-emerald-600">PAID ✓</span>
                    ) : (
                      <span className="text-slate-700">
                        Rs. {s.amount.toLocaleString("en-LK")}
                      </span>
                    )}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>
      </Card>

      <Card>
        <h2 className="text-xl font-semibold text-slate-900">Selected Subjects</h2>
        {selectedSubjects.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">None selected.</p>
        ) : (
          <ul className="mt-3 space-y-1 text-sm">
            {selectedSubjects.map((s) => (
              <li key={s.id} className="flex justify-between">
                <span>{s.name}</span>
                <span className="text-slate-600">
                  Rs. {s.amount.toLocaleString("en-LK")}
                </span>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4 border-t border-slate-200 pt-3">
          <div className="flex justify-between font-semibold text-slate-900">
            <span>Total</span>
            <span>Rs. {total.toLocaleString("en-LK")}</span>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-xl font-semibold text-slate-900">
          PRIVATE CLASS STUDENT PAYMENT
        </h2>

        <div className="mt-4 space-y-1 text-sm text-slate-700">
          <p>
            <span className="font-medium text-slate-500">SID:</span>{" "}
            {profile?.sid ?? "—"}
          </p>
          <p>
            <span className="font-medium text-slate-500">Name:</span>{" "}
            {profile?.name ?? "—"}
          </p>
          <p>
            <span className="font-medium text-slate-500">NIC:</span>{" "}
            {profile?.nic ?? "—"}
          </p>
          <p>
            <span className="font-medium text-slate-500">Stream:</span>{" "}
            {profile?.stream ?? "—"}
          </p>
          <p>
            <span className="font-medium text-slate-500">Phone:</span>{" "}
            {profile?.phone ?? "—"}
          </p>
          <p>
            <span className="font-medium text-slate-500">Email:</span>{" "}
            {profile?.email ?? "—"}
          </p>
        </div>

        <div className="mt-4 border-t border-slate-200 pt-3 text-sm text-slate-700">
          <p>
            <span className="font-medium text-slate-500">Month / Year:</span>{" "}
            {selectedPeriod?.displayName ?? "—"}
          </p>
          <p>
            <span className="font-medium text-slate-500">Class Session:</span>{" "}
            {selectedSession?.name ?? "—"}
          </p>
        </div>

        <div className="mt-4 border-t border-slate-200 pt-3 text-sm">
          <h3 className="font-medium text-slate-700">Selected Subjects</h3>
          {selectedSubjects.length === 0 ? (
            <p className="mt-2 text-slate-500">None selected.</p>
          ) : (
            <ul className="mt-2 space-y-1">
              {selectedSubjects.map((s) => (
                <li key={s.id} className="flex justify-between">
                  <span>{s.name}</span>
                  <span className="text-slate-600">
                    Rs. {s.amount.toLocaleString("en-LK")}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-3 flex justify-between font-semibold text-slate-900">
            <span>Total</span>
            <span>Rs. {total.toLocaleString("en-LK")}</span>
          </div>
        </div>

        <Button
          onClick={proceed}
          disabled={selected.size === 0 || busy}
          className="mt-5 w-full"
        >
          {busy ? "Creating invoice…" : "Proceed to Invoice"}
        </Button>
      </Card>

      <Card>
        <h2 className="text-xl font-semibold text-slate-900">Payment</h2>

        {paymentError && (
          <div className="mt-3">
            <Alert type="error">{paymentError}</Alert>
          </div>
        )}

        {paid && invoice ? (
          <div className="mt-4 text-center">
            <div className="text-4xl">✓</div>
            <h3 className="mt-2 text-xl font-bold text-emerald-600">
              PAYMENT SUCCESSFUL
            </h3>
            <div className="mt-3 space-y-1 text-left text-sm text-slate-700">
              <p>
                <span className="font-medium">Student:</span> {profile?.name ?? "—"}
              </p>
              <p>
                <span className="font-medium">SID:</span> {profile?.sid ?? "—"}
              </p>
              <p>
                <span className="font-medium">Invoice:</span> {invoice.invoiceNumber}
              </p>
              <p>
                <span className="font-medium">Amount:</span>{" "}
                Rs. {invoice.totalAmount.toLocaleString("en-LK")}
              </p>
              {receiptNumber && (
                <p>
                  <span className="font-medium">Receipt:</span> {receiptNumber}
                </p>
              )}
            </div>
            <div className="mt-5 space-y-2">
              {payment && (
                <a
                  href={`/api/receipts/${payment.id}/pdf`}
                  className="block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                >
                  Download Receipt
                </a>
              )}
              <Button variant="secondary" className="w-full" onClick={cancel}>
                Done
              </Button>
            </div>
          </div>
        ) : invoice && !payment ? (
          <div className="mt-4">
            <div className="space-y-1 text-sm text-slate-700">
              <p>
                <span className="font-medium text-slate-500">Invoice No:</span>{" "}
                {invoice.invoiceNumber}
              </p>
              <p>
                <span className="font-medium text-slate-500">Status:</span>{" "}
                {invoice.status}
              </p>
              <p>
                <span className="font-medium text-slate-500">Total:</span>{" "}
                Rs. {invoice.totalAmount.toLocaleString("en-LK")}
              </p>
            </div>
            <div className="mt-5 flex gap-2">
              <Button className="flex-1" onClick={payNow} disabled={busy}>
                {busy ? "Working…" : "PAY NOW"}
              </Button>
              <Button variant="secondary" onClick={cancel}>
                Cancel
              </Button>
            </div>
          </div>
        ) : invoice && payment ? (
          <div className="mt-4 text-center">
            <div className="space-y-1 text-left text-sm text-slate-700">
              <p>
                <span className="font-medium text-slate-500">Invoice:</span>{" "}
                {invoice.invoiceNumber}
              </p>
              <p>
                <span className="font-medium text-slate-500">Amount:</span>{" "}
                Rs. {payment.amount.toLocaleString("en-LK")}
              </p>
            </div>

            {qrExpired ? (
              <div className="my-6">
                <div className="text-xl font-bold text-red-600">QR EXPIRED</div>
                <Button onClick={regenerateQr} className="mt-3" disabled={busy}>
                  Generate New QR
                </Button>
              </div>
            ) : (
              <div className="my-5 flex justify-center">
                {qrUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={qrUrl}
                    alt="Payment QR"
                    className="h-56 w-56 rounded-lg border"
                  />
                ) : (
                  <div className="h-56 w-56 animate-pulse rounded-lg bg-slate-100" />
                )}
              </div>
            )}

            <div className="flex flex-wrap justify-center gap-2">
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
                PDF
              </a>
              <Button variant="secondary" size="sm" onClick={checkStatus}>
                Check Status
              </Button>
              <Button variant="ghost" size="sm" onClick={simulate}>
                Simulate
              </Button>
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="mt-3"
              onClick={cancel}
            >
              Cancel
            </Button>

            <p className="mt-3 text-xs text-slate-500">
              Scan using a supported banking/payment application.
            </p>
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-500">
            Select subjects and click “Proceed to Invoice” to generate an invoice
            and make a payment.
          </p>
        )}
      </Card>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense>
      <DashboardInner />
    </Suspense>
  );
}
