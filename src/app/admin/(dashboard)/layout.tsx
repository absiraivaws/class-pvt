import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/session";
import { LogoutButton } from "@/components/logout-button";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  const links = [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/students", label: "Students" },
    { href: "/admin/periods", label: "Periods" },
    { href: "/admin/sessions", label: "Sessions" },
    { href: "/admin/subjects", label: "Subjects" },
    { href: "/admin/fees", label: "Fees" },
    { href: "/admin/invoices", label: "Invoices" },
    { href: "/admin/payments", label: "Payments" },
    { href: "/admin/reconciliation", label: "Reconciliation" },
    { href: "/admin/reports", label: "Reports" },
    { href: "/admin/audit", label: "Audit Logs" },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-4">
            <span className="text-lg font-bold text-indigo-600">Class Pay Admin</span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
              {admin.role}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500">{admin.email}</span>
            <LogoutButton variant="button" />
          </div>
        </div>
        <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 pb-2">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="whitespace-nowrap rounded-md px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
    </div>
  );
}
