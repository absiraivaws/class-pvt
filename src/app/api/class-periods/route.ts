import { prisma } from "@/lib/prisma";
import { json } from "@/lib/api";

export async function GET() {
  const periods = await prisma.classPeriod.findMany({
    where: { status: "ACTIVE" },
    orderBy: [{ year: "asc" }, { month: "asc" }],
  });
  return json({
    periods: periods.map((p) => ({
      id: p.id,
      displayName: p.displayName,
      month: p.month,
      year: p.year,
      status: p.status,
    })),
  });
}
