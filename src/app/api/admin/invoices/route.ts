import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/session";
import { json, apiError } from "@/lib/api";

export async function GET(request: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) return apiError("Unauthorized.", 401);

  const status = request.nextUrl.searchParams.get("status");
  const search = request.nextUrl.searchParams.get("search") ?? "";

  const invoices = await prisma.invoice.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(search
        ? {
            OR: [
              { invoiceNumber: { contains: search, mode: "insensitive" as const } },
              { student: { sid: { contains: search, mode: "insensitive" as const } } },
              { student: { name: { contains: search, mode: "insensitive" as const } } },
            ],
          }
        : {}),
    },
    include: {
      student: true,
      classPeriod: true,
      session: true,
      items: true,
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return json({
    invoices: invoices.map((inv) => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      sid: inv.student.sid,
      studentName: inv.student.name,
      period: inv.classPeriod.displayName,
      session: inv.session.name,
      subjects: inv.items.map((i) => i.subjectName),
      totalAmount: inv.totalAmount.toNumber(),
      status: inv.status,
      createdAt: inv.createdAt,
      paidAt: inv.paidAt,
    })),
  });
}
