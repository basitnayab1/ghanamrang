import Link from "next/link";
import HomeHero from "@/components/HomeHero";
import ProductCard from "@/components/ProductCard";
import TheRail from "@/components/TheRail";
import Reveal3D from "@/components/Reveal3D";
import ScrollStatement from "@/components/ScrollStatement";
import ScrollMarquee from "@/components/ScrollMarquee";
import ShadesSection from "@/components/ShadesSection";
import { preload } from "react-dom";
import { colorways, heroFigures, products } from "@/data/catalog";

export default function Home() {
  const abaya = products.find((p) => p.category === "abaya-sets")!;

  // the hero figures are the first thing people see: ask for them in the <head>, before any script
  heroFigures.forEach((f) => preload(f.src, { as: "image", fetchPriority: "high" }));

  return (
    <main className="bg-ink">
      <HomeHero />

      {/* words light up one by one as you scroll */}
      <ScrollStatement
        eyebrow="Ghanam Rang"
        text="Cut loose, dyed *deep,* and made to move — sets in mocha, navy and olive that carry you from the street to the pitch with *quiet* grace."
      />

      {/* collection */}
      <section className="mx-auto max-w-[1400px] px-6 py-16 md:px-10">
        <Reveal3D className="mb-8 flex items-end justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-accent">The collection</p>
            <h2 className="mt-2 font-serif text-[36px] font-light md:text-[44px]">Every set, every shade</h2>
          </div>
          <Link href="/shop" className="text-[13px] text-muted hover:text-paper">Shop all →</Link>
        </Reveal3D>
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3">
          {colorways.map(({ product, color }, i) => (
            <ProductCard key={`${product.id}-${color.name}`} product={product} color={color} index={i} />
          ))}
        </div>
      </section>

      {/* three lengths of cloth in 3D, one per colour, moving in a breeze */}
      <ShadesSection
        shades={colorways.map(({ product, color }) => ({
          name: color.name,
          hex: color.swatch,
          note: product.name,
          href: `/shop?color=${encodeURIComponent(color.name)}`,
        }))}
      />

      {/* big type that drifts sideways and speeds up with the scroll */}
      <ScrollMarquee items={["Abaya", "Khimar", "Mocha", "Navy", "Olive", "Ghanam Rang"]} />

      {/* the collection hung on a rack; scrolling slides it */}
      <TheRail />

      {/* size guide teaser */}
      <section className="mx-auto grid max-w-[1400px] gap-10 px-6 py-20 md:grid-cols-2 md:px-10">
        <Reveal3D>
          <p className="text-[11px] uppercase tracking-[0.22em] text-accent">Find your fit</p>
          <h2 className="mt-2 font-serif text-[36px] font-light md:text-[44px]">Three sizes, cut loose.</h2>
          <p className="mt-4 max-w-sm text-[14px] leading-relaxed text-paper/70">
            Every set comes in Small, Medium and Large, with a relaxed fit. Not sure? Message us on WhatsApp and we&apos;ll help you choose.
          </p>
          <Link href={`/product/${abaya.id}`} className="mt-6 inline-block text-[13px] underline underline-offset-4 hover:text-accent">
            See the size chart
          </Link>
        </Reveal3D>
        <Reveal3D delay={0.15} className="self-end">
        <table className="w-full text-left text-[14px] tabular-nums">
          <thead>
            <tr className="text-muted">{abaya.sizeChart.head.map((h) => <th key={h} className="pb-3 font-normal">{h}</th>)}</tr>
          </thead>
          <tbody>
            {abaya.sizeChart.rows.map((r) => (
              <tr key={r[0]} className="border-t border-line">{r.map((c, i) => <td key={i} className="py-3">{c}</td>)}</tr>
            ))}
          </tbody>
          <caption className="caption-bottom pt-3 text-left text-[11px] text-muted">{abaya.name}, in {abaya.sizeChart.unit}</caption>
        </table>
        </Reveal3D>
      </section>
    </main>
  );
}
