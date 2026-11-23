"use client";

import { useState } from "react";
import { Button } from "@/components/arc/button/button";
import { FileDropzone } from "@/components/arc/file-dropzone/file-dropzone";
import { HoldToConfirm } from "@/components/arc/hold-to-confirm/hold-to-confirm";
import { Muted } from "@/components/ui/Table";

export interface LogoFieldProps {
  /** Data URL of the current logo, empty when none is set. */
  value: string;
  onChange: (dataUrl: string) => void;
  maxSize?: number;
}

const ACCEPT = "image/png,image/jpeg,image/svg+xml,image/webp";

/**
 * Logo picker: Arc's file dropzone to choose the image, then a preview with a
 * hold-to-delete control instead of a one-tap remove, since a stray click on a
 * brand asset is annoying to recover.
 */
export function LogoField({ value, onChange, maxSize = 512 * 1024 }: LogoFieldProps) {
  const [replacing, setReplacing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function read(file: File) {
    if (!ACCEPT.split(",").includes(file.type)) {
      setError("Format harus PNG, JPEG, SVG, atau WebP.");
      return;
    }
    if (file.size > maxSize) {
      setError(`Ukuran maksimal ${Math.round(maxSize / (1024 * 1024))} MB.`);
      return;
    }
    setError(null);
    const reader = new FileReader();
    reader.onload = () => {
      onChange(typeof reader.result === "string" ? reader.result : "");
      setReplacing(false);
    };
    reader.onerror = () => setError("Berkas gagal dibaca, coba file lain.");
    reader.readAsDataURL(file);
  }

  if (!value || replacing) {
    return (
      <div className="flex flex-col gap-2">
        <FileDropzone
          label="Logo perusahaan"
          description="Tampil di topbar, laporan, dan aplikasi mobile."
          accept={ACCEPT}
          maxFiles={1}
          maxSize={maxSize}
          note="PNG, JPEG, SVG, atau WebP. Maksimal 512 KB, disarankan rasio 1:1."
          compactAt={2}
          onFilesChange={(files) => {
            const file = files[0];
            if (file) read(file);
          }}
        />
        {error ? <Muted>{error}</Muted> : null}
        {replacing ? (
          <Button size="sm" variant="ghost" onClick={() => setReplacing(false)}>
            Batalkan penggantian
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={value}
          alt="Logo perusahaan"
          width={72}
          height={72}
          style={{ objectFit: "contain" }}
        />
        <div className="flex flex-col gap-2">
          <span className="text-xs">Logo tersimpan di draf sesi ini.</span>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="secondary" onClick={() => setReplacing(true)} type="button">
              Ganti logo
            </Button>
            <HoldToConfirm
              label="Tahan untuk hapus logo"
              confirmedLabel="Logo dihapus"
              duration={1200}
              tone="danger"
              onConfirm={() => {
                onChange("");
                setReplacing(false);
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}