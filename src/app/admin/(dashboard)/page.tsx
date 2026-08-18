import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/session";
import { getAdminDashboardStats } from "@/services/report.service";
import { StatCard } from "@/components/ui";
import { formatLKR } from "@/lib/utils";

export default async function AdminDashboardPage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  const stats = await getAdminDashboardStats();

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Total Students" value={stats.totalStudents} />
        <StatCard label="Today's Payments" value={formatLKR(stats.todayPayments)} />
        <StatCard label="This Month" value={formatLKR(stats.monthPayments)} />
        <StatCard label="Pending Payments" value={stats.pendingPayments} />
        <StatCard label="Successful Payments" value={stats.successfulPayments} />
        <StatCard label="Failed Payments" value={stats.failedPayments} />
      </div>
    </div>
  );
}
