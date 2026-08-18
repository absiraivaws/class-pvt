export type ProviderPaymentRequest = {
  invoiceNumber: string;
  studentId: string;
  amount: number;
  currency: string;
  description: string;
  reference: string;
};

export type ProviderPaymentResult = {
  paymentReference: string;
  qrData: string;
  expiry: Date;
  status: string;
};

export type ProviderWebhookResult = {
  providerTxnId: string;
  reference: string;
  amount: number;
  currency: string;
  status: "SUCCESS" | "FAILED";
  paymentMethod: string;
};

export interface PaymentProvider {
  name: string;
  createPayment(req: ProviderPaymentRequest): Promise<ProviderPaymentResult>;
  verifyWebhook(
    payload: unknown,
    headers: Headers
  ): ProviderWebhookResult | null;
}
