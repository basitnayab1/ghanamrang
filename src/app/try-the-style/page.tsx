import type { Metadata } from "next";
import { Suspense } from "react";
import TryTheLook from "@/components/TryTheLook";

export const metadata: Metadata = { title: "Try the Style" };

export default function TryTheStylePage() {
  return (
    <main className="bg-ink">
      <Suspense fallback={<div className="h-screen" />}>
        <TryTheLook />
      </Suspense>
    </main>
  );
}
