"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { categories, colorways, type Category } from "@/data/catalog";
import ProductCard from "./ProductCard";

const SORTS = [
  { id: "featured", label: "Featured" },
  { id: "price-asc", label: "Price: low to high" },
  { id: "price-desc", label: "Price: high to low" },
] as const;

const COLORS = Array.from(new Map(colorways.map(({ color }) => [color.name, color.swatch])).entries());

export default function ShopView() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // All filters live in the URL so a filtered view can be shared.
  const category = params.get("category") as Category | null;
  const colorFilter = params.get("color");
  const sort = params.get("sort") ?? "featured";

  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.replace(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false });
  };

  const list = useMemo(() => {
    const out = colorways.filter(
      ({ product, color }) => (!category || product.category === category) && (!colorFilter || color.name === colorFilter),
    );
    if (sort === "price-asc") out.sort((a, b) => a.product.price - b.product.price);
    if (sort === "price-desc") out.sort((a, b) => b.product.price - a.product.price);
    return out;
  }, [category, colorFilter, sort]);

  const title = categories.find((c) => c.id === category)?.label ?? "All sets";
  const chip = (active: boolean) =>
    `shrink-0 rounded-full border px-4 py-1.5 text-[12px] transition ${active ? "border-paper bg-paper text-ink" : "border-line text-paper/80 hover:border-paper/50"}`;

  return (
    <div className="mx-auto max-w-[1400px] px-6 pb-24 pt-10 md:px-10">
      <h1 className="font-serif text-[44px] font-light leading-none md:text-[56px]">{title}</h1>

      <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
        <div className="-mx-6 flex gap-2 overflow-x-auto px-6 [scrollbar-width:none] md:mx-0 md:px-0">
          <button onClick={() => setParam("category", null)} className={chip(!category)}>All</button>
          {categories.map((c) => (
            <button key={c.id} onClick={() => setParam("category", c.id)} className={chip(category === c.id)}>
              {c.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {COLORS.map(([name, swatch]) => (
            <button
              key={name}
              onClick={() => setParam("color", colorFilter === name ? null : name)}
              aria-pressed={colorFilter === name}
              title={name}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] transition ${colorFilter === name ? "border-paper" : "border-line text-paper/70 hover:border-paper/50"}`}
            >
              <span className="h-3 w-3 rounded-full" style={{ background: swatch }} />
              {name}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between border-y border-line py-3 text-[12px]">
        <span className="text-muted">{list.length} {list.length === 1 ? "style" : "styles"}</span>
        <label className="flex items-center gap-2">
          <span className="text-muted">Sort</span>
          <select
            value={sort}
            onChange={(e) => setParam("sort", e.target.value === "featured" ? null : e.target.value)}
            className="cursor-pointer bg-transparent outline-none [&>option]:bg-card"
          >
            {SORTS.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        </label>
      </div>

      {list.length === 0 ? (
        <div className="py-24 text-center">
          <p className="text-muted">Nothing matches these filters.</p>
          <button onClick={() => router.replace(pathname, { scroll: false })} className="mt-3 text-[13px] underline underline-offset-4">
            Clear filters
          </button>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3">
          {list.map(({ product, color }, i) => (
            <ProductCard key={`${product.id}-${color.name}`} product={product} color={color} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
