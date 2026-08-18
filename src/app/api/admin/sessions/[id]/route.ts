import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/session";
import { json, apiError } from "@/lib/api";
import { AuditAction, UserType } from "@/lib/constants";
import { logAudit } from "@/services/audit.service";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getCurrentAdmin();
  if (!admin) return apiError("Unauthorized.", 401);

  const { id } = await params;
  const existing = await prisma.classSession.findUnique({ where: { id } });
  if (!existing) return apiError("Session not found.", 404);

  let body: { name?: string; status?: boolean };
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid request body.");
  }

  const data: { name?: string; status?: boolean } = {};
  if (typeof body.name === "string" && body.name.trim().length >= 2) {
    data.name = body.name.trim();
  }
  if (typeof body.status === "boolean") data.status = body.status;

  if (Object.keys(data).length === 0) return apiError("No changes provided.", 422);

  const session = await prisma.classSession.update({ where: { id }, data });

  await logAudit(AuditAction.SESSION_CHANGED, {
    userId: admin.id,
    userType: UserType.ADMIN,
    entityType: "CLASS_SESSION",
    entityId: id,
  });

  return json({ session });
}
