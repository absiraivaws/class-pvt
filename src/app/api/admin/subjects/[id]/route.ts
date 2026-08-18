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
  const existing = await prisma.subject.findUnique({ where: { id } });
  if (!existing) return apiError("Subject not found.", 404);

  let body: { code?: string; name?: string; status?: boolean };
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid request body.");
  }

  const data: { code?: string; name?: string; status?: boolean } = {};
  if (typeof body.code === "string" && body.code.trim().length >= 2) {
    data.code = body.code.trim().toUpperCase();
  }
  if (typeof body.name === "string" && body.name.trim().length >= 2) {
    data.name = body.name.trim();
  }
  if (typeof body.status === "boolean") data.status = body.status;

  if (Object.keys(data).length === 0) return apiError("No changes provided.", 422);

  const subject = await prisma.subject.update({ where: { id }, data });

  await logAudit(AuditAction.SUBJECT_CHANGED, {
    userId: admin.id,
    userType: UserType.ADMIN,
    entityType: "SUBJECT",
    entityId: id,
  });

  return json({ subject });
}
