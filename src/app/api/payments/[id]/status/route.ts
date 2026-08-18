import { NextRequest } from "next/server";
import { getCurrentStudent } from "@/lib/session";
import { json, apiError } from "@/lib/api";
import { getPaymentStatus } from "@/services/payment.service";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const student = await getCurrentStudent();
  if (!student) return apiError("Unauthorized.", 401);

  const { id } = await params;
  const status = await getPaymentStatus(id, student.id);
  if (!status) return apiError("Payment not found.", 404);

  return json(status);
}
