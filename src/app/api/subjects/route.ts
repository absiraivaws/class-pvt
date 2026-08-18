import { prisma } from "@/lib/prisma";
import { json } from "@/lib/api";

export async function GET() {
  const subjects = await prisma.subject.findMany({
    where: { status: true },
    orderBy: { name: "asc" },
  });
  return json({
    subjects: subjects.map((s) => ({ id: s.id, code: s.code, name: s.name })),
  });
}
