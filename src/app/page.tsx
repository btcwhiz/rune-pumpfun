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
import News from "./components/News";

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
  <CardBody className="flex flex-col justify-between p-5">
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
          className="max-w-md bg-pink color-pink text-pink"
          // color="warning"
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
        <p className="text-xs leading-tight">
          {item.runeDescription}
        </p>
      </div>

      <div className="flex justify-between mt-0 gap-2"> 
        <button className="bg-[#99E591] text-[#000000] leading-[1.1] text-[10px] rounded w-[96px] h-[35px]">
          Remain: {item.remainAmount}
        </button>
        <button className="bg-[#91DEE5] text-[#000000] text-[10px] leading-[1.1] rounded w-[96px] h-[35px]">
          Price: {(item.pool / item.remainAmount).toFixed(5)}
        </button>
        <button className="bg-[#E591DD] text-[#000000] leading-[1.1] text-[10px] rounded w-[96px] h-[35px]">
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
    <main className="p-3 pt-0 min-h-screen">
      <div className="flex flex-col sm:gap-12 gap-0">
        <News />
        {/* --- Rune List --- */}
        <div className="flex flex-col gap-3 md:px-10 p-2">
          <div className="flex justify-center md:justify-between items-center flex-col gap-6 sm:flex-row">
            <div className="flex items-center flex-wrap gap-8 justify-center sm:justify-normal">
              <Tabs
            aria-label="Options"
            variant="underlined"
            selectedKey={selected}
            onSelectionChange={(tab) => handleTabChange(tab as string)}
            classNames={{
              tabList: "gap-6 w-full relative rounded-none p-0 border-b border-bgColor-stroke",
              cursor: "w-full bg-pink",
              tab: "max-w-fit px-0 h-12",
              tabContent: "group-data-[selected=true]:text-white"
            }}>
  <Tab 
    key="all" 
    title={
      <span className="group-data-[selected=true]:text-white">Runes</span>
    }
  />
  <Tab 
    key="pending" 
    title={
      <span className="group-data-[selected=true]:text-white">Pending Runes</span>
    }
  />
                <Tab key="waiting" title="Waiting"></Tab>
              </Tabs>
              <Button
                // color="warning"
                onClick={() => getRunes()}
                className="rounded-full text-pink"
                isIconOnly
                variant="flat"
              >
                <TfiReload />
              </Button>
            </div>
            <Input
              // label="Search"
              // color="warning"
              // isClearable
              radius="lg"
              value={searchKey}
              onChange={(e) => handleSearchKeyChange(e.target.value as string)}
              className="w-full min-w-[300px] max-w-[600px] h-[50px] bg-[rgba(234,234,234,0.2)] rounded-md flex-grow-0 z-0"
              classNames={{
                base: "max-w-full",
                mainWrapper: "h-full",
                input: "text-[#EAEAEA] font-arial font-normal text-base leading-[17px] tracking-[-0.32px]",
                inputWrapper: "h-full bg-transparent hover:bg-black",
              }}

              startContent={
                <div className="flex items-center gap-2.5 mb-0">
                <SearchIcon className="w-[18px] h-[18px] text-[#EAEAEA]" />
                <span className="text-[#EAEAEA] font-arial font-normal text-base leading-[17px] tracking-[-0.32px]">
                  Search
                </span>
              </div>
             
              }
            />
          </div>
          <div>
            {selected === "all" && <div className="text-center sm:text-left mt-4">Etched Runes</div>}
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
