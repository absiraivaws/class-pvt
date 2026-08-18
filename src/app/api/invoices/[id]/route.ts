import { NextRequest } from "next/server";
import { getCurrentStudent } from "@/lib/session";
import { json, apiError } from "@/lib/api";
import { getInvoiceForStudent } from "@/services/invoice.service";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const student = await getCurrentStudent();
  if (!student) return apiError("Unauthorized.", 401);

  const { id } = await params;
  const invoice = await getInvoiceForStudent(id, student.id);
  if (!invoice) return apiError("Invoice not found.", 404);

  return json({
    invoice: {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      status: invoice.status,
      subtotal: invoice.subtotal.toNumber(),
      totalAmount: invoice.totalAmount.toNumber(),
      createdAt: invoice.createdAt,
      paidAt: invoice.paidAt,
      period: invoice.classPeriod.displayName,
      session: invoice.session.name,
      student: {
        sid: invoice.student.sid,
        name: invoice.student.name,
        nic: invoice.student.nic,
        stream: invoice.student.stream.name,
        phone: invoice.student.phone,
        email: invoice.student.email,
      },
      items: invoice.items.map((i) => ({
        subjectId: i.subjectId,
        subjectName: i.subjectName,
        unitAmount: i.unitAmount.toNumber(),
        amount: i.amount.toNumber(),
      })),
      payments: invoice.payments.map((p) => ({
        id: p.id,
        status: p.status,
        reference: p.reference,
        receiptNumber: p.receiptNumber,
      })),
    },
  });
}
