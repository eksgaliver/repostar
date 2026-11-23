"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Alert } from "@/components/arc/alert/alert";
import { Button } from "@/components/arc/button/button";
import { Combobox } from "@/components/arc/combobox/combobox";
import { Input } from "@/components/arc/input/input";
import { RadioGroup } from "@/components/arc/radio-group/radio-group";
import { Stepper } from "@/components/arc/stepper/stepper";
import type { StepperStep } from "@/components/arc/stepper/stepper";
import { Card } from "@/components/ui/Card";
import { ClientDatePicker } from "@/components/ui/ClientDatePicker";
import { ImageField } from "@/components/ui/ImageField";
import { Muted } from "@/components/ui/Table";
import { fetchCompanies } from "@/lib/company";
import { fetchDirectoryOptions, onboardEmployee } from "@/lib/people";
import type { EmployeeType, OnboardPayload, Option } from "@/lib/people";
import { fetchPositions } from "@/lib/positions";
import type { PositionRow } from "@/lib/positions";

const steps: StepperStep[] = [
  { id: "user", label: "Data user", description: "Akun dan identitas" },
  { id: "penempatan", label: "Penempatan", description: "Lokasi, posisi, shift, kontrak" },
];

const typeOptions = [
  { value: "S", label: "Staff / Karyawan", description: "Kantor, gudang, administrasi" },
  { value: "D", label: "Supir", description: "Profil supir dengan SIM dan unit" },
  { value: "MK", label: "Mekanik", description: "Profil mekanik dengan spesialisasi" },
];

const genderOptions = [
  { value: "male", label: "Laki-laki" },
  { value: "female", label: "Perempuan" },
];

const contractOptions = [
  { value: "PKWTT", label: "PKWTT", description: "Karyawan tetap" },
  { value: "PKWT", label: "PKWT", description: "Kontrak berjangka" },
  { value: "Probation", label: "Probation", description: "Masa percobaan" },
];

const isoDate = (date?: Date) => (date ? date.toISOString().slice(0, 10) : undefined);

/**
 * Onboarding in two steps: the login account first, then the biodata. HR always
 * opens a staff account on the `onboarding` password; only a super admin can
 * raise the role afterwards. The photo lands on the employee row and becomes
 * the avatar in the directory.
 */
export function EmployeeOnboard() {
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState<{ code: string; email: string; password: string } | null>(null);

  const [companyId, setCompanyId] = useState("");
  const [companyCode, setCompanyCode] = useState("");
  const [options, setOptions] = useState<{
    regions: Option[];
    branches: Option[];
    departments: Option[];
    shifts: Option[];
  }>({ regions: [], branches: [], departments: [], shifts: [] });

  const [email, setEmail] = useState("");

  const [photo, setPhoto] = useState("");
  const [fullName, setFullName] = useState("");
  const [nickname, setNickname] = useState("");
  const [nik, setNik] = useState("");
  const [birthDate, setBirthDate] = useState<Date | undefined>(undefined);
  const [gender, setGender] = useState("male");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const [type, setType] = useState<EmployeeType>("S");
  const [regionId, setRegionId] = useState("");
  const [branchId, setBranchId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [positionId, setPositionId] = useState("");
  const [positions, setPositions] = useState<PositionRow[]>([]);
  const [shiftId, setShiftId] = useState("");
  const [joinDate, setJoinDate] = useState<Date | undefined>(undefined);

  const [contractType, setContractType] = useState("PKWTT");
  const [contractEndDate, setContractEndDate] = useState<Date | undefined>(undefined);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { rows } = await fetchCompanies();
      const stored = window.localStorage.getItem("stars:active-company");
      const active = rows.find((item) => item.id === stored) ?? rows[0];
      if (!active || !alive) return;
      setCompanyId(active.id);
      setCompanyCode(active.code);
      const loaded = await fetchDirectoryOptions(active.id);
      if (alive) setOptions(loaded);
    })();
    return () => {
      alive = false;
    };
  }, []);

  // Positions follow the chosen department; the pick is dropped when it changes.
  useEffect(() => {
    let alive = true;
    setPositionId("");
    if (!departmentId) {
      setPositions([]);
      return;
    }
    fetchPositions(departmentId)
      .then((rows) => {
        if (alive) setPositions(rows);
      })
      .catch(() => {
        if (alive) setPositions([]);
      });
    return () => {
      alive = false;
    };
  }, [departmentId]);

  function validate(index: number): string | null {
    if (index === 0) {
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) return "Email login belum valid.";
      if (!companyId) return "Pilih perusahaan dulu di menu Perusahaan.";
      if (!fullName.trim()) return "Nama lengkap wajib diisi.";
    }
    if (index === 1) {
      if (!regionId) return "Wilayah penempatan wajib dipilih.";
      if (!joinDate) return "Tanggal masuk wajib diisi.";
      if (contractType !== "PKWTT" && !contractEndDate) return "Kontrak PKWT / Probation wajib punya tanggal akhir.";
    }
    return null;
  }

  function goNext() {
    const message = validate(step);
    if (message) {
      setError(message);
      return;
    }
    setError(null);
    setStep(1);
  }

  async function submit() {
    const message = validate(1);
    if (message) {
      setError(message);
      return;
    }
    setError(null);
    setSaving(true);
    const payload: OnboardPayload = {
      // HR always opens a staff account; only a super admin can raise the role later.
      account: { email: email.trim().toLowerCase(), role: "staff" },
      profile: {
        companyId,
        regionId,
        type,
        fullName: fullName.trim(),
        joinDate: isoDate(joinDate)!,
        photo: photo || undefined,
        nickname: nickname || undefined,
        nik: nik || undefined,
        birthDate: isoDate(birthDate),
        gender: gender as "male" | "female",
        phone: phone || undefined,
        address: address || undefined,
        branchId: branchId || undefined,
        departmentId: departmentId || undefined,
        positionId: positionId || undefined,
        shiftId: shiftId || undefined,
        contractType,
        contractEndDate: isoDate(contractEndDate),
      },
    };

    try {
      const result = await onboardEmployee(payload);
      setDone({
        code: result.employee.employeeCode,
        email: result.account.email,
        password: result.account.onboardingPassword,
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Gagal menyimpan karyawan.");
    } finally {
      setSaving(false);
    }
  }

  if (done) {
    return (
      <div className="flex flex-col gap-4">
        <Alert tone="success" title="Karyawan dan akun dibuat">
          {done.code} · {done.email} sudah terdaftar. Sampaikan kata sandi awal berikut dan minta diganti saat
          login pertama.
        </Alert>

        <Card title="Kredensial awal" description="Ditampilkan sekali, tidak dikirim lewat email." meta="Akun">
          <ul className="list-rows">
            <li className="flex items-center justify-between gap-3">
              <span>Email login</span>
              <code className="text-xs">{done.email}</code>
            </li>
            <li className="flex items-center justify-between gap-3">
              <span>Kata sandi awal</span>
              <code className="text-xs">{done.password}</code>
            </li>
            <li className="flex items-center justify-between gap-3">
              <span>Kode karyawan</span>
              <strong>{done.code}</strong>
            </li>
          </ul>
        </Card>

        <div className="flex flex-wrap gap-3">
          <Link href="/human-resources/karyawan">
            <Button>Buka daftar karyawan</Button>
          </Link>
          <Button variant="secondary" onClick={() => setDone(null)}>
            Tambah karyawan lain
          </Button>
        </div>
      </div>
    );
  }

  const stepSteps = steps.map((item, index) => ({ ...item, error: error && index === step ? error : undefined }));
  const contractNeedsEnd = contractType !== "PKWTT";

  return (
    <div className="flex flex-col gap-4">
      <Stepper steps={stepSteps} current={step} details="current" label="Langkah onboarding karyawan" />

      <Card
        title={step === 0 ? "Data user" : "Penempatan & posisi"}
        description={
          step === 0
            ? "Akun login, foto, dan identitas karyawan. Peran dikunci ke karyawan (staff); hanya Super Admin yang bisa menaikkannya nanti."
            : "Lokasi penempatan, posisi (departemen), shift, tipe karyawan, dan kontrak. Kode karyawan dibuat otomatis dari wilayah dan tipe."
        }
        meta={`Langkah ${step + 1} dari ${steps.length}`}
        status={companyCode ? `Perusahaan ${companyCode}` : undefined}
      >
        {step === 0 ? (
          <div className="flex flex-col gap-4">
            <Input
              label="Email login"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="nama@perusahaan.co.id"
              description="Dipakai untuk masuk, reset sandi, dan MFA."
            />
            <Muted>
              Kata sandi awal otomatis <strong>onboarding</strong>, wajib diganti saat login pertama. Peran
              akun: karyawan (staff).
            </Muted>

            <section className="form-section">
              <h3 className="form-section__title">Identitas</h3>
              <ImageField
                label="Foto karyawan"
                description="Tampil sebagai avatar di daftar karyawan."
                value={photo}
                onChange={setPhoto}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Nama lengkap"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="Nama sesuai KTP"
                />
                <Input
                  label="Nama panggilan"
                  value={nickname}
                  onChange={(event) => setNickname(event.target.value)}
                  placeholder="Opsional"
                />
                <Input label="NIK" value={nik} onChange={(event) => setNik(event.target.value)} placeholder="16 digit" />
                <ClientDatePicker
                  label="Tanggal lahir"
                  value={birthDate}
                  onChange={setBirthDate}
                  locale="id-ID"
                  description="Opsional, untuk data kependudukan."
                />
                <RadioGroup label="Jenis kelamin" options={genderOptions} value={gender} onValueChange={setGender} />
                <Input label="Telepon" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="08xx" />
                <Input
                  label="Alamat"
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                  placeholder="Opsional"
                  className="sm:col-span-2"
                />
              </div>
            </section>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <section className="form-section">
              <h3 className="form-section__title">Penempatan</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <RadioGroup
                    label="Tipe karyawan"
                    options={typeOptions}
                    value={type}
                    onValueChange={(next) => setType(next as EmployeeType)}
                  />
                </div>
                <Combobox
                  label="Wilayah"
                  options={options.regions.map((option) => ({ value: option.id, label: option.label }))}
                  value={regionId}
                  onValueChange={setRegionId}
                  placeholder="Pilih wilayah"
                />
                <Combobox
                  label="Cabang"
                  options={options.branches.map((option) => ({ value: option.id, label: option.label }))}
                  value={branchId}
                  onValueChange={setBranchId}
                  placeholder="Opsional"
                />
                <Combobox
                  label="Departemen"
                  options={options.departments.map((option) => ({ value: option.id, label: option.label }))}
                  value={departmentId}
                  onValueChange={setDepartmentId}
                  placeholder="Pilih departemen"
                />
                <Combobox
                  label="Posisi"
                  options={positions
                    .filter((position) => position.isActive)
                    .map((position) => ({ value: position.id, label: position.name }))}
                  value={positionId}
                  onValueChange={setPositionId}
                  placeholder={departmentId ? "Pilih posisi" : "Pilih departemen dulu"}
                  emptyMessage={
                    departmentId
                      ? "Departemen ini belum punya posisi. Tambahkan di halaman departemen."
                      : "Pilih departemen dulu."
                  }
                  description="Pilihan posisi mengikuti departemen yang dipilih."
                />
                <Combobox
                  label="Shift"
                  options={options.shifts.map((option) => ({ value: option.id, label: option.label }))}
                  value={shiftId}
                  onValueChange={setShiftId}
                  placeholder="Opsional"
                />
                <ClientDatePicker
                  label="Tanggal masuk"
                  value={joinDate}
                  onChange={setJoinDate}
                  locale="id-ID"
                  showToday
                  description="Dasar perhitungan masa kerja."
                />
              </div>
            </section>

            <section className="form-section">
              <h3 className="form-section__title">Kontrak</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <RadioGroup
                    label="Jenis kontrak"
                    options={contractOptions}
                    value={contractType}
                    onValueChange={setContractType}
                  />
                </div>
                {contractNeedsEnd ? (
                  <ClientDatePicker
                    label="Akhir kontrak"
                    value={contractEndDate}
                    onChange={setContractEndDate}
                    locale="id-ID"
                    description="Wajib untuk PKWT dan Probation."
                  />
                ) : (
                  <Muted>PKWTT tidak memakai tanggal akhir.</Muted>
                )}
              </div>
            </section>
          </div>
        )}
      </Card>

      {error ? <Alert tone="danger" title={error} /> : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="secondary" onClick={() => setStep(0)} disabled={step === 0 || saving}>
          Kembali
        </Button>
        {step === 0 ? (
          <Button onClick={goNext}>Lanjut ke penempatan</Button>
        ) : (
          <Button onClick={submit} loading={saving}>
            Simpan karyawan
          </Button>
        )}
      </div>
    </div>
  );
}