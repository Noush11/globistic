"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { nanoid } from "nanoid";
import type { ProductDTO } from "@/types/api";
import {
  emptyAreas,
  PRINT_AREAS,
  FONT_OPTIONS,
  usedPrintAreas,
  totalLayerCount,
  type AreaLayers,
  type Layer,
  type PrintAreaKey,
  type TextLayer
} from "@/types/design";
import { DesignCanvas } from "./DesignCanvas";
import { DEFAULT_MOCKUP } from "./constants";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { priceLine } from "@/lib/pricing";
import { formatCurrency } from "@/lib/utils";
import { uploadDesignFile } from "@/lib/upload-client";
import { useCart } from "@/store/cart";

export function Customizer({ product }: { product: ProductDTO }) {
  const router = useRouter();
  const addItem = useCart((s) => s.addItem);

  const [areas, setAreas] = useState<AreaLayers>(emptyAreas());
  const [activeArea, setActiveArea] = useState<PrintAreaKey>("FRONT");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [color, setColor] = useState(product.colors[0]?.color || "Black");
  const [size, setSize] = useState(product.sizes[2] || product.sizes[0] || "M");
  const [quantity, setQuantity] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [added, setAdded] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const colorMeta = product.colors.find((c) => c.color === color);
  const variant = product.variants.find((v) => v.color === color && v.size === size);
  const mockup = colorMeta?.mockupImage || product.images[0] || DEFAULT_MOCKUP;
  const layers = areas[activeArea];
  const selected = layers.find((l) => l.id === selectedId) || null;

  // Live pricing
  const pricing = useMemo(
    () =>
      priceLine({
        basePrice: product.basePrice,
        printAreaPrice: product.printAreaPrice,
        variantModifier: variant?.priceModifier ?? 0,
        printAreas: usedPrintAreas(areas),
        layerCount: totalLayerCount(areas),
        quantity
      }),
    [product, variant, areas, quantity]
  );

  // ── Layer ops ──────────────────────────────────────────────
  function patchLayer(id: string, patch: Partial<Layer>) {
    setAreas((prev) => ({
      ...prev,
      [activeArea]: prev[activeArea].map((l) => (l.id === id ? ({ ...l, ...patch } as Layer) : l))
    }));
  }

  function addLayer(layer: Layer) {
    setAreas((prev) => ({ ...prev, [activeArea]: [...prev[activeArea], layer] }));
    setSelectedId(layer.id);
  }

  function deleteLayer(id: string) {
    setAreas((prev) => ({ ...prev, [activeArea]: prev[activeArea].filter((l) => l.id !== id) }));
    setSelectedId(null);
  }

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const src = await uploadDesignFile(file);
      const img = new Image();
      img.onload = () => {
        const ratio = img.naturalHeight / img.naturalWidth || 1;
        const width = 50;
        addLayer({
          id: nanoid(),
          type: "image",
          src,
          x: 25,
          y: 25,
          width,
          height: width * ratio,
          rotation: 0,
          zIndex: layers.length + 1,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight
        });
      };
      img.src = src;
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function addText() {
    const layer: TextLayer = {
      id: nanoid(),
      type: "text",
      text: "Your text",
      fontFamily: "Inter",
      fontSize: 28,
      color: "#111111",
      bold: true,
      italic: false,
      align: "center",
      x: 15,
      y: 40,
      width: 70,
      height: 18,
      rotation: 0,
      zIndex: layers.length + 1
    };
    addLayer(layer);
  }

  function handleAddToCart() {
    addItem({
      productId: product.id,
      productSlug: product.slug,
      productName: product.name,
      variantId: variant?.id,
      color,
      colorHex: colorMeta?.colorHex,
      size,
      quantity,
      basePrice: product.basePrice,
      printAreaPrice: product.printAreaPrice,
      variantModifier: variant?.priceModifier ?? 0,
      design: { productId: product.id, productSlug: product.slug, color, size, variantId: variant?.id, areas },
      thumbnail: mockup
    });
    setAdded(true);
    setTimeout(() => router.push("/cart"), 700);
  }

  const used = usedPrintAreas(areas);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      {/* Canvas + area tabs */}
      <div className="card p-5">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {PRINT_AREAS.map((a) => (
            <button
              key={a.key}
              onClick={() => {
                setActiveArea(a.key);
                setSelectedId(null);
              }}
              className={`relative rounded-xl px-4 py-2 text-sm font-medium transition ${
                activeArea === a.key
                  ? "bg-brand-600 text-white"
                  : "border border-slate-200 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
              }`}
            >
              {a.label}
              {areas[a.key].length > 0 && (
                <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-green-500" />
              )}
            </button>
          ))}
        </div>

        <DesignCanvas
          area={activeArea}
          mockup={mockup}
          garmentColor={colorMeta?.colorHex || "#1f2937"}
          layers={layers}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onUpdate={patchLayer}
        />

        <p className="mt-3 text-center text-xs text-slate-400">
          Drag to move · corner handle to resize · top handle to rotate
        </p>
      </div>

      {/* Controls */}
      <div className="space-y-4">
        <div className="card p-5">
          <h2 className="text-lg font-bold">{product.name}</h2>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Select label="Color" value={color} onChange={(e) => setColor(e.target.value)}>
              {product.colors.map((c) => (
                <option key={c.color} value={c.color}>{c.color}</option>
              ))}
            </Select>
            <Select label="Size" value={size} onChange={(e) => setSize(e.target.value)}>
              {product.sizes.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </Select>
          </div>
          <div className="mt-3">
            <label className="label">Quantity</label>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => setQuantity((q) => Math.max(1, q - 1))}>−</Button>
              <input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="input w-20 text-center"
              />
              <Button variant="outline" size="icon" onClick={() => setQuantity((q) => q + 1)}>+</Button>
            </div>
          </div>
        </div>

        {/* Add design */}
        <div className="card p-5">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Add to {PRINT_AREAS.find((a) => a.key === activeArea)?.label}</h3>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" loading={uploading} onClick={() => fileRef.current?.click()}>
              ⬆ Upload art
            </Button>
            <Button variant="outline" onClick={addText}>＋ Add text</Button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/svg+xml"
            className="hidden"
            onChange={onUpload}
          />
          <p className="mt-2 text-xs text-slate-400">PNG, JPG, SVG & transparent images supported.</p>
        </div>

        {/* Selected layer editor */}
        {selected && (
          <div className="card p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                {selected.type === "text" ? "Edit text" : "Edit image"}
              </h3>
              <Button variant="danger" size="sm" onClick={() => deleteLayer(selected.id)}>Delete</Button>
            </div>

            {selected.type === "text" && (
              <div className="space-y-3">
                <textarea
                  value={selected.text}
                  onChange={(e) => patchLayer(selected.id, { text: e.target.value })}
                  className="input min-h-[60px]"
                  placeholder="Type your text"
                />
                <Select
                  label="Font"
                  value={selected.fontFamily}
                  onChange={(e) => patchLayer(selected.id, { fontFamily: e.target.value })}
                >
                  {FONT_OPTIONS.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </Select>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Color</label>
                    <input
                      type="color"
                      value={selected.color}
                      onChange={(e) => patchLayer(selected.id, { color: e.target.value })}
                      className="h-11 w-full cursor-pointer rounded-xl border border-slate-300 dark:border-slate-700"
                    />
                  </div>
                  <div>
                    <label className="label">Size: {selected.fontSize}px</label>
                    <input
                      type="range"
                      min={10}
                      max={120}
                      value={selected.fontSize}
                      onChange={(e) => patchLayer(selected.id, { fontSize: parseInt(e.target.value) })}
                      className="mt-3 w-full"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={selected.bold ? "primary" : "outline"}
                    onClick={() => patchLayer(selected.id, { bold: !selected.bold })}
                  >
                    Bold
                  </Button>
                  <Button
                    size="sm"
                    variant={selected.italic ? "primary" : "outline"}
                    onClick={() => patchLayer(selected.id, { italic: !selected.italic })}
                  >
                    Italic
                  </Button>
                </div>
              </div>
            )}

            <div className="mt-3">
              <label className="label">Rotation: {Math.round(selected.rotation)}°</label>
              <input
                type="range"
                min={-180}
                max={180}
                value={selected.rotation}
                onChange={(e) => patchLayer(selected.id, { rotation: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>
          </div>
        )}

        {/* Price + cart */}
        <div className="card sticky bottom-4 p-5">
          <div className="flex items-center justify-between text-sm text-slate-500">
            <span>Print locations</span>
            <span>{used.length || 0}</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-sm text-slate-500">
            <span>Unit price</span>
            <span>{formatCurrency(pricing.unitPrice)}</span>
          </div>
          <div className="mt-2 flex items-end justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
            <span className="text-sm font-medium">Total ({quantity})</span>
            <span className="text-2xl font-bold text-brand-600">{formatCurrency(pricing.lineTotal)}</span>
          </div>
          {pricing.breakdown.bulkDiscountPerUnit > 0 && (
            <div className="mt-1 text-right">
              <Badge tone="green">Bulk discount applied</Badge>
            </div>
          )}
          <Button className="mt-4 w-full" size="lg" onClick={handleAddToCart} disabled={added}>
            {added ? "✓ Added to cart" : "Add to cart"}
          </Button>
        </div>
      </div>
    </div>
  );
}
