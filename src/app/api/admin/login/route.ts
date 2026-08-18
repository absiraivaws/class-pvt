import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { json, apiError, getClientIp } from "@/lib/api";
import { AuditAction, UserType } from "@/lib/constants";
import { logAudit } from "@/services/audit.service";
import { createSessionToken, SESSION_COOKIE, SESSION_OPTIONS } from "@/lib/auth";

export async function POST(request: NextRequest) {
  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid request body.");
  }

  const email = body.email?.toLowerCase() ?? "";
  const password = body.password ?? "";

  if (!email || !password) return apiError("Email and password required.", 422);

  const admin = await prisma.adminUser.findUnique({ where: { email } });
  if (!admin) return apiError("Invalid credentials.", 401);

  const valid = await bcrypt.compare(password, admin.passwordHash);
  if (!valid) return apiError("Invalid credentials.", 401);

  if (admin.status !== "ACTIVE") {
    return apiError("Account is inactive.", 403);
  }

  const token = await createSessionToken({
    sub: admin.id,
    type: "admin",
    role: admin.role as "ADMIN" | "FINANCE",
  });

  const store = await cookies();
  store.set(SESSION_COOKIE, token, SESSION_OPTIONS);

  await logAudit(AuditAction.ADMIN_LOGIN, {
    userId: admin.id,
    userType: UserType.ADMIN,
    entityType: "ADMIN",
    entityId: admin.id,
    ipAddress: getClientIp(request),
  });

  return json({ message: "Login successful.", redirect: "/admin" });
}
