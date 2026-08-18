import { prisma } from "@/lib/prisma";

type AuditInput = {
  userId?: string | null;
  userType?: "STUDENT" | "ADMIN" | null;
  entityType?: string | null;
  entityId?: string | null;
  ipAddress?: string | null;
};

export async function logAudit(action: string, input: AuditInput = {}) {
  try {
    await prisma.auditLog.create({
      data: {
        action,
        userId: input.userId ?? null,
        userType: input.userType ?? null,
        entityType: input.entityType ?? null,
        entityId: input.entityId ?? null,
        ipAddress: input.ipAddress ?? null,
      },
    });
  } catch (e) {
    console.error("Audit log failed:", e);
  }
}
