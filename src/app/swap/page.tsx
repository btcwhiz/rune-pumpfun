"use client";

import React, { useContext, useEffect, useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  useDisclosure,
  Accordion,
  AccordionItem,
  Listbox,
  ListboxItem,
} from "@nextui-org/react";
import { IoSwapVerticalSharp } from "react-icons/io5";
import { FaChevronDown } from "react-icons/fa";

import ImageDisplay from "../components/ImageDIsplay";
import { getAllPools } from "../api/swap";
import { ListboxWrapper } from "./ListboxWrapper";
import AvatarDisplay from "../components/AvatarDisplay";
import { preSwapToken, swapToken } from "../api/requests";
import { MainContext } from "../contexts/MainContext";
import toast from "react-hot-toast";
import useSocket from "../hooks/useSocket";
import { displayBtc, getWallet } from "../utils/util";
import PumpInput from "../components/PumpInput";
import { XverseSignPsbt } from "../utils/transaction";
import { BTCImg, ImgStr } from "../config/imageStrings";

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
  const [pools, setPools] = useState<any[]>([]);
  const [direction, setDirection] = useState<Boolean>(true);

  const [baseToken, setBaseToken] = useState<any>({
    runeId: "btc",
    runeName: "BTC",
    btcAmount: 100000000,
    runeAmount: 100000000,
    image: BTCImg,
  });

  const [targetToken, setTargetToken] = useState<any>({
    runeId: "2869809:2877",
    runeName: "THE.THOG.IS.BEST",
    btcAmount: 100000000,
    runeAmount: 100000000,
    image: ImgStr,
  });

  const handleSwapToken = async () => {
    try {
      if (!userInfo.userId) {
        return toast.error("Please connect your wallet");
      }
      if (!poolId) {
        return toast.error("Pool ID is invalid");
      }
      setIsLoading(true);
      const storedWallet = getWallet();
      const { success, pendingSwapId, feeId, psbtHex, inputsToSign } =
        await preSwapToken(
          userInfo.userId,
          poolId,
          baseToken.runeId,
          baseAmount,
          targetToken.runeId,
          targetAmount,
          storedWallet.type
        );
      if (success === true) {
        // console.log("psbtHex, pendingSwapId :>> ", psbtHex, pendingSwapId);
        let signedPsbt = "";
        if (storedWallet.type === "Unisat") {
          signedPsbt = await (window as any).unisat.signPsbt(psbtHex);
        } else if (storedWallet.type === "Xverse") {
          const { signedPSBT } = await XverseSignPsbt(psbtHex, inputsToSign);
          signedPsbt = signedPSBT;
        } else {
          signedPsbt = await (window as any).unisat.signPsbt(psbtHex);
        }
        if (signedPsbt) {
          // console.log("signedPsbt :>> ", signedPsbt);
          const { success } = await swapToken(
            pendingSwapId,
            feeId,
            signedPsbt,
            storedWallet.type
          );
          if (success)
            toast.success("Success, please wait while tx confirming");
        }
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

  const getData = async () => {
    const res = await getAllPools();
    // console.log("res :>> ", res);
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

  const handleInputBaseAmount = async (amount: any) => {
    if (socket && isConnected) {
      if (direction === true) {
        socket.emit("predict-rune", { poolId, amount, type: "base" });
      } else {
        socket.emit("predict-btc", { poolId, amount, type: "base" });
      }
    }
    setBaseAmount(amount);
  };

  const handleInputTargeAmount = async (amount: any) => {
    if (socket && isConnected) {
      if (direction === true) {
        socket.emit("predict-btc", { poolId, amount, type: "target" });
      } else {
        socket.emit("predict-rune", { poolId, amount, type: "target" });
      }
    }
    setTargetAmount(amount);
  };

  useEffect(() => {
    getData();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on("estimate-base", (base: any) => {
        setBaseAmount(base.predictAmount);
      });
      socket.on("estimate-target", (base: any) => {
        setTargetAmount(base.predictAmount);
      });
      return () => {
        socket.off("estimate-base");
        socket.off("estimate-target");
      };
    }
  }, [poolId, socket, direction]);

  return (
    <div className="flex justify-center gap-3 p-3 md:pt-20">
      <div className="flex flex-col gap-3 border-2 bg-bgColor-ghost py-10 p-3 border-bgColor-stroke rounded-xl w-full">
        <div className="py-3 font-bold text-2xl text-center">Swap</div>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-2 bg-[rgba(234,234,234,0.1)] p-2 rounded-xl">
            <div className="flex justify-between items-center px-3">
              <div>From</div>
              <div>
                {baseToken.runeId === "btc"
                  ? displayBtc(baseToken.btcAmount)
                  : baseToken.runeAmount}
              </div>
            </div>
            <div className="flex items-center gap-3 p-2">
              <PumpInput
                type="number"
                value={baseAmount}
                onChange={handleInputBaseAmount}
              ></PumpInput>
              <Button
                className="flex justify-between gap-1 p-2 rounded-xl w-44 bg-bgColor-pink text-white"
                variant="flat"
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
              variant="flat"
              onPress={() => handleChangeToken()}
              className="bg-bgColor-pink text-white"
            >
              <IoSwapVerticalSharp />
            </Button>
          </div>
          <div className="flex flex-col gap-2 bg-[rgba(234,234,234,0.1)] p-2 rounded-xl">
            <div className="flex justify-between items-center px-3">
              <div>To</div>
              <div>
                {targetToken.runeId === "btc"
                  ? displayBtc(targetToken.btcAmount)
                  : targetToken.runeAmount}
              </div>
            </div>
            <div className="flex items-center gap-3 p-2 rounded-xl">
              <PumpInput
                type="number"
                value={targetAmount}
                onChange={handleInputTargeAmount}
              ></PumpInput>
              <Button
                className="flex justify-between items-center gap-1 p-2 rounded-xl w-44 bg-bgColor-pink text-white"
                variant="flat"
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
          <div className="bg-[rgba(234,234,234,0.1)] rounded-xl">
            <Accordion variant="bordered" itemClasses={itemClasses}>
              <AccordionItem
                key="1"
                aria-label="Fee"
                title="Fee"
                className="text-white"
              >
                <div>
                  <div className="flex justify-between items-center">
                    <div>Max Slippage</div>
                    <div>{`${slippage}%`}</div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div>LP Fee</div>
                    <div>0.3%</div>
                  </div>
                </div>
              </AccordionItem>
            </Accordion>
          </div>
          <div className="flex justify-center">
            <Button
              variant="flat"
              className={`w-44 ${
                baseAmount && targetAmount
                  ? "bg-bgColor-pink"
                  : "bg-bgColor-pink/[.5] cursor-not-allowed"
              } text-white`}
              onClick={() => handleSwapToken()}
              isLoading={isLoading}
            >
              Confirm
            </Button>
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
              <ModalBody className="border-none">
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
                        className="border-none w-full"
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
                <Button className="text-white bg-bgColor-pink" variant="ghost" onPress={onClose}>
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
