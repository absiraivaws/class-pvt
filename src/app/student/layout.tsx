import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentStudent } from "@/lib/session";
import { LogoutButton } from "@/components/logout-button";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const student = await getCurrentStudent();
  if (!student) redirect("/login");

  const links = [
    { href: "/student/dashboard", label: "Class Payment" },
    { href: "/student/invoices", label: "Payment History" },
    { href: "/student/profile", label: "Profile" },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-3">
          <div>
            <div className="text-lg font-bold text-indigo-600">Class Pay</div>
            <div className="text-sm text-slate-500">
              Welcome, <span className="font-medium text-slate-700">{student.name}</span>{" "}
              · SID: {student.sid}
            </div>
          </div>
          <nav className="flex items-center gap-4">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-sm text-slate-600 hover:text-indigo-600"
              >
                {l.label}
              </Link>
            ))}
            <LogoutButton />
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
