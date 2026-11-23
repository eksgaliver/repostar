"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/arc/button/button";
import { EmptyState } from "@/components/arc/empty-state/empty-state";
import { Muted } from "@/components/ui/Table";
import { useBreadcrumbTrail } from "@/lib/breadcrumbs";
import { CompanySetupWizard } from "@/components/company/CompanySetupWizard";
import { draftFrom, fetchCompany } from "@/lib/company";
import type { CompanyRow } from "@/lib/company";

/** Edit: loads the tenant, then hands it to the same wizard in edit mode. */
export function CompanyEditor({ companyId }: { companyId: string }) {
  const [row, setRow] = useState<CompanyRow | null>(null);
  const [loading, setLoading] = useState(true);

  useBreadcrumbTrail(row ? ["Ubah"] : []);

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
        description={`Tidak ada tenant dengan id ${companyId}, jadi tidak ada yang bisa diubah.`}
        action={
          <Link href="/perusahaan">
            <Button variant="secondary">Kembali ke daftar</Button>
          </Link>
        }
      />
    );
  }

  return <CompanySetupWizard mode="edit" companyId={row.id} initial={draftFrom(row)} />;
}