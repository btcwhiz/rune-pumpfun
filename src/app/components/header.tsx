"use client";

import React, { useContext, useEffect } from "react";
import { Button } from "@nextui-org/react";
import toast from "react-hot-toast";
import { FaHome, FaPlus, FaUser } from "react-icons/fa";
import { IoIosLogOut } from "react-icons/io";
import { TfiReload } from "react-icons/tfi";
import Link from "next/link";
import moment from "moment-timezone";

import { MainContext } from "../contexts/MainContext";
import { authUser } from "../api/requests";
import { usePathname } from "next/navigation";
import { GiMoneyStack } from "react-icons/gi";
import { AiOutlineSwap } from "react-icons/ai";
import { GrMoney } from "react-icons/gr";

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
        if (session > moment.now()) {
          handleConnectWallet();
        }
      }
    };

    autoConnect();
  }, []);

  return (
    <div className="z-10 bg-bgColor-ghost px-12 border-b-2 border-bgColor-stroke w-full font-mono text-sm">
      <div className="flex flex-wrap justify-between items-center bg-gradient-to-t dark:from-black dark:via-black lg:bg-none w-full lg:size-auto gap-3">
        <div className="flex flex-wrap justify-center items-center gap-3">
          {links.map((item, index) => (
            <Button
              key={index}
              href={item.link}
              as={Link}
              className={`${
                item.link === path
                  ? "border-warning border-b text-warning"
                  : "text-white"
              } rounded-none flex items-center gap-2 h-16`}
              color="warning"
              variant="light"
            >
              {item.icon}
              <span>{item.label}</span>
            </Button>
          ))}
        </div>
        <div className="py-3">
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
              <div>{`${userInfo.btcBalance / 10 ** 8} BTC`}</div>
              <Button
                color="warning"
                onClick={() => handleConnectWallet()}
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
                className="flex items-center gap-2 text-white"
                variant="flat"
              >
                <div>Payment</div>
                <GiMoneyStack />
              </Button>
              <Button
                as={Link}
                color="warning"
                href={`/profile/${encodeURIComponent(userInfo?.profileId)}`}
                className="flex items-center gap-2 text-white"
                variant="flat"
              >
                <div>Profile</div>
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
