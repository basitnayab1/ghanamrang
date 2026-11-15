"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { formatPrice, productHref, type ColorOption, type Product } from "@/data/catalog";
import Tilt3D from "./Tilt3D";

/** One card per colourway: main photo, second photo on hover. */
export default function ProductCard({ product, color, index = 0 }: { product: Product; color: ColorOption; index?: number }) {
  const href = productHref(product, color);
  const [main, hover] = color.images;

  return (
    <motion.article
      // swings up out of the page in 3D as it scrolls into view
      initial={{ opacity: 0, y: 50, rotateX: 28 }}
      whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.8, delay: Math.min(index % 4, 3) * 0.08, ease: [0.22, 1, 0.36, 1] }}
      style={{ transformPerspective: 1000, transformOrigin: "50% 100%" }}
      className="group"
    >
      <Tilt3D className="rounded-lg">
      <Link href={href} className="relative block aspect-[3/4] overflow-hidden rounded-lg bg-card">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={main} alt={`${product.name} in ${color.name}`} className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]" />
        {hover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={hover} alt="" className="absolute inset-0 h-full w-full object-cover opacity-0 transition duration-700 group-hover:opacity-100" />
        )}
        {product.isNew && (
          <span className="absolute left-3 top-3 rounded-full bg-ink/70 px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] backdrop-blur">New</span>
        )}
      </Link>
      </Tilt3D>

      <div className="mt-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link href={href} className="block truncate text-[14px] hover:underline">
            {product.name}
          </Link>
          <p className="mt-0.5 flex items-center gap-1.5 text-[12px] text-muted">
            <span className="h-2.5 w-2.5 rounded-full border border-line" style={{ background: color.swatch }} />
            {color.name}
          </p>
        </div>
        <p className="shrink-0 text-[13px] tabular-nums">{formatPrice(product.price)}</p>
      </div>
    </motion.article>
  );
}
