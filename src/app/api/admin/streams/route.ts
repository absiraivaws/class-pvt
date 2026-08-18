import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/session";
import { json, apiError } from "@/lib/api";

export async function GET() {
  const admin = await getCurrentAdmin();
  if (!admin) return apiError("Unauthorized.", 401);

  const streams = await prisma.stream.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { students: true } } },
  });
  return json({
    streams: streams.map((s) => ({
      id: s.id,
      name: s.name,
      status: s.status,
      studentCount: s._count.students,
    })),
  });
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
  if (!name || name.length < 2) return apiError("Stream name is required.", 422);

  const existing = await prisma.stream.findUnique({ where: { name } });
  if (existing) return apiError("Stream already exists.", 409);

  const stream = await prisma.stream.create({ data: { name, status: true } });
  return json({ stream }, 201);
}
