"use client";

import { useRef, useState } from "react";
import { FileDropzone } from "@/components/arc/file-dropzone/file-dropzone";
import type { FileDropzoneItem } from "@/components/arc/file-dropzone/file-dropzone";
import type { DocumentAttachment } from "@/lib/documents";

/** One letter carries at most five files; each is capped at 2 MB before base64. */
const MAX_FILES = 5;
const MAX_BYTES = 2 * 1024 * 1024;

const keyOf = (file: { name: string; size: number }) => `${file.name}:${file.size}`;

/** Decodes a stored data URL back into a File so the dropzone can list it. */
function fileFromAttachment(attachment: DocumentAttachment): File | null {
  try {
    const base64 = attachment.dataUrl.split(",")[1] ?? "";
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
    return new File([bytes], attachment.name, { type: attachment.type });
  } catch {
    return null;
  }
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("read_failed"));
    reader.readAsDataURL(file);
  });
}

/**
 * Attachments are read in the browser and stored as base64 data URLs, so the
 * letter leaves the app as one self-contained record. Stored files are handed to
 * the dropzone as rows, which means removing a row there also removes it from
 * the payload.
 */
export function AttachmentField({
  value,
  onChange,
}: {
  value: DocumentAttachment[];
  onChange: (next: DocumentAttachment[]) => void;
}) {
  const [initialItems] = useState<FileDropzoneItem[]>(() =>
    value.flatMap((attachment) => {
      const file = fileFromAttachment(attachment);
      return file
        ? [{ id: keyOf(attachment), name: attachment.name, size: attachment.size, file }]
        : [];
    })
  );
  const cache = useRef(new Map(value.map((attachment) => [keyOf(attachment), attachment])));
  const [error, setError] = useState<string | null>(null);

  async function sync(files: File[]) {
    const next: DocumentAttachment[] = [];
    for (const file of files) {
      const cached = cache.current.get(keyOf(file));
      if (cached) {
        next.push(cached);
        continue;
      }
      if (file.size > MAX_BYTES) {
        setError(`${file.name} melebihi 2 MB dan tidak dilampirkan.`);
        continue;
      }
      try {
        const dataUrl = await readAsDataUrl(file);
        const attachment = {
          name: file.name,
          type: file.type || "application/octet-stream",
          size: file.size,
          dataUrl,
        };
        cache.current.set(keyOf(file), attachment);
        next.push(attachment);
      } catch {
        setError(`Gagal membaca ${file.name}.`);
      }
    }
    onChange(next.slice(0, MAX_FILES));
  }

  return (
    <div className="flex flex-col gap-2">
      <FileDropzone
        label="Lampiran surat"
        description="Letakkan berkas di sini atau pilih dari perangkat."
        multiple
        maxFiles={MAX_FILES}
        maxSize={MAX_BYTES}
        note="Maksimal 5 berkas, 2 MB per berkas. Disimpan sebagai base64 di dalam surat."
        compactAt={2}
        defaultItems={initialItems}
        onFilesChange={(files) => {
          setError(null);
          void sync(files);
        }}
      />
      {error ? <p className="dept-hint">{error}</p> : null}
    </div>
  );
}