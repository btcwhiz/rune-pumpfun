"use client";

import axios from "axios";
import { ChartTable } from "./types";
const generateDemoData = (numBars: number) => {
  const data = [];
  const startTime = new Date("2023-01-20").getTime();
  let currentTime = startTime;

  for (let i = 0; i < numBars; i++) {
    const open = Math.random() * 1.01;
    const high = open + Math.random() * 2.71;
    const low = open - Math.random() * 1.31;
    const close = open + (Math.random() - 0.5) * 1.51; // Randomly vary close price around open
    data.push({
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      time: currentTime,
    });
    currentTime += 1000 * 60 * 60 * 24; // Increment time by 5 minutes
  }

  return data;
};

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
    console.log("ok");
    // const demoData = generateDemoData(500); // Generate 50 bars of data
    // const res = {
    //   table: demoData,
    // };
    const resData: any = await axios.post(
      `${process.env.NEXT_PUBLIC_API_URL}/api/pump/get-bar-status`,
      { runeId }
    );
    const res = {
      table: resData?.data?.chartData || [],
    };
    console.log("res :>> ", res);
    if (!res) {
      throw new Error();
    }
    console.log("tradingchart === getch data", res);
    return res as ChartTable;
  } catch (err) {
    return Promise.reject(new Error("Failed at fetching charts"));
  }
}
