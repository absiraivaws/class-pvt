"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Input,
  Label,
  Select,
  Alert,
  Card,
} from "@/components/ui";
import { SortHeader, type SortDir } from "@/components/data-table";
import { FilterDropdown } from "@/components/data-table";

type Student = {
  id: string;
  sid: string;
  name: string;
  nic: string;
  stream: string;
  guardianName: string;
  phone: string;
  email: string;
  status: string;
};
type Stream = { id: string; name: string };

type SortKey = "sid" | "name" | "nic" | "stream" | "phone" | "status";

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [streams, setStreams] = useState<Stream[]>([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterStream, setFilterStream] = useState("");
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [form, setForm] = useState({
    sid: "",
    name: "",
    nic: "",
    streamId: "",
    guardianName: "",
    phone: "",
    email: "",
    password: "",
  });

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/students")
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && data.students) setStudents(data.students);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/streams")
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setStreams(d.streams ?? []);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const rows = useMemo(() => {
    let result = students;

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((s) =>
        [s.sid, s.name, s.nic, s.stream, s.phone, s.email, s.status]
          .join(" ")
          .toLowerCase()
          .includes(q)
      );
    }
    if (filterStatus) result = result.filter((s) => s.status === filterStatus);
    if (filterStream) result = result.filter((s) => s.stream === filterStream);

    if (sortKey) {
      result = [...result].sort((a, b) => {
        const av = a[sortKey];
        const bv = b[sortKey];
        const cmp = String(av).localeCompare(String(bv));
        return sortDir === "asc" ? cmp : -cmp;
      });
    }
    return result;
  }, [students, search, filterStatus, filterStream, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir("asc");
    } else if (sortDir === "asc") {
      setSortDir("desc");
    } else {
      setSortKey(null);
    }
  }

  async function toggleStatus(s: Student) {
    const res = await fetch(`/api/admin/students/${s.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: s.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
      }),
    });
    if (res.ok) setRefresh((r) => r + 1);
  }

  async function createStudent(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/admin/students", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to create student.");
      return;
    }
    setShowForm(false);
    setForm({
      sid: "",
      name: "",
      nic: "",
      streamId: "",
      guardianName: "",
      phone: "",
      email: "",
      password: "",
    });
    setRefresh((r) => r + 1);
  }

  function header(key: SortKey, label: string) {
    return (
      <SortHeader
        label={label}
        active={sortKey === key}
        dir={sortDir}
        onToggle={() => toggleSort(key)}
      />
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900">Students</h1>
        <div className="flex gap-2">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search SID, name, NIC…"
            className="w-64"
          />
          <FilterDropdown active={filterStatus !== "" || filterStream !== ""}>
            <div>
              <Label>Status</Label>
              <Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">All</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </Select>
            </div>
            <div>
              <Label>Stream</Label>
              <Select
                value={filterStream}
                onChange={(e) => setFilterStream(e.target.value)}
              >
                <option value="">All</option>
                {streams.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </div>
          </FilterDropdown>
          <Button onClick={() => setShowForm((v) => !v)}>
            {showForm ? "Close" : "Add Student"}
          </Button>
        </div>
      </div>

      {showForm && (
        <Card className="mt-4">
          <h2 className="font-semibold text-slate-900">Add Student</h2>
          <form onSubmit={createStudent} className="mt-4 grid gap-3 sm:grid-cols-2">
            {error && (
              <div className="sm:col-span-2">
                <Alert type="error">{error}</Alert>
              </div>
            )}
            <div>
              <Label>SID</Label>
              <Input value={form.sid} onChange={(e) => setForm({ ...form, sid: e.target.value })} required />
            </div>
            <div>
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <Label>NIC</Label>
              <Input value={form.nic} onChange={(e) => setForm({ ...form, nic: e.target.value })} required />
            </div>
            <div>
              <Label>Stream</Label>
              <Select value={form.streamId} onChange={(e) => setForm({ ...form, streamId: e.target.value })} required>
                <option value="">Select</option>
                {streams.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Guardian</Label>
              <Input value={form.guardianName} onChange={(e) => setForm({ ...form, guardianName: e.target.value })} required />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div>
              <Label>Password</Label>
              <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit">Create Student</Button>
            </div>
          </form>
        </Card>
      )}

      <Card className="mt-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="py-2 pr-3">{header("sid", "SID")}</th>
                <th className="py-2 pr-3">{header("name", "Name")}</th>
                <th className="py-2 pr-3">{header("nic", "NIC")}</th>
                <th className="py-2 pr-3">{header("stream", "Stream")}</th>
                <th className="py-2 pr-3">{header("phone", "Phone")}</th>
                <th className="py-2 pr-3">{header("status", "Status")}</th>
                <th className="py-2 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-500">
                    No students found.
                  </td>
                </tr>
              ) : (
                rows.map((s) => (
                  <tr key={s.id} className="border-b border-slate-100">
                    <td className="py-3">{s.sid}</td>
                    <td className="py-3">{s.name}</td>
                    <td className="py-3">{s.nic}</td>
                    <td className="py-3">{s.stream}</td>
                    <td className="py-3">{s.phone}</td>
                    <td className="py-3">
                      <span
                        className={
                          s.status === "ACTIVE"
                            ? "text-emerald-600"
                            : "text-red-600"
                        }
                      >
                        {s.status}
                      </span>
                    </td>
                    <td className="py-3">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => toggleStatus(s)}
                      >
                        {s.status === "ACTIVE" ? "Deactivate" : "Activate"}
                      </Button>
                    </td>
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
