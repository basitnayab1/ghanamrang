/**
 * Checkout settings and validation shared by the checkout page (client) and
 * the order API (server). PLACEHOLDERS: delivery fee, free-delivery threshold
 * — replace with the real values.
 */
import { findColor, getProduct } from "@/data/catalog";

export const DELIVERY_FEE = 250; // placeholder
export const FREE_DELIVERY_OVER = 10000; // placeholder
export { WHATSAPP_NUMBER } from "./social";

export const CITIES = [
  "Karachi", "Lahore", "Islamabad", "Rawalpindi", "Faisalabad", "Multan", "Peshawar", "Quetta",
  "Sialkot", "Gujranwala", "Hyderabad", "Bahawalpur", "Sargodha", "Abbottabad", "Sukkur", "Other",
];

export const PAYMENT_METHODS = [
  { id: "cod", label: "Cash on delivery", note: "Pay in cash when your order arrives." },
  { id: "transfer", label: "Bank transfer / JazzCash / Easypaisa", note: "Confirm the payment details with us on WhatsApp after placing your order." },
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number]["id"];

export type OrderLineInput = { productId: string; size: string; colorName: string; qty: number };

export type CustomerInput = {
  name: string;
  phone: string;
  email?: string;
  city: string;
  address: string;
  notes?: string;
};

export type OrderInput = { customer: CustomerInput; payment: PaymentMethod; lines: OrderLineInput[] };

export type PricedLine = OrderLineInput & { name: string; price: number; image: string; lineTotal: number };

export const deliveryFor = (subtotal: number) => (subtotal >= FREE_DELIVERY_OVER ? 0 : DELIVERY_FEE);

/** Normalises Pakistani mobile numbers to 03XXXXXXXXX, or null if invalid. */
export function normalisePhone(raw: string): string | null {
  const digits = raw.replace(/[\s\-()]/g, "");
  const m = digits.match(/^(?:\+?92|0)?(3\d{9})$/);
  return m ? `0${m[1]}` : null;
}

/** Prices lines from the catalog. Throws on anything that isn't a real product/colour/size. */
export function priceLines(lines: OrderLineInput[]): PricedLine[] {
  return lines.map((l) => {
    const product = getProduct(l.productId);
    if (!product || product.price === null) throw new Error("Unknown product");
    const color = product.colors.find((c) => c.name === l.colorName);
    if (!color) throw new Error("Unknown colour");
    if (!product.sizes.includes(l.size)) throw new Error("Unknown size");
    if (!Number.isInteger(l.qty) || l.qty < 1 || l.qty > 10) throw new Error("Bad quantity");
    return {
      productId: product.id,
      colorName: color.name,
      size: l.size,
      qty: l.qty,
      name: product.name,
      price: product.price,
      image: findColor(product, color.name).images[0],
      lineTotal: product.price * l.qty,
    };
  });
}

export type FieldErrors = Partial<Record<keyof CustomerInput | "payment" | "lines", string>>;

/** Validates a checkout submission. Returns field errors, or the cleaned input. */
export function validateOrder(input: unknown): { errors: FieldErrors } | { clean: OrderInput } {
  const errors: FieldErrors = {};
  const o = (input ?? {}) as Partial<OrderInput>;
  const c = (o.customer ?? {}) as Partial<CustomerInput>;
  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

  const name = str(c.name);
  if (name.length < 2 || name.length > 80) errors.name = "Please enter your full name.";

  const phone = normalisePhone(str(c.phone));
  if (!phone) errors.phone = "Enter a Pakistani mobile number, e.g. 0300 1234567.";

  const email = str(c.email);
  if (email && (email.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) errors.email = "That email doesn't look right.";

  const city = str(c.city);
  if (!city || city.length > 60) errors.city = "Please choose your city.";

  const address = str(c.address);
  if (address.length < 10 || address.length > 300) errors.address = "Please enter your full address (house, street, area).";

  const notes = str(c.notes);
  if (notes.length > 300) errors.notes = "Please keep notes under 300 characters.";

  const payment = o.payment;
  if (!PAYMENT_METHODS.some((p) => p.id === payment)) errors.payment = "Please choose a payment method.";

  const lines = Array.isArray(o.lines) ? o.lines : [];
  if (lines.length === 0 || lines.length > 20) errors.lines = "Your bag is empty.";
  else {
    try {
      priceLines(lines as OrderLineInput[]);
      if (payment === "cod" && lines.some((line) => getProduct(line.productId)?.advanceOnly)) {
        errors.payment = "Your bag includes an item that requires advance payment.";
      }
    } catch {
      errors.lines = "Something in your bag is no longer available. Please review your bag.";
    }
  }

  if (Object.keys(errors).length) return { errors };
  return {
    clean: {
      customer: { name, phone: phone!, email: email || undefined, city, address, notes: notes || undefined },
      payment: payment as PaymentMethod,
      lines: (lines as OrderLineInput[]).map(({ productId, size, colorName, qty }) => ({ productId, size, colorName, qty })),
    },
  };
}
