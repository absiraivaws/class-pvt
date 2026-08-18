import { prisma } from "@/lib/prisma";
import { getCurrentStudent } from "@/lib/session";
import { json, apiError } from "@/lib/api";

export async function GET() {
  const student = await getCurrentStudent();
  if (!student) return apiError("Unauthorized.", 401);

  const invoices = await prisma.invoice.findMany({
    where: { studentId: student.id },
    include: {
      classPeriod: true,
      session: true,
      items: true,
      payments: {
        orderBy: { initiatedAt: "desc" },
        select: {
          id: true,
          status: true,
          reference: true,
          receiptNumber: true,
          providerTxnId: true,
          amount: true,
          paidAt: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const history = invoices.map((inv) => {
    const latestPayment = inv.payments[0] ?? null;
    return {
      invoiceId: inv.id,
      invoiceNumber: inv.invoiceNumber,
      period: inv.classPeriod.displayName,
      session: inv.session.name,
      subjects: inv.items.map((i) => i.subjectName),
      amount: inv.totalAmount.toNumber(),
      status: inv.status,
      createdAt: inv.createdAt,
      paidAt: inv.paidAt,
      payment: latestPayment,
    };
  });

  return json({ history });
}
