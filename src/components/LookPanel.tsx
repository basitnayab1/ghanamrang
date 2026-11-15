"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { findColor, formatPrice, getProduct, productHref, type Look } from "@/data/catalog";
import { useBag } from "@/store/bag";

export default function LookPanel({ look }: { look: Look }) {
  const add = useBag((s) => s.add);
  const product = getProduct(look.productId)!;
  const color = findColor(product, look.colorName);
  const [size, setSize] = useState<string | null>(null);
  const [needSize, setNeedSize] = useState(false);

  const addToBag = () => {
    if (!size) return setNeedSize(true);
    add([{ productId: product.id, size, colorName: color.name }]);
  };

  return (
    <aside className="flex h-full flex-col border-line lg:border-l lg:pl-8">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={look.id}
          initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -8, filter: "blur(4px)" }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-1 flex-col"
        >
          <p className="text-[11px] uppercase tracking-[0.18em] text-accent">{color.name}</p>
          <h2 className="mt-1 font-serif text-[34px] font-light leading-tight">{product.name}</h2>
          <p className="mt-1 text-[15px] tabular-nums">{formatPrice(product.price)}</p>

          <div className="mt-6">
            <p className="mb-2 text-[11px] uppercase tracking-[0.16em] text-muted">In this set</p>
            <ul className="divide-y divide-line border-y border-line text-[13px]">
              {product.pieces.map((piece, i) => (
                <motion.li
                  key={piece}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.08 + i * 0.05 }}
                  className="flex items-center gap-3 py-2.5"
                >
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: color.swatch }} />
                  {piece}
                </motion.li>
              ))}
            </ul>
          </div>

          <div className="mt-6">
            <p className={`mb-2 text-[11px] uppercase tracking-[0.16em] ${needSize && !size ? "text-red-400" : "text-muted"}`}>
              {needSize && !size ? "Please choose a size" : "Size"}
            </p>
            <div className="flex gap-2">
              {product.sizes.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setSize(s);
                    setNeedSize(false);
                  }}
                  aria-pressed={size === s}
                  className={`h-10 w-12 rounded-md border text-[13px] transition ${size === s ? "border-paper bg-paper text-ink" : "border-line hover:border-paper/50"}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="mt-6 space-y-3 pt-2">
        <button
          onClick={addToBag}
          className="group flex w-full items-center justify-center gap-2 rounded-md bg-paper py-3.5 text-[13px] font-medium text-ink transition hover:bg-accent"
        >
          Add full set to bag
          <span className="transition-transform group-hover:translate-x-1">→</span>
        </button>
        <Link href={productHref(product, color)} className="block text-center text-[12px] text-muted underline-offset-4 hover:text-paper hover:underline">
          View details &amp; size chart
        </Link>
      </div>
    </aside>
  );
}
