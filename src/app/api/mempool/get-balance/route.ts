import { NextResponse } from "next/server";
import { MEMPOOL_URL } from "@/app/app/config/config";
import axios from "axios";

export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const address = searchParams.get("address");

    if (!address) {
      return NextResponse.json(
        { error: "address is required" },
        { status: 400 }
      );
    }

    const url = `${MEMPOOL_URL}/address/${address}`;
    const res = await axios.get(url);

    return NextResponse.json({
      status: true,
      balance:
        res.data.chain_stats.funded_txo_sum -
        res.data.chain_stats.spent_txo_sum,
    });
  } catch (error) {
    return NextResponse.json({ status: false }, { status: 500 });
  }
}
