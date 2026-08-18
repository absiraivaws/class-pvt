import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/session";
import { json, apiError } from "@/lib/api";

export async function GET() {
  const admin = await getCurrentAdmin();
  if (!admin) return apiError("Unauthorized.", 401);

  const exceptions = await prisma.payment.findMany({
    where: { reconciliationStatus: "EXCEPTION" },
    include: {
      student: true,
      invoice: { include: { classPeriod: true, session: true } },
    },
    orderBy: { initiatedAt: "desc" },
  });

  return json({
    exceptions: exceptions.map((p) => ({
      id: p.id,
      reference: p.reference,
      providerTxnId: p.providerTxnId,
      sid: p.student.sid,
      studentName: p.student.name,
      invoiceNumber: p.invoice.invoiceNumber,
      invoiceAmount: p.invoice.totalAmount.toNumber(),
      paymentAmount: p.amount.toNumber(),
      status: p.status,
      initiatedAt: p.initiatedAt,
    })),
  });
}
