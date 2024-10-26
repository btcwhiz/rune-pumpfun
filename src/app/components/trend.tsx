"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import moment from "moment-timezone";
import { Bounce } from "react-awesome-reveal";

import useSocket from "../hooks/useSocket";
import { SATS_MULTIPLE } from "../config/config";

import Image from 'next/image';

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
    <div className="z-10 p-4 px-12 pb-0 border-b-0 border-bgColor-stroke w-full font-mono text-sm flex gap-3 flex items-center content-center">
      {newTrade?.profileId && (
        <Bounce key={newTrade.key} delay={500} triggerOnce={true} className="w-1/3">
          <div className="w-full flex justify-center w-30">
            <div className="flex gap-1 justify-between items-center gap-2 h-20 px-4 bg-[#EAEAEA] p-3 rounded-xl w-full">
              
            <div className="rounded-lg overflow-hidden">
            <Image
                src="/img/thog.png" // Update this path to your actual logo path
                alt="Runes Logo"
                width={32}
                height={32}
                className="w-8 h-8" // Adjust size as needed
              />
            </div> 
              
              <Link
                href={`/profile/${encodeURIComponent(newTrade?.profileId)}`}
                className="text-black"
              >
                {newTrade?.profileId?.slice(0, 6)}
              </Link>
              {newTrade?.type === 0 && (
                <div className="text-success">BOUGHT</div>
              )}
              {newTrade?.type === 1 && <div className="text-danger">sold</div>}
              {newTrade?.type === 2 && (
                <div className="text-danger">burned</div>
              )}
              <div className="text-black">
                {newTrade?.type === 2 ? (
                  <div>{`${newTrade?.runeAmount}`}</div>
                ) : (
                  <div>{`${displayBtc(newTrade?.btcAmount)} BTC`}</div>
                )}
              </div>
              <div>of</div>
              <Link
                href={`/rune/${encodeURIComponent(newTrade?.runeId)}`}
                className="text-black"
              >
                {displayRune(newTrade?.runeName)}
              </Link>
            </div>
          </div>
        </Bounce>
      )}
      {newRune?.profileId && (
        <Bounce key={newRune.key} delay={500} triggerOnce={true} className="w-1/3">
          <div className="w-full flex justify-center">
            <div className="flex gap-1 justify-between items-center gap-2 h-20 px-4 bg-[#EAEAEA] p-3 rounded-xl w-full">
              
            <div className="rounded-lg overflow-hidden">
            <Image
                src="/img/thog.png" // Update this path to your actual logo path
                alt="Runes Logo"
                width={32}
                height={32}
                className="w-8 h-8" // Adjust size as needed
              />
            </div> 
              <Link
                href={`/profile/${encodeURIComponent(newRune?.profileId)}`}
                className="text-black"
              >
                {newRune?.profileId?.slice(0, 6)}
              </Link>
              <div>CREATED</div>
              <Link
                href={`/rune/${encodeURIComponent(newRune?.runeId)}`}
                className="text-black"
              >
                {displayRune(newRune.runeName)}
              </Link>
              <div>on</div>
              <div className="text-black">{displayDate(newRune.now)}</div>
            </div>
          </div>
        </Bounce>
      )}
    </div>
  );
}
