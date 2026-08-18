import { NextRequest } from "next/server";
import { processWebhook } from "@/services/payment.service";

export async function POST(request: NextRequest) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Invalid payload." }, { status: 400 });
  }

  const result = await processWebhook(payload, request.headers);

  if (!result.ok) {
    return Response.json({ error: result.message }, { status: 400 });
  }

  return Response.json({ message: result.message }, { status: 200 });
}
