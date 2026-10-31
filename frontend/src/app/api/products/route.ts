import { NextResponse } from "next/server";
import { serverStore } from "@/lib/server-store";

export async function GET() {
  const products = serverStore.getProducts();
  return NextResponse.json(products);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const product = serverStore.createProduct(body);
    return NextResponse.json(product, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Invalid request";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
