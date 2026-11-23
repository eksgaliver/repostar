"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/arc/alert/alert";
import { Badge } from "@/components/arc/badge/badge";
import { Button } from "@/components/arc/button/button";
import { ColorPicker } from "@/components/arc/color-picker/color-picker";
import type { ColorSwatch } from "@/components/arc/color-picker/color-picker";
import { DatePicker } from "@/components/arc/date-picker/date-picker";
import { Input } from "@/components/arc/input/input";
import { RadioGroup } from "@/components/arc/radio-group/radio-group";
import { Stepper } from "@/components/arc/stepper/stepper";
import type { StepperStep } from "@/components/arc/stepper/stepper";
import { Card } from "@/components/ui/Card";
import { Muted } from "@/components/ui/Table";
import { SearchableMultiSelect } from "@/components/company/SearchableMultiSelect";
import { LogoField } from "@/components/company/LogoField";
import { defaultDraft, patchDraft, rememberDraft } from "@/lib/company";
import type { CompanyDraft } from "@/lib/company";
import {
  provinceOptions,
  regencyOptions,
  timezonesOf,
  timezoneShortName,
} from "@/components/company/region-data";

const timezoneChoices = [
  { value: "Asia/Jakarta", label: "WIB · Asia/Jakarta", description: "Sumatera, Jawa, Kalimantan Barat dan Tengah" },
  { value: "Asia/Makassar", label: "WITA · Asia/Makassar", description: "Bali, NTB, NTT, Kalsel, Kaltim, Kaltara, Sulawesi" },
  { value: "Asia/Jayapura", label: "WIT · Asia/Jayapura", description: "Maluku, Maluku Utara, seluruh Papua" },
];

/** Brand presets offered under both colour fields. */
const brandSwatches: ColorSwatch[] = [
  { id: "brand-navy", color: "#1d4ed8" },
  { id: "brand-teal", color: "#0f766e" },
  { id: "brand-amber", color: "#b45309" },
  { id: "brand-slate", color: "#334155" },
];

const steps: StepperStep[] = [
  { id: "profil", label: "Profil", description: "Identitas tenant" },
  { id: "warna", label: "Warna brand", description: "Primary dan secondary" },
  { id: "wilayah", label: "Wilayah", description: "Provinsi operasional" },
  { id: "cutoff", label: "Cutoff", description: "Siklus absensi dan sub wilayah" },
  { id: "ringkasan", label: "Ringkasan", description: "Periksa lalu simpan" },
];

const stepHints = [
  "Kode perusahaan menjadi awalan kode karyawan, misalnya PK-0001 untuk wilayah Riau.",
  "Primary menandai aksi utama, secondary menandai penanda dan grafik pendukung.",
  "Provinsi yang dipilih menentukan zona waktu absensi dan daftar sub wilayah di langkah berikutnya.",
  "Siklus cutoff PRD berjalan dari tanggal 26 sampai tanggal 25 bulan berikutnya.",
  "Semua data masih pratinjau: endpoint warna dan cutoff belum ada di erp-backend-api.",
];

export interface CompanySetupWizardProps {
  /** Create posts a new tenant; edit reuses the same steps for an existing one. */
  mode?: "create" | "edit";
  companyId?: string;
  initial?: Partial<CompanyDraft>;
}

export function CompanySetupWizard({ mode = "create", companyId, initial }: CompanySetupWizardProps) {
  const router = useRouter();
  const start = { ...defaultDraft, ...initial };

  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [code, setCode] = useState(start.code);
  const [name, setName] = useState(start.name);
  const [legalName, setLegalName] = useState(start.legalName);
  const [logo, setLogo] = useState(start.logo);
  const [timezone, setTimezone] = useState(start.timezone);

  const [primary, setPrimary] = useState(start.primary);
  const [secondary, setSecondary] = useState(start.secondary);

  const [provinceIds, setProvinceIds] = useState<string[]>(start.provinceIds);
  const [regencyIds, setRegencyIds] = useState<string[]>(start.regencyIds);
  const [cutoffStart, setCutoffStart] = useState<Date | undefined>(undefined);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Constructed after mount: a render-time Date would break prerendering.
  useEffect(() => {
    const today = new Date();
    setCutoffStart(new Date(today.getFullYear(), today.getMonth(), start.cutoffDay));
  }, [start.cutoffDay]);

  const subRegionOptions = useMemo(() => regencyOptions(provinceIds), [provinceIds]);
  const zoneSummary = timezonesOf(provinceIds).map(timezoneShortName).join(", ");

  const cycle = cutoffStart
    ? { from: cutoffStart.getDate(), to: cutoffStart.getDate() === 1 ? 31 : cutoffStart.getDate() - 1 }
    : null;

  /** Edit mode saves each change at once, so reopening the form shows the last input. */
  function commit(patch: Partial<CompanyDraft>) {
    if (companyId) patchDraft(companyId, patch);
  }

  function validate(index: number): string | null {
    if (index === 0) {
      if (!code.trim()) return "Kode perusahaan wajib diisi.";
      if (!name.trim()) return "Nama perusahaan wajib diisi.";
    }
    if (index === 2 && provinceIds.length === 0) return "Pilih minimal satu provinsi operasional.";
    if (index === 3 && !cutoffStart) return "Tentukan tanggal cutoff absensi.";
    return null;
  }

  function goNext() {
    const message = validate(step);
    if (message) {
      setError(message);
      return;
    }
    setError(null);
    setStep((current) => Math.min(current + 1, steps.length - 1));
  }

  function goBack() {
    setError(null);
    setStep((current) => Math.max(current - 1, 0));
  }

  function pickProvinces(next: string[]) {
    // A sub wilayah only counts while its provinsi stays selected.
    const allowed = new Set(regencyOptions(next).map((option) => option.value));
    const kept = regencyIds.filter((value) => allowed.has(value));
    setProvinceIds(next);
    setRegencyIds(kept);
    commit({ provinceIds: next, regencyIds: kept });
  }

  async function save() {
    const message = validate(3);
    if (message) {
      setError(message);
      setStep(3);
      return;
    }
    setError(null);
    setSaving(true);
    const draft: CompanyDraft = {
      code,
      name,
      legalName,
      logo,
      timezone,
      primary,
      secondary,
      provinceIds,
      regencyIds,
      cutoffDay: cutoffStart?.getDate() ?? start.cutoffDay,
    };
    if (companyId) rememberDraft(companyId, draft);
    // No backend columns for colours, wilayah or cutoff yet, so the draft stays in session.
    await new Promise((resolve) => setTimeout(resolve, 700));
    setSaving(false);
    setSaved(true);
  }

  function leave() {
    router.push(companyId ? `/perusahaan/${companyId}` : "/perusahaan");
  }

  const stepSteps = steps.map((item, index) => ({
    ...item,
    error: error && index === step ? error : undefined,
  }));

  if (saved) {
    return (
      <div className="flex flex-col gap-4">
        <Alert tone="success" title={mode === "edit" ? "Perubahan perusahaan siap dipakai" : "Rancangan perusahaan siap dipakai"}>
          {name || code} tersimpan sebagai pratinjau di sesi ini. Hubungkan ke <code>/master/companies</code>{" "}
          untuk menyimpannya permanen.
        </Alert>

        <Card title={name || code || "Perusahaan baru"} description="Ringkasan konfigurasi" meta="Pratinjau">
          <ul className="list-rows">
            <li className="flex items-center justify-between gap-3">
              <span>Kode</span>
              <strong>{code || "—"}</strong>
            </li>
            <li className="flex items-center justify-between gap-3">
              <span>Nama legal</span>
              <span>{legalName || "—"}</span>
            </li>
            <li className="flex items-center justify-between gap-3">
              <span>Zona waktu default</span>
              <span>{timezone}</span>
            </li>
            <li className="flex items-center justify-between gap-3">
              <span>Provinsi operasional</span>
              <span>
                {provinceIds.length} provinsi · {zoneSummary || "—"}
              </span>
            </li>
            <li className="flex items-center justify-between gap-3">
              <span>Sub wilayah</span>
              <span>{regencyIds.length} kabupaten/kota</span>
            </li>
            <li className="flex items-center justify-between gap-3">
              <span>Siklus cutoff</span>
              <span>{cycle ? `${cycle.from} – ${cycle.to}` : "—"}</span>
            </li>
            <li className="flex items-center justify-between gap-3">
              <span>Warna brand</span>
              <span className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  style={{ background: primary, width: 18, height: 18, borderRadius: 999, display: "inline-block" }}
                />
                <span
                  aria-hidden="true"
                  style={{ background: secondary, width: 18, height: 18, borderRadius: 999, display: "inline-block" }}
                />
                <code className="text-[11px]">{primary}</code>
              </span>
            </li>
          </ul>
        </Card>

        <div className="flex flex-wrap items-center gap-3">
          <Button variant="secondary" onClick={() => setSaved(false)}>
            Ubah lagi
          </Button>
          <Button onClick={leave}>{companyId ? "Buka detail perusahaan" : "Kembali ke daftar"}</Button>
          {companyId ? null : (
            <Button
              variant="ghost"
              onClick={() => {
                setSaved(false);
                setStep(0);
                setCode("");
                setName("");
                setLegalName("");
                setLogo("");
                setProvinceIds([]);
                setRegencyIds([]);
              }}
            >
              Mulai perusahaan baru
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Stepper
        steps={stepSteps}
        current={step}
        onStepSelect={(index) => {
          setError(null);
          setStep(index);
        }}
        details="current"
        label="Langkah setup perusahaan"
        completeLabel="Siap disimpan"
      />

      <Card
        title={step === 0 && mode === "edit" ? `${steps[step]!.label} · ubah data` : steps[step]!.label}
        description={stepHints[step]}
        meta={`Langkah ${step + 1} dari ${steps.length}`}
        status={step === 4 ? "Siap disimpan" : undefined}
      >
        {step === 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <LogoField
                value={logo}
                onChange={(next) => {
                  setLogo(next);
                  commit({ logo: next });
                }}
              />
            </div>
            <Input
              label="Kode perusahaan"
              value={code}
              onChange={(event) => {
                const next = event.target.value.toUpperCase();
                setCode(next);
                commit({ code: next });
              }}
              placeholder="WMPL"
              maxLength={16}
              description="Huruf atau angka, dipakai sebagai awalan kode karyawan."
            />
            <Input
              label="Nama singkat"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                commit({ name: event.target.value });
              }}
              placeholder="Wijaya Manggala Premier Lestari"
              description="Nama yang tampil di topbar dan laporan."
            />
            <Input
              label="Nama legal"
              value={legalName}
              onChange={(event) => {
                setLegalName(event.target.value);
                commit({ legalName: event.target.value });
              }}
              placeholder="PT Wijaya Manggala Premier Lestari"
              description="Nama sesuai akta, untuk dokumen resmi."
              className="sm:col-span-2"
            />
            <div className="sm:col-span-2">
              <RadioGroup
                label="Zona waktu default"
                options={timezoneChoices}
                value={timezone}
                onValueChange={(next) => {
                  setTimezone(next);
                  commit({ timezone: next });
                }}
              />
            </div>
          </div>
        ) : null}

        {step === 1 ? (
          <div className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <ColorPicker
                label="Warna primary"
                value={primary}
                onValueChange={(next) => {
                  setPrimary(next);
                  commit({ primary: next });
                }}
                background="#ffffff"
                defaultSwatches={brandSwatches}
              />
              <ColorPicker
                label="Warna secondary"
                value={secondary}
                onValueChange={(next) => {
                  setSecondary(next);
                  commit({ secondary: next });
                }}
                background="#ffffff"
                defaultSwatches={brandSwatches}
              />
            </div>

            <ul className="list-rows">
              <li className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    style={{ background: primary, width: 20, height: 20, borderRadius: 6, display: "inline-block" }}
                  />
                  Primary
                </span>
                <code className="text-[11px]">{primary}</code>
              </li>
              <li className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    style={{ background: secondary, width: 20, height: 20, borderRadius: 6, display: "inline-block" }}
                  />
                  Secondary
                </span>
                <code className="text-[11px]">{secondary}</code>
              </li>
            </ul>
            <Muted>Keduanya menjadi CSS variable tenant, jadi kartu, tombol, dan grafik mengikuti tanpa hardcode.</Muted>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="flex flex-col gap-4">
            <SearchableMultiSelect
              label="Provinsi operasional"
              searchLabel="Cari provinsi"
              options={provinceOptions}
              value={provinceIds}
              onValueChange={pickProvinces}
              placeholder="Riau, Kalimantan Timur, …"
              emptyMessage="Tidak ada provinsi yang cocok dengan pencarian."
              maxVisible={10}
            />
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={provinceIds.length ? "info" : "neutral"} pill>
                {provinceIds.length} provinsi dipilih
              </Badge>
              {zoneSummary ? (
                <Badge tone="neutral" pill>
                  {zoneSummary}
                </Badge>
              ) : null}
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="flex flex-col gap-4">
            <DatePicker
              label="Tanggal cutoff absensi"
              value={cutoffStart}
              onChange={(date) => {
                setCutoffStart(date);
                commit({ cutoffDay: date?.getDate() ?? start.cutoffDay });
              }}
              locale="id-ID"
              format={{ day: "numeric", month: "long", year: "numeric" }}
              description="Awal siklus. Absensi direkap sampai sehari sebelum tanggal ini di bulan berikutnya."
              showToday
            />

            {cycle ? (
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="info" pill>
                  Siklus {cycle.from} – {cycle.to}
                </Badge>
                <Muted>Seluruh cabang di provinsi terpilih memakai siklus ini.</Muted>
              </div>
            ) : null}

            {provinceIds.length ? (
              <SearchableMultiSelect
                label="Sub wilayah operasional"
                searchLabel="Cari kabupaten/kota"
                options={subRegionOptions}
                value={regencyIds}
                onValueChange={(next) => {
                  setRegencyIds(next);
                  commit({ regencyIds: next });
                }}
                placeholder="Kampar, Kutai Kartanegara, …"
                emptyMessage="Tidak ada kabupaten/kota yang cocok."
                maxVisible={12}
              />
            ) : (
              <Muted>Pilih provinsi di langkah sebelumnya untuk membuka daftar kabupaten/kota.</Muted>
            )}

            <Muted>
              {regencyIds.length} sub wilayah dipilih dari {subRegionOptions.length} pilihan pada{" "}
              {provinceIds.length} provinsi.
            </Muted>
          </div>
        ) : null}

        {step === 4 ? (
          <ul className="list-rows">
            <li className="flex items-center justify-between gap-3">
              <span>Kode · nama</span>
              <span>
                <strong>{code || "—"}</strong> · {name || "—"}
              </span>
            </li>
            <li className="flex items-center justify-between gap-3">
              <span>Nama legal</span>
              <span>{legalName || "—"}</span>
            </li>
            <li className="flex items-center justify-between gap-3">
              <span>Zona waktu default</span>
              <span>{timezone}</span>
            </li>
            <li className="flex items-center justify-between gap-3">
              <span>Warna brand</span>
              <span className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  style={{ background: primary, width: 18, height: 18, borderRadius: 999, display: "inline-block" }}
                />
                <span
                  aria-hidden="true"
                  style={{ background: secondary, width: 18, height: 18, borderRadius: 999, display: "inline-block" }}
                />
                <code className="text-[11px]">
                  {primary} · {secondary}
                </code>
              </span>
            </li>
            <li className="flex items-center justify-between gap-3">
              <span>Provinsi operasional</span>
              <span>
                {provinceIds.length} provinsi{zoneSummary ? ` · ${zoneSummary}` : ""}
              </span>
            </li>
            <li className="flex items-center justify-between gap-3">
              <span>Sub wilayah</span>
              <span>{regencyIds.length} kabupaten/kota</span>
            </li>
            <li className="flex items-center justify-between gap-3">
              <span>Cutoff absensi</span>
              <span>{cycle ? `Tanggal ${cycle.from} (rekap ${cycle.from} – ${cycle.to})` : "—"}</span>
            </li>
            <li className="flex items-center justify-between gap-3">
              <span>Logo</span>
              <span>
                {logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logo} alt="Logo perusahaan" width={32} height={32} style={{ objectFit: "contain" }} />
                ) : (
                  " belum diunggah"
                )}
              </span>
            </li>
          </ul>
        ) : null}
      </Card>

      {error ? <Alert tone="danger" title={error} /> : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="secondary" onClick={goBack} disabled={step === 0 || saving} type="button">
          Kembali
        </Button>
        {step < steps.length - 1 ? (
          <Button onClick={goNext} type="button">
            Lanjut
          </Button>
        ) : (
          <Button onClick={save} loading={saving} type="button">
            {mode === "edit" ? "Simpan perubahan" : "Simpan perusahaan"}
          </Button>
        )}
      </div>
    </div>
  );
}