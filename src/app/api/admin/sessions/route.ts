import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/session";
import { json, apiError } from "@/lib/api";
import { AuditAction, UserType } from "@/lib/constants";
import { logAudit } from "@/services/audit.service";

export async function GET() {
  const admin = await getCurrentAdmin();
  if (!admin) return apiError("Unauthorized.", 401);

  const sessions = await prisma.classSession.findMany({
    orderBy: { name: "asc" },
  });
  return json({ sessions });
}

export async function POST(request: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) return apiError("Unauthorized.", 401);

  let body: { name?: string };
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid request body.");
  }

  const name = body.name?.trim();
  if (!name || name.length < 2) return apiError("Session name is required.", 422);

  const existing = await prisma.classSession.findUnique({ where: { name } });
  if (existing) return apiError("Session already exists.", 409);

  const session = await prisma.classSession.create({
    data: { name, status: true },
  });

  await logAudit(AuditAction.SESSION_CHANGED, {
    userId: admin.id,
    userType: UserType.ADMIN,
    entityType: "CLASS_SESSION",
    entityId: session.id,
  });

  return json({ session }, 201);
}
