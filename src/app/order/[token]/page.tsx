import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatPrice } from "@/data/catalog";
import { PAYMENT_METHODS, TRANSFER_ACCOUNTS, WHATSAPP_NUMBER } from "@/lib/checkout";
import { getOrderByToken, type Order } from "@/lib/orders";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Order placed", robots: { index: false } };

/** The message the customer can send us on WhatsApp to confirm quickly. */
function whatsappText(o: Order) {
  const items = o.lines.map((l) => `• ${l.name} — ${l.colorName}, size ${l.size} × ${l.qty}`).join("\n");
  return [
    `Assalam o Alaikum! I just placed order ${o.number} on the Ghanam Rang website.`,
    "",
    items,
    "",
    `Total: ${formatPrice(o.total)} (${o.payment === "cod" ? "cash on delivery" : "bank transfer"})`,
    `Name: ${o.customer.name}`,
    `City: ${o.customer.city}`,
  ].join("\n");
}

export default async function OrderPage({ params }: { params: Promise<{ token: string }> }) {
  const order = await getOrderByToken((await params).token);
  if (!order) notFound();

  const payment = PAYMENT_METHODS.find((p) => p.id === order.payment);
  const wa = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappText(order))}`;

  return (
    <main className="min-h-screen bg-ink">
      <div className="mx-auto max-w-2xl px-6 pb-24 pt-14">
        <p className="text-[11px] uppercase tracking-[0.2em] text-accent">Order placed</p>
        <h1 className="mt-2 font-serif text-[44px] font-light leading-tight md:text-[56px]">
          Shukriya, {order.customer.name.split(" ")[0]}.
        </h1>
        <p className="mt-3 text-[14px] leading-relaxed text-paper/70">
          Your order <span className="font-medium text-paper">{order.number}</span> has been received. We&apos;ll call or message you on{" "}
          <span className="text-paper">{order.customer.phone}</span> to confirm it before dispatch.
        </p>

        <a
          href={wa}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 flex w-full items-center justify-center gap-2 rounded-md bg-[#25D366] py-4 text-[14px] font-medium text-black transition hover:brightness-110"
        >
          Confirm faster on WhatsApp
        </a>

        {order.payment === "transfer" && (
          <section className="mt-8 rounded-xl border border-accent/40 bg-accent/5 p-5">
            <h2 className="text-[13px] font-medium">Pay by transfer</h2>
            <p className="mt-1 text-[13px] text-paper/70">
              Send {formatPrice(order.total)} to one of these accounts and share the receipt on WhatsApp with your order number.
            </p>
            <ul className="mt-4 space-y-3 text-[13px]">
              {TRANSFER_ACCOUNTS.map((a) => (
                <li key={a.label} className="rounded-md bg-card p-3">
                  <p className="text-muted">{a.label}</p>
                  <p>{a.title}</p>
                  <p className="tabular-nums">{a.number}</p>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="mt-10 rounded-xl border border-line bg-card p-6">
          <h2 className="font-serif text-[26px] font-light">Order summary</h2>
          <ul className="mt-4 divide-y divide-line">
            {order.lines.map((l) => (
              <li key={`${l.productId}-${l.colorName}-${l.size}`} className="flex gap-3 py-3">
                <div className="h-20 w-[60px] shrink-0 overflow-hidden rounded bg-card-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={l.image} alt="" className="h-full w-full object-cover" />
                </div>
                <div className="flex-1">
                  <p className="text-[13px]">{l.name}</p>
                  <p className="text-[11px] text-muted">{l.colorName} · Size {l.size} · Qty {l.qty}</p>
                </div>
                <p className="text-[13px] tabular-nums">{formatPrice(l.lineTotal)}</p>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-1.5 border-t border-line pt-4 text-[13px] tabular-nums">
            <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{formatPrice(order.subtotal)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Delivery</dt><dd>{order.delivery === 0 ? "Free" : formatPrice(order.delivery)}</dd></div>
            <div className="flex justify-between pt-2 text-[16px] font-medium"><dt>Total</dt><dd>{formatPrice(order.total)}</dd></div>
          </dl>
          <div className="mt-6 grid gap-4 border-t border-line pt-4 text-[13px] sm:grid-cols-2">
            <div>
              <p className="text-muted">Deliver to</p>
              <p>{order.customer.name}</p>
              <p className="text-paper/70">{order.customer.address}</p>
              <p className="text-paper/70">{order.customer.city}</p>
            </div>
            <div>
              <p className="text-muted">Payment</p>
              <p>{payment?.label}</p>
            </div>
          </div>
        </section>

        <Link href="/" className="mt-8 inline-block text-[13px] text-muted underline-offset-4 hover:text-paper hover:underline">
          ← Continue shopping
        </Link>
      </div>
    </main>
  );
}
