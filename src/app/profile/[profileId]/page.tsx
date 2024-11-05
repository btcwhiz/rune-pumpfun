"use client";

import React, { useContext, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import copy from "copy-to-clipboard";
import { FaCopy, FaEdit, FaSave } from "react-icons/fa";
import toast from "react-hot-toast";

import {
  authUser,
  getUserInfoByProfileId,
  preWithdrawFunc,
  updateUserProfile,
  withdrawFunc,
} from "../../api/requests";
import {
  Button,
  Card,
  CardBody,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Tab,
  Tabs,
  useDisclosure,
} from "@nextui-org/react";
import { displayAddress, unisatSignPsbt } from "../../utils/pump";
import { MainContext } from "../../contexts/MainContext";
import PumpInput from "../../components/PumpInput";
import { IoMdCloseCircle } from "react-icons/io";

export default function Profile() {
  const router = useRouter();
  const { profileId } = useParams();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { userInfo, setUserInfo } = useContext(MainContext);

  const [profileInfo, setProfileInfo] = useState<any>({});
  const [runes, setRunes] = useState<any[]>([]);
  const [myRunes, setMyRunes] = useState<any[]>([]);
  const [isEditable, setIsEditable] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [pId, setPId] = useState<string>(profileId as string);

  const [runeId, setRuneId] = useState<string>("");
  const [runeAmount, setRuneAmount] = useState<string>("");

  const handleChangeProfile = async () => {
    const rep: any = await updateUserProfile(profileId as string, pId);
    if (rep.status) {
      const user = await authUser(
        rep.userInfo.paymentAddress,
        rep.userInfo.paymentPublicKey,
        rep.userInfo.ordinalAddress,
        rep.userInfo.ordinalPublicKey
      );
      setUserInfo(user);
      router.push(`./${pId}`);
    }
  };

  const handleWithdraw = async () => {
    try {
      if (!runeId) {
        toast.error("Please input rune ID");
        return;
      }
      const rAmount = Number(runeAmount);
      if (!rAmount) {
        toast.error("Please input rune amount");
        return;
      }
      if (userInfo.userId) {
        setLoading(true);
        const preWithdrawRes = await preWithdrawFunc(
          userInfo.userId,
          runeId,
          rAmount
        );
        if (runeId === "btc") {
          const signedPsbt = await unisatSignPsbt(preWithdrawRes?.psbt);
          const withdrawRes = await withdrawFunc(
            userInfo.userId,
            runeId,
            rAmount,
            preWithdrawRes.requestId,
            signedPsbt
          );
          toast.success(withdrawRes.msg);
        } else {
          const withdrawRes = await withdrawFunc(
            userInfo.userId,
            runeId,
            rAmount,
            preWithdrawRes.requestId,
            ""
          );
          toast.success(withdrawRes.msg);
        }
        setRuneAmount("");
        getAllRuneBalances();
        onClose();
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

  const getAllRuneBalances = async () => {
    try {
      const pfp: any = await getUserInfoByProfileId(profileId as string);
      setProfileInfo({
        ...pfp.userInfo,
        multisigWallet: pfp.multisigWallet,
      });
      // console.log("pfp.runes :>> ", pfp.runes);
      setRunes(pfp.runes);
      setMyRunes(
        pfp.runes.filter(
          (item: any) => item.creatorAddress === userInfo.paymentAddress
        )
      );
    } catch (error) {}
  };

  useEffect(() => {
    if (profileId) getAllRuneBalances();

    // eslint-disable-next-line
  }, [profileId]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-center p-3 md:pt-20">
        <div className="flex flex-col justify-center gap-3 border-2 bg-bgColor-ghost p-6 border-bgColor-stroke rounded-xl w-[92vw] md:w-[700px]">
          <div className="py-3 font-bold text-2xl text-center">
            User Profile
          </div>
          <div className="flex items-center">
            <div className="flex items-center gap-3 w-full">
              <PumpInput
                className="w-full text-ellipsis"
                value={pId}
                disabled={!isEditable}
                onChange={setPId}
              ></PumpInput>
              {
                <div className="flex gap-2">
                  {profileId === userInfo.profileId ? (
                    pId !== profileId ? (
                      <Button
                        color="warning"
                        variant="flat"
                        onClick={() => handleChangeProfile()}
                        isIconOnly
                      >
                        <FaSave />
                      </Button>
                    ) : (
                      <Button
                        color="warning"
                        variant="flat"
                        onClick={() => {
                          setIsEditable(!isEditable);
                        }}
                        isIconOnly
                      >
                        <FaEdit />
                      </Button>
                    )
                  ) : (
                    <></>
                  )}
                  <div>
                    {isEditable && (
                      <Button
                        color="warning"
                        variant="flat"
                        onClick={() => {
                          setIsEditable(!isEditable);
                        }}
                        isIconOnly
                      >
                        <IoMdCloseCircle />
                      </Button>
                    )}
                  </div>
                </div>
              }
            </div>
          </div>
          <div className="flex flex-col justify-center gap-3">
            <div className="flex justify-between gap-3">
              <div>BTC Balance: </div>
              <div>{`${profileInfo?.btcBalance / 10 ** 8} BTC`}</div>
            </div>
            <div className="flex justify-between items-center gap-3">
              <div className="font-bold">Main Wallet: </div>
              <div className="flex items-center gap-2">
                <div>{`${displayAddress(profileInfo?.paymentAddress)}`}</div>
                <Button
                  color="warning"
                  variant="flat"
                  onClick={() => copy(profileInfo?.paymentAddress)}
                  className="flex justify-center items-center"
                  isIconOnly
                >
                  <FaCopy />
                </Button>
              </div>
            </div>
            <div className="flex justify-between items-center gap-3">
              <div className="font-bold">Multi Sig Wallet: </div>
              <div className="flex items-center gap-2">
                <div>{`${displayAddress(profileInfo?.multisigWallet)}`}</div>
                <Button
                  color="warning"
                  variant="flat"
                  onClick={() => copy(profileInfo?.multisigWallet)}
                  className="flex justify-center items-center"
                  isIconOnly
                >
                  <FaCopy />
                </Button>
              </div>
            </div>
          </div>
          <div>
            <Tabs aria-label="Options" color="warning" variant="underlined">
              <Tab key="runes-held" title="Runes Held">
                <Card className="border-2 bg-bgColor-ghost border-bgColor-stroke text-white">
                  <CardBody>
                    <div className="py-3 font-bold text-center text-xl">
                      Runes Held
                    </div>
                    <hr />
                    <div className="flex flex-col gap-2">
                      {runes.map((rune: any, index: number) => (
                        <div key={index}>
                          <div className="flex justify-between items-center gap-2">
                            <Link
                              href={`${
                                rune.runeId
                                  ? `/rune/${encodeURIComponent(rune.runeId)}`
                                  : `#`
                              }`}
                              className="w-full"
                            >
                              <div className="flex flex-col gap-1 py-2">
                                <div className="flex justify-between items-center gap-2">
                                  <span>Rune Name</span>
                                  <span>{rune?.runeName}</span>
                                </div>
                                <div className="flex justify-between items-center gap-2">
                                  <div>Balance: </div>
                                  <div>{rune.balance ? rune.balance : 0}</div>
                                </div>
                              </div>
                            </Link>
                            <Button
                              onClick={() => {
                                setRuneId(rune.runeId);
                                onOpen();
                              }}
                              color="warning"
                              variant="flat"
                              disabled={rune.balance ? false : true}
                            >
                              Withdraw
                            </Button>
                          </div>
                          <hr />
                        </div>
                      ))}
                    </div>
                  </CardBody>
                </Card>
              </Tab>
              <Tab key="runes-created" title="Runes Created">
                <Card className="border-2 bg-bgColor-ghost border-bgColor-stroke text-white">
                  <CardBody>
                    <div className="py-3 font-bold text-center text-xl">
                      Runes Created
                    </div>
                    <hr />
                    <div className="flex flex-col gap-2">
                      {myRunes.map((rune: any, index: number) => (
                        <div key={index}>
                          <div className="flex justify-between items-center gap-2">
                            <Link
                              href={`${
                                rune.runeId
                                  ? `/rune/${encodeURIComponent(rune.runeId)}`
                                  : `#`
                              }`}
                              className="w-full"
                            >
                              <div className="flex flex-col gap-1 hover:bg-foreground-300 p-2">
                                <div className="flex justify-between items-center gap-2">
                                  <span>Rune Name</span>
                                  <span>{rune?.runeName}</span>
                                </div>
                                <div className="flex justify-between items-center gap-2">
                                  <div>Balance: </div>
                                  <div>{rune.balance ? rune.balance : 0}</div>
                                </div>
                              </div>
                            </Link>
                            <Button
                              onClick={() => {
                                setRuneId(rune.runeId);
                                onOpen();
                              }}
                              color="warning"
                              variant="flat"
                            >
                              Withdraw
                            </Button>
                          </div>
                          <hr />
                        </div>
                      ))}
                    </div>
                  </CardBody>
                </Card>
              </Tab>
            </Tabs>
          </div>
        </div>
      </div>

      <Modal size={"xs"} isOpen={isOpen} onClose={onClose}>
        <ModalContent className="bg-dark">
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Withdraw Rune
              </ModalHeader>
              <ModalBody>
                <Input
                  type="text"
                  label="Rune Amount"
                  color="warning"
                  variant="bordered"
                  value={runeAmount}
                  onChange={(e) => setRuneAmount(e.target.value)}
                />
              </ModalBody>
              <ModalFooter>
                <Button
                  color="warning"
                  variant="flat"
                  onPress={() => handleWithdraw()}
                >
                  Withdraw
                </Button>
                <Button color="warning" variant="light" onPress={onClose}>
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
