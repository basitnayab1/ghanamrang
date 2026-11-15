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
  let orders;
  try {
    orders = await listOrders();
  } catch (e) {
    // most likely the database isn't connected yet — say so instead of a blank error page
    return (
      <main className="min-h-[70vh] bg-ink">
        <div className="mx-auto max-w-lg px-6 py-32">
          <h1 className="font-serif text-[40px] font-light">Orders</h1>
          <p role="alert" className="mt-4 rounded-md border border-red-400/40 bg-red-400/10 p-4 text-[13px] text-red-300">
            {e instanceof Error ? e.message : "Couldn't load orders."}
          </p>
        </div>
      </main>
    );
  }
  return (
    <main className="min-h-screen bg-ink">
      {/* keyed so "Refresh" (router.refresh) replaces the client copy with new data */}
      <AdminOrders key={orders.map((o) => o.number + o.status).join()} orders={orders} />
    </main>
  );
}
