import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validation";
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

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(
      parsed.error.issues.map((i) => i.message).join(" "),
      422
    );
  }

  const data = parsed.data;

  const [sidExists, nicExists, emailExists, streamExists] = await Promise.all([
    prisma.student.findUnique({ where: { sid: data.sid.toUpperCase() } }),
    prisma.student.findUnique({ where: { nic: data.nic.toUpperCase() } }),
    prisma.student.findUnique({ where: { email: data.email.toLowerCase() } }),
    prisma.stream.findUnique({ where: { id: data.streamId } }),
  ]);

  if (sidExists) return apiError("This SID is already registered.", 409);
  if (nicExists) return apiError("This NIC is already registered.", 409);
  if (emailExists) return apiError("This email is already registered.", 409);
  if (!streamExists) return apiError("Selected stream is invalid.", 422);

  const passwordHash = await bcrypt.hash(data.password, 12);

  const student = await prisma.student.create({
    data: {
      sid: data.sid.toUpperCase(),
      name: data.name,
      nic: data.nic.toUpperCase(),
      streamId: data.streamId,
      guardianName: data.guardianName,
      phone: data.phone,
      email: data.email.toLowerCase(),
      passwordHash,
      emailVerified: false,
      status: "ACTIVE",
    },
  });

  await logAudit(AuditAction.STUDENT_REGISTER, {
    userId: student.id,
    userType: UserType.STUDENT,
    entityType: "STUDENT",
    entityId: student.id,
    ipAddress: getClientIp(request),
  });

  await sendEmail({
    to: student.email,
    subject: "Account registered",
    text: `Your student account has been successfully registered.\nSID: ${student.sid}`,
  });

  return json(
    {
      message: "Registration successful. You can now log in.",
      sid: student.sid,
    },
    201
  );
}
