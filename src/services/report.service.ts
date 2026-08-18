import { prisma } from "@/lib/prisma";
import { InvoiceStatus, PaymentStatus } from "@/lib/constants";

export type DateFilter = {
  from?: Date;
  to?: Date;
};

export async function getPaymentReport(filters: {
  from?: Date;
  to?: Date;
  studentId?: string;
  streamId?: string;
  sessionId?: string;
  status?: string;
}) {
  const { from, to, studentId, streamId, sessionId, status } = filters;

  const where: Record<string, unknown> = {};

  if (from || to) {
    where.paidAt = {
      ...(from ? { gte: from } : {}),
      ...(to ? { lte: to } : {}),
    };
  }
  if (studentId) where.studentId = studentId;
  if (status) where.status = status;
  if (sessionId) {
    where.invoice = { ...(where.invoice as object), sessionId };
  }
  if (streamId) {
    where.student = { ...(where.student as object), streamId };
  }

  const payments = await prisma.payment.findMany({
    where: where as never,
    include: {
      student: { include: { stream: true } },
      invoice: {
        include: {
          session: true,
          classPeriod: true,
          items: { include: { subject: true } },
        },
      },
    },
    orderBy: { paidAt: "desc" },
  });

  let total = 0;
  const rows = payments.map((p) => {
    total += p.amount.toNumber();
    return p;
  });

  return { payments: rows, total };
}

export async function getDailyCollection(date: Date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  const items = await prisma.invoiceItem.findMany({
    where: {
      invoice: { status: InvoiceStatus.PAID, paidAt: { gte: start, lte: end } },
    },
    include: { subject: true },
  });

  const bySubject = new Map<string, { subjectName: string; total: number }>();
  for (const item of items) {
    const current = bySubject.get(item.subjectId) ?? {
      subjectName: item.subjectName,
      total: 0,
    };
    current.total += item.amount.toNumber();
    bySubject.set(item.subjectId, current);
  }

  const rows = Array.from(bySubject.values());
  const total = rows.reduce((s, r) => s + r.total, 0);
  return { date, rows, total };
}

export async function getAdminDashboardStats() {
  const [
    totalStudents,
    pendingPayments,
    successfulPayments,
    failedPayments,
    todayPayments,
    monthPayments,
  ] = await Promise.all([
    prisma.student.count({ where: { status: "ACTIVE" } }),
    prisma.payment.count({ where: { status: PaymentStatus.PENDING } }),
    prisma.payment.count({ where: { status: PaymentStatus.SUCCESS } }),
    prisma.payment.count({ where: { status: PaymentStatus.FAILED } }),
    prisma.payment.aggregate({
      where: {
        status: PaymentStatus.SUCCESS,
        paidAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
      _sum: { amount: true },
    }),
    prisma.payment.aggregate({
      where: {
        status: PaymentStatus.SUCCESS,
        paidAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
      _sum: { amount: true },
    }),
  ]);

  return {
    totalStudents,
    pendingPayments,
    successfulPayments,
    failedPayments,
    todayPayments: todayPayments._sum.amount?.toNumber() ?? 0,
    monthPayments: monthPayments._sum.amount?.toNumber() ?? 0,
  };
}

export async function getOutstanding(periodId: string) {
  const period = await prisma.classPeriod.findUnique({
    where: { id: periodId },
    include: {
      subjectFees: { where: { status: true }, include: { subject: true } },
    },
  });
  if (!period) return { period: null, rows: [] };

  const students = await prisma.student.findMany({
    where: { status: "ACTIVE" },
    include: {
      stream: true,
      invoices: {
        where: { classPeriodId: periodId },
        include: { items: true },
      },
    },
  });

  const totalSubjects = new Set(
    period.subjectFees.map((f) => f.subjectId)
  ).size;

  const rows = students
    .map((s) => {
      const paidSubjects = new Set(
        s.invoices
          .filter((i) => i.status === InvoiceStatus.PAID)
          .flatMap((i) => i.items.map((it) => it.subjectId))
      );
      const paidCount = paidSubjects.size;
      return {
        sid: s.sid,
        name: s.name,
        stream: s.stream?.name ?? "",
        paidCount,
        totalSubjects,
        outstanding: totalSubjects - paidCount,
      };
    })
    .filter((r) => r.outstanding > 0)
    .sort((a, b) => b.outstanding - a.outstanding);

  return { period, rows };
}
