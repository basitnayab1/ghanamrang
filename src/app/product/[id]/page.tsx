import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { colorways, getProduct, products } from "@/data/catalog";
import ProductDetail from "@/components/ProductDetail";
import ProductCard from "@/components/ProductCard";

type Props = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return products.map((p) => ({ id: p.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = getProduct((await params).id);
  return p ? { title: p.name, description: p.description } : {};
}

export default async function ProductPage({ params }: Props) {
  const product = getProduct((await params).id);
  if (!product) notFound();

  const more = colorways.filter((c) => c.product.id !== product.id).slice(0, 4);

  return (
    <main className="bg-ink">
      <Suspense fallback={<div className="h-screen" />}>
        <ProductDetail key={product.id} product={product} />
      </Suspense>

      {more.length > 0 && (
        <section className="mx-auto max-w-[1400px] px-6 py-20 md:px-10">
          <h2 className="mb-6 font-serif text-[32px] font-light">You may also like</h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4">
            {more.map(({ product: p, color }, i) => (
              <ProductCard key={`${p.id}-${color.name}`} product={p} color={color} index={i} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
