import "server-only";

import type { Order } from "./orders";

/**
 * Sends a new order to OpsDesk (order confirmation, address check, risk,
 * booking). Set OPSDESK_URL and OPSDESK_API_KEY to turn it on; without them
 * this does nothing.
 *
 * It never fails the customer's checkout: OpsDesk being slow or down only
 * logs an error. Sending the same order twice is safe - OpsDesk ignores
 * duplicates by order number - so a retry can't create a second order.
 */
export async function sendToOpsDesk(order: Order): Promise<void> {
  const url = process.env.OPSDESK_URL;
  const key = process.env.OPSDESK_API_KEY;
  if (!url || !key) return;

  const body = {
    externalId: order.number,
    number: order.number,
    createdAt: order.createdAt,
    customer: {
      name: order.customer.name,
      phone: order.customer.phone,
      city: order.customer.city,
      address: order.customer.address,
      email: order.customer.email,
    },
    items: order.lines.map((l) => ({ name: l.name, variant: `${l.colorName} / ${l.size}`, qty: l.qty, price: l.price })),
    total: order.total,
    payment: order.payment === "transfer" ? "transfer" : "cod",
    notes: order.customer.notes,
  };

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const res = await fetch(`${url.replace(/\/$/, "")}/api/v1/orders`, {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok) return;
      // 4xx won't get better by retrying (wrong key, rejected data)
      if (res.status < 500) {
        console.error(`OpsDesk rejected order ${order.number}: ${res.status} ${await res.text().catch(() => "")}`);
        return;
      }
      console.error(`OpsDesk error for order ${order.number}: ${res.status}`);
    } catch (e) {
      console.error(`OpsDesk unreachable for order ${order.number} (attempt ${attempt})`, e);
    }
  }
}
