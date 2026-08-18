import { NextRequest } from "next/server";
import { createHash, randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { forgotPasswordSchema } from "@/lib/validation";
import { json, apiError, getClientIp } from "@/lib/api";
import { AuditAction, UserType } from "@/lib/constants";
import { logAudit } from "@/services/audit.service";
import { sendEmail } from "@/services/email.service";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid request body.");
  }

  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) return apiError("Invalid email address.", 422);

  const email = parsed.data.email.toLowerCase();
  const student = await prisma.student.findUnique({ where: { email } });

  // Always respond the same way to avoid email enumeration.
  if (!student) {
    return json({
      message:
        "If that email is registered, a reset link has been sent.",
    });
  }

  const token = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

  await prisma.passwordResetToken.create({
    data: { studentId: student.id, tokenHash, expiresAt },
  });

  const resetUrl = `${process.env.APP_URL || "http://localhost:3000"}/reset-password?token=${token}`;

  await sendEmail({
    to: student.email,
    subject: "Reset your password",
    text: `Click the secure link below to reset your password:\n\n${resetUrl}\n\nThis link expires in 30 minutes.`,
  });

  await logAudit(AuditAction.PASSWORD_RESET_REQUEST, {
    userId: student.id,
    userType: UserType.STUDENT,
    entityType: "STUDENT",
    entityId: student.id,
    ipAddress: getClientIp(request),
  });

  return json({
    message: "If that email is registered, a reset link has been sent.",
  });
}
