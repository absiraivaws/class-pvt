"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui";
import { formatDateTime } from "@/lib/utils";

type Log = {
  id: string;
  userType: string | null;
  action: string;
  entityType: string | null;
  entityId: string | null;
  ipAddress: string | null;
  createdAt: string;
};

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<Log[]>([]);

  useEffect(() => {
    fetch("/api/admin/audit")
      .then((r) => r.json())
      .then((d) => setLogs(d.logs ?? []))
      .catch(() => {});
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Audit Logs</h1>
      <Card className="mt-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="py-2 font-medium">Time</th>
                <th className="py-2 font-medium">User Type</th>
                <th className="py-2 font-medium">Action</th>
                <th className="py-2 font-medium">Entity</th>
                <th className="py-2 font-medium">IP</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-500">
                    No audit records.
                  </td>
                </tr>
              ) : (
                logs.map((l) => (
                  <tr key={l.id} className="border-b border-slate-100">
                    <td className="py-3">{formatDateTime(l.createdAt)}</td>
                    <td className="py-3">{l.userType ?? "—"}</td>
                    <td className="py-3 font-mono text-xs">{l.action}</td>
                    <td className="py-3 text-xs">
                      {l.entityType ? `${l.entityType} ${l.entityId ?? ""}` : "—"}
                    </td>
                    <td className="py-3">{l.ipAddress ?? "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
