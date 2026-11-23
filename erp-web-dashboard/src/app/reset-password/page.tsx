"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Alert } from "@/components/arc/alert/alert";
import { Badge } from "@/components/arc/badge/badge";
import { Button } from "@/components/arc/button/button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/arc/input/input";
import { Progress } from "@/components/arc/progress/progress";
import { scorePassword } from "@/components/account/ChangePasswordForm";
import { apiFetch, copyFor } from "@/lib/api";

type TokenState = "checking" | "valid" | "invalid" | "missing";

export default function ResetPasswordPage() {
  const [token, setToken] = useState("");
  const [tokenState, setTokenState] = useState<TokenState>("checking");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get("token") ?? "";
    setToken(fromUrl);
    if (!fromUrl) {
      setTokenState("missing");
      return;
    }
    apiFetch<{ valid: boolean }>(`/account/reset-password/verify?token=${encodeURIComponent(fromUrl)}`)
      .then((data) => setTokenState(data.valid ? "valid" : "invalid"))
      .catch(() => setTokenState("invalid"));
  }, []);

  const score = scorePassword(next);
  const mismatch = confirm.length > 0 && confirm !== next;
  const canSubmit = tokenState === "valid" && next.length >= 8 && next === confirm && !saving;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await apiFetch("/account/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, newPassword: next }),
      });
      setDone(true);
      setNext("");
      setConfirm("");
    } catch (caught) {
      setError(copyFor(caught));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Reset sandi</h1>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Token sekali pakai dari halaman lupa sandi. Setelah tersimpan, semua tautan reset lain
          untuk akun ini tidak berlaku lagi.
        </p>
      </div>

      {done ? (
        <Card title="Sandi berhasil diganti" description="Silakan masuk kembali dengan sandi baru." meta="Selesai" status="ok">
          <div className="flex flex-wrap gap-2">
            <Link href="/profile">
              <Button size="sm">Kembali ke profil</Button>
            </Link>
            <Link href="/forgot-password">
              <Button size="sm" variant="ghost">
                Minta tautan lain
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <Card
          title="Buat sandi baru"
          description="Minimal 8 karakter, sebaiknya gabungan huruf besar, kecil, angka, dan simbol."
          meta="Account"
          status={tokenState === "valid" ? "token valid" : tokenState === "checking" ? "memeriksa…" : "token tidak valid"}
          action={
            <Badge tone={tokenState === "valid" ? "success" : tokenState === "checking" ? "info" : "danger"} dot pill>
              {tokenState}
            </Badge>
          }
        >
          {tokenState === "missing" ? (
            <Alert tone="warning" title="Token belum ada" open>
              Buka halaman ini dari tautan reset, atau tempel token di kolom di bawah.
            </Alert>
          ) : null}
          {tokenState === "invalid" ? (
            <Alert tone="danger" title="Token tidak valid" open>
              Tautan mungkin sudah kedaluwarsa atau dipakai.{" "}
              <Link href="/forgot-password" style={{ textDecoration: "underline" }}>
                Minta tautan baru
              </Link>
              .
            </Alert>
          ) : null}
          {error ? (
            <Alert tone="danger" title="Gagal menyimpan sandi" open>
              {error}
            </Alert>
          ) : null}

          <form onSubmit={submit} className="mt-4 flex flex-col gap-4">
            <Input
              label="Token reset"
              value={token}
              onChange={(event) => {
                setToken(event.target.value);
                setTokenState(event.target.value ? "valid" : "missing");
              }}
              description="Bisa ditempel manual kalau tautan dibuka di perangkat lain."
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
            <Progress value={score} label="Kekuatan sandi" showValue />
            <Input
              label="Ulangi sandi baru"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              error={mismatch ? "Konfirmasi belum sama dengan sandi baru." : undefined}
              required
            />

            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" size="sm" loading={saving} disabled={!canSubmit}>
                Simpan sandi baru
              </Button>
              <Link href="/forgot-password">
                <Button type="button" size="sm" variant="ghost">
                  Minta tautan baru
                </Button>
              </Link>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}