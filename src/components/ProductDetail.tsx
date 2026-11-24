"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { categories, familyStyles, findColor, formatPrice, looks, productHref, thumbOf, type Product } from "@/data/catalog";
import { whatsappLink } from "@/lib/social";
import { useBag } from "@/store/bag";

export default function ProductDetail({ product }: { product: Product }) {
  const params = useSearchParams();
  const add = useBag((s) => s.add);

  const color = findColor(product, params.get("color"));
  const [imageIndex, setImageIndex] = useState(0);
  const image = color.images[Math.min(imageIndex, color.images.length - 1)];

  const [size, setSize] = useState<string | null>(null);
  const [needSize, setNeedSize] = useState(false);
  const [added, setAdded] = useState(false);
  const [open, setOpen] = useState<string | null>("set");

  const styleLook = looks.find((l) => l.productId === product.id && l.colorName === color.name);
  const category = categories.find((c) => c.id === product.category);

  const addToBag = () => {
    if (!size) return setNeedSize(true);
    add([{ productId: product.id, size, colorName: color.name }]);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  const sections = [
    {
      id: "set",
      title: "What's included",
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
          {product.sizeChart.unit && <p className="mt-2 text-[11px] text-muted">All measurements in {product.sizeChart.unit}.</p>}
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
      <div className="min-w-0">
        <nav className="mb-4 text-[12px] text-muted">
          <Link href="/shop" className="hover:text-paper">Shop</Link>
          <span className="mx-2">/</span>
          <Link href={`/shop?category=${product.category}`} className="hover:text-paper">{category?.label}</Link>
        </nav>

        <div className="flex flex-col-reverse gap-3 md:flex-row">
          <div className="flex gap-2 overflow-x-auto p-1 md:flex-col">
            {color.images.map((src, i) => (
              <button
                key={src}
                onClick={() => setImageIndex(i)}
                aria-label={`Show photo ${i + 1}`}
                aria-pressed={i === imageIndex}
                className={`h-24 w-[72px] shrink-0 overflow-hidden rounded bg-card transition ${i === imageIndex ? "ring-1 ring-paper" : "opacity-50 hover:opacity-100"}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={thumbOf(src)} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>

          <div className={`relative aspect-[3/4] w-full overflow-hidden rounded-xl md:flex-1 ${image.includes("/shop/") ? "bg-[#c9c3b8]" : "bg-card"}`}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.img
                key={image}
                src={image}
                alt={`${product.name} in ${color.name}`}
                initial={{ opacity: 0, scale: 1.03, filter: "blur(6px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, scale: 0.99, filter: "blur(6px)" }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0 h-full w-full object-contain"
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
        {product.advanceOnly && <p className="mt-1 text-[13px] text-accent">Advance payment required.</p>}
        <p className="mt-5 max-w-md text-[14px] leading-relaxed text-paper/70">{product.description}</p>

        <div className="mt-8">
          <p className="mb-2 text-[12px]">
            Colour <span className="text-muted">— {color.name}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {familyStyles(product).map(({ product: variant, color: c }) => (
              <Link key={productHref(variant, c)} href={productHref(variant, c)} scroll={false}
                onClick={() => setImageIndex(0)}
                aria-label={c.name}
                aria-current={variant.id === product.id && c.name === color.name ? "page" : undefined}
                className="flex items-center gap-2 rounded-md border border-line py-1 pl-1 pr-2 text-xs hover:border-paper/50 aria-[current=page]:border-accent">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={thumbOf(c.modelImage)} alt="" className="h-12 w-9 rounded-sm bg-[#c9c3b8] object-contain" />
                {c.name}
              </Link>
            ))}
          </div>
        </div>

        {product.price === null || !product.sizes.length ? (
          <a href={whatsappLink("Please share the available sizes for " + product.name + (product.price === null ? " and its price" : "") + ".")} className="mt-6 inline-block underline">{product.price === null ? "Ask about price and sizes" : "Ask about sizes on WhatsApp"}</a>
        ) : (<>
        <div className="mt-6">
          <div className="mb-2 flex justify-between text-[12px]">
            <p className={needSize && !size ? "text-red-400" : ""}>{needSize && !size ? "Please choose a size" : "Size"}</p>
            {product.sizeChart.rows.length > 0 && <button onClick={() => setOpen("size")} className="text-muted underline underline-offset-4 hover:text-paper">
              Size chart
            </button>}
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

        </>)}

        {styleLook && (
          <Link href={`/try-the-style?look=${styleLook.id}`} className="mt-3 block text-center text-[12px] text-muted underline-offset-4 hover:text-paper hover:underline">
            See it in Try the Style →
          </Link>
        )}

        {/* accordion */}
        <div className="mt-8 divide-y divide-line border-y border-line text-[13px]">
          {sections.filter(s => s.id !== "size" || product.sizeChart.rows.length > 0).map((s) => (
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
