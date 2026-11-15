"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { categories, findColor, formatPrice, looks, type Product } from "@/data/catalog";
import { useBag } from "@/store/bag";

export default function ProductDetail({ product }: { product: Product }) {
  const params = useSearchParams();
  const pathname = usePathname();
  const add = useBag((s) => s.add);

  // Colour is local state so it changes instantly; the URL is kept in sync for sharing.
  const [colorName, setColorName] = useState(() => findColor(product, params.get("color")).name);
  const color = findColor(product, colorName);
  const [imageIndex, setImageIndex] = useState(0);
  const image = color.images[Math.min(imageIndex, color.images.length - 1)];

  const [size, setSize] = useState<string | null>(null);
  const [needSize, setNeedSize] = useState(false);
  const [added, setAdded] = useState(false);
  const [open, setOpen] = useState<string | null>("set");

  const styleLook = looks.find((l) => l.productId === product.id && l.colorName === color.name);
  const category = categories.find((c) => c.id === product.category);

  const pickColor = (name: string) => {
    setColorName(name);
    setImageIndex(0);
    window.history.replaceState(null, "", `${pathname}?color=${encodeURIComponent(name)}`);
  };

  const addToBag = () => {
    if (!size) return setNeedSize(true);
    add([{ productId: product.id, size, colorName: color.name }]);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  const sections = [
    {
      id: "set",
      title: "What's in the set",
      body: <ul className="list-disc space-y-1 pl-4">{product.pieces.map((p) => <li key={p}>{p}</li>)}</ul>,
    },
    {
      id: "size",
      title: "Size chart",
      body: (
        <>
          <table className="w-full text-left tabular-nums">
            <thead>
              <tr className="text-muted">{product.sizeChart.head.map((h) => <th key={h} className="pb-2 font-normal">{h}</th>)}</tr>
            </thead>
            <tbody>
              {product.sizeChart.rows.map((r) => (
                <tr key={r[0]} className="border-t border-line">{r.map((c, i) => <td key={i} className="py-2">{c}</td>)}</tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-[11px] text-muted">All measurements in {product.sizeChart.unit}.</p>
        </>
      ),
    },
    { id: "details", title: "Details", body: <ul className="list-disc space-y-1 pl-4">{product.details.map((d) => <li key={d}>{d}</li>)}</ul> },
    {
      id: "shipping",
      title: "Delivery & orders",
      body: (
        <p>
          Delivery across Pakistan. Questions about fit or colour? Message us on{" "}
          <a href="https://wa.me/923229120086" target="_blank" rel="noopener noreferrer" className="text-accent underline underline-offset-4">WhatsApp</a>.
        </p>
      ),
    },
  ];

  return (
    <div className="mx-auto grid max-w-[1400px] gap-10 px-6 pt-6 md:px-10 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
      {/* gallery */}
      <div>
        <nav className="mb-4 text-[12px] text-muted">
          <Link href="/shop" className="hover:text-paper">Shop</Link>
          <span className="mx-2">/</span>
          <Link href={`/shop?category=${product.category}`} className="hover:text-paper">{category?.label}</Link>
        </nav>

        <div className="flex flex-col-reverse gap-3 md:flex-row">
          <div className="flex gap-2 md:flex-col">
            {color.images.map((src, i) => (
              <button
                key={src}
                onClick={() => setImageIndex(i)}
                aria-label={`Show photo ${i + 1}`}
                aria-pressed={i === imageIndex}
                className={`h-24 w-[72px] shrink-0 overflow-hidden rounded bg-card transition ${i === imageIndex ? "ring-1 ring-paper" : "opacity-50 hover:opacity-100"}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>

          <div className="relative aspect-[3/4] flex-1 overflow-hidden rounded-xl bg-card">
            <AnimatePresence mode="wait" initial={false}>
              <motion.img
                key={image}
                src={image}
                alt={`${product.name} in ${color.name}`}
                initial={{ opacity: 0, scale: 1.03, filter: "blur(6px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, scale: 0.99, filter: "blur(6px)" }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0 h-full w-full object-cover"
              />
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* info */}
      <div className="lg:sticky lg:top-24 lg:self-start lg:pt-10">
        {product.isNew && <p className="text-[11px] uppercase tracking-[0.18em] text-accent">New in</p>}
        <h1 className="mt-1 font-serif text-[40px] font-light leading-tight md:text-[48px]">{product.name}</h1>
        <p className="mt-1 text-[17px] tabular-nums">{formatPrice(product.price)}</p>
        <p className="mt-5 max-w-md text-[14px] leading-relaxed text-paper/70">{product.description}</p>

        <div className="mt-8">
          <p className="mb-2 text-[12px]">
            Colour <span className="text-muted">— {color.name}</span>
          </p>
          <div className="flex gap-2">
            {product.colors.map((c) => (
              <button
                key={c.name}
                onClick={() => pickColor(c.name)}
                aria-label={c.name}
                aria-pressed={c.name === color.name}
                className={`h-9 w-9 rounded-full border border-line transition ${c.name === color.name ? "ring-1 ring-paper ring-offset-2 ring-offset-ink" : "hover:scale-110"}`}
                style={{ background: c.swatch }}
              />
            ))}
          </div>
        </div>

        <div className="mt-6">
          <div className="mb-2 flex justify-between text-[12px]">
            <p className={needSize && !size ? "text-red-400" : ""}>{needSize && !size ? "Please choose a size" : "Size"}</p>
            <button onClick={() => setOpen("size")} className="text-muted underline underline-offset-4 hover:text-paper">
              Size chart
            </button>
          </div>
          <motion.div className="flex gap-2" animate={needSize && !size ? { x: [0, -6, 6, -4, 4, 0] } : {}} transition={{ duration: 0.35 }}>
            {product.sizes.map((s) => (
              <button
                key={s}
                onClick={() => {
                  setSize(s);
                  setNeedSize(false);
                }}
                aria-pressed={size === s}
                className={`h-11 w-14 rounded-md border text-[13px] transition ${size === s ? "border-paper bg-paper text-ink" : "border-line hover:border-paper/50"}`}
              >
                {s}
              </button>
            ))}
          </motion.div>
        </div>

        <button onClick={addToBag} className="mt-8 flex w-full items-center justify-center rounded-md bg-paper py-4 text-[13px] font-medium text-ink transition hover:bg-accent">
          <AnimatePresence mode="wait" initial={false}>
            <motion.span key={added ? "added" : "add"} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>
              {added ? "Added to bag ✓" : `Add to bag — ${formatPrice(product.price)}`}
            </motion.span>
          </AnimatePresence>
        </button>

        {styleLook && (
          <Link href={`/try-the-style?look=${styleLook.id}`} className="mt-3 block text-center text-[12px] text-muted underline-offset-4 hover:text-paper hover:underline">
            See it in Try the Style →
          </Link>
        )}

        {/* accordion */}
        <div className="mt-8 divide-y divide-line border-y border-line text-[13px]">
          {sections.map((s) => (
            <div key={s.id}>
              <button onClick={() => setOpen(open === s.id ? null : s.id)} aria-expanded={open === s.id} className="flex w-full items-center justify-between py-4">
                {s.title}
                <span className={`text-muted transition-transform ${open === s.id ? "rotate-45" : ""}`}>+</span>
              </button>
              <AnimatePresence initial={false}>
                {open === s.id && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                    <div className="pb-5 text-paper/70">{s.body}</div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
