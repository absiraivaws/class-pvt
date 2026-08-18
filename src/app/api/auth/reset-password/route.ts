import { NextRequest } from "next/server";
import { createHash } from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { resetPasswordSchema } from "@/lib/validation";
import { json, apiError, getClientIp } from "@/lib/api";
import { AuditAction, UserType } from "@/lib/constants";
import { logAudit } from "@/services/audit.service";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid request body.");
  }

  const parsed = resetPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(
      parsed.error.issues.map((i) => i.message).join(" "),
      422
    );
  }

  const { token, password } = parsed.data;
  const tokenHash = createHash("sha256").update(token).digest("hex");

  const record = await prisma.passwordResetToken.findFirst({
    where: { tokenHash, usedAt: null },
  });

  if (!record) return apiError("Invalid or expired reset link.", 400);
  if (record.expiresAt.getTime() < Date.now()) {
    return apiError("Reset link has expired. Request a new one.", 400);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.$transaction([
    prisma.student.update({
      where: { id: record.studentId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
  ]);

  await logAudit(AuditAction.PASSWORD_RESET, {
    userId: record.studentId,
    userType: UserType.STUDENT,
    entityType: "STUDENT",
    entityId: record.studentId,
    ipAddress: getClientIp(request),
  });

  return json({ message: "Password updated. You can now log in." });
}
