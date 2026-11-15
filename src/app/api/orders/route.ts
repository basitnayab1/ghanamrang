import { NextResponse } from "next/server";
import { validateOrder } from "@/lib/checkout";
import { createOrder } from "@/lib/orders";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const result = validateOrder(body);
  if ("errors" in result) return NextResponse.json({ errors: result.errors }, { status: 422 });

  try {
    const order = await createOrder(result.clean);
    return NextResponse.json({ token: order.token, number: order.number }, { status: 201 });
  } catch (e) {
    console.error("Order failed", e);
    return NextResponse.json({ error: "We couldn't place your order. Please try again or message us on WhatsApp." }, { status: 500 });
  }
}
