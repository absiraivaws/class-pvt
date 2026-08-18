"use client";

import { useRouter } from "next/navigation";

export function LogoutButton({ variant = "link" }: { variant?: "link" | "button" }) {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  if (variant === "button") {
    return (
      <button
        onClick={logout}
        className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        Logout
      </button>
    );
  }

  return (
    <button onClick={logout} className="text-sm text-slate-600 hover:text-slate-900">
      Logout
    </button>
  );
}
