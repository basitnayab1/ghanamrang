"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { formatPrice, productHref, thumbOf } from "@/data/catalog";
import { bagCount, resolveLines, useBag } from "@/store/bag";

/** Loads the saved bag from localStorage once we're in the browser. */
export function BagHydrator() {
  useEffect(() => {
    useBag.persist.rehydrate();
  }, []);
  return null;
}

export default function BagDrawer() {
  const { open, setOpen, setQty, remove } = useBag();
  const lines = resolveLines(useBag((s) => s.lines));
  const subtotal = lines.reduce((s, l) => s + l.product.price * l.qty, 0);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          />
          <motion.aside
            role="dialog"
            aria-label="Shopping bag"
            className="fixed right-0 top-0 z-[201] flex h-full w-full max-w-sm flex-col border-l border-line bg-card p-6"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 260, damping: 30 }}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-serif text-2xl">Bag ({bagCount(lines)})</h2>
              <button onClick={() => setOpen(false)} className="text-sm text-muted hover:text-paper">
                Close
              </button>
            </div>

            {lines.length === 0 ? (
              <div className="mt-16 text-center">
                <p className="text-sm text-muted">Your bag is empty.</p>
                <Link href="/try-the-style" onClick={() => setOpen(false)} className="mt-4 inline-block text-[13px] underline underline-offset-4">
                  Browse the styles
                </Link>
              </div>
            ) : (
              <ul className="flex-1 divide-y divide-line overflow-y-auto">
                {lines.map((l) => (
                  <li key={l.key} className="flex gap-3 py-4">
                    <Link href={productHref(l.product, l.color)} onClick={() => setOpen(false)} className="h-24 w-[72px] shrink-0 overflow-hidden rounded bg-card-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={thumbOf(l.color.images[0])} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
                    </Link>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <p className="truncate text-[13px]">{l.product.name}</p>
                      <p className="text-[11px] text-muted">
                        {l.color.name} · Size {l.size}
                      </p>
                      <div className="mt-auto flex items-center justify-between">
                        <div className="flex items-center rounded-full border border-line text-[12px]">
                          <button aria-label="Decrease quantity" onClick={() => setQty(l.key, l.qty - 1)} className="px-2.5 py-1 hover:text-accent">−</button>
                          <span className="w-5 text-center tabular-nums">{l.qty}</span>
                          <button aria-label="Increase quantity" onClick={() => setQty(l.key, l.qty + 1)} className="px-2.5 py-1 hover:text-accent">+</button>
                        </div>
                        <span className="text-[13px] tabular-nums">{formatPrice(l.product.price * l.qty)}</span>
                      </div>
                    </div>
                    <button onClick={() => remove(l.key)} aria-label={`Remove ${l.product.name}`} className="self-start text-[11px] text-muted hover:text-paper">
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {lines.length > 0 && (
              <div className="space-y-1 border-t border-line pt-4 text-[13px] tabular-nums">
                <div className="flex justify-between pt-1 font-medium">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <p className="text-[11px] text-muted">Delivery calculated at checkout. Cash on delivery available.</p>
                <Link
                  href="/checkout"
                  onClick={() => setOpen(false)}
                  className="mt-3 block w-full rounded-md bg-paper py-3 text-center font-medium text-ink transition hover:bg-accent"
                >
                  Checkout
                </Link>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
