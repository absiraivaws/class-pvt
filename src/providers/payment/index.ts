import type { PaymentProvider } from "./types";
import { MockProvider } from "./mock";
import { LankaQrProvider } from "./lankaqr";

let cached: PaymentProvider | null = null;

export function getPaymentProvider(): PaymentProvider {
  if (cached) return cached;
  const name = process.env.PAYMENT_PROVIDER || "mock";
  cached = name === "lankaqr" ? new LankaQrProvider() : new MockProvider();
  return cached;
}
