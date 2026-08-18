import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentStudent } from "@/lib/session";
import { apiError } from "@/lib/api";
import { qrToPngBuffer } from "@/lib/qr";
import { QrStatus } from "@/lib/constants";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const student = await getCurrentStudent();
  if (!student) return apiError("Unauthorized.", 401);

  const { id } = await params;

  const payment = await prisma.payment.findFirst({
    where: { id, studentId: student.id },
    include: {
      invoice: true,
      qrCodes: {
        where: { status: QrStatus.ACTIVE },
        orderBy: { generatedAt: "desc" },
        take: 1,
      },
    },
  });

  if (!payment) return apiError("Payment not found.", 404);
  const qr = payment.qrCodes[0];
  if (!qr) return apiError("No active QR code. Generate a new one.", 404);

  const buffer = await qrToPngBuffer(qr.qrData);

  return new Response(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename="PaymentQR_${payment.invoice.invoiceNumber}.png"`,
    },
  });
}
