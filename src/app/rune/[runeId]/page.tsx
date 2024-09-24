"use client";

import {
  Button,
  Card,
  CardBody,
  Input,
  Progress,
  Tab,
  Tabs,
} from "@nextui-org/react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useContext, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  burnFunc,
  etchingRuneFunc,
  getPumpActionFunc,
  getRuneBalance,
  getRuneInfoFunc,
  preBurn,
  preEtchingRuneFunc,
  pumpBuyFunc,
  pumpPreBuyFunc,
  pumpPreSellFunc,
  pumpSellFunc,
} from "../../api/requests";
import { MainContext } from "../../contexts/MainContext";
import {
  displayAddress,
  displayPercentage,
  unisatSignPsbt,
} from "../../utils/pump";
import { DEFAULT_POOL, SATS_MULTIPLE } from "../../config/config";
// import useSocket from "../../hooks/useSocket";
import { TradingChart } from "../../components/TVChart/TradingChart";
import { coinInfo } from "../../utils/types";
import { calcProgress, displayBtc, getTimeDifference } from "../../utils/util";
import ImageDisplay from "../../components/ImageDIsplay";
import useSocket from "../../hooks/useSocket";

export default function CreateRune() {
  let { runeId }: any = useParams();

  runeId = decodeURIComponent(runeId);

  const [coin, setCoin] = useState<coinInfo>({
    _id: "string",
    runeId,
    name: "Rune Name",
    creator: "Abra",
    ticker: "12345",
    url: "url",
    reserveOne: 100,
    reserveTwo: 123,
    token: "string",
    marketcap: 156743,
    replies: 27,
    description: "This is Description",
    twitter: "twitter",
    date: new Date("2022-07-01"),
  } as coinInfo);
  const { userInfo } = useContext(MainContext);
  const socket = useSocket();

  const [runeInfo, setRuneInfo] = useState<any>({});
  const [runeBalance, setRuneBalance] = useState<number>(0);

  const [target, setTarget] = useState<boolean>(true);

  // Buy
  const [buyFlag, setBuyFlag] = useState<boolean>(false);
  const [buyRuneAmount, setBuyRuneAmount] = useState<string>("");
  const [btcAmount, setBtcAmount] = useState<string>("");
  const [buyPsbtData, setBuyPsbtData] = useState<{
    psbt: string;
    requestId: string;
  }>({ psbt: "", requestId: "" });

  // Sell
  const [sellFlag, setSellFlag] = useState<boolean>(false);
  const [sellRuneAmount, setSellRuneAmount] = useState<string>("");
  const [pumpActions, setPumpActions] = useState<any[]>([]);
  const [process, setProcess] = useState<number>(0);

  // Burn
  const [availableBurn, setAvailableBurn] = useState<string>("");
  const [burnRuneAmount, setBurnRuneAmount] = useState<string>("");
  const [estimateRuneAmount, setEstimateRuneAmount] = useState<string>("");

  const [userList, setUserList] = useState<any[]>([]);

  const [slippage, setSlippage] = useState<string>("3");
  // const [runeId, setRuneId] = useState<string>("");

  const [loading, setLoading] = useState<boolean>(false);
  const [estimatePrice, setEstimatePrice] = useState<number>(0);

  const handlePreBuy = async () => {
    try {
      if (userInfo.userId && runeId) {
        if (target === false && !btcAmount) {
          return toast.error("Please input BTC amount");
        } else if (target === true && !buyRuneAmount) {
          return toast.error("Please input Rune amount");
        }
        setLoading(true);
        const res = await pumpPreBuyFunc(
          userInfo.userId,
          runeId,
          btcAmount,
          buyRuneAmount,
          target,
          slippage
        );
        console.log("res :>> ", res);
        setBuyPsbtData(res?.requestData);
        setLoading(false);
        if (res?.requestData) {
          setBuyFlag(true);
          setSellFlag(false);
          if (target === false) {
            setEstimatePrice(res?.runeAmount);
          } else {
            setEstimatePrice(res?.estimatePrice);
          }
        }
      } else {
        toast.error("Invalid parameters");
      }
    } catch (error) {
      setLoading(false);
      console.log("error :>> ", error);
      toast.error("Something went wrong");
    }
  };

  const handleBuy = async () => {
    try {
      if (
        userInfo.userId &&
        runeId &&
        estimatePrice &&
        slippage &&
        buyPsbtData
      ) {
        if (target === false && !btcAmount) {
          return toast.error("Invalid Parameters");
        } else if (target === true && !buyRuneAmount) {
          return toast.error("Invalid Parameters");
        }
        let runeAmount: any = buyRuneAmount;
        let btcPrice: any = estimatePrice;
        if (target === false) {
          runeAmount = estimatePrice;
          btcPrice = btcAmount;
        }

        setLoading(true);
        const signedPsbt = await unisatSignPsbt(buyPsbtData?.psbt);
        const res = await pumpBuyFunc(
          userInfo.userId,
          runeId,
          runeAmount,
          btcPrice,
          buyPsbtData.requestId,
          slippage,
          signedPsbt
        );
        if (res.success) {
          toast.success(res.msg);
          initialize();
        }
        setBuyFlag(false);
        setLoading(false);
        getRuneBalanceFunc();
        if (socket) {
          socket.emit("update-user", { userId: userInfo.userId });
        }
      } else {
        return toast.error("Invalid parameters");
      }
    } catch (error) {
      setBuyFlag(false);
      setLoading(false);
      console.log("error :>> ", error);
      toast.error("Something went wrong");
    }
  };

  const handlePreSell = async () => {
    try {
      if (userInfo.userId && runeId && sellRuneAmount) {
        setLoading(true);
        const res = await pumpPreSellFunc(
          userInfo.userId,
          runeId,
          sellRuneAmount,
          slippage
        );
        const ePrice = res?.estimatePrice;
        if (ePrice) {
          setEstimatePrice(ePrice);
          setSellFlag(true);
          setBuyFlag(false);
        }
        setLoading(false);
      } else {
        setLoading(false);
        toast.error("Invalid Parameters");
      }
    } catch (error) {
      setLoading(false);
      console.log("error :>> ", error);
      toast.error("Something went wrong");
    }
  };

  const handleSell = async () => {
    try {
      if (
        userInfo.userId &&
        runeId &&
        sellRuneAmount &&
        slippage &&
        estimatePrice
      ) {
        setLoading(true);
        const message = `You will sell ${sellRuneAmount} rune (ID: ${runeId}) and will get ${estimatePrice} BTC`;
        const currentWindow: any = window;
        const signature = await currentWindow?.unisat?.signMessage(message);
        const res = await pumpSellFunc(
          userInfo.userId,
          runeId,
          sellRuneAmount,
          estimatePrice,
          slippage,
          {
            signature,
            message,
          }
        );
        setLoading(false);
        toast.success(res.msg);
        initialize();
        setSellFlag(false);
        setLoading(false);
        getRuneBalanceFunc();
        if (socket) {
          socket.emit("update-user", { userId: userInfo.userId });
        }
      } else {
        toast.error("Invalid parameters");
      }
    } catch (error) {
      setSellFlag(false);
      setLoading(false);
      console.log("error :>> ", error);
      toast.error("Something went wrong");
    }
  };

  const handleBurn = async () => {
    try {
      if (userInfo.userId && runeId && burnRuneAmount) {
        setLoading(true);
        const burnResponse = await preBurn(
          runeId,
          userInfo.userId,
          burnRuneAmount
        );
        console.log("burnResponse :>> ", burnResponse);
        if (burnResponse.success) {
          setEstimateRuneAmount(burnResponse.estimateRuneAmount);
          const signedPsbt = await (window as any).unisat.signPsbt(
            burnResponse?.psbt
          );
          const burnTokenRep = await burnFunc(
            burnResponse.pendingBurnId,
            signedPsbt
          );
          if (burnTokenRep.success === true) {
            toast.success("Success");
          }
        }
        setLoading(false);
        initialize();
        getRuneBalanceFunc();
      } else {
        toast.error("Invalid parameters");
      }
    } catch (error) {
      setSellFlag(false);
      setLoading(false);
      console.log("error :>> ", error);
      toast.error("Something went wrong");
    }
  };

  const initialize = async () => {
    try {
      setLoading(false);

      const pActions: any = await getPumpActionFunc(runeId);
      setPumpActions(pActions.pumpAction);

      const runeIf: any = await getRuneInfoFunc(runeId);
      const rune: any = runeIf?.runeInfo[0];
      const progress = calcProgress(
        rune.remainAmount,
        rune.runeAmount,
        rune.poolstate
      );
      setProcess(progress);
      setRuneInfo(rune);
      setCoin({
        ...coin,
        name: rune.runeName,
      });
      const runes = runeIf?.runeInfo;
      let uList: any[] = [];
      for (let i = 0; i < runes.length; i++) {
        try {
          let userInfo =
            runes[i].runebalance.userInfo[0] || runes[i].runebalance.userInfo;
          let multisig =
            runes[i].runebalance.multisig[0] || runes[i].runebalance.multisig;
          uList.push({
            multisig: multisig.address,
            balance: runes[i].runebalance.balance,
            ...userInfo,
          });
        } catch (error) {}
      }
      setUserList(uList);
    } catch (error) {
      console.log("error :>> ", error);
    }
  };

  useEffect(() => {
    initialize();
    // eslint-disable-next-line
  }, [runeId]);

  const getRuneBalanceFunc = async () => {
    try {
      const rBalance = await getRuneBalance(userInfo.userId, runeId);
      console.log("rBalance :>> ", rBalance);
      setRuneBalance(rBalance.balance);
      setAvailableBurn(rBalance.availableBurn);
    } catch (error) {}
  };

  useEffect(() => {
    userInfo.userId && runeId && getRuneBalanceFunc();
    // eslint-disable-next-line
  }, [userInfo, runeId]);

  // Get Estimate Price if you are in buying

  // Socket Connection
  // useEffect(() => {
  //   if (socket && userInfo) {
  //     socket.current.emit("login", userInfo.userId);
  //     return () => {
  //       socket.current.off("login");
  //     };
  //   }
  //   // eslint-disable-next-line
  // }, [socket, userInfo]);

  // // Get Buy Price Every 3 seconds
  // useEffect(() => {
  //   if (socket) {
  //     const id = setInterval(() => {
  //       if (buyFlag) {
  //         socket.current.emit("lemme-know-buy-price", {
  //           runeId,
  //           buyRuneAmount,
  //         });
  //       }
  //     }, 3000);
  //     return () => clearInterval(id);
  //   }
  //   // eslint-disable-next-line
  // }, [socket, buyFlag, runeId, buyRuneAmount]);

  // // Get Sell Price Every 3 seconds
  // useEffect(() => {
  //   if (socket) {
  //     const id = setInterval(() => {
  //       if (sellFlag) {
  //         socket.current.emit("lemme-know-sell-price", {
  //           runeId,
  //           sellRuneAmount,
  //         });
  //       }
  //     }, 3000);
  //     return () => clearInterval(id);
  //   }
  //   // eslint-disable-next-line
  // }, [socket, sellFlag, runeId, sellRuneAmount]);

  // useEffect(() => {
  //   if (socket) {
  //     socket.current.on("buy-price", (data: any) => {
  //       setEstimatePrice(data.estimatePrice || 0);
  //     });
  //     socket.current.on("sell-price", (data: any) => {
  //       setEstimatePrice(data.estimatePrice || 0);
  //     });
  //     return () => {
  //       socket.current.off("buy-price");
  //       socket.current.off("sell-price");
  //     };
  //   }
  // }, [socket]);

  return (
    <main className="p-3 min-h-screen">
      <div className="flex flex-col gap-3">
        <div className="flex justify-center">
          <Link className="p-3 border rounded-xl" href={"/"}>
            Go Back
          </Link>
        </div>
        <div className="gap-3 grid grid-cols-3 p-5">
          <div className="flex flex-col gap-5 col-span-2">
            <div>
              <div className="flex justify-between items-center py-2">
                <div className="flex items-center gap-2">
                  <div><span className="text-orange">Ticker:</span> {runeInfo.runeName}</div>
                  <div className="text-orange">
                    {`Marketcap: 
                      ${displayBtc(
                        runeInfo.runeAmount *
                          (runeInfo.pool / runeInfo.remainAmount)
                      )}
                    BTC`}
                  </div>
                </div>
                <div>
                  <div>
                    <span className="text-orange">created by</span>{" "}
                    {`${
                      runeInfo.creatorAddress &&
                      runeInfo.creatorAddress.slice(0, 5)
                    }...`}
                  </div>
                </div>
              </div>
              <TradingChart param={coin}></TradingChart>
            </div>
            <div>
              {/* Transaction History */}
              <Tabs aria-label="Options" color="primary">
                <Tab key="trades" title="Trades">
                  <Card>
                    <CardBody>
                      <div>
                        <div>Transaction History</div>
                        <div className="flex items-center">
                          <div className="w-10">No</div>
                          <div className="gap-3 grid grid-cols-5 w-full">
                            <div>Type</div>
                            <div>Symbol</div>
                            <div>Rune</div>
                            <div>BTC</div>
                            <div>Date</div>
                          </div>
                        </div>
                        {pumpActions.map((item, index) => (
                          <div key={index} className="flex items-center">
                            <div className="w-10">{index + 1}</div>
                            <div className="gap-3 grid grid-cols-5 w-full">
                              <div>
                                {item.type == 0 && "Buy"}
                                {item.type == 1 && "Sell"}
                                {item.type == 2 && "Burn"}
                              </div>
                              <div>{item.runeSymbol}</div>
                              <div>{item.runeAmount}</div>
                              <div>
                                {(item.btcAmount / SATS_MULTIPLE).toFixed(12)}
                              </div>
                              <div>{getTimeDifference(item.created_at)}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardBody>
                  </Card>
                </Tab>
                <Tab key="thread" title="Thread">
                  <Card>
                    <CardBody>
                      <div>Thread</div>
                    </CardBody>
                  </Card>
                </Tab>
              </Tabs>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <Tabs aria-label="Options" color="primary">
              <Tab key="buy" title="Buy">
                <Card>
                  <CardBody className="flex flex-col gap-3">
                    {/* Buy */}
                    <div className="flex justify-around">
                      <div>Your balance</div>
                      <div>{runeBalance}</div>
                    </div>
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-col gap-3">
                        <Button
                          color="primary"
                          onClick={() => {
                            setBuyFlag(false);
                            setTarget(!target);
                          }}
                        >
                          {`switch to ${
                            target === true ? "BTC" : runeInfo?.runeName
                          }`}
                        </Button>
                        {target === true ? (
                          <Input
                            type="text"
                            label="Rune Amount"
                            value={buyRuneAmount}
                            disabled={loading}
                            onChange={(e) => {
                              setBuyFlag(false);
                              setBuyRuneAmount(e.target.value);
                            }}
                          />
                        ) : (
                          <Input
                            type="text"
                            label="BTC Amount"
                            value={btcAmount}
                            disabled={loading}
                            onChange={(e) => {
                              setBuyFlag(false);
                              setBtcAmount(e.target.value);
                            }}
                          />
                        )}

                        <Input
                          type="number"
                          label="Slippage (%)"
                          value={`${slippage}`}
                          disabled={loading}
                          min={0}
                          onChange={(e) => {
                            setBuyFlag(false);
                            setSlippage(e.target.value);
                          }}
                        />
                        {buyFlag ? (
                          <div className="flex flex-col items-center gap-3">
                            <div>
                              {target === false
                                ? `You would get ${estimatePrice} ${runeInfo.runeName}`
                                : `You should pay ${
                                    estimatePrice / 10 ** 8
                                  } btc`}
                            </div>
                            <Button
                              color="success"
                              onClick={() => handleBuy()}
                              isLoading={loading}
                            >
                              Confirm
                            </Button>
                          </div>
                        ) : (
                          <Button
                            color="success"
                            onClick={() => handlePreBuy()}
                            isLoading={loading}
                            // disabled={runeInfo.poolstate === 1}
                          >
                            Buy
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </Tab>
              <Tab key="sell" title="Sell">
                <Card>
                  <CardBody className="flex gap-3">
                    <div className="flex justify-around">
                      <div>Your balance</div>
                      <div>{runeBalance}</div>
                    </div>
                    {/* Sell */}
                    <div className="flex flex-col gap-3">
                      <div className="text-center">Sell</div>
                      <div className="flex flex-col gap-3">
                        {/* <Input
                          type="text"
                          label="Rune ID"
                          value={runeId}
                          onChange={(e) => {
                            setSellFlag(false);
                            setRuneId(e.target.value);
                          }}
                        /> */}
                        <Input
                          type="text"
                          label="Sell Rune Amount"
                          value={sellRuneAmount}
                          disabled={loading}
                          onChange={(e) => {
                            setSellFlag(false);
                            setSellRuneAmount(e.target.value);
                          }}
                        />
                        <Input
                          type="number"
                          label="Slippage (%)"
                          value={`${slippage}`}
                          disabled={loading}
                          min={0}
                          onChange={(e) => {
                            setSellFlag(false);
                            setSlippage(e.target.value);
                          }}
                        />
                        {sellFlag ? (
                          <div className="flex flex-col items-center gap-3">
                            <div>{`You would get ${
                              estimatePrice / SATS_MULTIPLE
                            } btc`}</div>
                            <Button
                              color="danger"
                              onClick={() => handleSell()}
                              isLoading={loading}
                            >
                              Confirm
                            </Button>
                          </div>
                        ) : (
                          <Button
                            color="danger"
                            onClick={() => handlePreSell()}
                            isLoading={loading}
                            // disabled={runeInfo.poolstate === 1}
                          >
                            Sell
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </Tab>
              <Tab key="burn" title="Burn">
                <Card>
                  <CardBody className="flex gap-3">
                    <div className="flex justify-around">
                      <div>Available Burn Balance</div>
                      <div>{availableBurn}</div>
                    </div>
                    {/* Sell */}
                    <div className="flex flex-col gap-3">
                      <div className="text-center">Burn</div>
                      <div className="flex flex-col gap-3">
                        <Input
                          type="text"
                          label="Burn Rune Amount"
                          value={burnRuneAmount}
                          disabled={loading}
                          onChange={(e) => setBurnRuneAmount(e.target.value)}
                        />
                        {estimateRuneAmount && (
                          <div className="flex items-center gap-1 pl-2">
                            <div>You will get</div>
                            <div>{`${estimateRuneAmount} runes`}</div>
                          </div>
                        )}
                        <Button
                          color="danger"
                          onClick={() => handleBurn()}
                          isLoading={loading}
                        >
                          Burn
                        </Button>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </Tab>
            </Tabs>
            <div>
              {runeInfo?.image && (
                <ImageDisplay
                  src={`${runeInfo?.image[0]?.imageString || ""}`}
                ></ImageDisplay>
              )}
            </div>
            <div className="flex justify-start gap-5">
              {runeInfo?.twitter ? (
                <Link href={runeInfo?.twitter} target="_blank">
                  {`[twitter]`}
                </Link>
              ) : (
                <></>
              )}
              {runeInfo?.telegram ? (
                <Link href={runeInfo?.telegram} target="_blank">
                  {`[telegram]`}
                </Link>
              ) : (
                <></>
              )}
              {runeInfo?.website ? (
                <Link href={runeInfo?.website} target="_blank">
                  {`[website]`}
                </Link>
              ) : (
                <></>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center gap-2">
                <span>Stage</span>
                <span>{runeInfo?.stage + 1}</span>
              </div>
              <div className="flex justify-between items-center gap-2">
                <span>Rune ID</span>
                <span>{runeInfo?.runeId}</span>
              </div>
              <div className="flex justify-between items-center gap-2">
                <span>Rune Symbol</span>
                <span>{runeInfo?.runeSymbol}</span>
              </div>
              <div className="flex justify-between items-center gap-2">
                <span>Rune Name</span>
                <span>{runeInfo?.runeName}</span>
              </div>
              <div className="flex justify-between items-center gap-2">
                <span>Rune Description</span>
                <span>{runeInfo?.runeDescription}</span>
              </div>
              <div className="flex justify-between items-center gap-2">
                <span>Remain Amount</span>
                <span>{runeInfo?.remainAmount}</span>
              </div>
              <div className="flex justify-between items-center gap-2">
                <span>Price</span>
                <span>{`${runeInfo?.pool / runeInfo?.remainAmount} sats`}</span>
              </div>
              <div className="flex justify-between items-center gap-2">
                <span>Marketcap</span>
                <span>{`${displayBtc(
                  runeInfo.runeAmount * (runeInfo.pool / runeInfo.remainAmount)
                )} BTC`}</span>
              </div>
              <div className="flex justify-between items-center gap-2">
                <span>BTC collected</span>
                <span>{`${displayBtc(runeInfo.pool - DEFAULT_POOL)} BTC`}</span>
              </div>
              <div className="flex flex-col items-start gap-2">
                <span>{`bonding curve progress: ${process}%`}</span>
                <Progress size="md" aria-label="Loading..." value={process} />
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center font-bold text-xl">
                <div>Holder distribution</div>
                <div>{userList.length}</div>
              </div>
              <div>
                <div className="flex justify-between">
                  <div>Bonding Curve</div>
                  <div>
                    {`${displayPercentage(
                      runeInfo.remainAmount,
                      runeInfo.runeAmount,
                      runeInfo.poolstate
                    )}%`}
                  </div>
                </div>
                {userList.map((item: any, index: number) => (
                  <div key={index} className="flex justify-between">
                    <Link
                      className="font-bold underline"
                      target="_blink"
                      href={`https://mempool.space/testnet/address/${item.multisig}`}
                    >
                      {`${displayAddress(item.multisig)} ${
                        item.ordinalAddress == runeInfo.creatorAddress
                          ? "Owner "
                          : ""
                      } ${
                        item.ordinalAddress == userInfo.ordinalAddress
                          ? "You"
                          : ""
                      }`}
                    </Link>
                    <div>
                      {`${displayPercentage(
                        item.balance,
                        runeInfo.runeAmount,
                        runeInfo.poolstate
                      )}%`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
