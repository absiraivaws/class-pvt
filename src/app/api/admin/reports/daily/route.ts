import { NextRequest } from "next/server";
import { getCurrentAdmin } from "@/lib/session";
import { apiError } from "@/lib/api";
import { getDailyCollection } from "@/services/report.service";
import { buildExcelWorkbook } from "@/lib/excel";
import { formatDate } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) return apiError("Unauthorized.", 401);

  const sp = request.nextUrl.searchParams;
  const date = sp.get("date") ? new Date(sp.get("date")!) : new Date();
  const format = sp.get("format") ?? "json";

  const { rows, total } = await getDailyCollection(date);

  if (format === "xlsx") {
    const buffer = await buildExcelWorkbook(
      "Daily Collection",
      [
        { header: "Subject", key: "subject", width: 24 },
        { header: "Amount", key: "amount", width: 16 },
      ],
      [
        ...rows.map((r) => ({
          subject: r.subjectName,
          amount: r.total,
        })),
        { subject: "TOTAL", amount: total },
      ]
    );
    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="daily-collection-${formatDate(date)}.xlsx"`,
      },
    });
  }

  return Response.json({ date, rows, total });
}
