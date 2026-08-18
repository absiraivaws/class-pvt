import { prisma } from "@/lib/prisma";
import { json } from "@/lib/api";

export async function GET() {
  const streams = await prisma.stream.findMany({
    where: { status: true },
    orderBy: { name: "asc" },
  });
  return json({
    streams: streams.map((s) => ({ id: s.id, name: s.name })),
  });
}
