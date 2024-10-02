"use client";

import React, { useContext, useEffect, useState } from "react";
import {
  Input,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  useDisclosure,
  RadioGroup,
  Radio,
  Image,
  Accordion,
  AccordionItem,
  Listbox,
  Avatar,
  ListboxItem,
} from "@nextui-org/react";
import toast from "react-hot-toast";
import { FaChevronDown } from "react-icons/fa";
import { FaPlus } from "react-icons/fa6";
import { IoSwapVerticalSharp } from "react-icons/io5";

import ImageDisplay from "../components/ImageDIsplay";
import { BTCImg, ImgStr } from "../config/config";
import { getAllPools, getLiquidity } from "../api/swap";
import AvatarDisplay from "../components/AvatarDisplay";
import { preAddLiquidity, addLiquidity } from "../api/requests";
import { MainContext } from "../contexts/MainContext";
import useSocket from "../hooks/useSocket";
import { unisatSignPsbt } from "../utils/pump";
import { ListboxWrapper } from "../swap/ListboxWrapper";
import { IoMdCloseCircle } from "react-icons/io";
import Link from "next/link";
import { displayBtc } from "../utils/util";
import PumpInput from "../components/PumpInput";

export default function Page() {
  const { socket, isConnected } = useSocket();
  const { userInfo } = useContext(MainContext);
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  const itemClasses = {
    base: "py-0 w-full",
    title: "text-white",
    // trigger:
    //   "px-2 py-0 data-[hover=true]:bg-default-100 rounded-lg h-14 flex items-center",
    // indicator: "text-medium",
    // content: "text-small px-2",
  };

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [baseAmount, setBaseAmount] = useState<string>("");
  const [poolId, setPoolId] = useState<string>("");
  const [targetAmount, setTargetAmount] = useState<string>("");
  const [slippage, setSlippage] = useState<number>(3);
  const [liquidities, setLiquidities] = useState<any[]>([]);
  const [pools, setPools] = useState<any[]>([]);
  const [direction, setDirection] = useState<Boolean>(true);

  const [baseToken, setBaseToken] = useState<any>({
    runeId: "btc",
    runeName: "BTC",
    image: BTCImg,
  });

  const [targetToken, setTargetToken] = useState<any>({
    runeId: "2869809:2877",
    runeName: "THE.THOG.IS.BEST",
    image: ImgStr,
  });

  const handleAddLiquidity = async () => {
    try {
      if (!userInfo.userId) {
        return toast.error("Please connect your wallet");
      }
      if (!poolId) {
        return toast.error("Pool ID is invalid");
      }
      setIsLoading(true);
      const { success, pendingLiquidityId, feeId, psbtHex } =
        await preAddLiquidity(
          userInfo.userId,
          poolId,
          baseToken.runeId,
          baseAmount,
          targetToken.runeId,
          targetAmount
        );
      // console.log(
      //   "success, pendingSwapId, feeId, psbtHex :>> ",
      //   success,
      //   pendingLiquidityId,
      //   feeId,
      //   psbtHex
      // );
      if (success === true) {
        // console.log("psbtHex, pendingSwapId :>> ", psbtHex, pendingLiquidityId);
        const signedPsbt = await (window as any).unisat.signPsbt(psbtHex);
        // const signedPsbt = await unisatSignPsbt(psbtHex);
        // console.log("signedPsbt :>> ", signedPsbt);
        const { success } = await addLiquidity(
          pendingLiquidityId,
          feeId,
          signedPsbt
        );
        if (success) toast.success("Success, please wait while tx confirming");
      }
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
    }
  };

  const handleChangeToken = () => {
    setDirection(!direction);
    setBaseToken(targetToken);
    setBaseAmount(targetAmount);
    setTargetToken(baseToken);
    setTargetAmount(baseAmount);
  };

  const handleInputBaseAmount = async (amount: any) => {
    if (socket && isConnected) {
      if (direction === true) {
        socket.emit("predict-pool-rune", { poolId, amount });
      } else {
        socket.emit("predict-pool-btc", { poolId, amount });
      }
    }
    setBaseAmount(amount);
  };

  const getData = async () => {
    const res = await getAllPools();
    setPools(res);
    if (res.length > 0) {
      if (direction === true) {
        setTargetToken(res[0]);
      } else {
        setBaseToken(res[0]);
      }
      setPoolId(res[0].poolId);
    }
  };

  useEffect(() => {
    getData();
  }, []);

  const getLiquidityData = async () => {
    const resp = await getLiquidity(userInfo.userId);
    setLiquidities(resp.liquidities);
  };

  useEffect(() => {
    userInfo.userId && getLiquidityData();
  }, [userInfo]);

  useEffect(() => {
    if (socket && isConnected) {
      socket.on("estimate-pool", (target: any) => {
        setTargetAmount(target.predictAmount);
      });
      return () => {
        socket.off("estimate-pool");
      };
    }
  }, [poolId, socket, isConnected]);

  return (
    <div className="flex flex-col gap-2 p-3 md:pt-20">
      <div className="flex justify-center">
        <div className="flex flex-col gap-3 border-2 bg-bgColor-ghost py-10 p-3 border-bgColor-stroke rounded-xl w-1/2">
          <div className="py-3 font-bold text-2xl text-center">
            Add Liquidity
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2 bg-bgColor-dark p-2 rounded-xl">
              <div className="pl-3">From</div>
              <div className="flex items-center gap-3 p-2">
                <PumpInput
                  type="number"
                  value={baseAmount}
                  onChange={handleInputBaseAmount}
                ></PumpInput>
                <Button
                  className="flex justify-between gap-1 p-2 rounded-xl w-44"
                  variant="flat"
                  color="warning"
                  onPress={() => {
                    direction !== true && onOpen();
                  }}
                >
                  <div className="flex items-center gap-1">
                    <ImageDisplay
                      src={baseToken.image}
                      className="w-6 h-6"
                    ></ImageDisplay>
                    <span>
                      {baseToken.runeName.length > 7
                        ? `${baseToken.runeName.slice(0, 7)}.`
                        : baseToken.runeName}
                    </span>
                  </div>
                  <div>
                    <FaChevronDown />
                  </div>
                </Button>
              </div>
            </div>
            <div className="flex justify-center">
              <Button
                isIconOnly
                color="warning"
                className="text-white"
                onPress={() => handleChangeToken()}
              >
                <IoSwapVerticalSharp />
              </Button>
            </div>
            <div className="flex flex-col gap-2 bg-bgColor-dark p-2 rounded-xl">
              <div className="pl-3">To</div>
              <div className="flex items-center gap-3 p-2 rounded-xl">
                <PumpInput
                  type="number"
                  value={targetAmount}
                  disabled={true}
                ></PumpInput>
                <Button
                  className="flex items-center gap-1 p-2 rounded-xl w-44"
                  variant="flat"
                  color="warning"
                  onPress={() => {
                    direction === true && onOpen();
                  }}
                >
                  <div className="flex items-center gap-1">
                    <ImageDisplay
                      src={targetToken.image}
                      className="w-6 h-6"
                    ></ImageDisplay>
                    <span>
                      {targetToken.runeName.length > 7
                        ? `${targetToken.runeName.slice(0, 7)}.`
                        : targetToken.runeName}
                    </span>
                  </div>
                  <div>
                    <FaChevronDown />
                  </div>
                </Button>
              </div>
            </div>
            <div className="flex justify-center">
              <Button
                color="warning"
                className="w-44 text-white"
                onClick={() => handleAddLiquidity()}
                isLoading={isLoading}
              >
                Confirm
              </Button>
            </div>
          </div>
        </div>
      </div>
      <div className="gap-2 grid grid-cols-2 px-5 md:pt-10">
        <div className="border-2 bg-bgColor-ghost p-2 border-bgColor-stroke rounded-xl">
          <div className="py-3 font-bold text-center text-lg">My Pools</div>
          <div>
            <div className="grid grid-cols-4 text-center">
              <div>BTC</div>
              <div>Rune ID</div>
              <div>Rune</div>
              <div>Action</div>
            </div>
          </div>
          <div>
            <div className="gap-2 grid">
              {liquidities
                .filter((item) => item.status === 1)
                .map((item, index) => (
                  <div
                    key={index}
                    className="items-center grid grid-cols-4 text-center"
                  >
                    <div>{displayBtc(item.btcAmount)}</div>
                    <div>{item.runeId}</div>
                    <div>{item.runeAmount}</div>
                    <div>
                      <Button isIconOnly color="primary" className="text-2xl">
                        <IoMdCloseCircle />
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>

        <div className="border-2 bg-bgColor-ghost p-2 border-bgColor-stroke rounded-xl">
          <div className="py-3 font-bold text-center text-lg">
            Liquidity Txs
          </div>
          <div>
            <div className="grid grid-cols-5 text-center">
              <div>BTC</div>
              <div>Name</div>
              <div>Rune</div>
              <div>Tx ID</div>
              <div>Status</div>
            </div>
          </div>
          <div>
            <div className="gap-2 grid">
              {liquidities.map((item, index) => (
                <div
                  key={index}
                  className="items-center grid grid-cols-5 text-center"
                >
                  <div>{displayBtc(item.btcAmount)}</div>
                  <div title={item.runeName}>{`${
                    item.runeName ? `${item.runeName.slice(0, 10)}...` : ``
                  }`}</div>
                  <div>{item.runeAmount}</div>
                  <div>
                    <Link
                      href={`https://mempool.space/testnet/tx/${item.txId}`}
                      target="_blink"
                      className="underline"
                    >
                      {item.txId && `${item.txId.slice(0, 5)}...`}
                    </Link>
                  </div>
                  <div>
                    {item.status === 0 ? "Pending" : ""}
                    {item.status === 1 ? "Success" : ""}
                    {item.status === 2 ? "Failed" : ""}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={isOpen}
        placement={"center"}
        onOpenChange={onOpenChange}
        className="bg-bgColor-ghost"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">Runes</ModalHeader>
              <ModalBody>
                <ListboxWrapper>
                  <Listbox
                    classNames={{
                      base: "w-full",
                      list: "w-full overflow-auto",
                    }}
                    defaultSelectedKeys={["1"]}
                    items={pools}
                    label="Assigned to"
                    // selectionMode="multiple"
                    selectionMode="single"
                    // onSelectionChange={setValues}
                    variant="flat"
                    color="warning"
                  >
                    {(item) => (
                      <ListboxItem
                        key={item.runeId}
                        textValue={item.runeName}
                        className="w-full"
                        onClick={() => {
                          if (poolId !== item.poolId) setPoolId(item.poolId);
                          if (direction === true) {
                            setTargetToken(item);
                          } else {
                            setBaseToken(item);
                          }
                          onClose();
                        }}
                      >
                        <div className="flex items-center gap-2 w-full">
                          <AvatarDisplay src={item.image}></AvatarDisplay>
                          <div className="flex flex-col">
                            <span className="text-small">{item.runeName}</span>
                            <span className="text-default-400 text-tiny">
                              {item.runeName}
                            </span>
                          </div>
                        </div>
                      </ListboxItem>
                    )}
                  </Listbox>
                </ListboxWrapper>
              </ModalBody>
              <ModalFooter>
                <Button color="warning" variant="ghost" onPress={onClose}>
                  Close
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
