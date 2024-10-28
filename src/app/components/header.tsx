"use client";

import React, { useContext, useEffect, useRef, useState } from "react";
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
import { FaHome, FaPlus, FaUser } from "react-icons/fa";
import { IoIosLink, IoIosLogOut } from "react-icons/io";
import { TfiReload } from "react-icons/tfi";
import Link from "next/link";
import moment from "moment-timezone";
import { usePathname } from "next/navigation";
import { GiMoneyStack } from "react-icons/gi";
import { AiOutlineSwap } from "react-icons/ai";
import { GrMoney } from "react-icons/gr";

import {
  AddressPurpose,
  BitcoinNetworkType,
  getAddress,
  signMessage,
} from "sats-connect";

import { MainContext } from "../contexts/MainContext";
import { authUser } from "../api/requests";
import Image from "next/image";
import { CheckIcon } from "./icons/CheckIcon";
import { BETA_URL, SIGN_MESSAGE, TEST_MODE, TEST_URL } from "../config";
import { displayBtc, getWallet } from "../utils/util";

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
  // {
  //   label: "Swap",
  //   link: "/swap",
  //   icon: <AiOutlineSwap />,
  // },
  // {
  //   label: "Pools",
  //   link: "/pools",
  //   icon: <GrMoney />,
  // },
];

export default function Header() {
  const path = usePathname();
  const loadingRef = useRef(false);
  const [isLoading, setIsLoading] = useState(false);
  const {
    paymentAddress,
    setPaymentAddress,
    setPaymentPubkey,
    setOrdinalAddress,
    setOrdinalPubkey,
    userInfo,
    setUserInfo,
  } = useContext(MainContext);

  const walletModal = useDisclosure();

  const handleDisConnectWallet = async () => {
    setUserInfo({});
    setPaymentAddress("");
    setPaymentPubkey("");
    setOrdinalAddress("");
    setOrdinalPubkey("");
  };

  const storeLocalStorage = (
    type: string,
    paymentAddress: string,
    paymentPubkey: string,
    ordinalAddress: string,
    ordinalPubkey: string
  ) => {
    localStorage.setItem(
      "wallet",
      JSON.stringify({
        type,
        paymentAddress,
        paymentPubkey,
        ordinalAddress,
        ordinalPubkey,
        session: moment.now() + 60 * 60 * 1000,
      })
    );
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
          if (network != (TEST_MODE ? "testnet" : "livenet")) {
            await unisat.switchNetwork(TEST_MODE ? "testnet" : "livenet");
          }
          const accounts = await unisat.requestAccounts();
          const address = accounts[0];
          const pubKey = await unisat.getPublicKey();
          await unisat.signMessage(SIGN_MESSAGE);
          setIsLoading(true);
          const uInfo: any = await authUser(address, pubKey, address, pubKey);
          console.log("uInfo :>> ", uInfo);
          storeLocalStorage("Unisat", address, pubKey, address, pubKey);
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
      const response: any = await getAddress({
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
        onFinish: () => {},
        onCancel: () => {},
      });

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
          // signature
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
          storeLocalStorage(
            "Xverse",
            paymentAddress,
            paymentPubkey,
            ordinalAddress,
            ordinalPubkey
          );
          setUserInfo(uInfo);
          setPaymentAddress(paymentAddress);
          setPaymentPubkey(paymentPubkey);
          setOrdinalAddress(ordinalAddress);
          setOrdinalPubkey(ordinalPubkey);
        }
      }
      walletModal.onClose();
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      console.log("xverseConnectWallet error ==> ", error);
      toast.error("Xverse Connect Wallet Error");
    }
  };

  // Leader Connect
  const leaderConnectWallet = async () => {
    // try {
    //   const currentWindow: any = window;
    //   const addressesRes = await currentWindow.btc?.request("getAddresses", {});
    //   const { address, publicKey } = (
    //     addressesRes as any
    //   ).result.addresses.find((address: BtcAddress) => address.type === "p2tr");
    //   const { address: paymentAddress, publicKey: paymentPublickey } = (
    //     addressesRes as any
    //   ).result.addresses.find(
    //     (address: BtcAddress) => address.type === "p2wpkh"
    //   );
    //   const vaultType = paymentAddress.slice(0, 2);
    //   if (vaultType == (TEST_MODE ? "bc" : "tb")) {
    //     Notiflix.Notify.failure("You need to switch your network.");
    //     return;
    //   }
    //   setWalletType(WalletTypes.HIRO);
    //   setPaymentAddress(paymentAddress);
    //   setPaymentPublicKey(paymentPublickey);
    //   setOrdinalAddress(address);
    //   setOrdinalPublicKey(publicKey);
    //   storeLocalStorage(
    //     address,
    //     publicKey,
    //     paymentAddress,
    //     paymentPublickey,
    //     WalletTypes.HIRO
    //   );
    //   Notiflix.Notify.success("Connected Successfully.");
    //   // Register Modal Part
    //   try {
    //     const paymentAddress: string = localStorage.getItem(
    //       "paymentAddress"
    //     ) as string;
    //     const exist = await axios.post(`${baseUrl}/check_user`, {
    //       paymentAddress,
    //     });
    //     console.log("exist :>> ", exist);
    //     if (exist?.data.success && paymentAddress != ADMIN_PAYMENT_ADDRESS) {
    //       registerModal.onOpen();
    //     }
    //   } catch (error) {
    //     console.log("error :>> ", error);
    //   }
    // } catch (err) {
    //   Notiflix.Notify.failure("Connection Canceled");
    // }
  };

  // useEffect(() => {
  //   const autoConnect = async () => {
  //     const storedWallet = localStorage.getItem("wallet");
  //     if (storedWallet) {
  //       const { session } = JSON.parse(storedWallet);
  //       if (session > moment.now() && !loadingRef.current) {
  //         loadingRef.current = true;
  //         await handleConnectWallet();
  //         loadingRef.current = false;
  //       }
  //     }
  //   };

  //   autoConnect();
  // }, []);

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

  return (
    <div className="z-10 p-4 sm:px-12 border-b-0 border-bgColor-stroke w-full font-mono text-sm">
      <div className="flex flex-wrap justify-center md:justify-between items-center bg-gradient-to-t dark:from-black dark:via-black lg:bg-none w-full lg:size-auto">
        
      <div className="flex items-center">
          <Image
            src="/img/runes_logo.png" // Replace with the actual path to your image
            alt="Logo"
            width={150} // Adjust the width as needed
            height={150} // Adjust the height as needed
            className="mr-4" // Add margin to the right of the image
          />
        </div>
        
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
        <div className="flex items-center gap-2">
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
                  {`${displayBtc(userInfo.btcBalance)}`}
                  <span className="text-orange font-bold">BTC</span>
                </div>
                <Button
                  color="warning"
                  onClick={refreshBalance}
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
                // onClick={() => handleConnectWallet()}
                onClick={() => {
                  walletModal.onOpen();
                }}
                className="rounded-md text-white"
                variant="flat"
              >
                Connect Wallet
              </Button>
            )}
          </div>
          <Button
            href={TEST_MODE ? BETA_URL : TEST_URL}
            as={Link}
            color="warning"
            className="rounded-md text-white"
            variant="ghost"
            endContent={<IoIosLink />}
          >
            {TEST_MODE ? "Mainnet" : "Testnet"}
          </Button>
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
        <ModalContent className="w-[90%] sm:w-full bg-bgColor-dark border-2 border-bgColor-stroke p-3">
          {(onClose) => (
            <>
              <ModalBody>
                <div className="w-full h-full flex flex-col gap-3 items-center rounded-xl">
                  <div className="flex flex-col text-black text-[26px]">
                    <p className="text-center font-bold">Connect Wallet</p>
                  </div>
                  <Divider className="bg-warning" />
                  {walletProviders.map((walletProvider, index) => (
                    <Button
                      key={index}
                      className={`flex-row justify-between rounded-2xl w-full p-3 py-7 bg-bgColor-dark hover:brightness-125 duration-300 border-2 border-bgColor-stroke items-center ${
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
                          ></Image>
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
