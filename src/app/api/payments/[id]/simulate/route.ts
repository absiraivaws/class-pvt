import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentStudent } from "@/lib/session";
import { json, apiError } from "@/lib/api";
import { getPaymentProvider } from "@/providers/payment";
import { buildMockWebhook } from "@/providers/payment/mock";
import { processWebhook } from "@/services/payment.service";
import { randomBytes } from "crypto";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const student = await getCurrentStudent();
  if (!student) return apiError("Unauthorized.", 401);

  const provider = getPaymentProvider();
  if (provider.name !== "mock") {
    return apiError("Simulation is only available with the mock provider.", 403);
  }

  const { id } = await params;
  const payment = await prisma.payment.findUnique({ where: { id } });
  if (!payment || payment.studentId !== student.id) {
    return apiError("Payment not found.", 404);
  }

  const payload = buildMockWebhook({
    reference: payment.reference,
    amount: payment.amount.toNumber(),
    providerTxnId: `TXN${randomBytes(6).toString("hex").toUpperCase()}`,
    status: "SUCCESS",
  });

  const result = await processWebhook(payload, new Headers());
  if (!result.ok) return apiError(result.message, 400);

  return json({ message: "Payment simulated successfully." });
}
