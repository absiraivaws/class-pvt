import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/session";
import { json, apiError } from "@/lib/api";
import { AuditAction, UserType } from "@/lib/constants";
import { logAudit } from "@/services/audit.service";

export async function GET(request: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) return apiError("Unauthorized.", 401);

  const periodId = request.nextUrl.searchParams.get("periodId");
  const sessionId = request.nextUrl.searchParams.get("sessionId");
  if (!periodId || !sessionId) return apiError("periodId and sessionId required.", 422);

  const [subjects, fees] = await Promise.all([
    prisma.subject.findMany({ orderBy: { name: "asc" } }),
    prisma.subjectFee.findMany({ where: { classPeriodId: periodId, sessionId } }),
  ]);

  const feeMap = new Map(fees.map((f) => [f.subjectId, f]));

  return json({
    fees: subjects.map((s) => {
      const fee = feeMap.get(s.id);
      return {
        subjectId: s.id,
        code: s.code,
        name: s.name,
        amount: fee ? fee.amount.toNumber() : null,
        status: fee ? fee.status : false,
        feeId: fee?.id ?? null,
      };
    }),
  });
}

export async function POST(request: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) return apiError("Unauthorized.", 401);

  let body: { periodId?: string; sessionId?: string; fees?: { subjectId: string; amount: number }[] };
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid request body.");
  }

  const { periodId, sessionId, fees } = body;
  if (!periodId || !sessionId || !Array.isArray(fees)) {
    return apiError("periodId, sessionId and fees[] are required.", 422);
  }

  await prisma.$transaction(async (tx) => {
    for (const f of fees) {
      if (f.amount < 0) continue;
      await tx.subjectFee.upsert({
        where: {
          classPeriodId_sessionId_subjectId: {
            classPeriodId: periodId,
            sessionId,
            subjectId: f.subjectId,
          },
        },
        update: { amount: f.amount, status: true },
        create: {
          classPeriodId: periodId,
          sessionId,
          subjectId: f.subjectId,
          amount: f.amount,
          status: true,
        },
      });
    }
  });

  await logAudit(AuditAction.FEE_CHANGED, {
    userId: admin.id,
    userType: UserType.ADMIN,
    entityType: "SUBJECT_FEE",
    entityId: periodId,
  });

  return json({ message: "Fees updated." });
}
