import type { Metadata } from "next";
import { Badge } from "@/components/arc/badge/badge";
import { Card } from "@/components/ui/Card";
import { Muted, PageHeader, Table } from "@/components/ui/Table";
import { deliveryOrders, kpiRows, routes } from "@/lib/sample";

export const metadata: Metadata = { title: "Rute & DO · S.T.A.R.S" };

const rupiah = (value: number) => `Rp ${value.toLocaleString("id-ID")}`;

export default function OperationsPage() {
  return (
    <>
      <PageHeader
        title="Rute, DO & FIFO"
        description="OA berubah setiap bulan, jadi setiap pembaruan menghasilkan ID rute unik baru agar histori bulan sebelumnya tetap akurat. Nominal OA hanya terlihat di halaman Marketing."
        aside={
          <>
            <Badge tone="info" pill>
              {routes.length} versi rute
            </Badge>
            <Badge tone="warning" pill>
              {deliveryOrders.filter((order) => order.status === "pending").length} DO menunggu OA
            </Badge>
          </>
        }
      />

      <Card
        title="Master rute & versioning OA"
        description="Nama customer, rute asal–tujuan, jenis cargo, jarak KMPP, dan ongkos angkut per bulan."
        meta="Operasional"
        status="OA bulanan"
      >
        <Table
          head={["ID rute unik", "Customer", "Rute", "Cargo", "Jarak", "OA", "Periode"]}
          rows={routes.map((route) => [
            <code key={`${route.code}-code`} className="text-xs">
              {route.code}
            </code>,
            route.customer,
            route.route,
            route.cargo,
            `${route.distanceKm} KM`,
            rupiah(route.oaAmount),
            <Muted key={`${route.code}-period`}>{route.period}</Muted>,
          ])}
        />
      </Card>

      <Card
        title="Delivery Order"
        description="Relation mengisi nomor DO, rute, cargo, dan total unit. Marketing melengkapi nominal OA. Relation tidak melihat field OA sama sekali."
        meta="Relation → Marketing"
        status={`${deliveryOrders.length} DO`}
      >
        <Table
          head={["Nomor DO", "Rute", "Cargo", "Unit", "OA (Marketing)", "Status"]}
          rows={deliveryOrders.map((order) => [
            <code key={`${order.doNumber}-no`} className="text-xs">
              {order.doNumber}
            </code>,
            order.route,
            order.cargo,
            `${order.units} unit`,
            order.oa === null ? (
              <Badge key={`${order.doNumber}-oa`} size="sm" tone="warning" dot>
                belum diisi
              </Badge>
            ) : (
              rupiah(order.oa)
            ),
            <Badge
              key={`${order.doNumber}-status`}
              size="sm"
              tone={order.status === "pending" ? "warning" : order.status === "priced" ? "info" : "success"}
              dot
            >
              {order.status}
            </Badge>,
          ])}
        />
      </Card>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card
          title="Antrean FIFO"
          description="Urutan keberangkatan per rute berdasarkan waktu selesai bongkar terakhir (S.T), lalu difilter sesuai konfigurasi rute."
          meta="First In First Out"
          status="2 unit siap"
        >
          <ol className="flex flex-col gap-3 text-sm">
            {kpiRows.map((row, index) => (
              <li key={row.plate} className="flex items-start justify-between gap-3">
                <span className="flex items-start gap-3">
                  <Badge size="sm" pill tone="info">
                    {index + 1}
                  </Badge>
                  <span className="flex flex-col">
                    <span className="font-medium">{row.plate}</span>
                    <Muted>{row.driver} · standby setelah bongkar</Muted>
                  </span>
                </span>
                <Badge size="sm" tone="success" dot>
                  siap
                </Badge>
              </li>
            ))}
          </ol>
        </Card>

        <Card
          title="Filter khusus rute"
          description="Nomor polisi tertentu, tahun pembuatan unit minimal, atau spesifikasi armada."
          meta="Konfigurasi"
          status="PKU-DMI-2026-11"
        >
          <Table
            head={["Jenis filter", "Nilai"]}
            rows={[
              ["Nomor polisi", "BM 8842 RA, BM 9011 RA"],
              ["Tahun minimal", "2021"],
              ["Spesifikasi", "Dump Truck"],
            ]}
          />
        </Card>
      </section>
    </>
  );
}