"use client";

import { useCallback, useEffect, useState } from "react";
import { Alert } from "@/components/arc/alert/alert";
import { Badge } from "@/components/arc/badge/badge";
import { Button } from "@/components/arc/button/button";
import { Input } from "@/components/arc/input/input";
import { Skeleton } from "@/components/arc/skeleton/skeleton";
import { Card } from "@/components/ui/Card";
import { Table } from "@/components/ui/Table";
import { apiFetch, copyFor } from "@/lib/api";

const DAYS = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

interface ShiftDay {
  dayOfWeek: number;
  isWorkDay: boolean;
  startTime: string | null;
  endTime: string | null;
}

interface Shift {
  id: string;
  name: string;
  days: ShiftDay[];
}

interface Company {
  id: string;
  name: string;
}

export function ShiftEditor() {
  const [companyId, setCompanyId] = useState("");
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("Reguler");
  const [days, setDays] = useState<ShiftDay[]>(
    DAYS.map((_, index) => ({
      dayOfWeek: index,
      isWorkDay: index !== 0,
      startTime: "08:00",
      endTime: index === 6 ? "12:00" : "17:00",
    })),
  );

  const load = useCallback(async (company: string) => {
    try {
      const data = await apiFetch<{ shifts: Shift[] }>(`/master/shifts?companyId=${company}`);
      setShifts(data.shifts ?? []);
      setError(null);
    } catch (caught) {
      setError(copyFor(caught));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const companies = await apiFetch<{ companies: Company[] }>("/master/companies");
        const first = companies.companies?.[0];
        if (!alive) return;
        if (first) {
          setCompanyId(first.id);
          await load(first.id);
        } else {
          setLoading(false);
        }
      } catch (caught) {
        if (!alive) return;
        setError(copyFor(caught));
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [load]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!companyId) return;
    setSaving(true);
    setError(null);
    try {
      await apiFetch("/master/shifts", {
        method: "POST",
        body: JSON.stringify({
          companyId,
          name,
          days: days.map((day) => ({
            dayOfWeek: day.dayOfWeek,
            isWorkDay: day.isWorkDay,
            startTime: day.isWorkDay ? day.startTime : undefined,
            endTime: day.isWorkDay ? day.endTime : undefined,
          })),
        }),
      });
      setOpen(false);
      await load(companyId);
    } catch (caught) {
      setError(copyFor(caught));
    } finally {
      setSaving(false);
    }
  }

  function updateDay(index: number, patch: Partial<ShiftDay>) {
    setDays((current) => current.map((day, position) => (position === index ? { ...day, ...patch } : day)));
  }

  return (
    <Card
      title="Shift & jam kerja"
      description="Jam masuk/pulang per hari dalam seminggu. Toleransi keterlambatan 0 menit dihitung dari jam masuk ini."
      meta="Master data"
      status={loading ? "…" : `${shifts.length} shift`}
      action={
        <Button size="sm" variant="secondary" onClick={() => setOpen((value) => !value)}>
          {open ? "Tutup" : "Tambah shift"}
        </Button>
      }
    >
      {error ? (
        <Alert tone="danger" title="Gagal" open>
          {error}
        </Alert>
      ) : null}

      {open ? (
        <form onSubmit={submit} className="flex flex-col gap-3">
          <Input label="Nama shift" value={name} onChange={(event) => setName(event.target.value)} required />
          <div className="flex flex-col gap-2">
            {days.map((day, index) => (
              <div key={day.dayOfWeek} className="grid items-center gap-2 sm:grid-cols-[120px_80px_1fr_1fr]">
                <span className="text-sm font-medium">{DAYS[day.dayOfWeek]}</span>
                <label className="flex items-center gap-2 text-xs" style={{ color: "var(--text-secondary)" }}>
                  <input
                    type="checkbox"
                    checked={day.isWorkDay}
                    onChange={(event) => updateDay(index, { isWorkDay: event.target.checked })}
                  />
                  kerja
                </label>
                <input
                  type="time"
                  className="resource-select"
                  value={day.startTime ?? ""}
                  disabled={!day.isWorkDay}
                  onChange={(event) => updateDay(index, { startTime: event.target.value })}
                />
                <input
                  type="time"
                  className="resource-select"
                  value={day.endTime ?? ""}
                  disabled={!day.isWorkDay}
                  onChange={(event) => updateDay(index, { endTime: event.target.value })}
                />
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Button type="submit" size="sm" loading={saving} disabled={saving || !companyId}>
              Simpan shift
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
              Batal
            </Button>
          </div>
        </form>
      ) : null}

      {loading ? (
        <Skeleton lines={3} />
      ) : (
        <Table
          minWidth={640}
          empty="Belum ada shift."
          head={["Shift", ...DAYS, "Hari kerja"]}
          rows={shifts.map((shift) => [
            <span key={`${shift.id}-name`} className="font-medium">
              {shift.name}
            </span>,
            ...DAYS.map((_, index) => {
              const day = shift.days.find((entry) => entry.dayOfWeek === index);
              return (
                <span key={`${shift.id}-${index}`} className="text-xs">
                  {day?.isWorkDay ? `${day.startTime?.slice(0, 5)}–${day.endTime?.slice(0, 5)}` : "—"}
                </span>
              );
            }),
            <Badge key={`${shift.id}-count`} size="sm" pill tone="info">
              {shift.days.filter((day) => day.isWorkDay).length} hari
            </Badge>,
          ])}
        />
      )}
    </Card>
  );
}