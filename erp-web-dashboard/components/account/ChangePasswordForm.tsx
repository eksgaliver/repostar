"use client";

import { useState } from "react";
import { Alert } from "@/components/arc/alert/alert";
import { Button } from "@/components/arc/button/button";
import { Input } from "@/components/arc/input/input";
import { Progress } from "@/components/arc/progress/progress";
import { apiFetch, copyFor } from "@/lib/api";

interface ChangePasswordFormProps {
  userId: string;
  email: string;
  onDone?: () => void;
}

const RULES = [
  { id: "length", label: "Minimal 8 karakter", test: (value: string) => value.length >= 8 },
  { id: "case", label: "Huruf besar & kecil", test: (value: string) => /[a-z]/.test(value) && /[A-Z]/.test(value) },
  { id: "digit", label: "Mengandung angka", test: (value: string) => /\d/.test(value) },
  { id: "symbol", label: "Mengandung simbol", test: (value: string) => /[^A-Za-z0-9]/.test(value) },
];

export function scorePassword(value: string): number {
  if (!value) return 0;
  const passed = RULES.filter((rule) => rule.test(value)).length;
  return Math.round((passed / RULES.length) * 100);
}

export function ChangePasswordForm({ userId, email, onDone }: ChangePasswordFormProps) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const score = scorePassword(next);
  const mismatch = confirm.length > 0 && confirm !== next;
  const canSubmit = current.length > 0 && next.length >= 8 && next === confirm && !saving;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setDone(false);
    try {
      await apiFetch("/account/change-password", {
        method: "POST",
        body: JSON.stringify({ userId, currentPassword: current, newPassword: next }),
      });
      setDone(true);
      setCurrent("");
      setNext("");
      setConfirm("");
      onDone?.();
    } catch (caught) {
      setError(copyFor(caught));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      {done ? (
        <Alert tone="success" title="Sandi diperbarui" open>
          Sandi baru sudah aktif. Tautan reset yang lama otomatis dibatalkan.
        </Alert>
      ) : null}
      {error ? (
        <Alert tone="danger" title="Gagal mengubah sandi" open>
          {error}
        </Alert>
      ) : null}

      <Input
        label="Sandi saat ini"
        type="password"
        autoComplete="current-password"
        placeholder="••••••••"
        value={current}
        onChange={(event) => setCurrent(event.target.value)}
        required
      />
      <Input
        label="Sandi baru"
        type="password"
        autoComplete="new-password"
        placeholder="Minimal 8 karakter"
        value={next}
        onChange={(event) => setNext(event.target.value)}
        required
      />

      <div className="flex flex-col gap-2">
        <Progress value={score} label="Kekuatan sandi" showValue />
        <ul className="grid gap-1 text-xs sm:grid-cols-2" style={{ color: "var(--text-secondary)" }}>
          {RULES.map((rule) => {
            const passed = rule.test(next);
            return (
              <li key={rule.id} className="flex items-center gap-2">
                <span style={{ color: passed ? "var(--success)" : "var(--text-muted)" }}>{passed ? "✓" : "○"}</span>
                {rule.label}
              </li>
            );
          })}
        </ul>
      </div>

      <Input
        label="Ulangi sandi baru"
        type="password"
        autoComplete="new-password"
        placeholder="Ulangi sandi baru"
        value={confirm}
        onChange={(event) => setConfirm(event.target.value)}
        error={mismatch ? "Konfirmasi belum sama dengan sandi baru." : undefined}
        required
      />

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" size="sm" loading={saving} disabled={!canSubmit}>
          Simpan sandi baru
        </Button>
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
          Berlaku untuk {email}
        </span>
      </div>
    </form>
  );
}