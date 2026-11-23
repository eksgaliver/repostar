"use client";

import { useState } from "react";
import { Badge } from "@/components/arc/badge/badge";
import { Button } from "@/components/arc/button/button";
import { Card } from "@/components/arc/card/card";
import { EmptyState } from "@/components/arc/empty-state/empty-state";
import { Input } from "@/components/arc/input/input";
import { Rating } from "@/components/arc/rating/rating";
import { SearchField } from "@/components/arc/search-field/search-field";
import { Skeleton } from "@/components/arc/skeleton/skeleton";
import { Switch } from "@/components/arc/switch/switch";

function Tile({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <div className="demo-tile">
      <span>{name}</span>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}

/** Live primitives that this dashboard actually uses. */
export function PrimitiveGallery() {
  const [query, setQuery] = useState("");
  const [on, setOn] = useState(true);

  return (
    <div className="gallery-grid">
      <Tile name="Badge">
        <Badge dot>neutral</Badge>
        <Badge tone="success" dot>
          success
        </Badge>
        <Badge tone="info" pill color="sky">
          info
        </Badge>
        <Badge tone="warning" outline>
          warning
        </Badge>
        <Badge tone="danger" pill>
          danger
        </Badge>
      </Tile>

      <Tile name="Rating">
        <Rating label="Rating demo" defaultValue={3} size="sm" />
      </Tile>

      <Tile name="Input">
        <Input label="Nama customer" placeholder="PT Sawit Nusantara" />
      </Tile>

      <Tile name="SearchField">
        <SearchField
          label="Filter komponen"
          placeholder="chart, menu, input…"
          value={query}
          onValueChange={setQuery}
        />
      </Tile>

      <Tile name="Switch">
        <Switch label="Tampilkan unit TAS" checked={on} onCheckedChange={setOn} />
      </Tile>

      <Tile name="Skeleton">
        <Skeleton lines={3} avatar />
      </Tile>

      <Tile name="EmptyState">
        <EmptyState
          title="Belum ada DO"
          description="Delivery order dari Relation akan muncul di sini setelah dikirim."
          action={<Button size="sm">Buat DO</Button>}
        />
      </Tile>

      <Tile name="Card">
        <Card
          title="Unit BM 8842 RA"
          description="Supir Andi Saputra · Korlap Pekanbaru · Target 9.000 KM / bulan."
          meta="Operasional"
          status="Aktif"
          action={
            <Badge size="sm" pill>
              active
            </Badge>
          }
        />
      </Tile>
    </div>
  );
}