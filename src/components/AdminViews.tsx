"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/data/catalog";
import { PAYMENT_METHODS } from "@/lib/checkout";
import type { Order, OrderStatus } from "@/lib/orders";
import type { Lead } from "@/lib/leads";

// kept in sync with ORDER_STATUSES in lib/orders (that module is server-only)
const STATUSES: OrderStatus[] = ["new", "confirmed", "shipped", "delivered", "cancelled"];

const STATUS_STYLE: Record<OrderStatus, string> = {
  new: "bg-accent/20 text-accent",
  confirmed: "bg-sky-400/15 text-sky-300",
  shipped: "bg-violet-400/15 text-violet-300",
  delivered: "bg-emerald-400/15 text-emerald-300",
  cancelled: "bg-white/5 text-muted line-through",
};

export function AdminLogin() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setBusy(false);
    if (res.ok) router.refresh();
    else setError("Wrong password.");
  };

  return (
    <form onSubmit={submit} className="mx-auto max-w-sm px-6 py-32">
      <h1 className="font-serif text-[40px] font-light">Orders</h1>
      <p className="mt-1 text-[13px] text-muted">Shop owner sign-in</p>
      <label htmlFor="pw" className="mb-1.5 mt-8 block text-[12px] text-muted">Password</label>
      <input
        id="pw"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full rounded-md border border-line bg-card px-3.5 py-3 text-[14px] outline-none focus:border-paper/60"
      />
      {error && <p className="mt-2 text-[12px] text-red-400">{error}</p>}
      <button disabled={busy || !password} className="mt-4 w-full rounded-md bg-paper py-3 text-[13px] font-medium text-ink hover:bg-accent disabled:opacity-50">
        {busy ? "Checking…" : "Sign in"}
      </button>
    </form>
  );
}

export function AdminOrders({ orders: initial }: { orders: Order[] }) {
  const router = useRouter();
  const [orders, setOrders] = useState(initial);
  const [filter, setFilter] = useState<OrderStatus | "all">("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  const shown = useMemo(() => (filter === "all" ? orders : orders.filter((o) => o.status === filter)), [orders, filter]);
  const count = (s: OrderStatus) => orders.filter((o) => o.status === s).length;
  const openRevenue = orders.filter((o) => o.status !== "cancelled").reduce((s, o) => s + o.total, 0);

  const changeStatus = async (number: string, status: OrderStatus) => {
    setSaving(number);
    const res = await fetch(`/api/admin/orders/${encodeURIComponent(number)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setSaving(null);
    if (res.ok) setOrders((os) => os.map((o) => (o.number === number ? { ...o, status } : o)));
    else if (res.status === 401) router.refresh();
    else alert("Couldn't update the order. Please try again.");
  };

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.refresh();
  };

  return (
    <div className="mx-auto max-w-[1200px] px-6 pb-24 pt-10 md:px-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-[44px] font-light leading-none">Orders</h1>
          <p className="mt-2 text-[13px] text-muted">
            {orders.length} total · {formatPrice(openRevenue)} excluding cancelled
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => router.refresh()} className="rounded-md border border-line px-4 py-2 text-[12px] hover:border-paper">Refresh</button>
          <button onClick={logout} className="rounded-md border border-line px-4 py-2 text-[12px] hover:border-paper">Sign out</button>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2 text-[12px]">
        {(["all", ...STATUSES] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-full border px-3.5 py-1.5 capitalize transition ${filter === s ? "border-paper bg-paper text-ink" : "border-line text-paper/80 hover:border-paper/50"}`}
          >
            {s} ({s === "all" ? orders.length : count(s)})
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <p className="py-24 text-center text-muted">No orders here yet.</p>
      ) : (
        <ul className="mt-6 divide-y divide-line rounded-xl border border-line bg-card">
          {shown.map((o) => {
            const open = openId === o.number;
            return (
              <li key={o.number}>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 p-4">
                  <button onClick={() => setOpenId(open ? null : o.number)} className="min-w-0 flex-1 text-left" aria-expanded={open}>
                    <p className="text-[14px] font-medium tabular-nums">{o.number}</p>
                    <p className="truncate text-[12px] text-muted">
                      {o.customer.name} · {o.customer.city} · {new Date(o.createdAt).toLocaleString("en-PK", { dateStyle: "medium", timeStyle: "short" })}
                    </p>
                  </button>
                  <p className="text-[14px] tabular-nums">{formatPrice(o.total)}</p>
                  <span className={`rounded-full px-2.5 py-1 text-[11px] capitalize ${STATUS_STYLE[o.status]}`}>{o.status}</span>
                  <select
                    value={o.status}
                    disabled={saving === o.number}
                    onChange={(e) => changeStatus(o.number, e.target.value as OrderStatus)}
                    aria-label={`Status for ${o.number}`}
                    className="cursor-pointer rounded-md border border-line bg-card-2 px-2 py-1.5 text-[12px] capitalize [&>option]:bg-card"
                  >
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                {open && (
                  <div className="grid gap-6 border-t border-line p-4 text-[13px] md:grid-cols-[1.4fr_1fr]">
                    <ul className="space-y-2">
                      {o.lines.map((l) => (
                        <li key={`${l.productId}-${l.colorName}-${l.size}`} className="flex justify-between gap-3">
                          <span>{l.name} — {l.colorName}, size {l.size} × {l.qty}</span>
                          <span className="tabular-nums text-paper/70">{formatPrice(l.lineTotal)}</span>
                        </li>
                      ))}
                      <li className="flex justify-between border-t border-line pt-2 text-muted"><span>Delivery</span><span className="tabular-nums">{o.delivery ? formatPrice(o.delivery) : "Free"}</span></li>
                    </ul>
                    <div className="space-y-1">
                      <p><span className="text-muted">Phone </span><a href={`tel:${o.customer.phone}`} className="tabular-nums underline-offset-2 hover:underline">{o.customer.phone}</a></p>
                      {o.customer.email && <p><span className="text-muted">Email </span>{o.customer.email}</p>}
                      <p><span className="text-muted">Address </span>{o.customer.address}, {o.customer.city}</p>
                      {o.customer.notes && <p><span className="text-muted">Notes </span>{o.customer.notes}</p>}
                      <p><span className="text-muted">Payment </span>{PAYMENT_METHODS.find((p) => p.id === o.payment)?.label}</p>
                      <a
                        href={`https://wa.me/92${o.customer.phone.slice(1)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-block rounded-md bg-[#25D366] px-3 py-1.5 text-[12px] font-medium text-black"
                      >
                        WhatsApp customer
                      </a>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/** People who left their details with the chat assistant, newest first. */
export function AdminLeads({ leads, error }: { leads: Lead[]; error?: string }) {
  return (
    <section className="mx-auto max-w-[1200px] px-6 pb-24 md:px-10">
      <div className="flex items-end justify-between gap-4 border-t border-line pt-10">
        <div>
          <h2 className="font-serif text-[36px] font-light leading-none">Leads</h2>
          <p className="mt-2 text-[13px] text-muted">From the chat assistant · {leads.length} total</p>
        </div>
      </div>

      {error ? (
        <p role="alert" className="mt-6 rounded-md border border-red-400/40 bg-red-400/10 p-4 text-[13px] text-red-300">{error}</p>
      ) : leads.length === 0 ? (
        <p className="py-16 text-center text-muted">No one has left their details yet.</p>
      ) : (
        <ul className="mt-6 divide-y divide-line rounded-xl border border-line bg-card">
          {leads.map((l) => (
            <li key={l.id} className="flex flex-wrap items-start gap-x-6 gap-y-2 p-4 text-[13px]">
              <div className="min-w-[180px] flex-1">
                <p className="text-[14px] font-medium">{l.name}</p>
                <p className="text-[12px] text-muted">
                  {[l.city, new Date(l.createdAt).toLocaleString("en-PK", { dateStyle: "medium", timeStyle: "short" })].filter(Boolean).join(" · ")}
                </p>
              </div>
              <div className="min-w-[200px] flex-[2] space-y-1 text-paper/80">
                {l.interest && <p><span className="text-muted">Likes </span>{l.interest}</p>}
                {l.message && <p><span className="text-muted">Note </span>{l.message}</p>}
                {l.page && <p className="text-[11px] text-muted">Chatted on {l.page}</p>}
              </div>
              <div className="flex items-center gap-2">
                <a href={`tel:${l.phone}`} className="tabular-nums underline-offset-2 hover:underline">{l.phone}</a>
                <a
                  href={`https://wa.me/92${l.phone.slice(1)}?text=${encodeURIComponent(`Assalam o Alaikum ${l.name.split(" ")[0]}! This is Ghanam Rang — thank you for reaching out.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-md bg-[#25D366] px-3 py-1.5 text-[12px] font-medium text-black"
                >
                  WhatsApp
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
