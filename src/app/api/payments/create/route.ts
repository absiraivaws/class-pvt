import { NextRequest } from "next/server";
import { getCurrentStudent } from "@/lib/session";
import { json, apiError } from "@/lib/api";
import { createPayment, PaymentError } from "@/services/payment.service";

export async function POST(request: NextRequest) {
  const student = await getCurrentStudent();
  if (!student) return apiError("Unauthorized.", 401);

  let body: { invoiceId?: string };
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid request body.");
  }

  if (!body.invoiceId) return apiError("invoiceId is required.", 422);

  try {
    const payment = await createPayment(body.invoiceId, student.id);
    const qr = payment.qrCodes[0] ?? null;

    return json({
      payment: {
        id: payment.id,
        reference: payment.reference,
        status: payment.status,
        amount: payment.amount.toNumber(),
        qrReference: payment.qrReference,
        qrExpiry: payment.qrExpiry,
        qrData: qr?.qrData ?? null,
      },
    });
  } catch (e) {
    if (e instanceof PaymentError) return apiError(e.message, 422);
    throw e;
  }
}
