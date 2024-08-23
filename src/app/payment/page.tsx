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
          console.log("Invalid parameters");
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
        console.log("Invalid Parameters");
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
    <main className="p-3 min-h-screen">
      <div className="flex flex-col gap-3">
        <div className="flex justify-center">
          <Link className="p-3 border rounded-xl" href={"/"}>
            Go Back
          </Link>
        </div>
        <div className="flex flex-col justify-center p-3">
          <div className="justify-between gap-3 grid grid-cols-2">
            {/* Deposit */}
            <div className="flex flex-col gap-3">
              <div className="text-center">Deposit</div>
              <div className="flex flex-col gap-3">
                <Input
                  type="text"
                  label="Deposit Amount"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                />
                <Button
                  color="success"
                  onClick={() => handleDeposit()}
                  isLoading={loading}
                >
                  {loading ? "Loading" : "Deposit"}
                </Button>
              </div>
            </div>

            {/* Withdraw */}
            <div className="flex flex-col gap-3">
              <div className="text-center">Withdraw</div>
              <div className="flex flex-col gap-3">
                <Input
                  type="text"
                  label="Rune ID"
                  placeholder="'btc' or rune id"
                  value={runeId}
                  onChange={(e) => setRuneId(e.target.value)}
                />
                <Input
                  type="text"
                  label="Withdraw Amount"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                />
                <Button
                  color="danger"
                  onClick={() => handleWithdraw()}
                  isLoading={loading}
                >
                  {loading ? "Loading" : "Withdraw"}
                </Button>
              </div>
            </div>
          </div>

          {/* Payment History */}
          <div className="p-10">
            <div>Payment History</div>
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
                  {item.withdrawType === 1 ? "rune" : "btc"}
                </div>
                <div>{item.runeId}</div>
                <div>
                  {item.amount / item.withdrawType === 1 ? 1 : SATS_MULTIPLE}
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
    </main>
  );
}
