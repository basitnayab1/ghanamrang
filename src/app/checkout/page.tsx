import type { Metadata } from "next";
import CheckoutView from "@/components/CheckoutView";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

export default function CheckoutPage() {
  return (
    <main className="min-h-screen bg-ink">
      <CheckoutView />
    </main>
  );
}
