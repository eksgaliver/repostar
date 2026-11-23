"use client";

import Link from "next/link";
import { useState } from "react";
import { Alert } from "@/components/arc/alert/alert";
import { Badge } from "@/components/arc/badge/badge";
import { Button } from "@/components/arc/button/button";
import { Card } from "@/components/ui/Card";
import { CopyButton } from "@/components/arc/copy-button/copy-button";
import { Input } from "@/components/arc/input/input";
import { apiFetch, copyFor } from "@/lib/api";

interface ForgotResponse {
  ok: boolean;
  token?: string;
  expiresAt?: string;
  email?: string;
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<ForgotResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSending(true);
    setError(null);
    setResult(null);
    try {
      const data = await apiFetch<ForgotResponse>("/account/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setResult(data);
    } catch (caught) {
      setError(copyFor(caught));
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Lupa sandi</h1>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Masukkan email akun. Sistem membuat token sekali pakai yang berlaku 30 menit.
        </p>
      </div>

      <Card
        title="Minta tautan reset"
        description="Demi keamanan, jawaban selalu sama apakah email terdaftar atau tidak."
        meta="Account"
        status="30 menit"
      >
        <form onSubmit={submit} className="flex flex-col gap-4">
          {error ? (
            <Alert tone="danger" title="Permintaan gagal" open>
              {error}
            </Alert>
          ) : null}

          <Input
            label="Email akun"
            type="email"
            autoComplete="email"
            placeholder="superadmin@stars.local"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" size="sm" loading={sending} disabled={sending}>
              Kirim permintaan
            </Button>
            <Link href="/profile">
              <Button type="button" size="sm" variant="ghost">
                Kembali ke profil
              </Button>
            </Link>
          </div>
        </form>
      </Card>

      {result?.ok ? (
        <Card
          title="Permintaan diterima"
          description="Kalau email terdaftar, tautan reset sudah dibuat. Di mode pengembangan token ditampilkan di bawah karena belum ada layanan email."
          meta="Dev"
          status={result.email ? result.email : "—"}
          action={
            <Badge tone="warning" dot pill>
              dev only
            </Badge>
          }
        >
          {result.token ? (
            <div className="flex flex-col gap-3">
              <div
                className="break-all rounded-lg border p-3 font-mono text-xs"
                style={{ borderColor: "var(--border)", background: "var(--surface-muted)", color: "var(--text-secondary)" }}
              >
                {result.token}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <CopyButton value={result.token} label="Copy token" />
                <Link href={`/reset-password?token=${encodeURIComponent(result.token)}`}>
                  <Button size="sm">Buat sandi baru</Button>
                </Link>
                {result.expiresAt ? (
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                    Kedaluwarsa {new Date(result.expiresAt).toLocaleTimeString("id-ID")}
                  </span>
                ) : null}
              </div>
            </div>
          ) : (
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Cek kotak masuk email Anda. Tautan hanya bisa dipakai sekali.
            </p>
          )}
        </Card>
      ) : null}
    </div>
  );
}