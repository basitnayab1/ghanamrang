"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatPrice, thumbOf } from "@/data/catalog";
import { CITIES, DELIVERY_FEE, FREE_DELIVERY_OVER, PAYMENT_METHODS, deliveryFor, type FieldErrors, type PaymentMethod } from "@/lib/checkout";
import { resolveLines, useBag } from "@/store/bag";

/** True once the saved bag has been loaded from localStorage. */
function useBagHydrated() {
  // `persist` is missing during server rendering (no localStorage there)
  const [done, setDone] = useState(() => useBag.persist?.hasHydrated() ?? false);
  useEffect(() => {
    if (useBag.persist.hasHydrated()) setDone(true);
    return useBag.persist.onFinishHydration(() => setDone(true));
  }, []);
  return done;
}

const input =
  "w-full rounded-md border border-line bg-card px-3.5 py-3 text-[14px] outline-none transition placeholder:text-muted/70 focus:border-paper/60";

export default function CheckoutView() {
  const router = useRouter();
  const hydrated = useBagHydrated();
  const stored = useBag((s) => s.lines);
  const clear = useBag((s) => s.clear);
  const lines = resolveLines(stored);
  const subtotal = lines.reduce((s, l) => s + l.product.price * l.qty, 0);
  const delivery = deliveryFor(subtotal);

  const [form, setForm] = useState({ name: "", phone: "", email: "", city: "", address: "", notes: "" });
  const [preferredPayment, setPayment] = useState<PaymentMethod>("cod");
  const advanceOnly = lines.some(({ product }) => product.advanceOnly);
  const payment = advanceOnly ? "transfer" : preferredPayment;
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setErrors((er) => ({ ...er, [k]: undefined }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setServerError(null);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: form,
          payment,
          lines: stored.map(({ productId, size, colorName, qty }) => ({ productId, size, colorName, qty })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 422 && data.errors) {
        setErrors(data.errors);
        if (data.errors.lines) setServerError(data.errors.lines);
        // bring the first problem into view
        requestAnimationFrame(() => document.querySelector("[aria-invalid=true]")?.scrollIntoView({ behavior: "smooth", block: "center" }));
        return;
      }
      if (!res.ok) {
        setServerError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      clear();
      router.push(`/order/${data.token}`);
    } catch {
      setServerError("Couldn't reach the shop. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!hydrated) return <div className="h-[60vh]" />;

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-md px-6 py-32 text-center">
        <h1 className="font-serif text-[40px] font-light">Your bag is empty</h1>
        <p className="mt-2 text-[14px] text-muted">Add a set to your bag to check out.</p>
        <Link href="/try-the-style" className="mt-6 inline-block rounded-md bg-paper px-6 py-3 text-[13px] font-medium text-ink hover:bg-accent">
          Browse the styles
        </Link>
      </div>
    );
  }

  const field = (k: keyof FieldErrors) => (errors[k] ? <p className="mt-1.5 text-[12px] text-red-400">{errors[k]}</p> : null);

  return (
    <div className="mx-auto grid max-w-[1200px] gap-12 px-6 pb-24 pt-10 md:px-10 lg:grid-cols-[1fr_400px]">
      <form onSubmit={submit} noValidate className="space-y-10">
        <h1 className="font-serif text-[44px] font-light leading-none md:text-[52px]">Checkout</h1>

        <fieldset className="space-y-4">
          <legend className="mb-4 text-[11px] uppercase tracking-[0.18em] text-accent">Contact</legend>
          <div>
            <label htmlFor="name" className="mb-1.5 block text-[12px] text-muted">Full name</label>
            <input id="name" autoComplete="name" value={form.name} onChange={set("name")} aria-invalid={!!errors.name} className={input} />
            {field("name")}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="phone" className="mb-1.5 block text-[12px] text-muted">Mobile number</label>
              <input id="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="0300 1234567" value={form.phone} onChange={set("phone")} aria-invalid={!!errors.phone} className={input} />
              {field("phone")}
            </div>
            <div>
              <label htmlFor="email" className="mb-1.5 block text-[12px] text-muted">Email <span className="text-muted/60">(optional)</span></label>
              <input id="email" type="email" autoComplete="email" value={form.email} onChange={set("email")} aria-invalid={!!errors.email} className={input} />
              {field("email")}
            </div>
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="mb-4 text-[11px] uppercase tracking-[0.18em] text-accent">Delivery</legend>
          <div>
            <label htmlFor="city" className="mb-1.5 block text-[12px] text-muted">City</label>
            <select id="city" autoComplete="address-level2" value={form.city} onChange={set("city")} aria-invalid={!!errors.city} className={`${input} cursor-pointer [&>option]:bg-card`}>
              <option value="">Choose your city</option>
              {CITIES.map((c) => <option key={c}>{c}</option>)}
            </select>
            {field("city")}
          </div>
          <div>
            <label htmlFor="address" className="mb-1.5 block text-[12px] text-muted">Full address</label>
            <textarea id="address" rows={3} autoComplete="street-address" placeholder="House no., street, area / sector" value={form.address} onChange={set("address")} aria-invalid={!!errors.address} className={`${input} resize-none`} />
            {field("address")}
          </div>
          <div>
            <label htmlFor="notes" className="mb-1.5 block text-[12px] text-muted">Order notes <span className="text-muted/60">(optional)</span></label>
            <input id="notes" placeholder="Landmark, preferred delivery time…" value={form.notes} onChange={set("notes")} aria-invalid={!!errors.notes} className={input} />
            {field("notes")}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-4 text-[11px] uppercase tracking-[0.18em] text-accent">Payment</legend>
          <div className="space-y-2">
            {advanceOnly && <p className="text-[13px] text-accent">Your bag includes an item that requires advance payment.</p>}
            {PAYMENT_METHODS.filter((m) => !advanceOnly || m.id === "transfer").map((m) => (
              <label
                key={m.id}
                className={`flex cursor-pointer items-start gap-3 rounded-md border p-4 transition ${payment === m.id ? "border-paper/70 bg-card-2" : "border-line hover:border-paper/40"}`}
              >
                <input type="radio" name="payment" value={m.id} checked={payment === m.id} onChange={() => setPayment(m.id)} className="mt-1 accent-[#c9b08a]" />
                <span>
                  <span className="block text-[14px]">{m.label}</span>
                  <span className="block text-[12px] text-muted">{m.note}</span>
                </span>
              </label>
            ))}
          </div>
          {field("payment")}
        </fieldset>

        {serverError && <p role="alert" className="rounded-md border border-red-400/40 bg-red-400/10 p-3 text-[13px] text-red-300">{serverError}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-paper py-4 text-[14px] font-medium text-ink transition hover:bg-accent disabled:cursor-wait disabled:opacity-60"
        >
          {submitting ? "Placing your order…" : `Place order — ${formatPrice(subtotal + delivery)}`}
        </button>
      </form>

      {/* summary */}
      <aside className="h-fit rounded-xl border border-line bg-card p-6 lg:sticky lg:top-24">
        <h2 className="font-serif text-[26px] font-light">Your order</h2>
        <ul className="mt-4 divide-y divide-line">
          {lines.map((l) => (
            <li key={l.key} className="flex gap-3 py-3">
              <div className="relative h-20 w-[60px] shrink-0 overflow-hidden rounded bg-card-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={thumbOf(l.color.images[0])} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
                <span className="absolute right-1 top-1 grid h-5 min-w-5 place-items-center rounded-full bg-paper px-1 text-[10px] font-medium text-ink">{l.qty}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px]">{l.product.name}</p>
                <p className="text-[11px] text-muted">{l.color.name} · Size {l.size}</p>
              </div>
              <p className="text-[13px] tabular-nums">{formatPrice(l.product.price * l.qty)}</p>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-1.5 border-t border-line pt-4 text-[13px] tabular-nums">
          <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{formatPrice(subtotal)}</dd></div>
          <div className="flex justify-between"><dt className="text-muted">Delivery</dt><dd>{delivery === 0 ? "Free" : formatPrice(delivery)}</dd></div>
          <div className="flex justify-between pt-2 text-[16px] font-medium"><dt>Total</dt><dd>{formatPrice(subtotal + delivery)}</dd></div>
        </dl>
        {delivery > 0 && (
          <p className="mt-3 text-[11px] text-muted">
            Free delivery on orders over {formatPrice(FREE_DELIVERY_OVER)} — add {formatPrice(FREE_DELIVERY_OVER - subtotal)} more. Standard delivery {formatPrice(DELIVERY_FEE)}.
          </p>
        )}
      </aside>
    </div>
  );
}
