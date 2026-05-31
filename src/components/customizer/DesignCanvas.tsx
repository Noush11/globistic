"use client";

import { useRef, useCallback, PointerEvent as ReactPointerEvent } from "react";
import type { Layer, PrintAreaKey } from "@/types/design";
import { PRINT_BOX } from "./constants";
import { cn } from "@/lib/utils";

interface Props {
  area: PrintAreaKey;
  mockup: string;
  garmentColor: string;
  layers: Layer[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onUpdate: (id: string, patch: Partial<Layer>) => void;
}

type DragMode = "move" | "resize" | "rotate" | null;

export function DesignCanvas({
  area,
  mockup,
  garmentColor,
  layers,
  selectedId,
  onSelect,
  onUpdate
}: Props) {
  const boxRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{
    mode: DragMode;
    id: string;
    startX: number;
    startY: number;
    orig: Layer;
    centerX: number;
    centerY: number;
  } | null>(null);

  const box = PRINT_BOX[area];

  const beginDrag = useCallback(
    (e: ReactPointerEvent, layer: Layer, mode: DragMode) => {
      e.stopPropagation();
      e.preventDefault();
      const rect = boxRef.current?.getBoundingClientRect();
      if (!rect) return;
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
      const centerX = rect.left + ((layer.x + layer.width / 2) / 100) * rect.width;
      const centerY = rect.top + ((layer.y + layer.height / 2) / 100) * rect.height;
      drag.current = {
        mode,
        id: layer.id,
        startX: e.clientX,
        startY: e.clientY,
        orig: layer,
        centerX,
        centerY
      };
      onSelect(layer.id);
    },
    [onSelect]
  );

  const onPointerMove = useCallback(
    (e: ReactPointerEvent) => {
      const d = drag.current;
      const rect = boxRef.current?.getBoundingClientRect();
      if (!d || !rect) return;

      const dxPct = ((e.clientX - d.startX) / rect.width) * 100;
      const dyPct = ((e.clientY - d.startY) / rect.height) * 100;

      if (d.mode === "move") {
        onUpdate(d.id, {
          x: clamp(d.orig.x + dxPct, -20, 100),
          y: clamp(d.orig.y + dyPct, -20, 100)
        });
      } else if (d.mode === "resize") {
        const ratio = d.orig.height / Math.max(1, d.orig.width);
        const newWidth = clamp(d.orig.width + dxPct, 5, 140);
        onUpdate(d.id, { width: newWidth, height: newWidth * ratio });
      } else if (d.mode === "rotate") {
        const angle =
          (Math.atan2(e.clientY - d.centerY, e.clientX - d.centerX) * 180) / Math.PI + 90;
        onUpdate(d.id, { rotation: Math.round(angle) });
      }
    },
    [onUpdate]
  );

  const endDrag = useCallback(() => {
    drag.current = null;
  }, []);

  return (
    <div
      className="relative mx-auto aspect-square w-full max-w-xl select-none overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900"
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerLeave={endDrag}
      onPointerDown={() => onSelect(null)}
    >
      {/* Garment base, tinted to the selected color */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: garmentColor, maskImage: `url(${mockup})` }}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={mockup}
        alt="Garment"
        className="pointer-events-none absolute inset-0 h-full w-full object-contain mix-blend-multiply dark:mix-blend-normal"
        draggable={false}
      />

      {/* Print area box */}
      <div
        ref={boxRef}
        className="absolute rounded-lg border-2 border-dashed border-brand-400/60"
        style={{
          left: `${box.left}%`,
          top: `${box.top}%`,
          width: `${box.width}%`,
          height: `${box.height}%`
        }}
      >
        {layers.map((layer) => {
          const selected = layer.id === selectedId;
          return (
            <div
              key={layer.id}
              className={cn(
                "absolute touch-none",
                selected ? "outline outline-2 outline-brand-500" : "hover:outline hover:outline-1 hover:outline-brand-300"
              )}
              style={{
                left: `${layer.x}%`,
                top: `${layer.y}%`,
                width: `${layer.width}%`,
                height: `${layer.height}%`,
                transform: `rotate(${layer.rotation}deg)`,
                zIndex: layer.zIndex
              }}
              onPointerDown={(e) => beginDrag(e, layer, "move")}
            >
              {layer.type === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={layer.src}
                  alt="Design"
                  className="pointer-events-none h-full w-full object-contain"
                  draggable={false}
                />
              ) : (
                <div
                  className="pointer-events-none flex h-full w-full items-center overflow-hidden"
                  style={{
                    color: layer.color,
                    fontFamily: layer.fontFamily,
                    fontSize: `${layer.fontSize}px`,
                    fontWeight: layer.bold ? 700 : 400,
                    fontStyle: layer.italic ? "italic" : "normal",
                    justifyContent:
                      layer.align === "center" ? "center" : layer.align === "right" ? "flex-end" : "flex-start",
                    lineHeight: 1.1,
                    whiteSpace: "nowrap"
                  }}
                >
                  {layer.text}
                </div>
              )}

              {selected && (
                <>
                  {/* Rotate handle */}
                  <button
                    aria-label="Rotate"
                    className="absolute -top-7 left-1/2 grid h-5 w-5 -translate-x-1/2 cursor-grab place-items-center rounded-full bg-brand-600 text-white shadow"
                    onPointerDown={(e) => beginDrag(e, layer, "rotate")}
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M23 4v6h-6M1 20v-6h6" />
                      <path d="M3.5 9a9 9 0 0 1 14.8-3.4L23 10M1 14l4.7 4.4A9 9 0 0 0 20.5 15" />
                    </svg>
                  </button>
                  {/* Resize handle */}
                  <button
                    aria-label="Resize"
                    className="absolute -bottom-2 -right-2 h-4 w-4 cursor-nwse-resize rounded-full border-2 border-white bg-brand-600 shadow"
                    onPointerDown={(e) => beginDrag(e, layer, "resize")}
                  />
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}
