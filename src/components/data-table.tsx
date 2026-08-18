"use client";

import { useState } from "react";

export type SortDir = "asc" | "desc";

export function SortHeader({
  label,
  active,
  dir,
  onToggle,
}: {
  label: string;
  active: boolean;
  dir: SortDir;
  onToggle: () => void;
}) {
  const upActive = active && dir === "asc";
  const downActive = active && dir === "desc";
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`inline-flex items-center gap-1 font-medium hover:text-slate-900 ${
        active ? "text-indigo-600" : "text-slate-500"
      }`}
      title={upActive ? "Sorted A-Z" : downActive ? "Sorted Z-A" : "Sort A-Z / Z-A"}
    >
      <span>{label}</span>
      <span className="flex flex-col">
        <svg
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`h-3 w-3 ${upActive ? "text-indigo-600" : "text-slate-300"}`}
        >
          <path
            fillRule="evenodd"
            d="M14.77 12.79a.75.75 0 01-1.06-.02L10 8.832 6.29 12.77a.75.75 0 11-1.08-1.04l4.25-4.5a.75.75 0 011.08 0l4.25 4.5a.75.75 0 01-.02 1.06z"
            clipRule="evenodd"
          />
        </svg>
        <svg
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`h-3 w-3 ${downActive ? "text-indigo-600" : "text-slate-300"}`}
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </span>
    </button>
  );
}

export function FilterDropdown({
  children,
  active = false,
}: {
  children: React.ReactNode;
  active?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium ${
          active
            ? "border-indigo-300 bg-indigo-50 text-indigo-700"
            : "border-slate-300 text-slate-700 hover:bg-slate-50"
        }`}
      >
        <svg
          viewBox="0 0 20 20"
          fill="currentColor"
          className="h-4 w-4"
        >
          <path
            fillRule="evenodd"
            d="M2.628 1.601C5.028 1.206 7.49 1 10 1s4.973.206 7.372.601a.75.75 0 01.628.74v2.288a2.25 2.25 0 01-.659 1.59l-4.682 4.683a2.25 2.25 0 00-.659 1.59v3.037c0 .684-.31 1.33-.844 1.757l-1.937 1.55A.75.75 0 018 18.25v-5.757a2.25 2.25 0 00-.659-1.591L2.659 6.22A2.25 2.25 0 012 4.629V2.34a.75.75 0 01.628-.74z"
            clipRule="evenodd"
          />
        </svg>
        Filter
      </button>
      {open && (
        <div className="absolute right-0 z-10 mt-2 w-64 space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-lg">
          {children}
        </div>
      )}
    </div>
  );
}
