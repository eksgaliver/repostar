"use client";

import { useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { Button } from "@/components/arc/button/button";
import { Muted } from "@/components/ui/Table";

interface SignaturePadProps {
  value: string | null;
  onChange: (dataUrl: string | null) => void;
  /** Height of the drawing area in CSS pixels. */
  height?: number;
}

/**
 * Draws a signature with a pointer and hands back a PNG data URL. The canvas is
 * scaled by the device pixel ratio once, so the exported image is crisp instead
 * of blurry on retina screens. An existing signature (edit mode) is redrawn on
 * top of the pad so it can be kept or replaced.
 */
export function SignaturePad({ value, onChange, height = 150 }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const valueRef = useRef(value);
  const [hasInk, setHasInk] = useState(Boolean(value));

  valueRef.current = value;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(canvas.clientWidth * ratio);
    canvas.height = Math.round(height * ratio);

    const context = canvas.getContext("2d");
    if (!context) return;
    context.scale(ratio, ratio);
    context.lineWidth = 2.4;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.strokeStyle = "#141b2d";

    const stored = valueRef.current;
    if (stored) {
      const image = new Image();
      image.onload = () => context.drawImage(image, 0, 0, canvas.clientWidth, height);
      image.src = stored;
    }
  }, [height]);

  /** A signature that arrives after mount (edit mode) is painted once. */
  useEffect(() => {
    if (!value || hasInk) return;
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    const image = new Image();
    image.onload = () => context.drawImage(image, 0, 0, canvas.clientWidth, height);
    image.src = value;
    setHasInk(true);
  }, [value, hasInk, height]);

  function point(event: ReactPointerEvent<HTMLCanvasElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  function start(event: ReactPointerEvent<HTMLCanvasElement>) {
    const context = canvasRef.current?.getContext("2d");
    if (!context) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drawing.current = true;
    const { x, y } = point(event);
    context.beginPath();
    context.moveTo(x, y);
  }

  function move(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const context = canvasRef.current?.getContext("2d");
    if (!context) return;
    const { x, y } = point(event);
    context.lineTo(x, y);
    context.stroke();
  }

  function finish() {
    if (!drawing.current) return;
    drawing.current = false;
    const canvas = canvasRef.current;
    if (!canvas) return;
    setHasInk(true);
    onChange(canvas.toDataURL("image/png"));
  }

  function clear() {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (canvas && context) context.clearRect(0, 0, canvas.width, canvas.height);
    setHasInk(false);
    onChange(null);
  }

  return (
    <div className="sig">
      <canvas
        ref={canvasRef}
        className="sig__pad"
        style={{ height }}
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={finish}
        onPointerCancel={finish}
        onPointerLeave={finish}
        aria-label="Area tanda tangan"
        role="img"
      />
      <div className="sig__foot">
        <Muted>{hasInk ? "Tanda tangan siap dipakai" : "Gambar tanda tangan di kotak"}</Muted>
        <Button size="sm" variant="ghost" onClick={clear} disabled={!hasInk}>
          Hapus tanda tangan
        </Button>
      </div>
    </div>
  );
}