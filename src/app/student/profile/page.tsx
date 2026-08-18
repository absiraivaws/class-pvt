"use client";

import { useEffect, useState } from "react";
import { Button, Input, Label, Alert, Card } from "@/components/ui";

export default function ProfilePage() {
  const [profile, setProfile] = useState({
    sid: "",
    name: "",
    nic: "",
    stream: "",
    guardianName: "",
    phone: "",
    email: "",
  });
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/student/profile")
      .then((r) => r.json())
      .then((d) => setProfile(d))
      .catch(() => setError("Failed to load profile."));
  }, []);

  function set<K extends keyof typeof profile>(key: K, value: string) {
    setProfile((p) => ({ ...p, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/student/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profile.name,
          guardianName: profile.guardianName,
          phone: profile.phone,
          password: password || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Update failed.");
        return;
      }
      setPassword("");
      setMessage(data.message || "Profile updated.");
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <h2 className="text-xl font-semibold text-slate-900">Profile</h2>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          {message && <Alert type="success">{message}</Alert>}
          {error && <Alert type="error">{error}</Alert>}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>SID</Label>
              <Input value={profile.sid} disabled />
            </div>
            <div>
              <Label>Stream</Label>
              <Input value={profile.stream} disabled />
            </div>
            <div>
              <Label>NIC</Label>
              <Input value={profile.nic} disabled />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={profile.email} disabled />
            </div>
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={profile.name}
                onChange={(e) => set("name", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="guardianName">Guardian Name</Label>
              <Input
                id="guardianName"
                value={profile.guardianName}
                onChange={(e) => set("guardianName", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={profile.phone}
                onChange={(e) => set("phone", e.target.value)}
              />
            </div>
          </div>

          <Button type="submit" disabled={loading}>
            {loading ? "Saving…" : "Save Changes"}
          </Button>
        </form>
      </Card>

      <Card>
        <h2 className="text-xl font-semibold text-slate-900">Change Password</h2>
        <p className="mt-1 text-sm text-slate-500">
          Set a new password (min 8 chars, uppercase, lowercase, number).
        </p>
        <div className="mt-4">
          <Label htmlFor="password">New Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Leave blank to keep current"
          />
        </div>
        <p className="mt-3 text-xs text-slate-400">
          Password is saved together with profile changes.
        </p>
      </Card>
    </div>
  );
}
