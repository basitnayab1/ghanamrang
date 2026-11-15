import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { ORDER_STATUSES, setOrderStatus, type OrderStatus } from "@/lib/orders";

export async function PATCH(req: Request, { params }: { params: Promise<{ number: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { status } = (await req.json().catch(() => ({}))) as { status?: unknown };
  if (!ORDER_STATUSES.includes(status as OrderStatus)) return NextResponse.json({ error: "Bad status" }, { status: 400 });

  const order = await setOrderStatus((await params).number, status as OrderStatus);
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  return NextResponse.json({ ok: true, status: order.status });
}
