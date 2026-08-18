import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/session";
import { json, apiError } from "@/lib/api";

export async function GET(request: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) return apiError("Unauthorized.", 401);

  const status = request.nextUrl.searchParams.get("status");
  const search = request.nextUrl.searchParams.get("search") ?? "";

  const payments = await prisma.payment.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(search
        ? {
            OR: [
              { reference: { contains: search, mode: "insensitive" as const } },
              { providerTxnId: { contains: search, mode: "insensitive" as const } },
              { student: { sid: { contains: search, mode: "insensitive" as const } } },
              { student: { name: { contains: search, mode: "insensitive" as const } } },
            ],
          }
        : {}),
    },
    include: {
      student: true,
      invoice: { include: { classPeriod: true, session: true } },
    },
    orderBy: { initiatedAt: "desc" },
    take: 200,
  });

  return json({
    payments: payments.map((p) => ({
      id: p.id,
      reference: p.reference,
      providerTxnId: p.providerTxnId,
      receiptNumber: p.receiptNumber,
      sid: p.student.sid,
      studentName: p.student.name,
      invoiceNumber: p.invoice.invoiceNumber,
      period: p.invoice.classPeriod.displayName,
      session: p.invoice.session.name,
      amount: p.amount.toNumber(),
      status: p.status,
      reconciliationStatus: p.reconciliationStatus,
      paymentMethod: p.paymentMethod,
      initiatedAt: p.initiatedAt,
      paidAt: p.paidAt,
    })),
  });
}
