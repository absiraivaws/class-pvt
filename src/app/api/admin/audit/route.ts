import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/session";
import { json, apiError } from "@/lib/api";

export async function GET(request: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) return apiError("Unauthorized.", 401);

  const action = request.nextUrl.searchParams.get("action") ?? "";
  const take = 300;

  const logs = await prisma.auditLog.findMany({
    where: action ? { action } : {},
    orderBy: { createdAt: "desc" },
    take,
  });

  return json({
    logs: logs.map((l) => ({
      id: l.id,
      userId: l.userId,
      userType: l.userType,
      action: l.action,
      entityType: l.entityType,
      entityId: l.entityId,
      ipAddress: l.ipAddress,
      createdAt: l.createdAt,
    })),
  });
}
