"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/arc/alert/alert";
import { Button } from "@/components/arc/button/button";
import { Input } from "@/components/arc/input/input";
import { RadioGroup } from "@/components/arc/radio-group/radio-group";
import { Card } from "@/components/ui/Card";
import { Muted } from "@/components/ui/Table";
import { resolveActiveCompany } from "@/lib/company";
import { createDepartment, updateDepartment, type DepartmentRow } from "@/lib/departments";

export interface DepartmentFormProps {
  mode: "create" | "edit";
  department?: DepartmentRow;
}

const statusOptions = [
  { value: "active", label: "Aktif", description: "Muncul di pilihan penempatan karyawan" },
  { value: "inactive", label: "Nonaktif", description: "Disimpan untuk histori, tidak dipakai lagi" },
];

/** Create and edit share one form; only the submit target differs. */
export function DepartmentForm({ mode, department }: DepartmentFormProps) {
  const router = useRouter();
  const [companyId, setCompanyId] = useState("");
  const [code, setCode] = useState(department?.code ?? "");
  const [name, setName] = useState(department?.name ?? "");
  const [status, setStatus] = useState(department?.isActive === false ? "inactive" : "active");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (mode === "edit") return;
    let alive = true;
    resolveActiveCompany().then((company) => {
      if (alive && company) setCompanyId(company.id);
    });
    return () => {
      alive = false;
    };
  }, [mode]);

  async function submit() {
    if (!code.trim() || !name.trim()) {
      setError("Kode dan nama departemen wajib diisi.");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const saved =
        mode === "edit" && department
          ? await updateDepartment(department.id, {
              code: code.trim().toUpperCase(),
              name: name.trim(),
              isActive: status === "active",
            })
          : await createDepartment({ companyId, code: code.trim().toUpperCase(), name: name.trim() });
      router.push(`/human-resources/departemen/${saved.id}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Gagal menyimpan departemen.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Card
        title="Data departemen"
        description="Kode menjadi penanda singkat (mis. OPR), nama dipakai di daftar karyawan dan laporan."
        meta="HR"
      >
        <div className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Kode departemen"
              value={code}
              onChange={(event) => setCode(event.target.value.toUpperCase())}
              placeholder="OPR"
              maxLength={16}
              description="Huruf atau angka, maksimal 16 karakter."
            />
            <Input
              label="Nama departemen"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Operasional"
            />
          </div>
          <RadioGroup label="Status" options={statusOptions} value={status} onValueChange={setStatus} />
          {mode === "create" && !companyId ? <Muted>Menyiapkan perusahaan aktif…</Muted> : null}
        </div>
      </Card>

      {error ? <Alert tone="danger" title={error} /> : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          variant="secondary"
          onClick={() =>
            router.push(
              mode === "edit" && department
                ? `/human-resources/departemen/${department.id}`
                : "/human-resources/departemen"
            )
          }
        >
          Batal
        </Button>
        <Button onClick={submit} loading={saving}>
          {mode === "edit" ? "Simpan perubahan" : "Simpan departemen"}
        </Button>
      </div>
    </div>
  );
}