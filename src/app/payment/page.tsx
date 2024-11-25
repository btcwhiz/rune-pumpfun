"use client";

import {
  Avatar,
  Button,
  Select,
  SelectItem,
  SelectSection,
} from "@nextui-org/react";
import Link from "next/link";
import { useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";

import {
  depositFunc,
  getAllTransactions,
  getBtcBalance,
  getUserInfoByProfileId,
  preDepositFunc,
  preWithdrawFunc,
  withdrawFunc,
} from "../api/requests";
import { MainContext } from "../contexts/MainContext";
import { unisatSignPsbt } from "../utils/pump";
import { SATS_MULTIPLE, testVersion } from "../config/config";
import useSocket from "../hooks/useSocket";
import PumpInput from "../components/PumpInput";
import { displayBtc, getWallet } from "../utils/util";
import { XverseSignPsbt } from "../utils/transaction";
import ImageDisplay from "../components/ImageDIsplay";
import Image from "next/image";

export default function CreateRune() {
  const { socket, isConnected } = useSocket();
  const { userInfo, userRunes, setUserRunes } = useContext(MainContext);

  const [dLoading, setDLoading] = useState<boolean>(false);
  const [wLoading, setWLoading] = useState<boolean>(false);
  const [allTransactions, setAllTransactions] = useState<any[]>([]);

  const [runeId, setRuneId] = useState<string>("");
  const [depositAmount, setDepositAmount] = useState<string>("");
  const [withdrawAmount, setWithdrawAmount] = useState<string>("");

  const getTxs = async () => {
    const alltxs = await getAllTransactions(userInfo.userId);
    // console.log("alltxs :>> ", alltxs.txs);
    setAllTransactions(alltxs.txs || []);
  };

  const getInitialData = async () => {
    const pfp: any = await getUserInfoByProfileId(userInfo.profileId as string);
    setUserRunes(pfp.runes);
  };

  const handleDeposit = async () => {
    const dAmount = Number(depositAmount);
    const currentWindow: any = window;
    setDLoading(true);
    try {
      if (userInfo.userId) {
        if (!dAmount) {
          toast.error("Please input deposit amount");
          setDLoading(false);
          return;
        }
        const btcBalance = await getBtcBalance(userInfo.paymentAddress);
        if (btcBalance.balance < dAmount * SATS_MULTIPLE) {
          toast.error("You don't have enough balance.");
          setDLoading(false);
          return;
        }
        const storedWallet = getWallet();
        const walletType = storedWallet.type;
        const res = await preDepositFunc(walletType, userInfo.userId, dAmount);
        let signedPsbt = "";
        if (walletType === "Unisat") {
          if (currentWindow?.unisat) {
            signedPsbt = await currentWindow?.unisat.signPsbt(res.psbtHex);
          }
        } else if (walletType === "Xverse") {
          if (currentWindow?.XverseProviders) {
            const { signedPSBT } = await XverseSignPsbt(
              res.psbtHex,
              res.inputsToSign
            );
            signedPsbt = signedPSBT;
          }
        } else {
          if (currentWindow?.unisat) {
            signedPsbt = await currentWindow?.unisat.signPsbt(res.psbtHex);
          }
        }
        if (signedPsbt) {
          const depositRes = await depositFunc(
            userInfo.userId,
            res.depositId,
            signedPsbt,
            walletType
          );
          getTxs();
          toast.success(depositRes.msg);
          if (socket && isConnected) {
            socket.emit("update-user", { userId: userInfo.userId });
          }
        }
        setDLoading(false);
      } else {
        setDLoading(false);
        return toast.error("Please connect wallet");
      }
    } catch (error) {
      setDLoading(false);
      console.log("error :>> ", error);
      toast.error("Something went wrong");
    }
  };

  const handleWithdraw = async () => {
    try {
      const wAmount = Number(withdrawAmount);
      const storedWallet = getWallet();
      setWLoading(true);
      if (!runeId) {
        toast.error("Please input runeID");
        setWLoading(false);
        return;
      }
      if (!wAmount) {
        toast.error("Please input withdraw amount");
        setWLoading(false);
        return;
      }
      if (runeId.toLocaleLowerCase() === "btc") {
        const btcBalance = await getBtcBalance(userInfo.multisigWallet);
        if (btcBalance.balance < wAmount * SATS_MULTIPLE) {
          toast.error("You don't have enough balance to withdraw.");
          setWLoading(false);
          return;
        }
      }

      if (userInfo.userId) {
        const preWithdrawRes = await preWithdrawFunc(
          userInfo.userId,
          runeId,
          wAmount
        );
        if (preWithdrawRes !== null) {
          if (runeId === "btc") {
            let signedPsbt = "";
            if (storedWallet.type === "Unisat") {
              signedPsbt = await unisatSignPsbt(preWithdrawRes?.psbt);
            } else if (storedWallet.type === "Xverse") {
              const { signedPSBT } = await XverseSignPsbt(
                preWithdrawRes.psbt,
                preWithdrawRes.inputsToSign
              );
              signedPsbt = signedPSBT;
            } else {
              signedPsbt = await unisatSignPsbt(preWithdrawRes?.psbt);
            }
            if (signedPsbt) {
              const withdrawRes = await withdrawFunc(
                userInfo.userId,
                runeId,
                wAmount,
                preWithdrawRes.requestId,
                signedPsbt
              );
              toast.success(withdrawRes.msg);
            }
          } else {
            const withdrawRes = await withdrawFunc(
              userInfo.userId,
              runeId,
              wAmount,
              preWithdrawRes.requestId,
              ""
            );
            toast.success(withdrawRes.msg);
          }
          getTxs();
        }
        setWLoading(false);
        getInitialData();
      } else {
        setWLoading(false);
        getInitialData();
        return toast.error("Please connect wallet");
      }
    } catch (error) {
      console.log("error :>> ", error);
      setWLoading(false);
      getInitialData();
    }
  };

  useEffect(() => {
    userInfo.userId && getTxs();
    // eslint-disable-next-line
  }, [userInfo.userId]);

  return (
    <div className="flex flex-col gap-3 p-3 min-h-screen">
      <div className="flex flex-col justify-center gap-3 p-3">
        <div className="justify-between gap-3 grid grid-cols-1 sm:grid-cols-2">
          {/* Deposit */}
          <div className="flex flex-col gap-3 border-2 bg-bgColor-ghost p-2 border-bgColor-stroke rounded-xl">
            <div className="py-3 font-bold text-center text-lg">Deposit</div>
            <div className="flex flex-col gap-3">
              <PumpInput
                label="Deposit Amount"
                value={depositAmount}
                onChange={setDepositAmount}
              ></PumpInput>
              <Button
                variant="flat"
                onClick={() => handleDeposit()}
                isLoading={dLoading}
                className={`${
                  depositAmount ? "bg-bgColor-pink" : "bg-bgColor-pink/[.5]"
                } text-white`}
                disabled={depositAmount ? false : true}
              >
                {dLoading ? "Loading" : "Deposit"}
              </Button>
            </div>
          </div>

          {/* Withdraw */}
          <div className="flex flex-col gap-3 border-2 bg-bgColor-ghost p-2 border-bgColor-stroke rounded-xl">
            <div className="py-3 font-bold text-center text-lg">Withdraw</div>
            <div className="flex flex-col gap-3">
              <Select
                items={[
                  {
                    runeId: "btc",
                    runeName: "BTC",
                    balance: displayBtc(userInfo.btcBalance),
                  },
                  ...userRunes,
                ]}
                placeholder="Select TOKEN"
                labelPlacement="outside"
                className="max-w-xs border-2 border-bgColor-stroke rounded-xl text-bgColor-ghost"
                classNames={{
                  label:
                    "group-data-[filled=true]:-translate-y-5 text-bgColor-pink text-bgColor-pink",
                  trigger: "min-h-10 h-14 text-bgColor-pink text-bgColor-pink",
                  listboxWrapper:
                    "max-h-[400px] text-bgColor-pink text-bgColor-pink",
                }}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                  setRuneId(e.target.value);
                }}
              >
                {(userRune: any) => (
                  <SelectItem
                    key={userRune.runeId}
                    textValue={`${userRune.runeName} - ${userRune.balance}`}
                  >
                    <div className="flex gap-2 items-center">
                      <div className="rounded-lg flex items-center justify-center">
                        {userRune.runeId.toLocaleLowerCase() === "btc" ? (
                          <Image
                            width={48}
                            height={48}
                            src={"/img/bitcoin.png"}
                            alt="great"
                            draggable={false}
                          />
                        ) : (
                          <ImageDisplay
                            src={userRune.runeImage}
                            className="w-14 h-14 min-w-10 min-h-10"
                          ></ImageDisplay>
                        )}
                      </div>
                      {/* <Avatar
                        alt={user.name}
                        className="flex-shrink-0"
                        size="sm"
                        src={user.avatar}
                      /> */}
                      <div className="flex flex-col">
                        <span className="text-small">{userRune.runeName}</span>
                        <span className="text-tiny text-default-400">
                          {userRune.balance}
                        </span>
                      </div>
                    </div>
                  </SelectItem>
                )}
              </Select>
              {/* <PumpInput
                label="Rune ID ('btc' or rune id)"
                value={runeId}
                onChange={setRuneId}
              ></PumpInput> */}
              <PumpInput
                label="Withdraw Amount"
                value={withdrawAmount}
                onChange={setWithdrawAmount}
                // endContent={
                //   <div className="flex justify-center items-center">
                //     <Button
                //       color="warning"
                //       variant="flat"
                //       onClick={() => setWithdrawAmount(userInfo.btcBalance)}
                //     >
                //       Max
                //     </Button>
                //   </div>
                // }
              ></PumpInput>
              <Button
                variant="flat"
                onClick={() => handleWithdraw()}
                isLoading={wLoading}
                className={`${
                  runeId && withdrawAmount
                    ? "bg-bgColor-pink"
                    : "bg-bgColor-pink/[.5]"
                } text-white`}
                disabled={runeId && withdrawAmount ? false : true}
              >
                {wLoading ? "Loading" : "Withdraw"}
              </Button>
            </div>
          </div>
        </div>

        {/* Payment History */}
        <div className="border-2 bg-bgColor-ghost p-2 sm:p-8 border-bgColor-stroke rounded-xl">
          <div className="py-3 font-bold text-center text-lg">
            Payment History
          </div>
          <div className="gap-3 grid grid-cols-4 sm:grid-cols-6">
            <div className="hidden sm:flex">No</div>
            <div>Action</div>
            <div className="hidden sm:flex">Type</div>
            <div>RuneID</div>
            <div>Amount</div>
            <div>TxId</div>
          </div>

          {allTransactions.map((item, index) => (
            <div key={index} className="gap-3 grid grid-cols-4 sm:grid-cols-6">
              <div className="hidden sm:flex">{index + 1}</div>
              <div className="uppercase">
                <span>{item.type === 0 ? "deposit" : "withdraw"}</span>
              </div>
              <div className="uppercase hidden sm:flex">
                {item.withdrawType === 0 ? "btc" : "rune"}
              </div>
              <div>{item.runeId}</div>
              <div>
                {item.amount / (item.withdrawType === 0 ? SATS_MULTIPLE : 1)}
              </div>
              <Link
                className="font-bold underline"
                target="_blink"
                href={`https://mempool.space${
                  testVersion ? "/testnet" : ""
                }/tx/${item.txId}`}
              >
                <div className="flex items-center gap-2">
                  <span className="flex sm:hidden">
                    {`${item.txId.slice(0, 4)}...`}
                  </span>
                  <span className="hidden sm:flex">
                    {`${item.txId.slice(0, 4)}...${item.txId.slice(
                      item.txId.length - 4,
                      item.txId.length - 1
                    )}`}
                  </span>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
