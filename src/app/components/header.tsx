"use client";

import React, { useContext, useEffect, useRef, useState } from "react";
import { Button } from "@nextui-org/react";
import toast from "react-hot-toast";
import { FaHome, FaPlus, FaUser } from "react-icons/fa";
import { IoIosLogOut } from "react-icons/io";
import { TfiReload } from "react-icons/tfi";
import Link from "next/link";
import moment from "moment-timezone";
import { usePathname } from "next/navigation";
import { GiMoneyStack } from "react-icons/gi";
import { AiOutlineSwap } from "react-icons/ai";
import { GrMoney } from "react-icons/gr";

import { MainContext } from "../contexts/MainContext";
import { authUser } from "../api/requests";

const links = [
  {
    label: "Home",
    link: "/",
    icon: <FaHome />,
  },
  {
    label: "Etching",
    link: "/create",
    icon: <FaPlus />,
  },
  {
    label: "Swap",
    link: "/swap",
    icon: <AiOutlineSwap />,
  },
  {
    label: "Pools",
    link: "/pools",
    icon: <GrMoney />,
  },
];

export default function Header() {
  const path = usePathname();
  const loadingRef = useRef(false);
  const {
    paymentAddress,
    setPaymentAddress,
    setPaymentPubkey,
    setOrdinalAddress,
    setOrdinalPubkey,
    userInfo,
    setUserInfo,
  } = useContext(MainContext);

  const walletConnectProcess = async () => {
    const currentWindow: any = window;
    const unisat: any = currentWindow.unisat;
    const accounts = await unisat.requestAccounts();
    const address = accounts[0];
    const pubKey = await unisat.getPublicKey();
    const uInfo: any = await authUser(address, pubKey, address, pubKey);
    localStorage.setItem(
      "wallet",
      JSON.stringify({
        type: "Unisat",
        paymentAddress: address,
        paymentPubkey: pubKey,
        ordinalAddress: address,
        ordinalPubkey: pubKey,
        session: moment.now() + 60 * 60 * 1000,
      })
    );
    setUserInfo(uInfo);
    setPaymentAddress(address);
    setPaymentPubkey(pubKey);
    setOrdinalAddress(address);
    setOrdinalPubkey(pubKey);
  };

  const handleConnectWallet = async () => {
    const currentWindow: any = window;
    if (currentWindow?.unisat) {
      if (!paymentAddress) {
        walletConnectProcess();
      }
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

  useEffect(() => {
    const autoConnect = async () => {
      const storedWallet = localStorage.getItem("wallet");
      if (storedWallet) {
        const { session } = JSON.parse(storedWallet);
        if (session > moment.now() && !loadingRef.current) {
          loadingRef.current = true;
          await handleConnectWallet();
          loadingRef.current = false;
        }
      }
    };

    autoConnect();
  }, []);

  return (
    <div className="z-10 bg-bgColor-ghost px-2 sm:px-12 border-b-2 border-bgColor-stroke w-full font-mono text-sm">
      <div className="flex flex-wrap justify-center md:justify-between items-center bg-gradient-to-t dark:from-black dark:via-black lg:bg-none w-full lg:size-auto gap-3">
        <div className="flex flex-wrap justify-center items-center gap-3">
          {links.map((item, index) => (
            <div key={index}>
              <Button
                href={item.link}
                as={Link}
                className={`${
                  item.link === path
                    ? "border-warning border-b text-warning"
                    : "text-white"
                } rounded-none items-center sm:gap-2 sm:h-16 hidden sm:flex`}
                color="warning"
                variant="light"
              >
                {item.icon}
                <span>{item.label}</span>
              </Button>
              <Button
                href={item.link}
                as={Link}
                className={`${
                  item.link === path
                    ? "border-warning border-b text-warning"
                    : "text-white"
                } rounded-none flex sm:hidden items-center sm:gap-2 sm:h-16`}
                color="warning"
                variant="light"
                isIconOnly
              >
                {item.icon}
              </Button>
            </div>
          ))}
        </div>
        <div className="py-3 flex justify-center items-center">
          {userInfo?.userId ? (
            <div className="flex flex-wrap justify-center items-center gap-3">
              {userInfo.role === 1 && (
                <Button
                  color="warning"
                  href={`/pump-admin`}
                  as={Link}
                  className="flex items-center gap-2 text-white"
                  variant="flat"
                >
                  <div>Admin</div>
                </Button>
              )}
              <div className="flex gap-1 items-center bg-bgColor-dark border-2 border-bgColor-stroke rounded-lg p-2">
                {`${userInfo.btcBalance / 10 ** 8}`}
                <span className="text-orange font-bold">BTC</span>
              </div>
              <Button
                color="warning"
                onClick={() => walletConnectProcess()}
                className="rounded-full"
                isIconOnly
                variant="flat"
              >
                <TfiReload className="text-white" />
              </Button>
              <Button
                color="warning"
                href={`/payment`}
                as={Link}
                className="hidden sm:flex items-center gap-2 text-white"
                variant="flat"
              >
                <div>Payment</div>
                <GiMoneyStack />
              </Button>
              <Button
                color="warning"
                href={`/payment`}
                as={Link}
                className="flex sm:hidden items-center gap-2 text-white rounded-full"
                variant="flat"
                isIconOnly
              >
                <GiMoneyStack />
              </Button>
              <Button
                as={Link}
                color="warning"
                href={`/profile/${encodeURIComponent(userInfo?.profileId)}`}
                className="hidden sm:flex items-center gap-2 text-white"
                variant="flat"
              >
                <div>Profile</div>
                <FaUser />
              </Button>
              <Button
                as={Link}
                color="warning"
                href={`/profile/${encodeURIComponent(userInfo?.profileId)}`}
                className="flex sm:hidden items-center gap-2 text-white rounded-full"
                variant="flat"
                isIconOnly
              >
                <FaUser />
              </Button>
              <Button
                color="warning"
                onClick={() => handleDisConnectWallet()}
                className="rounded-full"
                isIconOnly
                variant="flat"
              >
                <IoIosLogOut className="text-white text-xl" />
              </Button>
            </div>
          ) : (
            <Button
              color="warning"
              onClick={() => handleConnectWallet()}
              className="rounded-md text-white"
              variant="flat"
            >
              Connect Wallet
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
