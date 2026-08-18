import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getCurrentStudent } from "@/lib/session";
import { json, apiError } from "@/lib/api";
import { passwordSchema } from "@/lib/validation";

export async function GET() {
  const student = await getCurrentStudent();
  if (!student) return apiError("Unauthorized.", 401);

  return json({
    sid: student.sid,
    name: student.name,
    nic: student.nic,
    stream: student.stream.name,
    guardianName: student.guardianName,
    phone: student.phone,
    email: student.email,
    emailVerified: student.emailVerified,
  });
}

export async function PUT(request: NextRequest) {
  const student = await getCurrentStudent();
  if (!student) return apiError("Unauthorized.", 401);

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid request body.");
  }

  const name =
    typeof body.name === "string" && body.name.trim().length >= 2
      ? body.name.trim()
      : student.name;
  const guardianName =
    typeof body.guardianName === "string" && body.guardianName.trim().length >= 2
      ? body.guardianName.trim()
      : student.guardianName;
  const phone =
    typeof body.phone === "string" && /^0\d{9}$/.test(body.phone.trim())
      ? body.phone.trim()
      : student.phone;

  const updated = await prisma.student.update({
    where: { id: student.id },
    data: { name, guardianName, phone },
    include: { stream: true },
  });

  if (typeof body.password === "string" && body.password.length > 0) {
    const parsed = passwordSchema.safeParse(body.password);
    if (!parsed.success) {
      return apiError(parsed.error.issues[0].message, 422);
    }
    await prisma.student.update({
      where: { id: student.id },
      data: { passwordHash: await bcrypt.hash(body.password, 12) },
    });
  }

  return json({
    message: "Profile updated.",
    name: updated.name,
    guardianName: updated.guardianName,
    phone: updated.phone,
  });
}
