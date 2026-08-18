import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentStudent } from "@/lib/session";
import { json, apiError } from "@/lib/api";
import { getInvoiceStatus } from "@/services/invoice.service";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const student = await getCurrentStudent();
  if (!student) return apiError("Unauthorized.", 401);

  const { id } = await params;
  const invoice = await prisma.invoice.findUnique({ where: { id } });
  if (!invoice || invoice.studentId !== student.id) {
    return apiError("Invoice not found.", 404);
  }

  const status = await getInvoiceStatus(id);
  return json(status);
}
