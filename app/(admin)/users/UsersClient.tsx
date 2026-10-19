"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { card, table, th, td, input, label, btnPrimary, btnSecondary, btnDanger, badge } from "@/app/components/ui";
import PasswordInput from "@/app/components/PasswordInput";

interface User {
  id: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
}

export default function UsersClient({ users }: { users: User[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newUser, setNewUser] = useState({ email: "", password: "", role: "staff" });
  const [resettingId, setResettingId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newUser),
    });
    setBusy(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Failed to create user");
      return;
    }
    setNewUser({ email: "", password: "", role: "staff" });
    router.refresh();
  }

  async function setRole(id: string, role: string) {
    setBusy(true);
    await fetch(`/api/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    setBusy(false);
    router.refresh();
  }

  async function setStatus(id: string, status: string) {
    setBusy(true);
    await fetch(`/api/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setBusy(false);
    router.refresh();
  }

  async function resetPassword(id: string) {
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters");
      return;
    }
    setBusy(true);
    const res = await fetch(`/api/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: newPassword }),
    });
    setBusy(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Failed to set password");
      return;
    }
    setResettingId(null);
    setNewPassword("");
    router.refresh();
  }

  return (
    <div>
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className={table}>
          <thead>
            <tr>
              <th className={th}>Email</th>
              <th className={th}>Role</th>
              <th className={th}>Status</th>
              <th className={th}>Created</th>
              <th className={th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td className={`${td} font-medium text-gray-900`}>{u.email}</td>
                <td className={td}>
                  <select className={input} value={u.role} onChange={(e) => setRole(u.id, e.target.value)} disabled={busy}>
                    <option value="staff">staff</option>
                    <option value="admin">admin</option>
                  </select>
                </td>
                <td className={td}>
                  <span className={badge(u.status === "active" ? "green" : "gray")}>{u.status}</span>
                </td>
                <td className={td}>{u.createdAt.slice(0, 10)}</td>
                <td className={td}>
                  {resettingId === u.id ? (
                    <div className="flex flex-col gap-1">
                      <PasswordInput
                        placeholder="New password"
                        autoComplete="new-password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                      <div className="flex gap-1.5">
                        <button className={btnPrimary} disabled={busy} onClick={() => resetPassword(u.id)}>
                          Save
                        </button>
                        <button
                          className={btnSecondary}
                          onClick={() => {
                            setResettingId(null);
                            setNewPassword("");
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      <button className={btnSecondary} onClick={() => setResettingId(u.id)}>
                        Set password
                      </button>
                      {u.status === "active" ? (
                        <button className={btnDanger} disabled={busy} onClick={() => setStatus(u.id, "disabled")}>
                          Disable
                        </button>
                      ) : (
                        <button className={btnPrimary} disabled={busy} onClick={() => setStatus(u.id, "active")}>
                          Re-enable
                        </button>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td className={td} colSpan={5}>
                  No users yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <form onSubmit={create} className={`${card} mt-4 flex flex-wrap items-end gap-3`}>
        <div>
          <label className={label}>Email</label>
          <input
            type="email"
            className={input}
            value={newUser.email}
            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
            required
          />
        </div>
        <div>
          <label className={label}>Password (set by you)</label>
          <PasswordInput
            autoComplete="new-password"
            value={newUser.password}
            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
            required
          />
        </div>
        <div>
          <label className={label}>Role</label>
          <select className={input} value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}>
            <option value="staff">staff</option>
            <option value="admin">admin</option>
          </select>
        </div>
        <button className={btnPrimary} disabled={busy} type="submit">
          Create user
        </button>
        {error && <p className="w-full text-sm text-red-600">{error}</p>}
      </form>
    </div>
  );
}
