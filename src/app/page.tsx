"use client";

import { useEffect, useState } from "react";
import { Button, Input, Progress, Spinner, Tab, Tabs } from "@nextui-org/react";
import Link from "next/link";
import { Card, CardBody } from "@nextui-org/react";
import { getCurrentBlock, getRuneFunc, getTxDetails } from "./api/requests";
import ImageDisplay from "./components/ImageDIsplay";
import { SATS_MULTIPLE } from "./config/config";
import { calcProgress } from "./utils/util";
import { TfiReload } from "react-icons/tfi";
import { SearchIcon } from "./components/icons/SearchIcon";

export default function Home() {
  const [runes, setRunes] = useState<any[]>([]);
  const [waitingRunes, setWaitingRunes] = useState<any[]>([]);
  const [pendingRunes, setPendingRunes] = useState<any[]>([]);
  const [filteredRunes, setFilteredRunes] = useState<any[]>([]);
  const [searchKey, setSearchKey] = useState<string>("");
  const [selected, setSelected] = useState<string>("all");

  const getRunes = async () => {
    try {
      let runeRes: any = await getRuneFunc();
      if (runeRes) {
        setSearchKey("");
        const etchedRunes = runeRes.runes.filter(
          (item: any) => item.runeId !== ""
        );
        const pendingRunes = runeRes.runes.filter(
          (item: any) => item.runeId === ""
        );
        setRunes(etchedRunes);
        setPendingRunes(pendingRunes);
        setWaitingRunes(runeRes.waitingRunes);
        if (selected === "pending") {
          setFilteredRunes(pendingRunes);
        } else if (selected === "waiting") {
          setFilteredRunes(runeRes.waitingRunes);
        } else {
          setFilteredRunes(etchedRunes);
        }
      }
    } catch (error) {
      console.log("error :>> ", error);
    }
  };

  useEffect(() => {
    getRunes();
    // eslint-disable-next-line
  }, []);

  const searchRune = (key: string) => {
    key = key.toLowerCase();
    return runes.filter((item: any) => {
      if (
        item.creatorAddress.toLowerCase().indexOf(key) !== -1 ||
        item.runeId.toLowerCase().indexOf(key) !== -1 ||
        item.runeDescription.toLowerCase().indexOf(key) !== -1 ||
        item.runeName.toLowerCase().indexOf(key) !== -1 ||
        item.runeSymbol.toLowerCase().indexOf(key) !== -1
      ) {
        return item;
      }
    });
  };

  const searchPendingRune = (key: string) => {
    key = key.toLowerCase();
    return pendingRunes.filter((item: any) => {
      if (
        item.address.toLowerCase().indexOf(key) !== -1 ||
        item.runeDescription.toLowerCase().indexOf(key) !== -1 ||
        item.runeName.toLowerCase().indexOf(key) !== -1 ||
        item.runeSymbol.toLowerCase().indexOf(key) !== -1
      ) {
        return item;
      }
    });
  };

  const searchWaitingRune = (key: string) => {
    key = key.toLowerCase();
    return waitingRunes.filter((item: any) => {
      if (
        item.address.toLowerCase().indexOf(key) !== -1 ||
        item.runeDescription.toLowerCase().indexOf(key) !== -1 ||
        item.runeName.toLowerCase().indexOf(key) !== -1 ||
        item.runeSymbol.toLowerCase().indexOf(key) !== -1
      ) {
        return item;
      }
    });
  };

  const handleSearchKeyChange = (key: string) => {
    setSearchKey(key);
    if (selected === "pending") {
      if (key === "") {
        setFilteredRunes(pendingRunes);
      } else {
        setFilteredRunes(searchPendingRune(key));
      }
    } else if (selected === "waiting") {
      if (key === "") {
        setFilteredRunes(waitingRunes);
      } else {
        setFilteredRunes(searchWaitingRune(key));
      }
    } else {
      if (key === "") {
        setFilteredRunes(runes);
      } else {
        setFilteredRunes(searchRune(key));
      }
    }
  };

  const handleTabChange = (tab: string) => {
    setSelected(tab);
    if (tab === "pending") {
      if (searchKey === "") {
        setFilteredRunes(pendingRunes);
      } else {
        setFilteredRunes(searchPendingRune(searchKey));
      }
    } else if (tab == "waiting") {
      if (searchKey === "") {
        setFilteredRunes(waitingRunes);
      } else {
        setFilteredRunes(searchWaitingRune(searchKey));
      }
    } else {
      if (searchKey === "") {
        setFilteredRunes(runes);
      } else {
        setFilteredRunes(searchRune(searchKey));
      }
    }
  };

  const RuneCard = ({ item }: { item: any }) => {
    const [runeProcess, setRuneProcess] = useState<number>(0);
    const [leftBlocks, setLeftBlocks] = useState<number>(0);
    // let runeAmount = Math.round(item.runeAmount * 0.8);
    const progress = calcProgress(
      item.remainAmount,
      item.runeAmount,
      item.poolstate
    );

    const getTxDetailsFunc = async () => {
      const resp = await getTxDetails(item.txId);
      const latestBlock = await getCurrentBlock();
      if (resp.status) {
        const runeBlock = resp.txDetails?.block_height;
        const currentBlock = latestBlock.blockHeight;
        console.log("runeBlock, currentBlock :>> ", runeBlock, currentBlock);

        setLeftBlocks(
          runeBlock + 6 - currentBlock > 0 ? runeBlock + 6 - currentBlock : 0
        );
        setRuneProcess((runeBlock + 6 - currentBlock || 0) / 6);
      }
    };

    useEffect(() => {
      getTxDetailsFunc();
      // eslint-disable-next-line
    }, []);

    return (
      <Card className="relative bg-bgColor-ghost border border-bgColor-stroke text-primary-50">
        <CardBody
          className={`${
            item.runeId ? "#" : "bg-gray-500"
          } flex flex-col justify-around`}
        >
          {selected === "pending" && (
            <div className="flex justify-between items-center gap-2 text-small">
              <span className="pl-2 flex gap-1">
                <span>{leftBlocks || 0}</span>
                <span>blocks</span>
                <span>left</span>
              </span>
              <Progress
                size="md"
                aria-label="Loading..."
                value={runeProcess}
                className="max-w-md"
                color="warning"
              />
            </div>
          )}
          <Link
            href={`${
              item.runeId ? `/rune/${encodeURIComponent(item.runeId)}` : `#`
            }`}
            className="flex flex-col gap-3"
          >
            {selected === "all" && (
              <div className="flex justify-between items-center gap-2 text-small">
                <span className="pl-2">{`${progress?.toFixed(4) || 0}%`}</span>
                <Progress
                  size="md"
                  aria-label="Loading..."
                  value={progress}
                  className="max-w-md"
                  color="warning"
                />
              </div>
            )}
            <div className="flex gap-3">
              <div>
                <ImageDisplay
                  src={item.image || item.imageString}
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
                  {!item.runeId && (
                    <div className="top-1/2 left-1/2 absolute font-Hadenut text-4xl text-danger -translate-x-1/2 -translate-y-1/2 -rotate-[17deg]">
                      <div className="flex justify-center font-bold gap-2">
                        <span>
                          {selected === "waiting" ? "Waiting" : "Pending"}
                        </span>{" "}
                        <Spinner color="danger"></Spinner>
                      </div>
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
                        (item.runeAmount * (item.pool / item.remainAmount)) /
                        SATS_MULTIPLE
                      ).toFixed(5)} BTC`}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </CardBody>
      </Card>
    );
  };

  return (
    <main className="p-2 min-h-screen">
      <div className="flex flex-col gap-3">
        {/* --- Rune List --- */}
        <div className="flex flex-col gap-3 md:px-10 p-2">
          <div className="flex justify-center md:justify-between items-center flex-col gap-2 sm:flex-row">
            <div className="flex items-center flex-wrap gap-3 justify-center sm:justify-normal">
              <Tabs
                aria-label="Options"
                color="warning"
                variant="underlined"
                selectedKey={selected}
                onSelectionChange={(tab) => handleTabChange(tab as string)}
              >
                <Tab key="all" title="Runes"></Tab>
                <Tab key="pending" title="Pending"></Tab>
                <Tab key="waiting" title="Waiting"></Tab>
              </Tabs>
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
            <Input
              label="Search"
              color="warning"
              // isClearable
              radius="lg"
              value={searchKey}
              onChange={(e) => handleSearchKeyChange(e.target.value as string)}
              className="w-60"
              classNames={{
                label: "text-black/50 dark:text-white/90",
                input: [
                  "bg-bgColor-dark",
                  "hover:border-warning",
                  "!placeholder:text-placeHolder",
                ],
                innerWrapper: "bg-transparent",
                inputWrapper: [
                  "!bg-bgColor-dark",
                  "!hover:bg-bgColor-stroke",
                  "border-2",
                  "border-bgColor-stroke",
                  "hover:border-bgColor-stroke",
                ],
              }}
              placeholder="Type to search..."
              startContent={
                <SearchIcon className="text-black/50 mb-0.5 dark:text-white/90 text-slate-400 pointer-events-none flex-shrink-0" />
              }
            />
          </div>
          <div>
            {selected === "all" && <div>Etched Runes</div>}
            {selected === "pending" && <div>Pending Runes</div>}
            {selected === "waiting" && (
              <div>Waiting Runes To Transfer BTC For Etching Runes</div>
            )}
          </div>
          <div className="gap-3 grid grid-cols-1 md:grid-cols-3">
            {filteredRunes.map((item, index) => {
              return <RuneCard key={index} item={item}></RuneCard>;
            })}
          </div>
        </div>
      </div>
    </main>
  );
}
