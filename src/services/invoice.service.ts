import { prisma } from "@/lib/prisma";
import { generateInvoiceNumber } from "@/lib/utils";
import { InvoiceStatus, PaymentStatus } from "@/lib/constants";

export type CreateInvoiceInput = {
  studentId: string;
  classPeriodId: string;
  sessionId: string;
  subjectIds: string[];
};

export class InvoiceError extends Error {}

export async function createInvoice(input: CreateInvoiceInput) {
  const { studentId, classPeriodId, sessionId, subjectIds } = input;

  if (subjectIds.length === 0) {
    throw new InvoiceError("Select at least one subject.");
  }

  const period = await prisma.classPeriod.findUnique({
    where: { id: classPeriodId },
  });
  if (!period || period.status !== "ACTIVE") {
    throw new InvoiceError("Selected month/year period is not active.");
  }

  const session = await prisma.classSession.findUnique({
    where: { id: sessionId },
  });
  if (!session || !session.status) {
    throw new InvoiceError("Selected class session is not available.");
  }

  // Load fees from the database (server-authoritative amounts).
  const fees = await prisma.subjectFee.findMany({
    where: {
      classPeriodId,
      sessionId,
      subjectId: { in: subjectIds },
      status: true,
    },
    include: { subject: true },
  });

  if (fees.length !== subjectIds.length) {
    throw new InvoiceError(
      "One or more subjects do not have a configured fee for this period and session."
    );
  }

  // Duplicate payment validation: find already-paid subjects for this student/period/session.
  const paidSubjects = await prisma.invoiceItem.findMany({
    where: {
      subjectId: { in: subjectIds },
      invoice: {
        studentId,
        classPeriodId,
        sessionId,
        status: InvoiceStatus.PAID,
      },
    },
    select: { subjectName: true },
  });

  if (paidSubjects.length > 0) {
    throw new InvoiceError(
      `Already paid: ${paidSubjects.map((s) => s.subjectName).join(", ")}.`
    );
  }

  const subtotal = fees.reduce((sum, f) => sum + f.amount.toNumber(), 0);

  const invoiceNumber = await generateInvoiceNumber();

  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber,
      studentId,
      classPeriodId,
      sessionId,
      subtotal,
      totalAmount: subtotal,
      status: InvoiceStatus.PENDING_PAYMENT,
      items: {
        create: fees.map((f) => ({
          subjectId: f.subjectId,
          subjectName: f.subject.name,
          unitAmount: f.amount,
          amount: f.amount,
        })),
      },
    },
    include: {
      items: true,
      classPeriod: true,
      session: true,
      student: { include: { stream: true } },
    },
  });

  return invoice;
}

export async function getInvoiceForStudent(invoiceId: string, studentId: string) {
  return prisma.invoice.findFirst({
    where: { id: invoiceId, studentId },
    include: {
      items: true,
      classPeriod: true,
      session: true,
      student: { include: { stream: true } },
      payments: true,
    },
  });
}

export async function getInvoiceStatus(invoiceId: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      payments: { orderBy: { initiatedAt: "desc" } },
    },
  });
  if (!invoice) return null;
  const latestPayment = invoice.payments[0] ?? null;
  return {
    invoiceId: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    status: invoice.status,
    paidAt: invoice.paidAt,
    payment: latestPayment
      ? {
          id: latestPayment.id,
          status: latestPayment.status,
          reference: latestPayment.reference,
          providerTxnId: latestPayment.providerTxnId,
          amount: latestPayment.amount.toNumber(),
        }
      : null,
  };
}

export async function getStudentPaidSubjectIds(
  studentId: string,
  classPeriodId: string,
  sessionId: string
): Promise<string[]> {
  const items = await prisma.invoiceItem.findMany({
    where: {
      invoice: {
        studentId,
        classPeriodId,
        sessionId,
        status: InvoiceStatus.PAID,
      },
    },
    select: { subjectId: true },
  });
  return items.map((i) => i.subjectId);
}

export { PaymentStatus };
