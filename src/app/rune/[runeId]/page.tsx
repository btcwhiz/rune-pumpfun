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
import { useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  burnFunc,
  getPumpActionFunc,
  getRuneBalance,
  getRuneInfoFunc,
  preBurn,
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
import { DEFAULT_POOL, SATS_MULTIPLE, testVersion } from "../../config/config";
import { TradingChart } from "../../components/TVChart/TradingChart";
import { coinInfo } from "../../utils/types";
import {
  calcAvailableRune,
  calcProgress,
  displayBtc,
  getTimeDifference,
  getWallet,
} from "../../utils/util";
import ImageDisplay from "../../components/ImageDIsplay";
import useSocket from "../../hooks/useSocket";
import { InputStyles } from "../../components/PumpInput";
import { XverseSignPsbt } from "../../utils/transaction";
import { TEST_MODE } from "../../config";
import { BitcoinNetworkType, signMessage } from "sats-connect";

export default function CreateRune() {
  let { runeId }: any = useParams();

  runeId = decodeURIComponent(runeId);

  const [coin, setCoin] = useState<coinInfo>({
    _id: "string",
    runeId,
    name: "Rune Name",
    creator: "Runed.com",
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
  const { socket, isConnected } = useSocket();

  const [runeInfo, setRuneInfo] = useState<any>({});
  const [runeBalance, setRuneBalance] = useState<number>(0);

  const [target, setTarget] = useState<boolean>(false);

  // Buy
  const [buyFlag, setBuyFlag] = useState<boolean>(false);
  const [buyRuneAmount, setBuyRuneAmount] = useState<string>("");
  const [btcAmount, setBtcAmount] = useState<string>("");
  const [buyPsbtData, setBuyPsbtData] = useState<{
    psbt: string;
    inputsToSign: any;
    requestId: string;
  }>({ psbt: "", inputsToSign: [], requestId: "" });

  // Sell
  const [sellFlag, setSellFlag] = useState<boolean>(false);
  const [sellRuneAmount, setSellRuneAmount] = useState<string>("");
  const [pumpActions, setPumpActions] = useState<any[]>([]);
  const [process, setProcess] = useState<number>(0);

  const [stage, setStage] = useState<string>("info");

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
      if (userInfo?.userId && runeId) {
        if (target === false && !btcAmount) {
          return toast.error("Please input BTC amount");
        } else if (target === true && !buyRuneAmount) {
          return toast.error("Please input Rune amount");
        }
        setLoading(true);
        const res = await pumpPreBuyFunc(
          userInfo?.userId,
          runeId,
          btcAmount,
          buyRuneAmount,
          target,
          slippage
        );
        // console.log("res :>> ", res);
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
        return toast.error("Please connect wallet");
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
        userInfo?.userId &&
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
        let signedPsbt = "";
        const storedWallet = getWallet();
        if (storedWallet.type === "Unisat") {
          signedPsbt = await unisatSignPsbt(buyPsbtData?.psbt);
        } else if (storedWallet.type === "Xverse") {
          const { signedPSBT } = await XverseSignPsbt(
            buyPsbtData?.psbt,
            buyPsbtData?.inputsToSign
          );
          signedPsbt = signedPSBT;
        } else {
          signedPsbt = await unisatSignPsbt(buyPsbtData?.psbt);
        }
        const res = await pumpBuyFunc(
          userInfo?.userId,
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
        if (socket && isConnected) {
          socket.emit("update-user", { userId: userInfo?.userId });
        }
      } else {
        return toast.error("Please connect wallet");
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
      if (userInfo?.userId && runeId && sellRuneAmount) {
        setLoading(true);
        const res = await pumpPreSellFunc(
          userInfo?.userId,
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
        return toast.error("Please connect wallet");
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
        userInfo?.userId &&
        runeId &&
        sellRuneAmount &&
        slippage &&
        estimatePrice
      ) {
        setLoading(true);
        const message = `You will sell ${sellRuneAmount} rune (ID: ${runeId}) and will get ${displayBtc(
          estimatePrice
        )} BTC`;
        const currentWindow: any = window;
        let signature = "";
        const storedWallet = getWallet();
        if (storedWallet.type === "Unisat") {
          signature = await currentWindow?.unisat?.signMessage(message);
        } else if (storedWallet.type === "Xverse") {
          await signMessage({
            payload: {
              network: {
                type: TEST_MODE
                  ? BitcoinNetworkType.Testnet
                  : BitcoinNetworkType.Mainnet,
              },
              address: userInfo?.paymentAddress as string,
              message: message,
            },
            onFinish: (response: any) => {
              // signature
              signature = response;
              return response;
            },
            onCancel: () => {},
          });
        } else {
          signature = await currentWindow?.unisat?.signMessage(message);
        }
        if (signature) {
          const res = await pumpSellFunc(
            userInfo?.userId,
            runeId,
            sellRuneAmount,
            estimatePrice,
            slippage,
            {
              signature,
              message,
            }
          );
          if (res.success) {
            toast.success(res.msg);
            initialize();
            getRuneBalanceFunc();
            if (socket) {
              socket.emit("update-user", { userId: userInfo?.userId });
            }
          }
        }
        setSellFlag(false);
        setLoading(false);
      } else {
        return toast.error("Please connect wallet");
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
      if (userInfo?.userId && runeId && burnRuneAmount) {
        setLoading(true);
        const storedWallet = getWallet();
        const burnResponse = await preBurn(
          runeId,
          userInfo?.userId,
          burnRuneAmount,
          storedWallet.type
        );
        if (burnResponse.success) {
          setEstimateRuneAmount(burnResponse.estimateRuneAmount);
          let signedPsbt = "";
          if (storedWallet.type === "Unisat") {
            signedPsbt = await (window as any).unisat.signPsbt(
              burnResponse?.psbt
            );
          } else if (storedWallet.type === "Xverse") {
            const { signedPSBT } = await XverseSignPsbt(
              burnResponse?.psbt,
              burnResponse?.inputsToSign
            );
            signedPsbt = signedPSBT;
          } else {
            signedPsbt = await (window as any).unisat.signPsbt(
              burnResponse?.psbt
            );
          }
          const burnTokenRep = await burnFunc(
            burnResponse.pendingBurnId,
            signedPsbt,
            storedWallet.type
          );
          if (burnTokenRep.success === true) {
            toast.success("Success");
          }
        }
        setLoading(false);
        initialize();
        getRuneBalanceFunc();
      } else {
        return toast.error("Please connect wallet");
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
      uList = uList.sort((a: any, b: any) => b.balance - a.balance);
      setUserList(uList);
    } catch (error) {
      console.log("error :>> ", error);
    }
  };

  const handleMaxAmount = async (target: boolean) => {
    if (target === true) {
      const maxAmount = calcAvailableRune(
        runeInfo.stage,
        runeInfo.runeAmount,
        runeInfo.remainAmount,
        runeInfo.stage2Percent,
        runeInfo.dexPercent
      );
      setBuyRuneAmount(`${maxAmount}`);
    } else {
      console.log("max btc");
    }
  };

  useEffect(() => {
    initialize();
    // eslint-disable-next-line
  }, [runeId]);

  const getRuneBalanceFunc = async () => {
    try {
      const rBalance = await getRuneBalance(userInfo?.userId, runeId);
      setRuneBalance(rBalance.balance);
      setAvailableBurn(rBalance.availableBurn);
    } catch (error) {}
  };

  useEffect(() => {
    userInfo?.userId && runeId && getRuneBalanceFunc();
    // eslint-disable-next-line
  }, [userInfo, runeId]);

  // Transaction History Stage
  const TransactionHistory = () => {
    return (
      <div>
        {/* Transaction History */}
        <Tabs aria-label="Options" color="warning" variant="underlined">
          <Tab key="trades" title="Trades">
            <Card className="border-2 bg-bgColor-ghost border-bgColor-stroke text-white">
              <CardBody>
                <div>
                  <div className="py-3 font-bold text-center text-lg">
                    Transaction History
                  </div>
                  <div className="flex items-center">
                    <div className="w-10">No</div>
                    <div className="gap-3 grid grid-cols-4 w-full">
                      <div>Type</div>
                      <div>Rune</div>
                      <div>BTC</div>
                      <div>Date</div>
                    </div>
                  </div>
                  {pumpActions.map((item, index) => (
                    <div key={index} className="flex items-center">
                      <div className="w-10">{index + 1}</div>
                      <div className="gap-3 grid grid-cols-4 w-full">
                        <div>
                          {item.type == 0 && "Buy"}
                          {item.type == 1 && "Sell"}
                          {item.type == 2 && "Burn"}
                        </div>
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
            <Card className="border-2 bg-bgColor-ghost border-bgColor-stroke text-white">
              <CardBody>
                <div className="py-3 font-bold text-center text-lg">Thread</div>
              </CardBody>
            </Card>
          </Tab>
        </Tabs>
      </div>
    );
  };

  // Rune Info Stage
  const RuneTokenInfo = () => {
    return (
      <div className="flex flex-col gap-3">
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
                  href={`https://mempool.space${
                    testVersion ? "/testnet" : ""
                  }/address/${item.multisig}`}
                >
                  {`${displayAddress(item.multisig)} ${
                    item.ordinalAddress == runeInfo.creatorAddress
                      ? "Owner "
                      : ""
                  } ${
                    item.ordinalAddress == userInfo?.ordinalAddress ? "You" : ""
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
    );
  };

  return (
    <main className="p-3 min-h-screen">
      <div className="flex flex-col gap-3">
        <div className="gap-3 hidden md:grid grid-cols-3 p-5">
          <div className="flex flex-col gap-5 col-span-2">
            <div>
              <div className="flex justify-between items-center py-2">
                <div className="flex items-center gap-2">
                  <div>
                    <span>Ticker: </span>
                    <span>{runeInfo?.runeName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>Marketcap: </span>
                    <div className="text-green">
                      {`${displayBtc(
                        runeInfo.runeAmount *
                          (runeInfo.pool / runeInfo.remainAmount)
                      )} BTC`}
                    </div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span>Created by</span>
                    <span className="text-pink">
                      {`${
                        runeInfo.creatorAddress &&
                        runeInfo.creatorAddress.slice(0, 5)
                      }...`}
                    </span>
                  </div>
                </div>
              </div>
              <TradingChart param={coin}></TradingChart>
            </div>
            <TransactionHistory />
          </div>
          <div className="flex flex-col gap-3">
            {/* Buy Sell */}
            <Tabs aria-label="Options" color="warning" variant="underlined">
              <Tab key="buy" title="Buy">
                <Card className="border-2 bg-bgColor-ghost border-bgColor-stroke text-white">
                  <CardBody className="flex flex-col gap-3">
                    {/* Buy */}
                    {/* Your Balance */}
                    <div className="flex flex-row justify-between text-pink">
                      <div>Your balance</div>
                      <div>{runeBalance}</div>
                    </div>
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-col gap-3">
                        <Button
                          className="bg-bgColor-pink/[.5] text-white"
                          variant="flat"
                          onClick={() => {
                            setBuyFlag(false);
                            setTarget(!target);
                          }}
                        >
                          {`Switch to ${
                            target === true ? "BTC" : runeInfo?.runeName
                          }`}
                        </Button>
                        {target === true ? (
                          <Input
                            type="text"
                            label="Rune Amount"
                            className="text-pink"
                            classNames={{
                              input: [
                                "bg-bgColor-white",
                                "hover:border-pink",
                                "!placeholder:text-pink",
                              ],
                              inputWrapper: [
                                "!bg-bgColor-white",
                                "!hover:bg-bgColor-stroke",
                                "border-2",
                                "border-bgColor-stroke",
                                "hover:border-bgColor-stroke",
                              ],
                              innerWrapper: ["flex", "!items-center"],
                            }}
                            value={buyRuneAmount}
                            disabled={loading}
                            onChange={(e) => {
                              setBuyFlag(false);
                              setBuyRuneAmount(e.target.value);
                            }}
                            endContent={
                              <div className="flex justify-center items-center !bg-bgColor-dark rounded-xl">
                                <Button
                                  className="bg-pink text-white" // Change to your desired background color"
                                  variant="flat"
                                  onClick={() => handleMaxAmount(target)}
                                >
                                  Max
                                </Button>
                              </div>
                            }
                          />
                        ) : (
                          <Input
                            type="text"
                            label="BTC Amount"
                            className="text-black"
                            classNames={InputStyles}
                            value={btcAmount}
                            disabled={loading}
                            onChange={(e) => {
                              setBuyFlag(false);
                              setBtcAmount(e.target.value);
                            }}
                            // endContent={
                            //   <Button
                            //     color="primary"
                            //     onClick={() => handleMaxAmount(target)}
                            //   >
                            //     Max
                            //   </Button>
                            // }
                          />
                        )}

                        <Input
                          type="number"
                          label="Slippage (%)"
                          value={`${slippage}`}
                          disabled={loading}
                          className="text-white"
                          classNames={InputStyles}
                          min={0}
                          onChange={(e) => {
                            setBuyFlag(false);
                            setSlippage(e.target.value);
                          }}
                        />
                        {buyFlag ? (
                          <div className="flex flex-col items-center text-center">
                            <div>
                              {target === false
                                ? `You would get ${estimatePrice.toFixed(4)} ${
                                    runeInfo.runeName
                                  }`
                                : `You should pay ${displayBtc(
                                    estimatePrice
                                  )} btc`}
                            </div>
                            <Button
                              className="bg-bgColor-pink text-bgColor-lime"
                              variant="flat"
                              onClick={() => handleBuy()}
                              isLoading={loading}
                            >
                              Confirm
                            </Button>
                          </div>
                        ) : (
                          <Button
                            className={`${
                              (target === true ? buyRuneAmount : btcAmount) &&
                              slippage
                                ? "bg-bgColor-pink"
                                : "bg-bgColor-pink/[.5]"
                            } text-white`}
                            variant="flat"
                            onClick={() => handlePreBuy()}
                            isLoading={loading}
                            disabled={
                              (target === true ? buyRuneAmount : btcAmount) &&
                              slippage
                                ? false
                                : true
                            }
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
                <Card className="border-2 bg-bgColor-ghost border-bgColor-stroke text-white">
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
                          classNames={InputStyles}
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
                          classNames={InputStyles}
                          value={`${slippage}`}
                          disabled={loading}
                          min={0}
                          onChange={(e) => {
                            setSellFlag(false);
                            setSlippage(e.target.value);
                          }}
                        />
                        {sellFlag ? (
                          <div className="flex flex-col items-center gap-3  text-center">
                            <div>{`You would get ${displayBtc(
                              estimatePrice / SATS_MULTIPLE
                            )} btc`}</div>
                            <Button
                              className="bg-bgColor-pink text-white"
                              variant="flat"
                              onClick={() => handleSell()}
                              isLoading={loading}
                            >
                              Confirm
                            </Button>
                          </div>
                        ) : (
                          <Button
                            color="warning"
                            className={`${
                              sellRuneAmount && slippage
                                ? "bg-bgColor-pink"
                                : "bg-bgColor-pink/[.5] cursor-not-allowed"
                            } text-white`}
                            onClick={() => handlePreSell()}
                            isLoading={loading}
                            disabled={sellRuneAmount && slippage ? true : false}
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
                <Card className="border-2 bg-bgColor-ghost border-bgColor-stroke text-white">
                  <CardBody className="flex gap-3">
                    <div className="flex justify-around">
                      <div>Available Burn Balance</div>
                      <div>{availableBurn}</div>
                    </div>
                    <div className="flex flex-col gap-3">
                      <div className="text-center">Burn</div>
                      <div className="flex flex-col gap-3">
                        <Input
                          type="text"
                          label="Burn Rune Amount"
                          classNames={InputStyles}
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
                          className={`${
                            burnRuneAmount
                              ? "bg-bgColor-pink"
                              : "bg-bgColor-pink/[.5] cursor-not-allowed"
                          } text-white`}
                          variant="flat"
                          onClick={() => handleBurn()}
                          isLoading={loading}
                          disabled={burnRuneAmount ? false : true}
                        >
                          Burn
                        </Button>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </Tab>
            </Tabs>
            <RuneTokenInfo />
          </div>
        </div>
        <div className="md:hidden">
          {stage === "info" && (
            <div className="w-full">
              <RuneTokenInfo />
            </div>
          )}
          {stage === "chart" && <TradingChart param={coin}></TradingChart>}
          {stage === "buysell" && (
            <div>
              {/* Mobile Buy Sell */}
              <Tabs aria-label="Options" color="warning" variant="underlined">
                <Tab key="buy" title="Buy">
                  <Card className="border-2 bg-bgColor-ghost border-bgColor-stroke text-white">
                    <CardBody className="flex flex-col gap-3">
                      {/* Buy */}
                      <div className="flex justify-around">
                        <div>Your balance</div>
                        <div>{runeBalance}</div>
                      </div>
                      <div className="flex flex-col gap-3">
                        <div className="flex flex-col gap-3">
                          <Button
                            className="bg-bgColor-pink/[.5] text-white"
                            variant="flat"
                            onClick={() => {
                              setBuyFlag(false);
                              setTarget(!target);
                            }}
                          >
                            {`Switch to ${
                              target === true ? "BTC" : runeInfo?.runeName
                            }`}
                          </Button>
                          {target === true ? (
                            <Input
                              type="text"
                              label="Rune Amount"
                              // color="warning"
                              classNames={{
                                input: [
                                  "bg-bgColor-white",
                                  "hover:border-warning",
                                  "!placeholder:text-placeHolder",
                                ],
                                inputWrapper: [
                                  "!bg-bgColor-white",
                                  "!hover:bg-bgColor-stroke",
                                  "border-2",
                                  "border-bgColor-stroke",
                                  "hover:border-bgColor-stroke",
                                ],
                                innerWrapper: ["flex", "!items-center"],
                              }}
                              value={buyRuneAmount}
                              disabled={loading}
                              onChange={(e) => {
                                setBuyFlag(false);
                                setBuyRuneAmount(e.target.value);
                              }}
                              endContent={
                                <div className="flex justify-center items-center">
                                  <Button
                                    className="text-pink"
                                    variant="flat"
                                    onClick={() => handleMaxAmount(target)}
                                  >
                                    Max
                                  </Button>
                                </div>
                              }
                            />
                          ) : (
                            <Input
                              type="text"
                              label="BTC Amount"
                              color="warning"
                              classNames={InputStyles}
                              value={btcAmount}
                              disabled={loading}
                              onChange={(e) => {
                                setBuyFlag(false);
                                setBtcAmount(e.target.value);
                              }}
                              // endContent={
                              //   <Button
                              //     color="primary"
                              //     onClick={() => handleMaxAmount(target)}
                              //   >
                              //     Max
                              //   </Button>
                              // }
                            />
                          )}

                          <Input
                            type="number"
                            label="Slippage (%)"
                            value={`${slippage}`}
                            disabled={loading}
                            color="warning"
                            classNames={InputStyles}
                            min={0}
                            onChange={(e) => {
                              setBuyFlag(false);
                              setSlippage(e.target.value);
                            }}
                          />
                          {buyFlag ? (
                            <div className="flex flex-col items-center gap-3 text-center">
                              <div>
                                {target === false
                                  ? `You would get ${estimatePrice.toFixed(
                                      4
                                    )} ${runeInfo.runeName}`
                                  : `You should pay ${displayBtc(
                                      estimatePrice
                                    )} btc`}
                              </div>
                              <Button
                                color="warning"
                                variant="flat"
                                onClick={() => handleBuy()}
                                isLoading={loading}
                              >
                                Confirm
                              </Button>
                            </div>
                          ) : (
                            <Button
                              color="warning"
                              variant="flat"
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
                  <Card className="border-2 bg-bgColor-ghost border-bgColor-stroke text-white">
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
                            className="text-white"
                            classNames={InputStyles}
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
                            color="warning"
                            classNames={InputStyles}
                            value={`${slippage}`}
                            disabled={loading}
                            min={0}
                            onChange={(e) => {
                              setSellFlag(false);
                              setSlippage(e.target.value);
                            }}
                          />
                          {sellFlag ? (
                            <div className="flex flex-col items-center gap-3 text-center">
                              <div>{`You would get ${displayBtc(
                                estimatePrice / SATS_MULTIPLE
                              )} btc`}</div>
                              <Button
                                color="warning"
                                variant="flat"
                                onClick={() => handleSell()}
                                isLoading={loading}
                              >
                                Confirm
                              </Button>
                            </div>
                          ) : (
                            <Button
                              color="warning"
                              variant="flat"
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
                  <Card className="border-2 bg-bgColor-ghost border-bgColor-stroke text-white">
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
                            color="warning"
                            classNames={InputStyles}
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
                            color="warning"
                            variant="flat"
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
              <TransactionHistory />
            </div>
          )}
          <div className="fixed bottom-0 left-0 bg-bgColor-dark border-2 border-bgColor-stroke w-full rounded-t-md flex justify-center">
            <Tabs
              aria-label="Options"
              color="warning"
              variant="underlined"
              onSelectionChange={(key) => setStage(key as string)}
            >
              <Tab key="info" title="Info"></Tab>
              <Tab key="chart" title="Chart"></Tab>
              <Tab key="buysell" title="Buy/Sell"></Tab>
            </Tabs>
          </div>
        </div>
      </div>
    </main>
  );
}
