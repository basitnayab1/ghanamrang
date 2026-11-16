import { NextResponse } from "next/server";
import { saveLead, validateLead } from "@/lib/leads";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  // bots fill every field they find; people never see this one
  if (typeof body.website === "string" && body.website) return NextResponse.json({ ok: true });

  const result = validateLead(body);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 422 });

  try {
    await saveLead(result.clean);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (e) {
    console.error("Lead failed", e);
    return NextResponse.json({ error: "We couldn't save your details. Please message us on WhatsApp." }, { status: 500 });
  }
}
