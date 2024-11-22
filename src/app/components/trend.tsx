"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Bounce } from "react-awesome-reveal";

import useSocket from "../hooks/useSocket";
import { SATS_MULTIPLE } from "../config/config";

import Image from "next/image";
import { displayDate, displayRune } from "../utils/util";
import ImageDisplay from "./ImageDIsplay";

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
    <div className="z-10 p-1 w-full font-mono text-sm flex flex-col xl:flex-row gap-4 px-5 md:px-10 max-w-[1258px]">
      {newTrade?.profileId && (
        <Bounce
          key={newTrade.key}
          delay={500}
          triggerOnce={true}
          className="w-full xl:w-1/2"
        >
          <div className="w-full flex justify-center bg-[#ffffff] bg-[rgba(234,234,234,0.2)] rounded-xl">
            <div>
              <div className="flex items-center gap-4 sm:gap-8 h-20 p-3 w-full border-0 border-pink overflow-y-hidden overflow-x-auto">
                <Link
                  href={`/profile/${encodeURIComponent(newTrade?.profileId)}`}
                  className="text-white w-auto underline px-0 flex gap-4 items-center"
                >
                  <div className="rounded-lg flex items-center justify-center min-w-12 min-h-12">
                    <Image
                      src="/img/runes_logo.png"
                      draggable={false}
                      alt="Runes Logo"
                      width={48}
                      height={48}
                      className="min-w-12 min-h-12 sm:flex rounded-lg"
                    />
                  </div>
                  {newTrade?.profileId?.slice(0, 6)}
                </Link>

                <div className="w-auto border-black border-0 rounded-lg flex flex-col gap-0 items-center justify-around py-2 px-0 mx-0">
                  {newTrade?.type === 0 && (
                    <div className="w-auto text-white p-0 border-black border-0 rounded-lg">
                      Bought
                    </div>
                  )}
                  {newTrade?.type === 1 && (
                    <div className="text-danger w-auto px-0">Sold</div>
                  )}
                  {newTrade?.type === 2 && (
                    <div className="text-danger w-auto px-0">Burned</div>
                  )}
                </div>
                <div className="text-white w-auto">
                  {newTrade?.type === 2 ? (
                    <div className="text-white p-0 border-black border-0 rounded-lg w-auto px-0">{`${newTrade?.runeAmount}`}</div>
                  ) : (
                    <div className="text-white p-0 border-black border-0 rounded-lg w-auto px-0">{`${displayBtc(
                      newTrade?.btcAmount
                    )}`}</div>
                  )}
                </div>

                <div className="text-white w-auto p-4 px-0 hidden sm:flex">
                  of
                </div>

                <Link
                  href={`/rune/${encodeURIComponent(newTrade?.runeId)}`}
                  className="text-white w-auto p-4 border-black border-0 rounded-lg flex items-center px-0"
                >
                  <div className="rounded-lg flex items-center justify-center min-w-12 min-h-12 gap-4">
                    <ImageDisplay
                      src={newTrade.runeImage}
                      className="w-12 h-12"
                    ></ImageDisplay>
                    {displayRune(newTrade?.runeName)}
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </Bounce>
      )}
      {newRune?.profileId && (
        <Bounce
          key={newRune.key}
          delay={500}
          triggerOnce={true}
          className="w-full xl:w-1/2"
        >
          <div className="w-full flex justify-center bg-[rgba(234,234,234,0.1)] rounded-xl">
            <div>
              <div className="flex items-center h-20 p-3 rounded-xl w-full gap-2 sm:gap-8  overflow-y-hidden overflow-x-auto">
                <Link
                  href={`/profile/${encodeURIComponent(newRune?.profileId)}`}
                  className="text-white w-auto underline"
                >
                  <div className="rounded-lg flex items-center justify-center min-w-12 min-h-12 gap-4">
                    <Image
                      src="/img/runes_logo.png"
                      draggable={false}
                      alt="Runes Logo"
                      width={48}
                      height={48}
                      className="min-w-12 min-h-12 sm:flex rounded-lg"
                    />
                    {newRune?.profileId?.slice(0, 6)}
                  </div>
                </Link>
                <div>Created</div>
                <Link
                  href={`/rune/${encodeURIComponent(newRune?.runeId)}`}
                  className="text-white w-auto "
                >
                  <div className="rounded-lg flex items-center justify-center min-w-12 min-h-12 gap-4">
                    <ImageDisplay
                      src={newTrade.runeImage}
                      className="w-12 h-12"
                    ></ImageDisplay>
                    {displayRune(newRune.runeName)}
                  </div>
                </Link>
                <div>on</div>
                <div className="text-white w-auto">
                  {displayDate(newRune.now)}
                </div>
              </div>
            </div>
          </div>
        </Bounce>
      )}
    </div>
  );
}
