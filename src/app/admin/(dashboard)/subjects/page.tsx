"use client";

import { useEffect, useState } from "react";
import { Button, Input, Label, Alert, Card } from "@/components/ui";

type Subject = { id: string; code: string; name: string; status: boolean };

export default function AdminSubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/subjects")
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && data.subjects) setSubjects(data.subjects);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/admin/subjects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, name }),
    });
    const data = await res.json();
    if (!res.ok) setError(data.error || "Failed to create subject.");
    else {
      setCode("");
      setName("");
      setRefresh((r) => r + 1);
    }
  }

  async function toggle(s: Subject) {
    await fetch(`/api/admin/subjects/${s.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: !s.status }),
    });
    setRefresh((r) => r + 1);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Subjects</h1>

      <Card className="mt-4">
        <form onSubmit={create} className="flex flex-wrap items-end gap-3">
          {error && (
            <div className="w-full">
              <Alert type="error">{error}</Alert>
            </div>
          )}
          <div>
            <Label>Code</Label>
            <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="CHEM" required />
          </div>
          <div>
            <Label>Subject Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Chemistry" required />
          </div>
          <Button type="submit">Add Subject</Button>
        </form>
      </Card>

      <Card className="mt-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              <th className="py-2 font-medium">Code</th>
              <th className="py-2 font-medium">Subject</th>
              <th className="py-2 font-medium">Status</th>
              <th className="py-2 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {subjects.map((s) => (
              <tr key={s.id} className="border-b border-slate-100">
                <td className="py-3 font-mono">{s.code}</td>
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
