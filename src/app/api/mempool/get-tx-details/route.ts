import { NextResponse } from "next/server";
import { MEMPOOL_URL } from "@/app/app/config/config";
import axios from "axios";

export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const txId = searchParams.get("txId");

    if (!txId) {
      return NextResponse.json({ error: "txId is required" }, { status: 400 });
    }

    const url = `${MEMPOOL_URL}/tx/${txId}/status`;
    const res = await axios.get(url);

    return NextResponse.json({
      status: true,
      block_height: res.data.block_height,
    });
  } catch (error) {
    return NextResponse.json({ status: false }, { status: 500 });
  }
}
