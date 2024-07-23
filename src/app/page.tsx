"use client";

import { useContext, useEffect, useState } from "react";
import { Button, Input, Progress } from "@nextui-org/react";
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
import Link from "next/link";

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
              const progress =
                ((item.runeAmount - item.remainAmount) / item.runeAmount) * 100;
              return (
                <Card key={index}>
                  <CardBody className="flex flex-col">
                    <Link href={`/rune/${encodeURIComponent(item.runeId)}`}>
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
