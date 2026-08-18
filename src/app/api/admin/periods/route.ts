import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/session";
import { json, apiError } from "@/lib/api";
import { AuditAction, UserType, PeriodStatus } from "@/lib/constants";
import { logAudit } from "@/services/audit.service";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export async function GET() {
  const admin = await getCurrentAdmin();
  if (!admin) return apiError("Unauthorized.", 401);

  const periods = await prisma.classPeriod.findMany({
    orderBy: [{ year: "desc" }, { month: "desc" }],
    include: { _count: { select: { subjectFees: true } } },
  });

  return json({
    periods: periods.map((p) => ({
      id: p.id,
      month: p.month,
      year: p.year,
      displayName: p.displayName,
      status: p.status,
      feeCount: p._count.subjectFees,
      createdAt: p.createdAt,
    })),
  });
}

export async function POST(request: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) return apiError("Unauthorized.", 401);

  let body: { month?: number; year?: number };
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid request body.");
  }

  const month = Number(body.month);
  const year = Number(body.year);
  if (!month || month < 1 || month > 12) return apiError("Invalid month.", 422);
  if (!year || year < 2000 || year > 2100) return apiError("Invalid year.", 422);

  const displayName = `${MONTHS[month - 1]}/${year}`;
  const existing = await prisma.classPeriod.findUnique({
    where: { displayName },
  });
  if (existing) return apiError("This period already exists.", 409);

  const period = await prisma.classPeriod.create({
    data: { month, year, displayName, status: PeriodStatus.ACTIVE },
  });

  await logAudit(AuditAction.PERIOD_CHANGED, {
    userId: admin.id,
    userType: UserType.ADMIN,
    entityType: "CLASS_PERIOD",
    entityId: period.id,
  });

  return json({ period }, 201);
}
