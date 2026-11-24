"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { findColor, getProduct, type ColorOption, type Product } from "@/data/catalog";

/** What we keep in storage: ids only, so prices and names always come from the catalog. */
type StoredLine = { productId: string; size: string; colorName: string; qty: number };

export type BagLine = StoredLine & { key: string; product: Product & { price: number }; color: ColorOption };

export type BagEntry = { productId: string; size: string; colorName: string };

type BagState = {
  lines: StoredLine[];
  open: boolean;
  /** Bundle savings earned by adding full looks. */
  savings: number;
  add: (entries: BagEntry[], savings?: number) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  setOpen: (open: boolean) => void;
  clear: () => void;
};

export const lineKey = (l: BagEntry) => `${l.productId}|${l.size}|${l.colorName}`;

export const useBag = create<BagState>()(
  persist(
    (set) => ({
      lines: [],
      open: false,
      savings: 0,
      add: (entries, savings = 0) =>
        set((s) => {
          const lines = [...s.lines];
          for (const e of entries) {
            const i = lines.findIndex((l) => lineKey(l) === lineKey(e));
            if (i >= 0) lines[i] = { ...lines[i], qty: lines[i].qty + 1 };
            else lines.push({ ...e, qty: 1 });
          }
          return { lines, open: true, savings: s.savings + savings };
        }),
      // Changing a bundle breaks it, so bundle savings are dropped on any reduction.
      setQty: (key, qty) =>
        set((s) => {
          const prev = s.lines.find((l) => lineKey(l) === key);
          const lines = s.lines
            .map((l) => (lineKey(l) === key ? { ...l, qty } : l))
            .filter((l) => l.qty > 0);
          return { lines, savings: prev && qty < prev.qty ? 0 : s.savings };
        }),
      remove: (key) => set((s) => ({ lines: s.lines.filter((l) => lineKey(l) !== key), savings: 0 })),
      setOpen: (open) => set({ open }),
      clear: () => set({ lines: [], savings: 0, open: false }),
    }),
    {
      name: "ghanam-rang-bag",
      partialize: (s) => ({ lines: s.lines, savings: s.savings }),
      skipHydration: true, // rehydrated on the client in <BagHydrator/> to avoid SSR mismatches
    },
  ),
);

/** Stored lines joined with catalog data; unknown products are dropped. */
export const resolveLines = (lines: StoredLine[]): BagLine[] =>
  lines.flatMap((l) => {
    const product = getProduct(l.productId);
    if (!product || product.price === null) return [];
    return [{ ...l, key: lineKey(l), product: { ...product, price: product.price }, color: findColor(product, l.colorName) }];
  });

export const bagCount = (lines: StoredLine[]) => lines.reduce((s, l) => s + l.qty, 0);
