import { NextResponse } from "next/server";
import axios from "axios";
import { MEMPOOL_URL } from "@/app/app/config/config";

export const getBlockHeight = async () => {
  try {
    const url = `${MEMPOOL_URL}/blocks/tip/height`;

    const res = await axios.get(url);
    return Number(res.data);
  } catch (error) {
    console.log("Mempool API is not working for fetch block height");
    return -1;
  }
};

export async function GET() {
  try {
    const blockHeight: any = await getBlockHeight();

    return NextResponse.json({ status: true, blockHeight });
  } catch (error) {
    return NextResponse.json(
      { status: false, blockHeight: 0 },
      { status: 500 }
    );
  }
}
