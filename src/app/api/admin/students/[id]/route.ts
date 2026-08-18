import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/session";
import { json, apiError } from "@/lib/api";
import { isValidNIC, isValidPhone } from "@/lib/validation";
import { AuditAction, UserType } from "@/lib/constants";
import { logAudit } from "@/services/audit.service";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getCurrentAdmin();
  if (!admin) return apiError("Unauthorized.", 401);

  const { id } = await params;
  const student = await prisma.student.findUnique({
    where: { id },
    include: { stream: true },
  });
  if (!student) return apiError("Student not found.", 404);

  return json({ student });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getCurrentAdmin();
  if (!admin) return apiError("Unauthorized.", 401);

  const { id } = await params;
  const existing = await prisma.student.findUnique({ where: { id } });
  if (!existing) return apiError("Student not found.", 404);

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid request body.");
  }

  const data: Record<string, unknown> = {};

  if (typeof body.name === "string" && body.name.trim().length >= 2) {
    data.name = body.name.trim();
  }
  if (typeof body.guardianName === "string" && body.guardianName.trim().length >= 2) {
    data.guardianName = body.guardianName.trim();
  }
  if (typeof body.phone === "string" && isValidPhone(body.phone)) {
    data.phone = body.phone.trim();
  }
  if (typeof body.streamId === "string" && body.streamId) {
    data.streamId = body.streamId;
  }
  if (typeof body.nic === "string" && isValidNIC(body.nic)) {
    const nicExists = await prisma.student.findUnique({
      where: { nic: body.nic.toUpperCase() },
    });
    if (nicExists && nicExists.id !== id) return apiError("NIC already used.", 409);
    data.nic = body.nic.toUpperCase();
  }
  if (body.status === "ACTIVE" || body.status === "INACTIVE") {
    data.status = body.status;
  }
  if (typeof body.password === "string" && body.password.length > 0) {
    data.passwordHash = await bcrypt.hash(body.password, 12);
  }

  if (Object.keys(data).length === 0) return apiError("No changes provided.", 422);

  const student = await prisma.student.update({
    where: { id },
    data,
    include: { stream: true },
  });

  await logAudit(AuditAction.STUDENT_UPDATED, {
    userId: admin.id,
    userType: UserType.ADMIN,
    entityType: "STUDENT",
    entityId: id,
  });

  return json({ student });
}
