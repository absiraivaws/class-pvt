import { prisma } from "@/lib/prisma";
import { PaymentStatus } from "@/lib/constants";

export async function getReceipt(paymentId: string, studentId?: string) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      invoice: {
        include: {
          items: true,
          classPeriod: true,
          session: true,
          student: { include: { stream: true } },
        },
      },
    },
  });

  if (!payment || payment.status !== PaymentStatus.SUCCESS) return null;
  if (studentId && payment.studentId !== studentId) return null;

  return payment;
}
