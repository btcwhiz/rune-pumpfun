"use client";

import { Button, Input } from "@nextui-org/react";
import Link from "next/link";
import { useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";

import {
  depositFunc,
  getAllTransactions,
  preDepositFunc,
  preWithdrawFunc,
  withdrawFunc,
} from "../api/requests";
import { MainContext } from "../contexts/MainContext";
import { unisatSignPsbt } from "../utils/pump";
import { SATS_MULTIPLE } from "../config/config";
import useSocket from "../hooks/useSocket";
import PumpInput from "../components/PumpInput";

export default function CreateRune() {
  const socket = useSocket();
  const { userInfo } = useContext(MainContext);

  const [loading, setLoading] = useState<boolean>(false);
  const [allTransactions, setAllTransactions] = useState<any[]>([]);

  const [runeId, setRuneId] = useState<string>("");
  const [depositAmount, setDepositAmount] = useState<string>("");
  const [withdrawAmount, setWithdrawAmount] = useState<string>("");

  const getTxs = async () => {
    const alltxs = await getAllTransactions(userInfo.userId);
    // console.log("alltxs :>> ", alltxs.txs);
    setAllTransactions(alltxs.txs || []);
  };

  const handleDeposit = async () => {
    const currentWindow: any = window;
    try {
      if (currentWindow?.unisat) {
        if (userInfo.userId && depositAmount) {
          setLoading(true);
          const walletType = "Unisat";
          const res = await preDepositFunc(
            walletType,
            userInfo.userId,
            depositAmount
          );
          if (currentWindow?.unisat) {
            const signedPsbt = await currentWindow?.unisat.signPsbt(
              res.psbtHex
            );

            const depositRes = await depositFunc(
              userInfo.userId,
              res.depositId,
              signedPsbt
            );
            getTxs();
            toast.success(depositRes.msg);
            if (socket) {
              socket.emit("update-user", { userId: userInfo.userId });
            }
          }
          setLoading(false);
        } else {
          return toast.error("Please connect wallet");
        }
      } else {
        toast.error("Please install unisat");
      }
    } catch (error) {
      setLoading(false);
      console.log("error :>> ", error);
      toast.error("Something went wrong");
    }
  };

  const handleWithdraw = async () => {
    try {
      if (userInfo.userId && runeId && withdrawAmount) {
        setLoading(true);
        const preWithdrawRes = await preWithdrawFunc(
          userInfo.userId,
          runeId,
          withdrawAmount
        );
        console.log("preWithdrawRes :>> ", preWithdrawRes);
        if (runeId === "btc") {
          const signedPsbt = await unisatSignPsbt(preWithdrawRes?.psbt);
          const withdrawRes = await withdrawFunc(
            userInfo.userId,
            runeId,
            withdrawAmount,
            preWithdrawRes.requestId,
            signedPsbt
          );
          console.log("withdrawRes :>> ", withdrawRes);
          toast.success(withdrawRes.msg);
        } else {
          const withdrawRes = await withdrawFunc(
            userInfo.userId,
            runeId,
            withdrawAmount,
            preWithdrawRes.requestId,
            ""
          );
          console.log("withdrawRes :>> ", withdrawRes);
          toast.success(withdrawRes.msg);
        }
        getTxs();
        setLoading(false);
      } else {
        setLoading(false);
        return toast.error("Please connect wallet");
      }
    } catch (error) {
      console.log("error :>> ", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    userInfo.userId && getTxs();
  }, [userInfo.userId]);

  return (
    <div className="flex flex-col gap-3 p-3 min-h-screen">
      <div className="flex flex-col justify-center gap-3 p-3">
        <div className="justify-between gap-3 grid grid-cols-2">
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
                color="warning"
                variant="flat"
                onClick={() => handleDeposit()}
                isLoading={loading}
              >
                {loading ? "Loading" : "Deposit"}
              </Button>
            </div>
          </div>

          {/* Withdraw */}
          <div className="flex flex-col gap-3 border-2 bg-bgColor-ghost p-2 border-bgColor-stroke rounded-xl">
            <div className="py-3 font-bold text-center text-lg">Withdraw</div>
            <div className="flex flex-col gap-3">
              <PumpInput
                label="Rune ID ('btc' or rune id)"
                value={runeId}
                onChange={setRuneId}
              ></PumpInput>
              <PumpInput
                label="Withdraw Amount"
                value={withdrawAmount}
                onChange={setWithdrawAmount}
              ></PumpInput>
              <Button
                color="warning"
                variant="flat"
                onClick={() => handleWithdraw()}
                isLoading={loading}
              >
                {loading ? "Loading" : "Withdraw"}
              </Button>
            </div>
          </div>
        </div>

        {/* Payment History */}
        <div className="border-2 bg-bgColor-ghost p-10 border-bgColor-stroke rounded-xl">
          <div className="py-3 font-bold text-center text-lg">
            Payment History
          </div>
          <div className="gap-3 grid grid-cols-6">
            <div>No</div>
            <div>Action</div>
            <div>Type</div>
            <div>RuneID</div>
            <div>Amount</div>
            <div>TxId</div>
          </div>

          {allTransactions.map((item, index) => (
            <div key={index} className="gap-3 grid grid-cols-6">
              <div>{index + 1}</div>
              <div className="uppercase">
                {item.type === 0 ? "deposit" : "withdraw"}
              </div>
              <div className="uppercase">
                {item.withdrawType === 0 ? "btc" : "rune"}
              </div>
              <div>{item.runeId}</div>
              <div>
                {item.amount / (item.withdrawType === 0 ? SATS_MULTIPLE : 1)}
              </div>
              <Link
                className="font-bold underline"
                target="_blink"
                href={`https://mempool.space/testnet/tx/${item.txId}`}
              >
                <div className="flex items-center gap-2">
                  <span>
                    {`${item.txId.slice(0, 8)}...${item.txId.slice(
                      item.txId.length - 8,
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
