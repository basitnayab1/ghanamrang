import type { Metadata } from "next";
import { Suspense } from "react";
import ShopView from "@/components/ShopView";

export const metadata: Metadata = { title: "Shop" };

export default function ShopPage() {
  return (
    <main className="min-h-screen bg-ink">
      <Suspense fallback={<div className="h-screen" />}>
        <ShopView />
      </Suspense>
    </main>
  );
}
