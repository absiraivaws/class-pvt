import { NextRequest } from "next/server";
import { getCurrentAdmin } from "@/lib/session";
import { apiError } from "@/lib/api";
import { getPaymentReport } from "@/services/report.service";
import { buildExcelWorkbook } from "@/lib/excel";
import { formatDateTime } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) return apiError("Unauthorized.", 401);

  const sp = request.nextUrl.searchParams;
  const from = sp.get("from") ? new Date(sp.get("from")!) : undefined;
  const to = sp.get("to") ? new Date(sp.get("to")!) : undefined;
  const status = sp.get("status") ?? undefined;
  const studentId = sp.get("studentId") ?? undefined;
  const format = sp.get("format") ?? "json";

  const { payments, total } = await getPaymentReport({
    from,
    to,
    status,
    studentId,
  });

  if (format === "xlsx") {
    const buffer = await buildExcelWorkbook(
      "Payments",
      [
        { header: "Reference", key: "reference", width: 24 },
        { header: "SID", key: "sid", width: 14 },
        { header: "Student", key: "student", width: 24 },
        { header: "Invoice", key: "invoiceNumber", width: 22 },
        { header: "Period", key: "period", width: 14 },
        { header: "Session", key: "session", width: 12 },
        { header: "Amount", key: "amount", width: 14 },
        { header: "Status", key: "status", width: 14 },
        { header: "Paid At", key: "paidAt", width: 22 },
      ],
      payments.map((p) => ({
        reference: p.reference,
        sid: p.student.sid,
        student: p.student.name,
        invoiceNumber: p.invoice.invoiceNumber,
        period: p.invoice.classPeriod.displayName,
        session: p.invoice.session.name,
        amount: p.amount.toNumber(),
        status: p.status,
        paidAt: p.paidAt ? formatDateTime(p.paidAt) : "",
      }))
    );
    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="payments-report.xlsx"`,
      },
    });
  }

  return Response.json({
    total,
    payments: payments.map((p) => ({
      id: p.id,
      reference: p.reference,
      providerTxnId: p.providerTxnId,
      receiptNumber: p.receiptNumber,
      sid: p.student.sid,
      student: p.student.name,
      stream: p.student.stream?.name ?? "",
      invoiceNumber: p.invoice.invoiceNumber,
      period: p.invoice.classPeriod.displayName,
      session: p.invoice.session.name,
      subjects: p.invoice.items.map((i) => i.subjectName),
      amount: p.amount.toNumber(),
      status: p.status,
      reconciliationStatus: p.reconciliationStatus,
      paymentMethod: p.paymentMethod,
      initiatedAt: p.initiatedAt,
      paidAt: p.paidAt,
    })),
  });
}
