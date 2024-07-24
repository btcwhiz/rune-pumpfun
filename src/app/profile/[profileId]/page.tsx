"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import copy from "copy-to-clipboard";
import { FaCopy } from "react-icons/fa";

import { getUserInfoByProfileId } from "../../api/requests";
import { Button, Card, CardBody, Tab, Tabs } from "@nextui-org/react";
import { displayAddress } from "../../utils/pump";

export default function Profile() {
  const { profileId } = useParams();
  const [profileInfo, setProfileInfo] = useState<any>({});
  const [runes, setRunes] = useState<any[]>([]);

  const getAllRuneBalances = async () => {
    try {
      const pfp: any = await getUserInfoByProfileId(profileId as string);
      setProfileInfo({
        ...pfp.userInfo,
        multisigWallet: pfp.multisigWallet,
      });
      console.log("pfp.runes :>> ", pfp.runes);
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
        <div className="flex flex-col justify-center w-[700px] max-w-[700px]">
          <div className="flex flex-col justify-center gap-3">
            <div className="flex justify-between gap-3">
              <div>BTC Balance: </div>
              <div>{`${profileInfo?.btcBalance / 10 ** 8} BTC`}</div>
            </div>
            <div className="flex justify-between items-center gap-3">
              <div className="font-bold">Main Wallet: </div>
              <div>{`${displayAddress(profileInfo?.paymentAddress)}`}</div>
              <Button
                color="primary"
                onClick={() => copy(profileInfo?.paymentAddress)}
                className="flex justify-center items-center"
              >
                <FaCopy />
              </Button>
            </div>
            <div className="flex justify-between items-center gap-3">
              <div className="font-bold">Multi Sig Wallet: </div>
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
