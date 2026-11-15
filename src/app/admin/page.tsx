import type { Metadata } from "next";
import { isAdmin } from "@/lib/admin-auth";
import { listOrders } from "@/lib/orders";
import { AdminLogin, AdminOrders } from "@/components/AdminViews";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Orders", robots: { index: false, follow: false } };

export default async function AdminPage() {
  if (!(await isAdmin())) {
    return (
      <main className="min-h-[70vh] bg-ink">
        <AdminLogin />
      </main>
    );
  }
  const orders = await listOrders();
  return (
    <main className="min-h-screen bg-ink">
      {/* keyed so "Refresh" (router.refresh) replaces the client copy with new data */}
      <AdminOrders key={orders.map((o) => o.number + o.status).join()} orders={orders} />
    </main>
  );
}
