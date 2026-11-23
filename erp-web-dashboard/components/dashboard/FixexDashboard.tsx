"use client";

import { useState } from "react";
import { Badge } from "@/components/arc/badge/badge";
import { Calendar } from "@/components/arc/calendar/calendar";
import { Card } from "@/components/ui/Card";
import { Muted } from "@/components/ui/Table";
import { dashboards, roleByValue } from "@/lib/roles";
import { useRole } from "@/lib/role-store";

/**
 * Fixex dashboard: one greeting and one calendar, copy taken from the role
 * chosen in the sidebar. Every role has its own dashboard text, so switching
 * the role changes both panels.
 */
export function FixexDashboard() {
  const role = roleByValue(useRole());
  const dashboard = dashboards[role.value];
  const [picked, setPicked] = useState<Date | undefined>(undefined);

  return (
    <div className="dash-grid">
      <section className="dash-greeting">
        <h2 className="dash-greeting__title">{dashboard.greeting}</h2>
        <p className="dash-greeting__note">{dashboard.note}</p>
        <div className="dash-greeting__foot">
          <Badge tone="info" pill>
            {role.label}
          </Badge>
          <Muted>{role.scope}</Muted>
        </div>
      </section>

      <Card
        title={dashboard.calendarTitle}
        description={dashboard.calendarNote}
        meta="Kalender"
        status={picked ? "Tanggal dipilih" : undefined}
      >
        <Calendar locale="id-ID" value={picked} onChange={setPicked} showToday />
        <p style={{ marginBottom: 0 }}>
          <Muted>
            {picked
              ? `Dipilih ${picked.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}.`
              : "Pilih tanggal untuk menandai agenda."}
          </Muted>
        </p>
      </Card>
    </div>
  );
}