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
import { SATS_MULTIPLE, testVersion } from "../config/config";
import useSocket from "../hooks/useSocket";
import PumpInput from "../components/PumpInput";
import { getWallet } from "../utils/util";
import { XverseSignPsbt } from "../utils/transaction";

export default function CreateRune() {
  const { socket, isConnected } = useSocket();
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
      if (userInfo.userId && depositAmount) {
        setLoading(true);
        const storedWallet = getWallet();
        const walletType = storedWallet.type;
        const res = await preDepositFunc(
          walletType,
          userInfo.userId,
          depositAmount
        );
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
        setLoading(false);
      } else {
        return toast.error("Please connect wallet");
      }
    } catch (error) {
      setLoading(false);
      console.log("error :>> ", error);
      toast.error("Something went wrong");
    }
  };

  const handleWithdraw = async () => {
    try {
      const storedWallet = getWallet();
      if (userInfo.userId && runeId && withdrawAmount) {
        setLoading(true);
        const preWithdrawRes = await preWithdrawFunc(
          userInfo.userId,
          runeId,
          withdrawAmount
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

            const withdrawRes = await withdrawFunc(
              userInfo.userId,
              runeId,
              withdrawAmount,
              preWithdrawRes.requestId,
              signedPsbt
            );
            toast.success(withdrawRes.msg);
          } else {
            const withdrawRes = await withdrawFunc(
              userInfo.userId,
              runeId,
              withdrawAmount,
              preWithdrawRes.requestId,
              ""
            );
            toast.success(withdrawRes.msg);
          }
          getTxs();
        }
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
                <span className="hidden sm:flex">
                  {item.type === 0 ? "deposit" : "withdraw"}
                </span>
                <span className="flex sm:hidden">
                  {item.type === 0 ? "d" : "w"}
                </span>
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
