"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LogoutButton } from "@/components/logout-button";

type NavItem = { href: string; label: string };
type NavGroup = { label: string; children: NavItem[] };
type NavEntry = NavItem | NavGroup;

const NAV: NavEntry[] = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/students", label: "Students" },
  { href: "/admin/classes", label: "Classes" },
  { href: "/admin/subjects-fees", label: "Subjects & Fees" },
  { href: "/admin/invoices", label: "Invoices" },
  { href: "/admin/payments", label: "Payments" },
  { href: "/admin/reconciliation", label: "Reconciliation" },
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/audit", label: "Audit Logs" },
];

function isGroup(entry: NavEntry): entry is NavGroup {
  return "children" in entry;
}

export function AdminSidebar({
  email,
  role,
}: {
  email: string;
  role: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState<Set<string>>(new Set());

  function isActive(href: string) {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  }

  function groupActive(group: NavGroup) {
    return group.children.some((c) => isActive(c.href));
  }

  function toggle(label: string) {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  }

  return (
    <aside className="fixed inset-y-0 left-0 flex w-64 flex-col border-r border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-4 py-4">
        <div className="text-lg font-bold text-indigo-600">Class Pay Admin</div>
        <span className="mt-1 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
          {role}
        </span>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {NAV.map((entry) => {
          if (isGroup(entry)) {
            const expanded = open.has(entry.label) || groupActive(entry);
            return (
              <div key={entry.label}>
                <button
                  onClick={() => toggle(entry.label)}
                  className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium ${
                    groupActive(entry)
                      ? "text-indigo-600"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <span>{entry.label}</span>
                  <svg
                    className={`h-4 w-4 transition-transform ${
                      expanded ? "rotate-90" : ""
                    }`}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
                {expanded && (
                  <div className="mt-1 space-y-1 pl-4">
                    {entry.children.map((c) => (
                      <Link
                        key={c.href}
                        href={c.href}
                        className={`block rounded-md px-3 py-2 text-sm ${
                          isActive(c.href)
                            ? "bg-indigo-50 font-medium text-indigo-700"
                            : "text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        {c.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          }
          return (
            <Link
              key={entry.href}
              href={entry.href}
              className={`block rounded-md px-3 py-2 text-sm font-medium ${
                isActive(entry.href)
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              {entry.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-200 px-4 py-4">
        <div className="truncate text-sm text-slate-500">{email}</div>
        <div className="mt-2">
          <LogoutButton variant="button" />
        </div>
      </div>
    </aside>
  );
}
