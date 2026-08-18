import { NextRequest } from "next/server";
import { getCurrentStudent } from "@/lib/session";
import { json, apiError } from "@/lib/api";
import { regenerateQr, PaymentError } from "@/services/payment.service";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const student = await getCurrentStudent();
  if (!student) return apiError("Unauthorized.", 401);

  const { id } = await params;

  try {
    const payment = await regenerateQr(id, student.id);
    const qr = payment?.qrCodes[0] ?? null;
    if (!payment || !qr) return apiError("Payment not found.", 404);

    return json({
      payment: {
        id: payment.id,
        reference: payment.reference,
        status: payment.status,
        amount: payment.amount.toNumber(),
        qrReference: payment.qrReference,
        qrExpiry: payment.qrExpiry,
        qrData: qr.qrData,
      },
    });
  } catch (e) {
    if (e instanceof PaymentError) return apiError(e.message, 422);
    throw e;
  }
}
