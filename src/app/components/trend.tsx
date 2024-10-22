"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import moment from "moment-timezone";
import { Bounce } from "react-awesome-reveal";

import useSocket from "../hooks/useSocket";
import { SATS_MULTIPLE } from "../config/config";

export default function Trend() {
  const { socket, isConnected } = useSocket();
  const [newTrade, setNewTrade] = useState<any>({});
  const [newRune, setNewRune] = useState<any>({});

  const displayBtc = (btcAmount: any) => {
    try {
      return (btcAmount / SATS_MULTIPLE).toFixed(8);
    } catch (error) {
      return btcAmount?.toFixed(8);
    }
  };

  const displayRune = (runeName: string) => {
    try {
      return runeName?.split(".")[0];
    } catch (error) {
      return "";
    }
  };

  const displayDate = (date: string) => {
    // Convert the date string to a moment object in the local timezone
    const localDate = moment.tz(date, moment.tz.guess());

    // Format the date as MM/DD/YY
    return localDate.format("MM/DD/YY");
  };

  useEffect(() => {
    if (isConnected && socket) {
      socket.emit("getTrend");

      socket.on("newPumpAction", (pumpData: any) => {
        setNewTrade(pumpData);
      });
      socket.on("newRuneToken", (newRuneToken: any) => {
        setNewRune(newRuneToken);
      });

      return () => {
        socket.off("newPumpAction");
        socket.off("newRuneToken");
      };
    }
  }, [socket, isConnected]);

  return (
    <div className="z-10 bg-bgColor-ghost p-2 border-b-2 border-bgColor-stroke w-full font-mono text-sm flex gap-1 flex-wrap justify-center sm:justify-start">
      {newTrade?.profileId && (
        <Bounce key={newTrade.key} delay={500} triggerOnce={true}>
          <div className="flex justify-start">
            <div className="flex justify-between items-center gap-1 bg-warning-800 p-3 rounded-xl">
              <Link
                href={`/profile/${encodeURIComponent(newTrade?.profileId)}`}
                className="text-warning"
              >
                {newTrade?.profileId?.slice(0, 6)}
              </Link>
              {newTrade?.type === 0 && (
                <div className="text-success">bought</div>
              )}
              {newTrade?.type === 1 && <div className="text-danger">sold</div>}
              {newTrade?.type === 2 && (
                <div className="text-danger">burned</div>
              )}
              <div className="text-warning">
                {newTrade?.type === 2 ? (
                  <div>{`${newTrade?.runeAmount}`}</div>
                ) : (
                  <div>{`${displayBtc(newTrade?.btcAmount)} BTC`}</div>
                )}
              </div>
              <div>of</div>
              <Link
                href={`/rune/${encodeURIComponent(newTrade?.runeId)}`}
                className="text-warning"
              >
                {displayRune(newTrade?.runeName)}
              </Link>
            </div>
          </div>
        </Bounce>
      )}
      {newRune?.profileId && (
        <Bounce key={newRune.key} delay={500} triggerOnce={true}>
          <div className="flex justify-start">
            <div className="flex justify-between items-center gap-1 bg-warning-900 p-3 rounded-xl">
              <Link
                href={`/profile/${encodeURIComponent(newRune?.profileId)}`}
                className="text-warning"
              >
                {newRune?.profileId?.slice(0, 6)}
              </Link>
              <div>created</div>
              <Link
                href={`/rune/${encodeURIComponent(newRune?.runeId)}`}
                className="text-warning"
              >
                {displayRune(newRune.runeName)}
              </Link>
              <div>on</div>
              <div className="text-warning">{displayDate(newRune.now)}</div>
            </div>
          </div>
        </Bounce>
      )}
    </div>
  );
}
