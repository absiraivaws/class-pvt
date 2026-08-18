import { prisma } from "@/lib/prisma";
import {
  generatePaymentReference,
  generateReceiptNumber,
} from "@/lib/utils";
import {
  InvoiceStatus,
  PaymentStatus,
  QrStatus,
  AuditAction,
  UserType,
} from "@/lib/constants";
import { getPaymentProvider } from "@/providers/payment";
import { logAudit } from "@/services/audit.service";
import { sendEmail } from "@/services/email.service";

export class PaymentError extends Error {}

const ACTIVE_PAYMENT_STATUSES = [
  PaymentStatus.INITIATED,
  PaymentStatus.QR_GENERATED,
  PaymentStatus.PENDING,
];

export async function createPayment(invoiceId: string, studentId: string) {
  // Amount always comes from the database — never trust the client.
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { student: true, items: true },
  });

  if (!invoice || invoice.studentId !== studentId) {
    throw new PaymentError("Invoice not found.");
  }
  if (invoice.status === InvoiceStatus.PAID) {
    throw new PaymentError("This invoice has already been paid.");
  }
  if (invoice.status === InvoiceStatus.CANCELLED) {
    throw new PaymentError("This invoice has been cancelled.");
  }

  // Reuse an existing active payment for this invoice if present.
  const existing = await prisma.payment.findFirst({
    where: {
      invoiceId,
      status: { in: ACTIVE_PAYMENT_STATUSES },
    },
    orderBy: { initiatedAt: "desc" },
    include: { qrCodes: { orderBy: { generatedAt: "desc" }, take: 1 } },
  });

  if (
    existing &&
    existing.qrExpiry &&
    existing.qrExpiry.getTime() > Date.now()
  ) {
    return existing;
  }

  const reference = await generatePaymentReference();
  const amount = invoice.totalAmount.toNumber();

  const provider = getPaymentProvider();
  const result = await provider.createPayment({
    invoiceNumber: invoice.invoiceNumber,
    studentId: invoice.student.sid,
    amount,
    currency: "LKR",
    description: "Class Fee",
    reference,
  });

  const payment = await prisma.payment.create({
    data: {
      invoiceId,
      studentId,
      reference,
      amount,
      status: PaymentStatus.QR_GENERATED,
      qrReference: result.paymentReference,
      qrExpiry: result.expiry,
      initiatedAt: new Date(),
      qrCodes: {
        create: {
          qrReference: result.paymentReference,
          qrData: result.qrData,
          amount,
          expiresAt: result.expiry,
          status: QrStatus.ACTIVE,
        },
      },
    },
    include: { qrCodes: true },
  });

  await logAudit(AuditAction.PAYMENT_QR_GENERATED, {
    userId: studentId,
    userType: UserType.STUDENT,
    entityType: "PAYMENT",
    entityId: payment.id,
  });

  return payment;
}

export async function regenerateQr(paymentId: string, studentId: string) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { invoice: { include: { student: true } } },
  });

  if (!payment || payment.studentId !== studentId) {
    throw new PaymentError("Payment not found.");
  }
  if (payment.status === PaymentStatus.SUCCESS) {
    throw new PaymentError("Payment already completed.");
  }
  if (payment.status === PaymentStatus.REFUNDED) {
    throw new PaymentError("Payment has been refunded.");
  }

  const amount = payment.amount.toNumber();
  const provider = getPaymentProvider();
  const result = await provider.createPayment({
    invoiceNumber: payment.invoice.invoiceNumber,
    studentId: payment.invoice.student.sid,
    amount,
    currency: "LKR",
    description: "Class Fee",
    reference: payment.reference,
  });

  // Expire previous QR codes for this payment.
  await prisma.paymentQr.updateMany({
    where: { paymentId, status: QrStatus.ACTIVE },
    data: { status: QrStatus.EXPIRED },
  });

  await prisma.payment.update({
    where: { id: paymentId },
    data: {
      qrReference: result.paymentReference,
      qrExpiry: result.expiry,
      status: PaymentStatus.QR_GENERATED,
      qrCodes: {
        create: {
          qrReference: result.paymentReference,
          qrData: result.qrData,
          amount,
          expiresAt: result.expiry,
          status: QrStatus.ACTIVE,
        },
      },
    },
  });

  const updated = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { qrCodes: { orderBy: { generatedAt: "desc" }, take: 1 } },
  });
  return updated;
}

export async function getPaymentStatus(paymentId: string, studentId: string) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { invoice: true, qrCodes: { orderBy: { generatedAt: "desc" }, take: 1 } },
  });
  if (!payment || payment.studentId !== studentId) return null;

  const qr = payment.qrCodes[0] ?? null;
  const qrExpired = qr && qr.expiresAt.getTime() < Date.now();

  return {
    id: payment.id,
    status: payment.status,
    reconciliationStatus: payment.reconciliationStatus,
    reference: payment.reference,
    providerTxnId: payment.providerTxnId,
    amount: payment.amount.toNumber(),
    receiptNumber: payment.receiptNumber,
    paidAt: payment.paidAt,
    invoice: {
      id: payment.invoice.id,
      invoiceNumber: payment.invoice.invoiceNumber,
      status: payment.invoice.status,
    },
    qr: qr
      ? {
          qrData: qr.qrData,
          expiresAt: qr.expiresAt,
          expired: qrExpired,
        }
      : null,
  };
}

type WebhookResult = {
  ok: boolean;
  message: string;
};

export async function processWebhook(
  rawPayload: unknown,
  headers: Headers
): Promise<WebhookResult> {
  const provider = getPaymentProvider();

  let normalized;
  try {
    normalized = provider.verifyWebhook(rawPayload, headers);
  } catch {
    return { ok: false, message: "Provider verification error." };
  }

  if (!normalized) {
    return { ok: false, message: "Invalid signature." };
  }

  const { providerTxnId, reference, amount, status, paymentMethod } =
    normalized;

  // Idempotency: if this provider transaction was already processed, return ok.
  const existingTxn = await prisma.payment.findUnique({
    where: { providerTxnId },
  });
  if (existingTxn) {
    return { ok: true, message: "Already processed." };
  }

  const payment = await prisma.payment.findFirst({
    where: {
      OR: [{ reference }, { qrReference: reference }],
    },
    include: { invoice: { include: { student: true } } },
  });

  if (!payment) {
    return { ok: false, message: "Payment reference not found." };
  }

  // Duplicate payment protection: invoice already paid.
  if (payment.invoice.status === InvoiceStatus.PAID) {
    await logAudit(AuditAction.PAYMENT_RECONCILIATION, {
      userId: payment.studentId,
      userType: UserType.STUDENT,
      entityType: "PAYMENT",
      entityId: payment.id,
    });
    return {
      ok: false,
      message: "Invoice already paid — duplicate payment blocked.",
    };
  }

  const expectedAmount = payment.amount.toNumber();
  const invoiceAmount = payment.invoice.totalAmount.toNumber();

  if (status === "FAILED") {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: PaymentStatus.FAILED, providerTxnId, paymentMethod },
    });
    await logAudit(AuditAction.PAYMENT_FAILED, {
      userId: payment.studentId,
      userType: UserType.STUDENT,
      entityType: "PAYMENT",
      entityId: payment.id,
    });
    return { ok: true, message: "Payment marked as failed." };
  }

  // Reconciliation: invoice == payment == provider-confirmed amount.
  const matched = amount === expectedAmount && expectedAmount === invoiceAmount;

  if (!matched) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.FAILED,
        providerTxnId,
        paymentMethod,
        reconciliationStatus: "EXCEPTION",
      },
    });
    await logAudit(AuditAction.PAYMENT_RECONCILIATION, {
      userId: payment.studentId,
      userType: UserType.STUDENT,
      entityType: "PAYMENT",
      entityId: payment.id,
    });
    return { ok: false, message: "RECONCILIATION EXCEPTION." };
  }

  // Success path: mark payment + invoice, generate receipt.
  const receiptNumber = await generateReceiptNumber();

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.SUCCESS,
        providerTxnId,
        paymentMethod,
        paidAt: new Date(),
        receiptNumber,
        reconciliationStatus: "MATCHED",
      },
    });
    await tx.paymentQr.updateMany({
      where: { paymentId: payment.id, status: QrStatus.ACTIVE },
      data: { status: QrStatus.USED },
    });
    await tx.invoice.update({
      where: { id: payment.invoiceId },
      data: { status: InvoiceStatus.PAID, paidAt: new Date() },
    });
  });

  await logAudit(AuditAction.PAYMENT_SUCCESS, {
    userId: payment.studentId,
    userType: UserType.STUDENT,
    entityType: "PAYMENT",
    entityId: payment.id,
  });

  const student = payment.invoice.student;
  await sendEmail({
    to: student.email,
    subject: "Payment received",
    text: `Your payment of Rs. ${expectedAmount.toFixed(2)} has been successfully received.\nInvoice: ${payment.invoice.invoiceNumber}\nReceipt: ${receiptNumber}`,
  });

  return { ok: true, message: "Payment confirmed." };
}
