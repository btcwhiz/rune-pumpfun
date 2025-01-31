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
  Listbox,
  ListboxItem,
} from "@nextui-org/react";
import toast from "react-hot-toast";
import { FaChevronDown } from "react-icons/fa";
import { IoSwapVerticalSharp } from "react-icons/io5";

import ImageDisplay from "../components/ImageDIsplay";
import { testVersion } from "../config/config";
import { getAllPools, getLiquidity } from "../api/swap";
import AvatarDisplay from "../components/AvatarDisplay";
import { preAddLiquidity, addLiquidity } from "../api/requests";
import { MainContext } from "../contexts/MainContext";
import useSocket from "../hooks/useSocket";
import { ListboxWrapper } from "../swap/ListboxWrapper";
import { IoMdCloseCircle } from "react-icons/io";
import Link from "next/link";
import { displayBtc, getWallet } from "../utils/util";
import PumpInput from "../components/PumpInput";
import { XverseSignPsbt } from "../utils/transaction";
import { BTCImg, ImgStr } from "../config/imageStrings";

export default function Page() {
  const { socket, isConnected } = useSocket();
  const { userInfo } = useContext(MainContext);
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [baseAmount, setBaseAmount] = useState<string>("");
  const [poolId, setPoolId] = useState<string>("");
  const [targetAmount, setTargetAmount] = useState<string>("");
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
      if (!userInfo?.userId) {
        return toast.error("Please connect your wallet");
      }
      if (!poolId) {
        return toast.error("Pool ID is invalid");
      }
      const storedWallet = getWallet();
      setIsLoading(true);
      const { success, pendingLiquidityId, feeId, psbtHex, inputsToSign } =
        await preAddLiquidity(
          userInfo?.userId,
          poolId,
          baseToken.runeId,
          baseAmount,
          targetToken.runeId,
          targetAmount,
          storedWallet.type
        );
      if (success === true) {
        console.log("psbtHex, inputsToSign :>> ", psbtHex, inputsToSign);
        const storedWallet = getWallet();
        let signedPsbt = "";
        if (storedWallet.type === "Xverse") {
          const { signedPSBT } = await XverseSignPsbt(psbtHex, inputsToSign);
          signedPsbt = signedPSBT;
        } else {
          signedPsbt = await (window as any).unisat.signPsbt(psbtHex);
        }
        // const signedPsbt = await unisatSignPsbt(psbtHex);
        // console.log("signedPsbt :>> ", signedPsbt);
        const { success } = await addLiquidity(
          pendingLiquidityId,
          feeId,
          signedPsbt,
          storedWallet.type
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
    // eslint-disable-next-line
  }, []);

  const getLiquidityData = async () => {
    const resp = await getLiquidity(userInfo.userId);
    setLiquidities(resp.liquidities);
  };

  useEffect(() => {
    userInfo?.userId && getLiquidityData();
    // eslint-disable-next-line
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
    <div className="flex flex-col gap-2 p-3 md:pt-20 w-full max-w-[1258px]  px-5 md:px-10">
      <div className="flex justify-center">
        <div className="flex flex-col gap-3 border-2 bg-bgColor-ghost py-10 p-3 border-bgColor-stroke rounded-xl w-full sm:w-4/5 md:w-1/2">
          <div className="py-3 font-bold text-2xl text-center">
            Add Liquidity
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2 bg-[rgba(234,234,234,0.1)] p-2 rounded-xl">
              <div className="pl-3">From</div>
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
                className="bg-bgColor-pink text-white"
                onPress={() => handleChangeToken()}
              >
                <IoSwapVerticalSharp />
              </Button>
            </div>
            <div className="flex flex-col gap-2 bg-[rgba(234,234,234,0.1)] p-2 rounded-xl">
              <div className="pl-3">To</div>
              <div className="flex items-center gap-3 p-2 rounded-xl">
                <PumpInput
                  type="number"
                  value={targetAmount}
                  disabled={true}
                ></PumpInput>
                <Button
                  className="flex items-center gap-1 p-2 rounded-xl w-44 bg-bgColor-pink text-white"
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
            <div className="flex justify-center">
              <Button
                variant="flat"
                className={`w-44 ${
                  baseAmount && targetAmount
                    ? "bg-bgColor-pink"
                    : "bg-bgColor-pink/[.5] cursor-not-allowed"
                } text-white`}
                onClick={() => handleAddLiquidity()}
                isLoading={isLoading}
              >
                Confirm
              </Button>
            </div>
          </div>
        </div>
      </div>
      <div className="gap-2 grid grid-cols-1 sm:grid-cols-2 md:pt-10">
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
                      href={`https://mempool.space${
                        testVersion ? "/testnet" : ""
                      }/tx/${item.txId}`}
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
                <Button
                  className="text-white bg-bgColor-pink"
                  variant="ghost"
                  onPress={onClose}
                >
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
