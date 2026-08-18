import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/session";
import { json, apiError } from "@/lib/api";
import { isValidNIC, isValidPhone, isValidSID, passwordSchema } from "@/lib/validation";

export async function GET(request: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) return apiError("Unauthorized.", 401);

  const search = request.nextUrl.searchParams.get("search") ?? "";
  const where = search
    ? {
        OR: [
          { sid: { contains: search, mode: "insensitive" as const } },
          { name: { contains: search, mode: "insensitive" as const } },
          { nic: { contains: search, mode: "insensitive" as const } },
          { phone: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  const students = await prisma.student.findMany({
    where,
    include: { stream: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return json({
    students: students.map((s) => ({
      id: s.id,
      sid: s.sid,
      name: s.name,
      nic: s.nic,
      stream: s.stream.name,
      guardianName: s.guardianName,
      phone: s.phone,
      email: s.email,
      emailVerified: s.emailVerified,
      status: s.status,
      createdAt: s.createdAt,
    })),
  });
}

export async function POST(request: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) return apiError("Unauthorized.", 401);

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid request body.");
  }

  const sid = String(body.sid ?? "").trim().toUpperCase();
  const name = String(body.name ?? "").trim();
  const nic = String(body.nic ?? "").trim().toUpperCase();
  const streamId = String(body.streamId ?? "").trim();
  const guardianName = String(body.guardianName ?? "").trim();
  const phone = String(body.phone ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");

  if (!isValidSID(sid)) return apiError("Invalid SID format.", 422);
  if (name.length < 2) return apiError("Name is required.", 422);
  if (!isValidNIC(nic)) return apiError("Invalid NIC format.", 422);
  if (!streamId) return apiError("Stream is required.", 422);
  if (guardianName.length < 2) return apiError("Guardian name is required.", 422);
  if (!isValidPhone(phone)) return apiError("Invalid phone number.", 422);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return apiError("Invalid email.", 422);
  }
  const passwordCheck = passwordSchema.safeParse(password);
  if (!passwordCheck.success) return apiError(passwordCheck.error.issues[0].message, 422);

  const [sidExists, nicExists, emailExists] = await Promise.all([
    prisma.student.findUnique({ where: { sid } }),
    prisma.student.findUnique({ where: { nic } }),
    prisma.student.findUnique({ where: { email } }),
  ]);
  if (sidExists) return apiError("SID already exists.", 409);
  if (nicExists) return apiError("NIC already exists.", 409);
  if (emailExists) return apiError("Email already exists.", 409);

  const student = await prisma.student.create({
    data: {
      sid,
      name,
      nic,
      streamId,
      guardianName,
      phone,
      email,
      passwordHash: await bcrypt.hash(password, 12),
      status: "ACTIVE",
    },
    include: { stream: true },
  });

  return json({ student }, 201);
}
