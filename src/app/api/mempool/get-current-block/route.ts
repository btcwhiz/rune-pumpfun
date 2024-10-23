import { NextResponse } from "next/server";
import axios from "axios";
import { MEMPOOL_URL } from "@/app/app/config/config";

export async function GET() {
  try {
    const url = `${MEMPOOL_URL}/blocks/tip/height`;

    const res = await axios.get(url);
    const blockHeight = Number(res.data);

    return NextResponse.json({ status: true, blockHeight });
  } catch (error) {
    return NextResponse.json(
      { status: false, blockHeight: 0 },
      { status: 500 }
    );
  }
}
