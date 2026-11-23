"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/arc/button/button";
import { ConfirmMorph } from "@/components/arc/confirm-morph/confirm-morph";
import { EmptyState } from "@/components/arc/empty-state/empty-state";
import { Card } from "@/components/ui/Card";
import { Muted, PageHeader } from "@/components/ui/Table";
import { useBreadcrumbTrail } from "@/lib/breadcrumbs";
import { apiFetch } from "@/lib/api";
import { fetchCompany } from "@/lib/company";
import type { CompanyRow } from "@/lib/company";

/**
 * Delete: its own route, never a button on the list. Deleting a tenant is
 * irreversible, so the confirm needs a held press, and the view states what is
 * lost before asking.
 */
export function CompanyDeleteView({ companyId }: { companyId: string }) {
  const router = useRouter();
  const [row, setRow] = useState<CompanyRow | null>(null);
  const [loading, setLoading] = useState(true);

  useBreadcrumbTrail(row ? ["Hapus"] : []);

  useEffect(() => {
    let alive = true;
    fetchCompany(companyId).then((result) => {
      if (!alive) return;
      setRow(result.row);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [companyId]);

  if (loading) {
    return <Muted>Memuat data perusahaan…</Muted>;
  }

  if (!row) {
    return (
      <EmptyState
        title="Perusahaan tidak ditemukan"
        description={`Tidak ada tenant dengan id ${companyId}, jadi tidak ada yang bisa dihapus.`}
        action={
          <Link href="/perusahaan">
            <Button variant="secondary">Kembali ke daftar</Button>
          </Link>
        }
      />
    );
  }

  async function remove() {
    await apiFetch(`/master/companies/${row!.id}`, { method: "DELETE" });
    router.push("/perusahaan");
  }

  return (
    <>
      <PageHeader
        title="Hapus perusahaan"
        description={`${row.code} · ${row.name}`}
        aside={
          <Link href={`/perusahaan/${row.id}`}>
            <Button size="sm" variant="secondary">
              Batal
            </Button>
          </Link>
        }
      />

      <Card
        title="Yang ikut terhapus"
        description="Relasi memakai onDelete cascade, jadi menghapus tenant ikut menghapus isinya."
        meta="Tidak bisa dibatalkan"
      >
        <ul className="list-rows">
          <li className="flex items-center justify-between gap-3">
            <span>Wilayah</span>
            <span>seluruh wilayah milik {row.code}</span>
          </li>
          <li className="flex items-center justify-between gap-3">
            <span>Cabang</span>
            <span>seluruh cabang di bawah wilayah tersebut</span>
          </li>
          <li className="flex items-center justify-between gap-3">
            <span>Karyawan, absensi, unit</span>
            <span>seluruh baris yang terikat company_id</span>
          </li>
        </ul>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <ConfirmMorph
          label="Hapus perusahaan"
          prompt={`Hapus ${row.code}?`}
          confirmLabel="Tahan untuk hapus"
          cancelLabel="Batal"
          pendingLabel="Menghapus…"
          errorLabel="Gagal menghapus"
          retryLabel="Coba lagi"
          confirmMode="hold"
          holdDuration={1200}
          onConfirm={remove}
        />
        <Muted>Tahan tombol selama 1,2 detik untuk konfirmasi. Lepas lebih awal membatalkan.</Muted>
      </div>
    </>
  );
}