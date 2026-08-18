import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE, verifySessionToken, type SessionUser } from "@/lib/auth";

export async function getSession(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function getCurrentStudent() {
  const session = await getSession();
  if (!session || session.type !== "student") return null;
  const student = await prisma.student.findUnique({
    where: { id: session.sub },
    include: { stream: true },
  });
  if (!student || student.status !== "ACTIVE") return null;
  return student;
}

export async function getCurrentAdmin() {
  const session = await getSession();
  if (!session || session.type !== "admin") return null;
  const admin = await prisma.adminUser.findUnique({
    where: { id: session.sub },
  });
  if (!admin || admin.status !== "ACTIVE") return null;
  return admin;
}
