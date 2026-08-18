"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Input, Label, Select, Alert, Card } from "@/components/ui";

type Stream = { id: string; name: string };

export default function RegisterPage() {
  const router = useRouter();
  const [streams, setStreams] = useState<Stream[]>([]);
  const [form, setForm] = useState({
    sid: "",
    name: "",
    nic: "",
    streamId: "",
    guardianName: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/streams")
      .then((r) => r.json())
      .then((d) => setStreams(d.streams ?? []))
      .catch(() => {});
  }, []);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, acceptTerms }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Registration failed.");
        return;
      }
      setSuccess(
        `${data.message} Redirecting to login…`
      );
      setTimeout(() => router.push("/login"), 1500);
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <Card className="w-full max-w-lg">
        <h1 className="text-center text-2xl font-bold text-slate-900">
          Student Registration
        </h1>
        <p className="mt-1 text-center text-sm text-slate-500">
          Create your student account.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          {error && <Alert type="error">{error}</Alert>}
          {success && <Alert type="success">{success}</Alert>}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="sid">SID</Label>
              <Input
                id="sid"
                value={form.sid}
                onChange={(e) => set("sid", e.target.value)}
                placeholder="STU000123"
                required
              />
            </div>
            <div>
              <Label htmlFor="name">Student Name</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="John Fernando"
                required
              />
            </div>
            <div>
              <Label htmlFor="nic">NIC</Label>
              <Input
                id="nic"
                value={form.nic}
                onChange={(e) => set("nic", e.target.value)}
                placeholder="200012345678"
                required
              />
            </div>
            <div>
              <Label htmlFor="streamId">Stream</Label>
              <Select
                id="streamId"
                value={form.streamId}
                onChange={(e) => set("streamId", e.target.value)}
                required
              >
                <option value="">Select stream</option>
                {streams.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="guardianName">Parent / Guardian Name</Label>
              <Input
                id="guardianName"
                value={form.guardianName}
                onChange={(e) => set("guardianName", e.target.value)}
                placeholder="Peter Fernando"
                required
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="0771234567"
                required
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="student@email.com"
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={form.confirmPassword}
                onChange={(e) => set("confirmPassword", e.target.value)}
                required
              />
            </div>
          </div>

          <label className="flex items-start gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              className="mt-0.5"
              required
            />
            <span>
              I accept the{" "}
              <Link href="/terms" className="text-indigo-600 hover:underline">
                Terms &amp; Conditions
              </Link>
            </span>
          </label>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Registering…" : "Register"}
          </Button>
        </form>

        <div className="mt-4 text-center text-sm">
          Already have an account?{" "}
          <Link href="/login" className="text-indigo-600 hover:underline">
            Login
          </Link>
        </div>
      </Card>
    </div>
  );
}
