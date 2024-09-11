"use client";

import React, { useContext, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import copy from "copy-to-clipboard";
import { FaCopy, FaEdit, FaSave } from "react-icons/fa";

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
import toast from "react-hot-toast";

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
      if (userInfo.userId && runeId && runeAmount) {
        console.log(
          "userInfo.userId, runeId && runeAmount :>> ",
          userInfo.userId,
          runeId,
          runeAmount
        );
        setLoading(true);
        const preWithdrawRes = await preWithdrawFunc(
          userInfo.userId,
          runeId,
          runeAmount
        );
        console.log("preWithdrawRes :>> ", preWithdrawRes);
        if (runeId === "btc") {
          const signedPsbt = await unisatSignPsbt(preWithdrawRes?.psbt);
          const withdrawRes = await withdrawFunc(
            userInfo.userId,
            runeId,
            runeAmount,
            preWithdrawRes.requestId,
            signedPsbt
          );
          console.log("withdrawRes :>> ", withdrawRes);
          toast.success(withdrawRes.msg);
        } else {
          const withdrawRes = await withdrawFunc(
            userInfo.userId,
            runeId,
            runeAmount,
            preWithdrawRes.requestId,
            ""
          );
          console.log("withdrawRes :>> ", withdrawRes);
          toast.success(withdrawRes.msg);
        }
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
      <div className="flex justify-center">
        <Link className="p-3 border rounded-xl" href={"/"}>
          Go Back
        </Link>
      </div>
      <div className="flex justify-center">
        <div className="flex flex-col justify-center gap-3 w-[700px] max-w-[700px]">
          <div className="flex items-center">
            <div className="flex items-center gap-3 w-full">
              <Input
                className="w-full text-ellipsis"
                value={pId}
                disabled={!isEditable}
                onChange={(e) => {
                  if (isEditable) setPId(e.target.value);
                }}
              ></Input>
              {profileId === userInfo.profileId ? (
                pId !== profileId ? (
                  <Button color="primary" onClick={() => handleChangeProfile()}>
                    <FaSave />
                  </Button>
                ) : (
                  <Button
                    color="primary"
                    onClick={() => {
                      setIsEditable(!isEditable);
                    }}
                  >
                    <FaEdit />
                  </Button>
                )
              ) : (
                <></>
              )}
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
                  color="primary"
                  onClick={() => copy(profileInfo?.paymentAddress)}
                  className="flex justify-center items-center"
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
                  color="primary"
                  onClick={() => copy(profileInfo?.multisigWallet)}
                  className="flex justify-center items-center"
                >
                  <FaCopy />
                </Button>
              </div>
            </div>
          </div>
          <div>
            <Tabs
              aria-label="Options"
              color="primary"
              className="bg-dark text-primary-50"
            >
              <Tab key="runes-held" title="Runes Held">
                <Card>
                  <CardBody>
                    <div>Runes Held</div>
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
                              color="primary"
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
                <Card>
                  <CardBody>
                    <div>Runes Created</div>
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
                              color="primary"
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
                  value={runeAmount}
                  onChange={(e) => setRuneAmount(e.target.value)}
                />
              </ModalBody>
              <ModalFooter>
                <Button color="primary" onPress={() => handleWithdraw()}>
                  Withdraw
                </Button>
                <Button color="danger" variant="light" onPress={onClose}>
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
