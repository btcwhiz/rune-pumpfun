import { NextResponse } from "next/server";
import mempoolJS from "@mempool/mempool.js";
import { testVersion } from "@/app/app/config/config";

export const getTxDetails = async (txid: string) => {
  const {
    bitcoin: { transactions },
  } = mempoolJS({
    hostname: "mempool.space",
    network: testVersion ? "testnet" : "mainnet", // 'signet' | 'testnet' | 'mainnet',
  });

  const tx = await transactions.getTx({ txid });
  return tx;
};

export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const txId = searchParams.get("txId");

    if (!txId) {
      return NextResponse.json({ error: "txId is required" }, { status: 400 });
    }

    const resp: any = await getTxDetails(txId);

    return NextResponse.json({ status: true, txDetails: resp.status });
  } catch (error) {
    return NextResponse.json({ status: false }, { status: 500 });
  }
}
