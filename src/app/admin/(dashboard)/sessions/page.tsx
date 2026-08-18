"use client";

import { useEffect, useState } from "react";
import { Button, Input, Label, Alert, Card } from "@/components/ui";

type Session = { id: string; name: string; status: boolean };

export default function AdminSessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/sessions")
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && data.sessions) setSessions(data.sessions);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/admin/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    if (!res.ok) setError(data.error || "Failed to create session.");
    else {
      setName("");
      setRefresh((r) => r + 1);
    }
  }

  async function toggle(s: Session) {
    await fetch(`/api/admin/sessions/${s.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: !s.status }),
    });
    setRefresh((r) => r + 1);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Class Sessions</h1>

      <Card className="mt-4">
        <form onSubmit={create} className="flex flex-wrap items-end gap-3">
          {error && (
            <div className="w-full">
              <Alert type="error">{error}</Alert>
            </div>
          )}
          <div>
            <Label>Session Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <Button type="submit">Add Session</Button>
        </form>
      </Card>

      <Card className="mt-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              <th className="py-2 font-medium">Name</th>
              <th className="py-2 font-medium">Status</th>
              <th className="py-2 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((s) => (
              <tr key={s.id} className="border-b border-slate-100">
                <td className="py-3">{s.name}</td>
                <td className="py-3">
                  <span className={s.status ? "text-emerald-600" : "text-slate-400"}>
                    {s.status ? "Active" : "Disabled"}
                  </span>
                </td>
                <td className="py-3">
                  <Button variant="secondary" size="sm" onClick={() => toggle(s)}>
                    {s.status ? "Disable" : "Enable"}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
