"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Alert } from "@/components/arc/alert/alert";
import { Avatar } from "@/components/arc/avatar/avatar";
import { Badge } from "@/components/arc/badge/badge";
import { Button } from "@/components/arc/button/button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/arc/input/input";
import { Skeleton } from "@/components/arc/skeleton/skeleton";
import { ChangePasswordForm } from "./ChangePasswordForm";
import { apiFetch, copyFor } from "@/lib/api";

interface Profile {
  id: string;
  email: string;
  fullName: string;
  role: string;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string | null;
  companyCode: string | null;
  companyName: string | null;
  employeeCode: string | null;
  employeeType: "S" | "D" | "MK" | null;
  nickname: string | null;
  phone: string | null;
  address: string | null;
  joinDate: string | null;
  isDepartmentHead: boolean | null;
  regionCode: string | null;
  regionName: string | null;
  departmentName: string | null;
}

/** Shown when the API is not running, so the page is still reviewable. */
const DEMO_PROFILE: Profile = {
  id: "demo",
  email: "superadmin@stars.local",
  fullName: "Super Admin",
  role: "super_admin",
  isActive: true,
  lastLoginAt: null,
  createdAt: null,
  companyCode: "WMPL",
  companyName: "Wijaya Manggala Premier Lestari",
  employeeCode: "PK.S.001",
  employeeType: "S",
  nickname: "Raihan",
  phone: "0812-0000-0000",
  address: "Pekanbaru, Riau",
  joinDate: "2024-01-02",
  isDepartmentHead: true,
  regionCode: "PK",
  regionName: "Riau",
  departmentName: "Operasional",
};

const roleLabel: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Admin (readonly)",
  hr_admin: "Admin HR",
  opr_admin: "Admin OPR",
  manager: "Manager",
  staff: "Staff",
};

const typeLabel: Record<string, string> = { S: "Staff", D: "Supir", MK: "Mekanik" };

function formValue(value: string | null | undefined): string {
  return value ?? "";
}

export function ProfileScreen() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [tab, setTab] = useState<"profile" | "security">("profile");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [nickname, setNickname] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hydrate = useCallback((next: Profile) => {
    setProfile(next);
    setFullName(next.fullName);
    setEmail(next.email);
    setNickname(formValue(next.nickname));
    setPhone(formValue(next.phone));
    setAddress(formValue(next.address));
  }, []);

  useEffect(() => {
    let alive = true;
    apiFetch<{ profile: Profile }>("/account/profile")
      .then((data) => {
        if (alive) hydrate(data.profile);
      })
      .catch((caught) => {
        if (!alive) return;
        setOffline(true);
        setError(copyFor(caught));
        hydrate(DEMO_PROFILE);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [hydrate]);

  async function saveProfile(event: React.FormEvent) {
    event.preventDefault();
    if (!profile) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const data = await apiFetch<{ profile: Profile }>("/account/profile", {
        method: "PATCH",
        body: JSON.stringify({
          userId: profile.id,
          fullName,
          email,
          nickname,
          phone,
          address,
        }),
      });
      hydrate(data.profile);
      setSaved(true);
      setOffline(false);
    } catch (caught) {
      setError(copyFor(caught));
    } finally {
      setSaving(false);
    }
  }

  if (loading || !profile) {
    return (
      <Card title="Memuat profil" description="Mengambil data dari erp-backend-api." meta="Account" status="…">
        <Skeleton lines={4} avatar />
      </Card>
    );
  }

  const initialsName = profile.fullName;

  return (
    <>
      {offline ? (
        <Alert tone="warning" title="Mode contoh" open>
          API belum berjalan, jadi data di bawah berasal dari contoh. Ubah profil dan sandi akan
          aktif setelah <code>setup-1.cmd</code> atau <code>setup-3.cmd</code> dijalankan.
        </Alert>
      ) : null}

      <Card
        title={profile.fullName}
        description={`${profile.companyName ?? "WMPL"} · ${roleLabel[profile.role] ?? profile.role}`}
        meta={profile.email}
        status={profile.isActive ? "Aktif" : "Nonaktif"}
        action={
          <div className="flex items-center gap-2">
            <Avatar name={initialsName} size="lg" />
            <Badge tone={profile.isActive ? "success" : "danger"} dot pill>
              {profile.isActive ? "aktif" : "nonaktif"}
            </Badge>
          </div>
        }
      >
        <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="text-xs" style={{ color: "var(--text-muted)" }}>ID Karyawan</div>
            <div className="font-medium">{profile.employeeCode ?? "—"}</div>
          </div>
          <div>
            <div className="text-xs" style={{ color: "var(--text-muted)" }}>Tipe</div>
            <div className="font-medium">{profile.employeeType ? typeLabel[profile.employeeType] : "—"}</div>
          </div>
          <div>
            <div className="text-xs" style={{ color: "var(--text-muted)" }}>Wilayah</div>
            <div className="font-medium">
              {profile.regionCode ? `${profile.regionCode} · ${profile.regionName}` : "—"}
            </div>
          </div>
          <div>
            <div className="text-xs" style={{ color: "var(--text-muted)" }}>Departemen</div>
            <div className="font-medium">{profile.departmentName ?? "—"}</div>
          </div>
        </div>
      </Card>

      <div className="flex items-center gap-2">
        <Button size="sm" variant={tab === "profile" ? "primary" : "ghost"} onClick={() => setTab("profile")}>
          Profil
        </Button>
        <Button size="sm" variant={tab === "security" ? "primary" : "ghost"} onClick={() => setTab("security")}>
          Keamanan &amp; sandi
        </Button>
      </div>

      {tab === "profile" ? (
        <Card
          title="Data profil"
          description="Perubahan langsung tersimpan ke tabel users dan employees."
          meta="Account"
          status="dapat diedit"
        >
          <form onSubmit={saveProfile} className="flex flex-col gap-4">
            {saved ? (
              <Alert tone="success" title="Profil disimpan" open>
                Perubahan sudah tersimpan.
              </Alert>
            ) : null}
            {error && !offline ? (
              <Alert tone="danger" title="Gagal menyimpan" open>
                {error}
              </Alert>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Nama lengkap"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                required
              />
              <Input
                label="Email login"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                description="Email ini dipakai untuk login dan tautan reset sandi."
                required
              />
              <Input
                label="Nama panggilan"
                value={nickname}
                onChange={(event) => setNickname(event.target.value)}
              />
              <Input
                label="Telepon"
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
              />
            </div>

            <Input
              label="Alamat"
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              description="Dipakai HRD untuk keperluan administrasi."
            />

            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" size="sm" loading={saving} disabled={saving || offline}>
                Simpan profil
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => hydrate(profile)}
                disabled={saving || offline}
              >
                Batalkan perubahan
              </Button>
              {profile.lastLoginAt ? (
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Login terakhir {new Date(profile.lastLoginAt).toLocaleString("id-ID")}
                </span>
              ) : null}
            </div>
          </form>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <Card
            title="Ubah sandi"
            description="Masukkan sandi saat ini untuk mengonfirmasi. Minimal 8 karakter dan harus berbeda dari sandi lama."
            meta="Keamanan"
            status={profile.email}
          >
            <ChangePasswordForm userId={profile.id} email={profile.email} />
          </Card>

          <Card
            title="Lupa sandi?"
            description="Minta tautan reset sekali pakai yang berlaku 30 menit. Tautan lama otomatis dibatalkan."
            meta="Reset"
            status="1 tautan aktif"
          >
            <div className="flex flex-col gap-3 text-sm" style={{ color: "var(--text-secondary)" }}>
              <p>
                Alur: kirim permintaan → terima tautan → buat sandi baru. Tautan disimpan sebagai
                hash dan hanya bisa dipakai sekali.
              </p>
              <div className="flex flex-wrap gap-2">
                <Link href="/forgot-password">
                  <Button size="sm" variant="secondary">
                    Minta tautan reset
                  </Button>
                </Link>
                <Link href="/reset-password">
                  <Button size="sm" variant="ghost">
                    Saya punya token
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}