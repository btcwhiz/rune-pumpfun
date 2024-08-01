"use client";

import { useContext, useEffect, useState } from "react";
import { Button, Input, Progress, Spinner } from "@nextui-org/react";
import Link from "next/link";
import Image from "next/image";
import toast from "react-hot-toast";
import { Tabs, Tab, Card, CardBody } from "@nextui-org/react";
import {
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

  return (
    <main className="p-3 min-h-screen">
      <div className="flex flex-col gap-3">
        {/* --- Rune List --- */}
        <div className="flex flex-col gap-3 p-10">
          <div className="flex justify-center gap-5">
            <Link className="p-3 border rounded-xl" href={"/create"}>
              start a new coin
            </Link>
            <Link className="p-3 border rounded-xl" href={"/payment"}>
              payment
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <div>Runes</div>
            <Button onClick={() => getRunes()} color="primary">
              Reload
            </Button>
          </div>
          <div className="gap-3 grid grid-cols-3">
            {runes.map((item, index) => {
              let progress =
                ((item.runeAmount - item.remainAmount) / item.runeAmount) * 100;
              if (item.poolstate === 1) progress = 100;
              return (
                <Card
                  key={index}
                  className="border-primary-50 bg-dark border text-primary-50"
                >
                  <CardBody
                    className={`${
                      item.runeId ? "" : "bg-gray-500"
                    } flex flex-col justify-end`}
                  >
                    <Link
                      href={`${
                        item.runeId
                          ? `/rune/${encodeURIComponent(item.runeId)}`
                          : `#`
                      }`}
                      className="flex flex-col gap-3"
                    >
                      {!item.runeId && (
                        <div className="flex flex-col justify-center gap-3 text-2xl">
                          <div className="flex justify-center font-bold">
                            Pending
                          </div>
                          <Spinner></Spinner>
                        </div>
                      )}
                      <div>
                        <ImageDisplay src={item.image[0]}></ImageDisplay>
                      </div>
                      {item.poolstate === 1 && <div>Closed</div>}
                      <div className="flex justify-between items-center gap-2">
                        <span>Rune ID</span>
                        <span>{item.runeId}</span>
                      </div>
                      <div className="flex justify-between items-center gap-2">
                        <span>Rune Symbol</span>
                        <span>{item.runeSymbol}</span>
                      </div>
                      <div className="flex justify-between items-center gap-2">
                        <span>Rune Name</span>
                        <span>{item.runeName}</span>
                      </div>
                      <div className="flex justify-between items-center gap-2">
                        <span>Rune Description</span>
                        <span>{item.runeDescription}</span>
                      </div>
                      <div className="flex justify-between items-center gap-2">
                        <span>Remain Amount</span>
                        <span>{item.remainAmount}</span>
                      </div>
                      <div className="flex justify-between items-center gap-2">
                        <span>Price</span>
                        <span>{`${item.pool / item.remainAmount} sats`}</span>
                      </div>
                      <div className="flex justify-between items-center gap-2">
                        <span>Marketcap</span>
                        <span>{`${
                          (item.runeAmount * (item.pool / item.remainAmount)) /
                          SATS_MULTIPLE
                        } BTC`}</span>
                      </div>
                      <div className="flex justify-between items-center gap-2">
                        <span>BTC collected</span>
                        <span>{`${
                          (item.pool - DEFAULT_POOL) / SATS_MULTIPLE
                        } BTC`}</span>
                      </div>
                      <div className="flex justify-between items-center gap-2">
                        <span>{`${progress}%`}</span>
                        <Progress
                          size="md"
                          aria-label="Loading..."
                          value={progress}
                          className="max-w-md"
                        />
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
