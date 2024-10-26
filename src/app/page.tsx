"use client";

import { useEffect, useState } from "react";
import { Button, Input, Progress, Spinner, Tab, Tabs } from "@nextui-org/react";
import Link from "next/link";
import { Card, CardBody } from "@nextui-org/react";
import { getRuneFunc } from "./api/requests";
import ImageDisplay from "./components/ImageDIsplay";
import { SATS_MULTIPLE } from "./config/config";
import { calcProgress } from "./utils/util";
import { TfiReload } from "react-icons/tfi";
import { SearchIcon } from "./components/icons/SearchIcon";

export default function Home() {
  const [runes, setRunes] = useState<any[]>([]);
  const [pendingRunes, setPendingRunes] = useState<any[]>([]);
  const [filteredRunes, setFilteredRunes] = useState<any[]>([]);
  const [searchKey, setSearchKey] = useState<string>("");
  const [selected, setSelected] = useState<string>("all");

  const getRunes = async () => {
    let runeRes: any = await getRuneFunc();
    if (runeRes) {
      setSearchKey("");
      setRunes(runeRes.runes);
      if (selected === "pending") {
        setFilteredRunes(runeRes.waitingRunes);
      } else {
        setFilteredRunes(runeRes.runes);
      }
      setPendingRunes(runeRes.waitingRunes);
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

  const handleSearchKeyChange = (key: string) => {
    setSearchKey(key);
    if (selected === "pending") {
      if (key === "") {
        setFilteredRunes(pendingRunes);
      } else {
        setFilteredRunes(searchPendingRune(key));
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
    } else {
      if (searchKey === "") {
        setFilteredRunes(runes);
      } else {
        setFilteredRunes(searchRune(searchKey));
      }
    }
  };

  return (
    <main className="p-3 min-h-screen">
      <div className="flex flex-col gap-12">
        {/* --- Rune List --- */}
        <div className="flex flex-col gap-3 md:px-10 p-2 w-full">
          <div className="flex justify-between items-center flex-col gap-[32px] sm:flex-row w-full">
          <div className="box-border flex flex-row items-start p-3 gap-4 w-[415px] h-[59px] bg-[rgba(234,234,234,0.1)] rounded-lg order-2 flex-grow-0 width-full">
          <Input
          label=""
          value={searchKey}
          onChange={(e) => handleSearchKeyChange(e.target.value as string)}
          className="w-full h-[35px] bg-[rgba(234,234,234,0.2)] rounded-md flex-grow-0 z-0"
          classNames={{
            base: "max-w-full",
            mainWrapper: "h-full",
            input: "text-[#EAEAEA] font-arial font-normal text-base leading-[17px] tracking-[-0.32px]",
            inputWrapper: "h-full bg-transparent hover:bg-transparent",
          }}
          startContent={
            <div className="flex items-center gap-2.5 mb-2">
              <SearchIcon className="w-[18px] h-[18px] text-[#EAEAEA]" />
              <span className="text-[#EAEAEA] font-arial font-normal text-base leading-[17px] tracking-[-0.32px]">
                Search
              </span>
            </div>
            }
        />
        </div>
          
          <div className="flex items-center gap-3">
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
  }}
>
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
</Tabs>
              <Button
                // color="white"
                onClick={() => getRunes()}
                className="rounded-full text-white"
                isIconOnly
                variant="flat"
              >
                <TfiReload />
              </Button>
            </div>
          </div>

        
          
          <div className="gap-8 flex flex-row flex-wrap justify-center">
            {filteredRunes.map((item, index) => {
              // let runeAmount = Math.round(item.runeAmount * 0.8);
              const progress = calcProgress(
                item.remainAmount,
                item.runeAmount,
                item.poolstate
              );
              return (
<Card
  key={index}
  className="box-border flex flex-col p-3 gap-4 bg-[rgba(234,234,234,0.1)] rounded-lg"
>
  <CardBody className="flex flex-col justify-between p-10 ">
    <Link
      href={`${item.runeId ? `/rune/${encodeURIComponent(item.runeId)}` : `#`}`}
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
        <button className="bg-[#99E591] text-black text-[10px]  rounded w-[96px] h-[35px]">
          Remain: {item.remainAmount}
        </button>
        <button className="bg-[#91DEE5] text-black text-[10px]  rounded w-[96px] h-[35px]">
          Price: {(item.pool / item.remainAmount).toFixed(5)}
        </button>
        <button className="bg-[#E591DD] text-black text-[10px]  rounded w-[96px] h-[35px]">
          Cap: {((item.runeAmount * (item.pool / item.remainAmount)) / SATS_MULTIPLE).toFixed(5)}
        </button>
      </div>

      {/* <button className="bg-[rgba(0,0,0,0.5)]  text-white text-[10px] font-bold rounded w-[96px] h-[35px] w-full">
  VISIT WEBSITE
</button> */}

      <div className="flex justify-between mt-0 w-full gap-2">
      <button className="b-grey-100 border-1 rounded-4 text-white text-[10px] font-bold rounded w-[96px] h-[35px] w-full" key={index}>
  VIEW TOKEN
</button>


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
