"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/arc/button/button";
import { Input } from "@/components/arc/input/input";
import { Card } from "@/components/ui/Card";
import { Muted } from "@/components/ui/Table";
import { apiUrl } from "@/lib/api";

/** PRD C.5 - cutoff recap straight to .xlsx for Payroll/Finance. */
export function ExportPanel() {
  const [period, setPeriod] = useState("");

  useEffect(() => {
    setPeriod(new Date().toISOString().slice(0, 7));
  }, []);

  const href = `${apiUrl}/attendance/export.xlsx?period=${period}`;

  return (
    <Card
      title="Export rekap kehadiran"
      description="Satu baris per karyawan: hadir, terlambat, cuti, CDT, dan Alfa untuk siklus 26–25."
      meta=".xlsx"
      status={period}
    >
      <div className="grid gap-4 sm:grid-cols-[220px_1fr] sm:items-end">
        <Input
          label="Periode cutoff"
          value={period}
          onChange={(event) => setPeriod(event.target.value)}
          placeholder="2026-11"
          description="Format YYYY-MM; periode mengikuti tanggal awal cutoff."
        />
        <div className="flex flex-wrap items-center gap-3">
          <a href={href} target="_blank" rel="noreferrer">
            <Button size="sm">Unduh .xlsx</Button>
          </a>
          <Muted>Endpoint: GET /attendance/export.xlsx</Muted>
        </div>
      </div>
    </Card>
  );
}