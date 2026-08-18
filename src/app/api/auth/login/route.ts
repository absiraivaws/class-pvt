import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validation";
import { json, apiError, getClientIp } from "@/lib/api";
import { AuditAction, UserType } from "@/lib/constants";
import { logAudit } from "@/services/audit.service";
import { createSessionToken, SESSION_COOKIE, SESSION_OPTIONS } from "@/lib/auth";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid request body.");
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(
      parsed.error.issues.map((i) => i.message).join(" "),
      422
    );
  }

  const { identifier, password } = parsed.data;

  const student = await prisma.student.findFirst({
    where: {
      OR: [
        { sid: identifier.toUpperCase() },
        { email: identifier.toLowerCase() },
      ],
    },
  });

  if (!student) return apiError("Invalid credentials.", 401);

  const valid = await bcrypt.compare(password, student.passwordHash);
  if (!valid) return apiError("Invalid credentials.", 401);

  if (student.status !== "ACTIVE") {
    return apiError("Your account is not active. Contact the administrator.", 403);
  }

  const token = await createSessionToken({
    sub: student.id,
    type: "student",
  });

  const store = await cookies();
  store.set(SESSION_COOKIE, token, SESSION_OPTIONS);

  await logAudit(AuditAction.STUDENT_LOGIN, {
    userId: student.id,
    userType: UserType.STUDENT,
    entityType: "STUDENT",
    entityId: student.id,
    ipAddress: getClientIp(request),
  });

  return json({ message: "Login successful.", redirect: "/student/dashboard" });
}
