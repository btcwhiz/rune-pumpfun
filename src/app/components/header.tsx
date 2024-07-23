"use client";

import React, { useContext } from "react";
import { Button } from "@nextui-org/react";
import toast from "react-hot-toast";
import copy from "copy-to-clipboard";
import { FaCopy } from "react-icons/fa";
import { IoIosLogOut } from "react-icons/io";
import { TfiReload } from "react-icons/tfi";

import { MainContext } from "../contexts/MainContext";
import { authUser } from "../api/requests";
import { displayAddress } from "../utils/pump";

export default function Header() {
  const {
    setPaymentAddress,
    setPaymentPubkey,
    setOrdinalAddress,
    setOrdinalPubkey,
    userInfo,
    setUserInfo,
  } = useContext(MainContext);

  const handleConnectWallet = async () => {
    const currentWindow: any = window;
    if (currentWindow?.unisat) {
      const unisat: any = currentWindow.unisat;
      const accounts = await unisat.requestAccounts();
      const address = accounts[0];
      const pubKey = await unisat.getPublicKey();
      const uInfo: any = await authUser(address, pubKey, address, pubKey);
      setUserInfo(uInfo);
      setPaymentAddress(address);
      setPaymentPubkey(pubKey);
      setOrdinalAddress(address);
      setOrdinalPubkey(pubKey);
    } else {
      toast.error("Plz install unisat wallet");
    }
  };

  const handleDisConnectWallet = async () => {
    setUserInfo({});
    setPaymentAddress("");
    setPaymentPubkey("");
    setOrdinalAddress("");
    setOrdinalPubkey("");
  };

  return (
    <div className="z-10 lg:flex justify-center items-center p-10 w-full font-mono text-sm">
      <div className="bottom-0 left-0 lg:static fixed flex justify-center items-end bg-gradient-to-t from-white dark:from-black via-white dark:via-black lg:bg-none w-full h-48 lg:size-auto">
        {userInfo?.userId ? (
          <div className="flex items-center gap-3">
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center gap-3">
                <div className="font-bold">Your Wallet: </div>
                <div>{`${userInfo?.btcBalance / 10 ** 8} BTC`}</div>
                <div>{`${displayAddress(userInfo?.paymentAddress)}`}</div>
                <Button
                  color="primary"
                  onClick={() => copy(userInfo?.paymentAddress)}
                  className="flex justify-center items-center"
                >
                  <FaCopy />
                </Button>
              </div>
              <div className="flex justify-between items-center gap-3">
                <div className="font-bold">Multi Sig Wallet: </div>
                <div>{`${Number(userInfo?.multiBalance) / 10 ** 8} BTC`}</div>
                <div>{`${displayAddress(userInfo?.multisigWallet)}`}</div>
                <Button
                  color="primary"
                  onClick={() => copy(userInfo?.multisigWallet)}
                  className="flex justify-center items-center"
                >
                  <FaCopy />
                </Button>
              </div>
            </div>
            <Button color="primary" onClick={() => handleConnectWallet()}>
              <TfiReload />
            </Button>
            <Button color="primary" onClick={() => handleDisConnectWallet()}>
              <IoIosLogOut />
            </Button>
          </div>
        ) : (
          <Button color="primary" onClick={() => handleConnectWallet()}>
            Connect Wallet
          </Button>
        )}
      </div>
    </div>
  );
}
