import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/session";
import { json, apiError } from "@/lib/api";
import { AuditAction, UserType } from "@/lib/constants";
import { logAudit } from "@/services/audit.service";

export async function GET() {
  const admin = await getCurrentAdmin();
  if (!admin) return apiError("Unauthorized.", 401);

  const subjects = await prisma.subject.findMany({ orderBy: { name: "asc" } });
  return json({ subjects });
}

export async function POST(request: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) return apiError("Unauthorized.", 401);

  let body: { code?: string; name?: string };
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid request body.");
  }

  const code = body.code?.trim().toUpperCase();
  const name = body.name?.trim();
  if (!code || code.length < 2) return apiError("Subject code is required.", 422);
  if (!name || name.length < 2) return apiError("Subject name is required.", 422);

  const [codeExists, nameExists] = await Promise.all([
    prisma.subject.findUnique({ where: { code } }),
    prisma.subject.findFirst({ where: { name } }),
  ]);
  if (codeExists) return apiError("Subject code already exists.", 409);
  if (nameExists) return apiError("Subject name already exists.", 409);

  const subject = await prisma.subject.create({
    data: { code, name, status: true },
  });

  await logAudit(AuditAction.SUBJECT_CHANGED, {
    userId: admin.id,
    userType: UserType.ADMIN,
    entityType: "SUBJECT",
    entityId: subject.id,
  });

  return json({ subject }, 201);
}
