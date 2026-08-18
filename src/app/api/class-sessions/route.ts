import { prisma } from "@/lib/prisma";
import { json } from "@/lib/api";

export async function GET() {
  const sessions = await prisma.classSession.findMany({
    where: { status: true },
    orderBy: { name: "asc" },
  });
  return json({
    sessions: sessions.map((s) => ({ id: s.id, name: s.name })),
  });
}
