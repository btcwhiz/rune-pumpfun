"use client";

import React, { useContext, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import copy from "copy-to-clipboard";
import { FaCopy, FaEdit, FaSave } from "react-icons/fa";

import { getUserInfoByProfileId, updateUserProfile } from "../../api/requests";
import { Button, Card, CardBody, Input, Tab, Tabs } from "@nextui-org/react";
import { displayAddress } from "../../utils/pump";
import { MainContext } from "../../contexts/MainContext";

export default function Profile() {
  const router = useRouter();
  const { profileId } = useParams();
  const { userInfo } = useContext(MainContext);

  const [profileInfo, setProfileInfo] = useState<any>({});
  const [runes, setRunes] = useState<any[]>([]);
  const [isEditable, setIsEditable] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [pId, setPId] = useState<string>(profileId as string);

  const handleChangeProfile = async () => {
    const rep: any = await updateUserProfile(profileId as string, pId);
    console.log("rep :>> ", rep);
    if (rep.status) {
      router.push(`./${pId}`);
    }
  };

  const getAllRuneBalances = async () => {
    try {
      const pfp: any = await getUserInfoByProfileId(profileId as string);
      setProfileInfo({
        ...pfp.userInfo,
        multisigWallet: pfp.multisigWallet,
      });
      setRunes(pfp.runes);
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
            <Tabs aria-label="Options" color="primary">
              <Tab key="runes" title="Runes">
                <Card>
                  <CardBody>
                    <div>Runes</div>
                    <hr />
                    <div className="flex flex-col gap-2">
                      {runes.map((rune: any, index: number) => (
                        <Link
                          key={index}
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
                            <hr />
                          </div>
                        </Link>
                      ))}
                    </div>
                  </CardBody>
                </Card>
              </Tab>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
