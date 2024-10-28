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
  const [recentBlockHeight, setRecentBlockHeight] = useState<number>(0);
  const [selected, setSelected] = useState<string>("all");

  const getRunes = async () => {
    try {
      const latestBlock = await getCurrentBlock();
      setRecentBlockHeight(latestBlock.blockHeight);
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

  const RuneCard = ({ item, selected }: { item: any; selected: string }) => {
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
      if (resp.status) {
        const block_height = resp.block_height;
        let leftBlock = block_height + 5 - recentBlockHeight;
        leftBlock = leftBlock > 0 ? leftBlock : 0;
        setLeftBlocks(leftBlock);
        setRuneProcess(((5 - leftBlock) * 100) / 5);
      }
    };

    useEffect(() => {
      if (selected === "pending" && item.txId) getTxDetailsFunc();
      // eslint-disable-next-line
    }, [item, selected]);

    return (
<Card className="relative box-border flex flex-col p-3 gap-4 bg-[rgba(234,234,234,0.1)] rounded-lg border border-bgColor-stroke text-primary-50">
  <CardBody className="flex flex-col justify-between p-10">
    {selected === "pending" && (
      <div className="flex justify-between items-center gap-2 text-small">
        <span className="pl-2 flex gap-1">
          <span>{leftBlocks}</span>
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
      <div className="flex gap-2.5">
        <ImageDisplay
          src={item.image || item.imageString}
          className="w-[90px] h-[90px] rounded"
        />
        <div className="flex flex-col justify-between w-[220px] h-[77px]">
          <div>
            <span className="text-white text-xs">NAME:</span>
            <h3 className="text-white text-base font-bold">{item.runeName}</h3>
          </div>
          <div>
            <span className="text-white text-xs">ID: {item.runeId}</span>
          </div>
          <div className="flex items-center bg-[rgba(0,0,0,0.2)] rounded p-2.5 pl-0 h-[25px] gap-[5px] bg-transparent">
            <span className="text-white text-xs w-auto">{`${progress?.toFixed(2) || 0}%`}</span>
            <Progress
              size="sm"
              aria-label="Loading..."
              value={progress}
              className="max-w-[162px]"
              classNames={{
                base: "bg-[rgba(255,255,255,0.2)]",
                indicator: "bg-pink",
              }}
            />
          </div>
        </div>
      </div>

      <div className="rounded p-2 h-[auto] overflow-hidden">
        <p className="text-white text-xs leading-tight">
          {item.runeDescription}
        </p>
      </div>

      <div className="flex justify-between mt-0">
        <button className="bg-[#99E591] text-black text-[10px] rounded w-[96px] h-[35px]">
          Remain: {item.remainAmount}
        </button>
        <button className="bg-[#91DEE5] text-black text-[10px] rounded w-[96px] h-[35px]">
          Price: {(item.pool / item.remainAmount).toFixed(5)}
        </button>
        <button className="bg-[#E591DD] text-black text-[10px] rounded w-[96px] h-[35px]">
          Cap: {((item.runeAmount * (item.pool / item.remainAmount)) / SATS_MULTIPLE).toFixed(5)}
        </button>
      </div>

      <div className="flex justify-between mt-0 w-full gap-2">
        <button className="b-grey-100 border-1 rounded-4 text-white text-[10px] font-bold w-full h-[35px]">
          VIEW TOKEN
        </button>
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
              return (
                <RuneCard
                  key={index}
                  item={item}
                  selected={selected}
                ></RuneCard>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}
