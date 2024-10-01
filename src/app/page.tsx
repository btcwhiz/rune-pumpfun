"use client";

import { useContext, useEffect, useState } from "react";
import { Button, Input, Progress, Spinner } from "@nextui-org/react";
import Link from "next/link";
import Image from "next/image";
import toast from "react-hot-toast";
import { Tabs, Tab, Card, CardBody } from "@nextui-org/react";
import {
  checkUser,
  getPumpActionFunc,
  getRuneFunc,
  pumpBuyFunc,
  pumpPreBuyFunc,
  pumpPreSellFunc,
  pumpSellFunc,
} from "./api/requests";
import { MainContext } from "./contexts/MainContext";
import ImageDisplay from "./components/ImageDIsplay";
import { DEFAULT_POOL, SATS_MULTIPLE } from "./config/config";
import { calcProgress } from "./utils/util";
import { TfiReload } from "react-icons/tfi";

export default function Home() {
  const { userInfo } = useContext(MainContext);

  const [runes, setRunes] = useState<any[]>([]);

  const getRunes = async () => {
    let runeRes: any = await getRuneFunc();
    setRunes(runeRes.runes);
  };

  useEffect(() => {
    getRunes();
    // eslint-disable-next-line
  }, []);

  // const handleCheckUser = async (userId: string) => {
  //   const res = await checkUser(userId);
  //   console.log("res :>> ", res);
  // };

  // useEffect(() => {
  //   if (userInfo.userId) {
  //     console.log("userInfo :>> ", userInfo);
  //     handleCheckUser(userInfo.userId);
  //   }
  // }, [userInfo]);

  return (
    <main className="p-3 min-h-screen">
      <div className="flex flex-col gap-3">
        {/* --- Rune List --- */}
        <div className="flex flex-col gap-3 md:px-10 p-2">
          <div className="flex items-center gap-3">
            <div>Runes</div>
            <Button
              color="warning"
              onClick={() => getRunes()}
              className="rounded-full text-white"
              isIconOnly
              variant="flat"
            >
              <TfiReload />
            </Button>
          </div>
          <div className="gap-3 grid grid-cols-1 md:grid-cols-3">
            {runes.map((item, index) => {
              // let runeAmount = Math.round(item.runeAmount * 0.8);
              const progress = calcProgress(
                item.remainAmount,
                item.runeAmount,
                item.poolstate
              );
              return (
                <Card
                  key={index}
                  className="relative bg-bgColor-ghost border border-bgColor-stroke text-primary-50"
                >
                  <CardBody
                    className={`${
                      item.runeId ? "" : "bg-gray-500"
                    } flex flex-col justify-around`}
                  >
                    {!item.runeId && (
                      <div className="flex flex-col justify-center gap-3 text-2xl">
                        <div className="flex justify-center font-bold">
                          Pending
                        </div>
                        <Spinner></Spinner>
                      </div>
                    )}
                    <Link
                      href={`${
                        item.runeId
                          ? `/rune/${encodeURIComponent(item.runeId)}`
                          : `#`
                      }`}
                      className="flex flex-col gap-3"
                    >
                      <div className="flex justify-between items-center gap-2 text-small">
                        <span className="pl-2">{`${
                          progress?.toFixed(4) || 0
                        }%`}</span>
                        <Progress
                          size="md"
                          aria-label="Loading..."
                          value={progress}
                          className="max-w-md"
                          color="warning"
                        />
                      </div>
                      <div className="flex gap-3">
                        <div>
                          <ImageDisplay
                            src={item.image[0]}
                            className="w-32"
                          ></ImageDisplay>
                        </div>
                        <div className="flex w-full">
                          <div className="flex flex-col gap-1 w-full">
                            {item.poolstate === 1 && (
                              <div className="top-1/2 left-1/2 absolute font-Hadenut text-4xl text-warning -translate-x-1/2 -translate-y-1/2 -rotate-[17deg]">
                                Closed!
                              </div>
                            )}
                            <div className="flex justify-between items-center gap-2 text-small">
                              <span className="text-bgColor-stroke2 text-xs">ID</span>
                              <span>{item.runeId}</span>
                            </div>
                            {/* <div className="flex justify-between items-center gap-2 text-small">
                              <span className="text-bgColor-stroke2 text-xs">Symbol</span>
                              <span>{item.runeSymbol}</span>
                            </div> */}
                            <div className="flex flex-wrap justify-between items-center gap-2 text-small">
                              <span className="text-bgColor-stroke2 text-xs">Name</span>
                              <span>{item.runeName}</span>
                            </div>
                            <div className="flex flex-wrap justify-between items-center gap-2 text-small">
                              <span className="text-bgColor-stroke2 text-xs">
                                Description
                              </span>
                              <span>{item.runeDescription}</span>
                            </div>
                            <div className="flex justify-between items-center gap-2 text-small">
                              <span className="text-bgColor-stroke2 text-xs">
                                Remain Amount
                              </span>
                              <span>{item.remainAmount}</span>
                            </div>
                            <div className="flex justify-between items-center gap-2 text-small">
                              <span className="text-bgColor-stroke2 text-xs">Price</span>
                              <span>{`${(item.pool / item.remainAmount).toFixed(
                                5
                              )} sats`}</span>
                            </div>
                            <div className="flex justify-between items-center gap-2 text-small">
                              <span className="text-bgColor-stroke2 text-xs">
                                Marketcap
                              </span>
                              <span className="text-warning">
                                {`${(
                                  (item.runeAmount *
                                    (item.pool / item.remainAmount)) /
                                  SATS_MULTIPLE
                                ).toFixed(5)} BTC`}
                              </span>
                            </div>
                            {/* <div className="flex justify-between items-center gap-2 text-small">
                              <span className="text-bgColor-stroke2 text-xs">
                                BTC collected
                              </span>
                              <span>{`${(
                                (item.pool - DEFAULT_POOL) /
                                SATS_MULTIPLE
                              ).toFixed(5)} BTC`}</span>
                            </div> */}
                          </div>
                        </div>
                      </div>
                    </Link>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}
