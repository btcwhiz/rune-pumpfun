"use client";

import axios from "axios";
import { ChartTable } from "./types";

export async function getChartTable({
  runeId,
  pairIndex,
  from,
  to,
  range,
  token,
}: {
  runeId: string;
  pairIndex: number;
  from: number;
  to: number;
  range: number;
  token: string;
}): Promise<ChartTable> {
  try {
    const resData: any = await axios.post(
      `${process.env.NEXT_PUBLIC_API_URL}/api/pump/get-bar-status`,
      { runeId, range, countBack: 300 }
    );
    const res = {
      table: resData?.data?.chartData || [],
    };
    console.log("res :>> ", res);
    if (!res) {
      throw new Error();
    }
    return res as ChartTable;
  } catch (err) {
    return Promise.reject(new Error("Failed at fetching charts"));
  }
}
