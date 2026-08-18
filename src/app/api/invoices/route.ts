import { NextRequest } from "next/server";
import { getCurrentStudent } from "@/lib/session";
import { json, apiError } from "@/lib/api";
import { createInvoice, InvoiceError } from "@/services/invoice.service";
import { AuditAction, UserType } from "@/lib/constants";
import { logAudit } from "@/services/audit.service";

export async function POST(request: NextRequest) {
  const student = await getCurrentStudent();
  if (!student) return apiError("Unauthorized.", 401);

  let body: { classPeriodId?: string; sessionId?: string; subjectIds?: string[] };
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid request body.");
  }

  const { classPeriodId, sessionId, subjectIds } = body;

  if (!classPeriodId || !sessionId || !Array.isArray(subjectIds)) {
    return apiError("classPeriodId, sessionId and subjectIds are required.", 422);
  }

  try {
    const invoice = await createInvoice({
      studentId: student.id,
      classPeriodId,
      sessionId,
      subjectIds,
    });

    await logAudit(AuditAction.INVOICE_CREATED, {
      userId: student.id,
      userType: UserType.STUDENT,
      entityType: "INVOICE",
      entityId: invoice.id,
    });

    return json(
      {
        invoice: {
          id: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          status: invoice.status,
          subtotal: invoice.subtotal.toNumber(),
          totalAmount: invoice.totalAmount.toNumber(),
        },
      },
      201
    );
  } catch (e) {
    if (e instanceof InvoiceError) return apiError(e.message, 422);
    throw e;
  }
}
