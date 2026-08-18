import { getCurrentAdmin } from "@/lib/session";
import { json, apiError } from "@/lib/api";
import { getAdminDashboardStats } from "@/services/report.service";

export async function GET() {
  const admin = await getCurrentAdmin();
  if (!admin) return apiError("Unauthorized.", 401);

  const stats = await getAdminDashboardStats();
  return json(stats);
}
