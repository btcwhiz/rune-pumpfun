"use client";

import React, { useContext, useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  Button,
  Chip,
  Divider,
  Modal,
  ModalBody,
  ModalContent,
  useDisclosure,
} from "@nextui-org/react";
import toast from "react-hot-toast";
import Link from "next/link";
import moment from "moment-timezone";
import { usePathname } from "next/navigation";
import {
  AddressPurpose,
  BitcoinNetworkType,
  getAddress,
  signMessage,
} from "sats-connect";
import { RiLogoutCircleRLine, RiRefreshLine } from "react-icons/ri";

// Icons
import { FaHome, FaPlus, FaUser } from "react-icons/fa";
import { GiMoneyStack } from "react-icons/gi";
import { AiOutlineSwap } from "react-icons/ai";
import { GrMoney } from "react-icons/gr";

import { MainContext } from "../contexts/MainContext";
import { authUser, getUserInfoByProfileId } from "../api/requests";
import { CheckIcon } from "./icons/CheckIcon";
import { SIGN_MESSAGE, TEST_MODE } from "../config";
import { displayBtc } from "../utils/util";
import { storeStorage } from "../utils/stoage";
import useSocket from "../hooks/useSocket";
import NetworkSwitch from "./NetworkSwitch";

const links = [
  {
    label: "Home",
    link: "/",
    icon: <FaHome size={20} />,
  },
  {
    label: "Etching",
    link: "/create",
    icon: <FaPlus size={20} />,
  },
  {
    label: "Swap",
    link: "/swap",
    icon: <AiOutlineSwap size={30} />,
  },
  {
    label: "Pools",
    link: "/pools",
    icon: <GrMoney size={20} />,
  },
];

export default function Header() {
  const path = usePathname();
  const { socket, isConnected } = useSocket();
  const [isLoading, setIsLoading] = useState(false);
  const {
    setPaymentAddress,
    setPaymentPubkey,
    setOrdinalAddress,
    setOrdinalPubkey,
    userInfo,
    setUserInfo,
    setUserRunes,
  } = useContext(MainContext);

  const walletModal = useDisclosure();

  const handleDisConnectWallet = async () => {
    setUserInfo({});
    setPaymentAddress("");
    setPaymentPubkey("");
    setOrdinalAddress("");
    setOrdinalPubkey("");
  };

  const refreshBalance = async () => {
    const uInfo: any = await authUser(
      userInfo.paymentAddress,
      userInfo.paymentPublicKey,
      userInfo.ordinalAddress,
      userInfo.ordinalPublicKey
    );
    setUserInfo(uInfo);
  };

  // Unisat Connect
  const unisatConnectWallet = async () => {
    try {
      const currentWindow: any = window;
      if (typeof currentWindow?.unisat !== "undefined") {
        const unisat: any = currentWindow?.unisat;
        try {
          const network = await unisat.getNetwork();
          if (network !== (TEST_MODE ? "testnet" : "livenet")) {
            await unisat.switchNetwork(TEST_MODE ? "testnet" : "livenet");
          }
          const accounts = await unisat.requestAccounts();
          const address = accounts[0];
          const pubKey = await unisat.getPublicKey();
          await unisat.signMessage(SIGN_MESSAGE);
          setIsLoading(true);
          const uInfo: any = await authUser(address, pubKey, address, pubKey);
          storeStorage("wallet", {
            type: "Unisat",
            paymentAddress: address,
            paymentPubkey: pubKey,
            ordinalAddress: address,
            ordinalPubkey: pubKey,
            session: moment.now() + 60 * 60 * 1000,
          });
          setUserInfo(uInfo);
          setPaymentAddress(address);
          setPaymentPubkey(pubKey);
          setOrdinalAddress(address);
          setOrdinalPubkey(pubKey);
          walletModal.onClose();
          setIsLoading(false);
        } catch (e) {
          setIsLoading(false);
          toast.error("Connect failed!");
        }
      }
    } catch (error) {
      toast.error("Please install Unisat Wallet!");
    }
  };

  // Xverse Connect
  const xverseConnectWallet = async () => {
    try {
      await getAddress({
        payload: {
          purposes: [
            AddressPurpose.Ordinals,
            AddressPurpose.Payment,
            AddressPurpose.Stacks,
          ],
          message: SIGN_MESSAGE,
          network: {
            type: TEST_MODE
              ? BitcoinNetworkType.Testnet
              : BitcoinNetworkType.Mainnet,
          },
        },
        onFinish: async (response) => {
          const paymentAddressItem = response.addresses.find(
            (address: any) => address.purpose === AddressPurpose.Payment
          );
          const ordinalsAddressItem = response.addresses.find(
            (address: any) => address.purpose === AddressPurpose.Ordinals
          );

          let res = "";
          await signMessage({
            payload: {
              network: {
                type: TEST_MODE
                  ? BitcoinNetworkType.Testnet
                  : BitcoinNetworkType.Mainnet,
              },
              address: paymentAddressItem?.address as string,
              message: SIGN_MESSAGE,
            },
            onFinish: (response: any) => {
              res = response;
              return response;
            },
            onCancel: () => {
              walletModal.onClose();
              setIsLoading(false);
            },
          });

          const paymentAddress = paymentAddressItem?.address as string;
          const paymentPubkey = paymentAddressItem?.publicKey as string;
          const ordinalAddress = ordinalsAddressItem?.address as string;
          const ordinalPubkey = ordinalsAddressItem?.publicKey as string;

          if (paymentAddress) {
            setIsLoading(true);
            const uInfo: any = await authUser(
              paymentAddress,
              paymentPubkey,
              ordinalAddress,
              ordinalPubkey
            );
            if (uInfo !== null) {
              storeStorage("wallet", {
                type: "Xverse",
                paymentAddress,
                paymentPubkey,
                ordinalAddress,
                ordinalPubkey,
                session: moment.now() + 60 * 60 * 1000,
              });
              setUserInfo(uInfo);
              setPaymentAddress(paymentAddress);
              setPaymentPubkey(paymentPubkey);
              setOrdinalAddress(ordinalAddress);
              setOrdinalPubkey(ordinalPubkey);
            }
          }
          walletModal.onClose();
          setIsLoading(false);
        },
        onCancel: () => {},
      });
    } catch (error) {
      setIsLoading(false);
      console.log("xverseConnectWallet error ==> ", error);
      toast.error("Xverse Connect Wallet Error");
    }
  };

  // Leader Connect
  const leaderConnectWallet = async () => {
    // Implementation for Leader Connect Wallet
  };

  const walletProviders = [
    {
      onClickFunc: unisatConnectWallet,
      img: "/img/wallet/unisat.png",
      label: "Unisat",
      extensionCheck: () => {
        let flag = false;
        try {
          flag = (window as any).unisat;
        } catch (error) {}
        return flag;
      },
      extensionLink:
        "https://chromewebstore.google.com/detail/unisat-wallet/ppbibelpcjmhbdihakflkdcoccbgbkpo",
    },
    {
      onClickFunc: xverseConnectWallet,
      img: "/img/wallet/xverse.png",
      label: "Xverse",
      extensionCheck: () => {
        let flag = false;
        try {
          flag = (window as any).XverseProviders;
        } catch (error) {}
        return flag;
      },
      extensionLink:
        "https://chromewebstore.google.com/detail/xverse-wallet/idnnbdplmphpflfnlkomgpfbpcgelopg",
    },
    {
      onClickFunc: leaderConnectWallet,
      img: "/img/wallet/leather.png",
      label: "Leather",
      extensionCheck: () => {
        let flag = false;
        try {
          flag = (window as any).LeatherProvider;
        } catch (error) {}
        return flag;
      },
      extensionLink:
        "https://chromewebstore.google.com/detail/leather/ldinpeekobnhjjdofggfgjlcehhmanlj",
    },
  ];

  useEffect(() => {
    if (socket && isConnected) {
      socket.on(
        "deposited",
        ({
          paymentAddress,
          amount,
        }: {
          paymentAddress: string;
          amount: number;
        }) => {
          if (paymentAddress === userInfo.paymentAddress) {
            toast.success(`${amount} BTC deposited`);
            refreshBalance();
          }
        }
      );
      return () => {
        socket.off("deposited");
      };
    }
  }, [socket, isConnected, userInfo, refreshBalance]);

  const getInitialData = async () => {
    const pfp: any = await getUserInfoByProfileId(userInfo.profileId as string);
    setUserRunes(pfp.runes);
  };

  useEffect(() => {
    if (userInfo) {
      if (userInfo?.profileId) getInitialData();
    }
  }, [userInfo]);

  return (
    <div className="z-10 p-4 sm:px-12 border-b-0 border-bgColor-stroke w-full font-mono text-sm max-w-[1258px]">
      <div className="flex flex-wrap justify-center md:justify-between items-center bg-gradient-to-t dark:from-black dark:via-black lg:bg-none w-full lg:size-auto mt-6 gap-4">
        <div className="flex items-center">
          <Image
            src="/img/runes_logo.png" // Replace with the actual path to your image
            alt="Logo"
            width={150} // Adjust the width as needed
            height={150} // Adjust the height as needed
            className="mr-4" // Add margin to the right of the image
            draggable={false}
          />
          <div className="flex items-center">
            <NetworkSwitch />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <div className="grid grid-cols-2 sm:grid-cols-4 items-center gap-3">
            {links.map((item, index) => (
              <div key={index}>
                <Button
                  href={item.link}
                  as={Link}
                  className={`${
                    item.link === path
                      ? "border-pink border-t-3 border-b-3 text-white"
                      : "text-white"
                  } rounded-none items-center sm:gap-2 sm:h-16 hidden sm:flex`}
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
                      ? "border-pink border-b-3 text-pink"
                      : "text-white"
                  } rounded-none flex sm:hidden items-center sm:gap-2 sm:h-16`}
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
                    href={`/pump-admin`}
                    as={Link}
                    className="flex items-center gap-2 text-white bg-pink"
                    variant="flat"
                  >
                    <div>Admin</div>
                  </Button>
                )}
                <div className="flex items-center bg-bgColor-dark border-2 border-bgColor-stroke rounded-lg">
                  <div className="flex flex-col justify-center">
                    <div className="text-bgColor-lime text-center">
                      Deposited
                    </div>
                    <div className="flex gap-1 items-center px-2">
                      {`${displayBtc(userInfo.btcBalance)}`}
                    </div>
                  </div>
                  <div className="flex flex-col justify-center">
                    <div className="text-bgColor-lime text-center">Account</div>
                    <div className="flex gap-1 items-center px-2">
                      {`${displayBtc(userInfo.paymentBalance).toFixed(2)}`}
                      <span className="text-orange font-bold">BTC</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    onClick={refreshBalance}
                    className="rounded-full bg-pink color-pink"
                    isIconOnly
                    variant="flat"
                  >
                    <RiRefreshLine className="text-white" size={24} />
                  </Button>
                  <Button
                    href={`/payment`}
                    as={Link}
                    className="hidden sm:flex items-center gap-2 text-white bg-pink color-pink"
                    variant="flat"
                  >
                    <div>Payment</div>
                    <GiMoneyStack size={26} />
                  </Button>
                  <Button
                    href={`/payment`}
                    as={Link}
                    className="flex sm:hidden items-center gap-2 text-white rounded-full bg-pink color-pink"
                    variant="flat"
                    isIconOnly
                  >
                    <GiMoneyStack size={26} />
                  </Button>
                  <Button
                    as={Link}
                    href={`/profile/${encodeURIComponent(userInfo?.profileId)}`}
                    className="hidden sm:flex items-center gap-2 text-white bg-pink color-pink"
                    variant="flat"
                  >
                    <div>Profile</div>
                    <FaUser size={20} />
                  </Button>
                  <Button
                    as={Link}
                    href={`/profile/${encodeURIComponent(userInfo?.profileId)}`}
                    className="flex sm:hidden items-center gap-2 text-white rounded-full bg-pink color-pink"
                    variant="flat"
                    isIconOnly
                  >
                    <FaUser size={20} />
                  </Button>
                  <Button
                    onClick={handleDisConnectWallet}
                    className="rounded-full bg-pink color-pink"
                    isIconOnly
                    variant="flat"
                  >
                    <RiLogoutCircleRLine
                      className="text-white text-xl"
                      size={22}
                    />
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                onClick={() => {
                  walletModal.onOpen();
                }}
                className="rounded-md text-white bg-pink"
                variant="flat"
              >
                Connect Wallet
              </Button>
            )}
          </div>
          {/* <Button
            href={TEST_MODE ? BETA_URL : TEST_URL}
            as={Link}
            className="rounded-md text-white border-1 border-white bg-transparent hover:text-black color-pink"
            endContent={<IoIosLink />}
          >
            {TEST_MODE ? "Mainnet" : "Testnet"}
          </Button> */}
        </div>
      </div>

      <Modal
        backdrop="blur"
        isOpen={walletModal.isOpen}
        onClose={walletModal.onClose}
        isDismissable={false}
        placement="center"
        motionProps={{
          variants: {
            enter: {
              y: 0,
              opacity: 1,
              transition: {
                duration: 0.3,
                ease: "easeOut",
              },
            },
            exit: {
              y: -20,
              opacity: 0,
              transition: {
                duration: 0.2,
                ease: "easeIn",
              },
            },
          },
        }}
      >
        <ModalContent className="w-[90%] sm:w-full bg-bgColor-dark border-2 border-bgColor-stroke px-0 sm:px-3 py-3">
          {(onClose) => (
            <>
              <ModalBody>
                <div className="w-full h-full flex flex-col gap-3 items-center rounded-xl">
                  <div className="flex flex-col text-[26px]">
                    <p className="text-center font-bold">Connect Wallet</p>
                  </div>
                  <Divider className="bg-pink" />
                  {walletProviders.map((walletProvider, index) => (
                    <Button
                      key={index}
                      className={`flex-row justify-between rounded-2xl w-full px-3 py-7 bg-bgColor-dark hover:brightness-125 duration-300 border-2 border-bgColor-stroke items-center ${
                        walletProvider.label === "Xverse"
                          ? "flex"
                          : "hidden sm:flex"
                      }`}
                      onClick={walletProvider.onClickFunc}
                      isLoading={isLoading}
                    >
                      <div className="flex items-center w-full justify-between">
                        <div className="flex flex-row gap-2 p-2 items-center">
                          <Image
                            src={walletProvider.img}
                            width={20}
                            height={20}
                            alt=""
                          />
                          <p className="text-white text-[20px]">
                            {walletProvider.label}
                          </p>
                        </div>
                        {walletProvider.extensionCheck() ? (
                          <Chip
                            startContent={<CheckIcon size={18} />}
                            variant="bordered"
                            color="warning"
                          >
                            Installed
                          </Chip>
                        ) : (
                          <a
                            className="py-2 px-4 bg-bgColor-light text-white border-2 border-bgColor-stroke rounded-xl text-center"
                            href={walletProvider.extensionLink}
                            target="_blank"
                          >
                            Install
                          </a>
                        )}
                      </div>
                    </Button>
                  ))}
                </div>
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
