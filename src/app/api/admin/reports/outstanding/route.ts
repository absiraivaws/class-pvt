import { NextRequest } from "next/server";
import { getCurrentAdmin } from "@/lib/session";
import { apiError } from "@/lib/api";
import { getOutstanding } from "@/services/report.service";
import { buildExcelWorkbook } from "@/lib/excel";

export async function GET(request: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) return apiError("Unauthorized.", 401);

  const periodId = request.nextUrl.searchParams.get("periodId");
  if (!periodId) return apiError("periodId is required.", 422);

  const format = request.nextUrl.searchParams.get("format") ?? "json";
  const { period, rows } = await getOutstanding(periodId);

  if (format === "xlsx") {
    const buffer = await buildExcelWorkbook(
      "Outstanding Students",
      [
        { header: "SID", key: "sid", width: 14 },
        { header: "Student", key: "name", width: 24 },
        { header: "Stream", key: "stream", width: 18 },
        { header: "Paid Subjects", key: "paidCount", width: 14 },
        { header: "Total Subjects", key: "totalSubjects", width: 14 },
        { header: "Outstanding", key: "outstanding", width: 14 },
      ],
      rows.map((r) => ({
        sid: r.sid,
        name: r.name,
        stream: r.stream,
        paidCount: r.paidCount,
        totalSubjects: r.totalSubjects,
        outstanding: r.outstanding,
      }))
    );
    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="outstanding-students.xlsx"`,
      },
    });
  }

  return Response.json({ period: period?.displayName, rows });
}
