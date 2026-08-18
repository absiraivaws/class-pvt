import { createHmac } from "crypto";
import type {
  PaymentProvider,
  ProviderPaymentRequest,
  ProviderPaymentResult,
  ProviderWebhookResult,
} from "./types";

const secret =
  process.env.LANKAQR_WEBHOOK_SECRET || "dev-webhook-secret-change-me";

function sign(payload: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

/**
 * Development payment provider. Produces a deterministic QR payload and
 * verifies webhook calls using an HMAC signature so the full payment flow
 * (signature verification, reconciliation, idempotency) is exercised without
 * a real bank connection.
 */
export class MockProvider implements PaymentProvider {
  name = "mock";

  async createPayment(
    req: ProviderPaymentRequest
  ): Promise<ProviderPaymentResult> {
    const expiryMs = Number(process.env.QR_EXPIRY_MINUTES || 10) * 60 * 1000;
    const expiry = new Date(Date.now() + expiryMs);

    const payload = {
      v: 1,
      provider: this.name,
      reference: req.reference,
      invoiceNumber: req.invoiceNumber,
      amount: req.amount,
      currency: req.currency,
      expiresAt: expiry.toISOString(),
    };
    const body = JSON.stringify(payload);

    return {
      paymentReference: `MOCK-${req.reference}`,
      qrData: `${body}&sig=${sign(body)}`,
      expiry,
      status: "PENDING",
    };
  }

  verifyWebhook(payload: unknown): ProviderWebhookResult | null {
    if (!payload || typeof payload !== "object") return null;
    const body = payload as Record<string, unknown>;

    const reference = String(body.reference ?? "");
    const amount = Number(body.amount ?? 0);
    const providerTxnId = String(body.providerTxnId ?? "");
    const status = String(body.status ?? "FAILED");
    const paymentMethod = String(body.paymentMethod ?? "MOCK_QR");
    const signature = String(body.signature ?? "");

    if (!reference || !providerTxnId) return null;

    // Reconstruct and verify the signed canonical payload.
    const canonical = JSON.stringify({
      reference,
      amount,
      providerTxnId,
      status,
    });
    const expected = sign(canonical);
    if (expected !== signature) return null;

    return {
      providerTxnId,
      reference,
      amount,
      currency: "LKR",
      status: status === "SUCCESS" ? "SUCCESS" : "FAILED",
      paymentMethod,
    };
  }
}

/**
 * Build a signed webhook body for the mock provider (used by the dev
 * "Simulate payment" action and tests).
 */
export function buildMockWebhook(input: {
  reference: string;
  amount: number;
  providerTxnId: string;
  status: "SUCCESS" | "FAILED";
}): Record<string, unknown> {
  const canonical = JSON.stringify({
    reference: input.reference,
    amount: input.amount,
    providerTxnId: input.providerTxnId,
    status: input.status,
  });
  return {
    ...input,
    paymentMethod: "MOCK_QR",
    signature: sign(canonical),
  };
}
