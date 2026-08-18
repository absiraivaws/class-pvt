import { NextRequest } from "next/server";
import { getCurrentStudent } from "@/lib/session";
import { apiError } from "@/lib/api";
import { getReceipt } from "@/services/receipt.service";
import { generateReceiptPdf } from "@/lib/pdf";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const student = await getCurrentStudent();
  if (!student) return apiError("Unauthorized.", 401);

  const { id } = await params;
  const payment = await getReceipt(id, student.id);
  if (!payment) return apiError("Receipt not found.", 404);

  const inv = payment.invoice;

  const buffer = await generateReceiptPdf({
    receiptNumber: payment.receiptNumber ?? "",
    invoiceNumber: inv.invoiceNumber,
    sid: inv.student.sid,
    studentName: inv.student.name,
    nic: inv.student.nic,
    stream: inv.student.stream.name,
    phone: inv.student.phone,
    email: inv.student.email,
    period: inv.classPeriod.displayName,
    session: inv.session.name,
    items: inv.items.map((i) => ({
      subjectName: i.subjectName,
      amount: i.amount.toNumber(),
    })),
    total: inv.totalAmount.toNumber(),
    paymentMethod: payment.paymentMethod ?? "",
    providerTxnId: payment.providerTxnId ?? "",
    reference: payment.reference,
    paidAt: payment.paidAt ?? payment.initiatedAt,
    instituteName: process.env.INSTITUTE_NAME || "Private Class Institute",
  });

  return new Response(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="Receipt_${payment.receiptNumber}.pdf"`,
    },
  });
}
