import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/session";
import { json, apiError } from "@/lib/api";
import { AuditAction, UserType, PeriodStatus } from "@/lib/constants";
import { logAudit } from "@/services/audit.service";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getCurrentAdmin();
  if (!admin) return apiError("Unauthorized.", 401);

  const { id } = await params;
  const existing = await prisma.classPeriod.findUnique({ where: { id } });
  if (!existing) return apiError("Period not found.", 404);

  let body: { status?: string };
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid request body.");
  }

  const status = body.status;
  if (status !== PeriodStatus.ACTIVE && status !== PeriodStatus.CLOSED) {
    return apiError("Invalid status.", 422);
  }

  const period = await prisma.classPeriod.update({
    where: { id },
    data: { status },
  });

  await logAudit(AuditAction.PERIOD_CHANGED, {
    userId: admin.id,
    userType: UserType.ADMIN,
    entityType: "CLASS_PERIOD",
    entityId: id,
  });

  return json({ period });
}
