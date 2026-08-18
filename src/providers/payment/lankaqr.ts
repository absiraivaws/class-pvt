import type {
  PaymentProvider,
  ProviderPaymentResult,
  ProviderWebhookResult,
} from "./types";

/**
 * LankaQR dynamic QR provider (national standard).
 *
 * This adapter is a stub: the exact request/response fields, authentication
 * headers, and webhook signature scheme must follow the selected bank's API
 * specification (see the software development document §50).
 *
 * Implement `createPayment` and `verifyWebhook` against the bank spec before
 * enabling PAYMENT_PROVIDER=lankaqr in production.
 */
export class LankaQrProvider implements PaymentProvider {
  name = "lankaqr";

  async createPayment(): Promise<ProviderPaymentResult> {
    throw new Error("LankaQR provider is not yet implemented");
  }

  verifyWebhook(): ProviderWebhookResult | null {
    throw new Error("LankaQR provider is not yet implemented");
  }
}
