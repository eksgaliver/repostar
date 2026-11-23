"use client";

import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  IndentDecrease,
  IndentIncrease,
  Italic,
  List,
  ListOrdered,
  Quote,
  Redo2,
  RemoveFormatting,
  Strikethrough,
  Table,
  Underline,
  Undo2,
} from "lucide-react";

const FONT_FAMILIES = [
  "Arial",
  "Calibri",
  "Georgia",
  "Times New Roman",
  "Verdana",
  "Trebuchet MS",
  "Courier New",
];

/** execCommand only knows sizes 1–7, so the list maps points onto them. */
const FONT_SIZES = [
  { label: "9 pt", value: "1" },
  { label: "10 pt", value: "2" },
  { label: "12 pt", value: "3" },
  { label: "14 pt", value: "4" },
  { label: "18 pt", value: "5" },
  { label: "24 pt", value: "6" },
  { label: "36 pt", value: "7" },
];

const BLOCKS = [
  { label: "Paragraf", value: "P" },
  { label: "Judul 1", value: "H1" },
  { label: "Judul 2", value: "H2" },
  { label: "Judul 3", value: "H3" },
  { label: "Kutipan", value: "BLOCKQUOTE" },
];

const TABLE_HTML =
  '<table class="doc-table"><tbody>' +
  Array.from({ length: 3 })
    .map(
      () =>
        `<tr>${Array.from({ length: 3 })
          .map(() => "<td>&nbsp;</td>")
          .join("")}</tr>`
    )
    .join("") +
  "</tbody></table><p><br></p>";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
}

/**
 * Word-like editing surface over a contentEditable page. Every toolbar action
 * goes through `apply`, which restores the last selection first: a native
 * `<select>` would otherwise steal the caret and format nothing.
 */
export function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const surfaceRef = useRef<HTMLDivElement>(null);
  const savedRange = useRef<Range | null>(null);

  useEffect(() => {
    const surface = surfaceRef.current;
    if (!surface) return;
    if (document.activeElement === surface) return;
    if (surface.innerHTML === value) return;
    surface.innerHTML = value;
  }, [value]);

  function rememberSelection() {
    const selection = document.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    if (surfaceRef.current?.contains(range.commonAncestorContainer)) {
      savedRange.current = range.cloneRange();
    }
  }

  function apply(command: string, argument?: string) {
    const surface = surfaceRef.current;
    if (!surface) return;
    surface.focus();
    const selection = document.getSelection();
    if (savedRange.current && selection) {
      selection.removeAllRanges();
      selection.addRange(savedRange.current);
    }
    // Colours and fonts need spans with styles, not deprecated <font> tags.
    document.execCommand("styleWithCSS", false, "true");
    document.execCommand(command, false, argument);
    rememberSelection();
    onChange(surface.innerHTML);
  }

  const tool = (label: string, command: string, argument?: string, icon?: ReactNode) => (
    <button
      type="button"
      className="rte__tool"
      title={label}
      aria-label={label}
      onMouseDown={(event) => event.preventDefault()}
      onClick={() => apply(command, argument)}
    >
      {icon ?? label}
    </button>
  );

  return (
    <div className="rte">
      <div className="rte__bar" role="toolbar" aria-label="Format teks">
        <select
          className="rte__select"
          aria-label="Jenis huruf"
          defaultValue=""
          onMouseDown={rememberSelection}
          onChange={(event) => {
            const family = event.target.value;
            if (family) apply("fontName", family);
            event.target.value = "";
          }}
        >
          <option value="">Font</option>
          {FONT_FAMILIES.map((family) => (
            <option key={family} value={family}>
              {family}
            </option>
          ))}
        </select>

        <select
          className="rte__select rte__select--size"
          aria-label="Ukuran huruf"
          defaultValue=""
          onMouseDown={rememberSelection}
          onChange={(event) => {
            const size = event.target.value;
            if (size) apply("fontSize", size);
            event.target.value = "";
          }}
        >
          <option value="">Ukuran</option>
          {FONT_SIZES.map((size) => (
            <option key={size.value} value={size.value}>
              {size.label}
            </option>
          ))}
        </select>

        <span className="rte__divider" aria-hidden="true" />
        {tool("Undo", "undo", undefined, <Undo2 size={15} strokeWidth={2} />)}
        {tool("Redo", "redo", undefined, <Redo2 size={15} strokeWidth={2} />)}
        <span className="rte__divider" aria-hidden="true" />

        {tool("Tebal", "bold", undefined, <Bold size={15} strokeWidth={2} />)}
        {tool("Miring", "italic", undefined, <Italic size={15} strokeWidth={2} />)}
        {tool("Garis bawah", "underline", undefined, <Underline size={15} strokeWidth={2} />)}
        {tool("Coret", "strikeThrough", undefined, <Strikethrough size={15} strokeWidth={2} />)}

        <select
          className="rte__select rte__select--block"
          aria-label="Gaya paragraf"
          defaultValue=""
          onMouseDown={rememberSelection}
          onChange={(event) => {
            const block = event.target.value;
            if (block) apply("formatBlock", block);
            event.target.value = "";
          }}
        >
          <option value="">Gaya</option>
          {BLOCKS.map((block) => (
            <option key={block.value} value={block.value}>
              {block.label}
            </option>
          ))}
        </select>

        <span className="rte__divider" aria-hidden="true" />
        {tool("Daftar butir", "insertUnorderedList", undefined, <List size={15} strokeWidth={2} />)}
        {tool("Daftar nomor", "insertOrderedList", undefined, <ListOrdered size={15} strokeWidth={2} />)}
        {tool("Kurangi indent", "outdent", undefined, <IndentDecrease size={15} strokeWidth={2} />)}
        {tool("Tambah indent", "indent", undefined, <IndentIncrease size={15} strokeWidth={2} />)}
        {tool("Kutipan", "formatBlock", "BLOCKQUOTE", <Quote size={15} strokeWidth={2} />)}

        <span className="rte__divider" aria-hidden="true" />
        {tool("Rata kiri", "justifyLeft", undefined, <AlignLeft size={15} strokeWidth={2} />)}
        {tool("Rata tengah", "justifyCenter", undefined, <AlignCenter size={15} strokeWidth={2} />)}
        {tool("Rata kanan", "justifyRight", undefined, <AlignRight size={15} strokeWidth={2} />)}
        {tool("Rata penuh", "justifyFull", undefined, <AlignJustify size={15} strokeWidth={2} />)}

        <span className="rte__divider" aria-hidden="true" />
        <label className="rte__color" title="Warna teks">
          <input
            type="color"
            defaultValue="#141b2d"
            aria-label="Warna teks"
            onChange={(event) => apply("foreColor", event.target.value)}
          />
        </label>
        <label className="rte__color" title="Sorotan teks">
          <input
            type="color"
            defaultValue="#fff3a3"
            aria-label="Warna sorotan"
            onChange={(event) => apply("hiliteColor", event.target.value)}
          />
        </label>

        <span className="rte__divider" aria-hidden="true" />
        {tool("Sisipkan tabel", "insertHTML", TABLE_HTML, <Table size={15} strokeWidth={2} />)}
        {tool("Hapus format", "removeFormat", undefined, <RemoveFormatting size={15} strokeWidth={2} />)}
      </div>

      <div
        ref={surfaceRef}
        className="rte__surface"
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label="Isi surat"
        data-placeholder="Tulis isi surat di sini…"
        onMouseUp={rememberSelection}
        onKeyUp={rememberSelection}
        onFocus={rememberSelection}
        onBlur={rememberSelection}
        onInput={(event) => onChange(event.currentTarget.innerHTML)}
        onPaste={(event) => {
          // Pasting from Word brings fonts and colours; keep the letter clean.
          event.preventDefault();
          const text = event.clipboardData.getData("text/plain");
          document.execCommand("insertText", false, text);
        }}
      />
    </div>
  );
}