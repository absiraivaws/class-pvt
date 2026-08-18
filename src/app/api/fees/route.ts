import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { json, apiError } from "@/lib/api";
import { getCurrentStudent } from "@/lib/session";
import { getStudentPaidSubjectIds } from "@/services/invoice.service";

export async function GET(request: NextRequest) {
  const periodId = request.nextUrl.searchParams.get("periodId");
  const sessionId = request.nextUrl.searchParams.get("sessionId");

  if (!periodId || !sessionId) {
    return apiError("periodId and sessionId are required.", 422);
  }

  const student = await getCurrentStudent();
  if (!student) return apiError("Unauthorized.", 401);

  const fees = await prisma.subjectFee.findMany({
    where: { classPeriodId: periodId, sessionId, status: true },
    include: { subject: true },
    orderBy: { subject: { name: "asc" } },
  });

  const paidSubjectIds = await getStudentPaidSubjectIds(
    student.id,
    periodId,
    sessionId
  );

  const subjects = fees.map((f) => ({
    id: f.subject.id,
    code: f.subject.code,
    name: f.subject.name,
    amount: f.amount.toNumber(),
    paid: paidSubjectIds.includes(f.subjectId),
  }));

  return json({ subjects });
}
