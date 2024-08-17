"use client";
import Head from "next/head";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import Script from "next/script";

// import {
//     ChartingLibraryWidgetOptions,
//     PeriodParams,
//     ResolutionString,
// } from "@/libraries/charting_library/charting_library";
// import { coinInfo } from "@/utils/types";
import { PeriodParams } from "../../../../public/libraries/charting_library/charting_library";
import { coinInfo } from "../../utils/types";
// import { TVChartContainer } from "@/components/TVChartContainer";

interface TradingChartProps {
  param: coinInfo;
}

const TVChartContainer = dynamic(
  () => import("./TVChartContainer").then((mod) => mod.TVChartContainer),
  { ssr: false }
);

export const TradingChart: React.FC<TradingChartProps> = ({ param }) => {
  const [isScriptReady, setIsScriptReady] = useState(false);
  const [period, setPeriod] = useState<PeriodParams>({} as PeriodParams);
  // console.log("tradingview chart", param)
  useEffect(() => {
    if (param.date !== undefined) {
      // console.log("===== param :>> ", param);
      const newPeriod: PeriodParams = {
        from: Math.floor(new Date(param.date).getTime()),
        to: Math.floor(new Date().getTime()),
        // to: new Date().getTime(),
        firstDataRequest: true,
        countBack: 300,
      };
      // console.log(newPeriod, "tradingview");
      setPeriod(newPeriod);
    }
  }, [param]);

  return (
    <>
      <Head>
        <title>TradingView with NextJS</title>
      </Head>
      {/* <Script
        src="/libraries/charting_library/charting_library.standalone.js"
        strategy="lazyOnload"
      /> */}
      <Script
        src="/libraries/datafeeds/udf/dist/bundle.js"
        strategy="lazyOnload"
        onReady={() => {
          setIsScriptReady(true);
        }}
      />
      {isScriptReady && param && (
        <TVChartContainer
          runeId={param?.runeId || ""}
          name={param.name}
          pairIndex={10}
          token={param.token}
          customPeriodParams={period}
        />
      )}
    </>
  );
};
