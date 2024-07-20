"use client";

import { useContext, useEffect, useRef, useState } from "react";
import { Button, Image, Input, Progress } from "@nextui-org/react";
import { Psbt } from "bitcoinjs-lib";
import toast from "react-hot-toast";
import { Tabs, Tab, Card, CardBody } from "@nextui-org/react";
import Header from "./components/header";
import {
  withdrawFunc,
  depositFunc,
  etchingRuneFunc,
  getPumpActionFunc,
  getRuneFunc,
  preDepositFunc,
  pumpBuyFunc,
  pumpPreBuyFunc,
  pumpPreSellFunc,
  pumpSellFunc,
  preWithdrawFunc,
  preEtchingRuneFunc,
  getAllTransactions,
} from "./api/requests";
import { MainContext } from "./contexts/MainContext";
import useSocket from "./hooks/useSocket";

export default function Home() {
  const satsmultiple = 10 ** 8;
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { ordinalAddress, userInfo } = useContext(MainContext);
  const socket = useSocket();

  const [loading, setLoading] = useState<boolean>(false);
  const [runes, setRunes] = useState<any[]>([]);

  // Etching
  const [imageData, setImageData] = useState<string>("");
  const [imageContent, setImageContent] = useState<string>("");
  const [etchingSymbol, setEtchingSymbol] = useState<string>("");
  const [etchingName, setEtchingName] = useState<string>("");
  const [initialBuyAmount, setInitialBuyAmount] = useState<string>("");

  const [slippage, setSlippage] = useState<string>("3");
  const [runeId, setRuneId] = useState<string>("");

  // Buy
  const [buyFlag, setBuyFlag] = useState<boolean>(false);
  const [buyRuneAmount, setBuyRuneAmount] = useState<string>("");
  const [buyPsbtData, setBuyPsbtData] = useState<{
    psbt: string;
    requestId: string;
  }>({ psbt: "", requestId: "" });

  // Sell
  const [sellFlag, setSellFlag] = useState<boolean>(false);
  const [sellRuneAmount, setSellRuneAmount] = useState<string>("");

  const [depositAmount, setDepositAmount] = useState<string>("");
  const [withdrawAmount, setWithdrawAmount] = useState<string>("");
  const [estimatePrice, setEstimatePrice] = useState<number>(0);
  const [pumpActions, setPumpActions] = useState<any[]>([]);
  const [allTransactions, setAllTransactions] = useState<any[]>([]);

  const getRunes = async (uInfo: any) => {
    if (uInfo.userId) {
      let runeRes: any = await getRuneFunc(uInfo.userId);
      setRunes(runeRes.runes);
    }
  };

  const getTxs = async () => {
    const alltxs = await getAllTransactions(userInfo.userId);
    setAllTransactions(alltxs.withdrawTxs || []);
  };

  const initialize = async () => {
    setLoading(false);
    setEstimatePrice(0);

    if (userInfo.paymentAddress) {
      const pActions = await getPumpActionFunc(userInfo.userId);
      setPumpActions(pActions.pumpAction);
      getRunes(userInfo);
      getTxs();
    }
  };

  const unisatSignPsbt = async (unsignedPsbt: string) => {
    const currentWindow: any = window;
    const paymentPublicKey = await currentWindow.unisat.getPublicKey();
    const ppsbt = unsignedPsbt;
    const tempPsbt = Psbt.fromHex(ppsbt);
    const inputCount = tempPsbt.inputCount;
    const inputArray = Array.from({ length: inputCount }, (_, i) => i);
    console.log("inputArray ==> ", inputArray);
    const toSignInputs: { index: number; publicKey: string }[] = [];
    inputArray.map((value: number) =>
      toSignInputs.push({
        index: value,
        publicKey: paymentPublicKey,
      })
    );
    console.log("toSignInputs ==> ", toSignInputs);
    const signedPsbt = await (window as any).unisat.signPsbt(ppsbt, {
      autoFinalized: false,
      toSignInputs,
    });
    return signedPsbt;
  };

  const handleUploadImage = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleEtchingRune = async () => {
    try {
      if (
        !imageContent ||
        !etchingSymbol ||
        !etchingName ||
        !initialBuyAmount
      ) {
        return toast.error("Invalid parameters");
      }

      if (
        !Number(initialBuyAmount) ||
        !Math.round(Number(initialBuyAmount)) ||
        Math.round(Number(initialBuyAmount)) > 1000000
      ) {
        return toast.error("Invalid initial rune amount");
      }

      setLoading(true);

      const { etchingPsbt, waitEtchingData }: any = await preEtchingRuneFunc(
        userInfo.userId,
        imageContent,
        etchingName,
        etchingSymbol,
        initialBuyAmount
      );
      console.log("etchingPsbt :>> ", etchingPsbt);
      console.log("waitEtchingData :>> ", waitEtchingData);

      const signedPsbt = await unisatSignPsbt(etchingPsbt.psbt);
      const res = await etchingRuneFunc(
        userInfo.userId,
        imageContent,
        etchingName,
        etchingSymbol,
        initialBuyAmount,
        ordinalAddress,
        signedPsbt,
        waitEtchingData.waitEtchingId,
        etchingPsbt.requestId
      );

      toast.success(res.msg);
      setImageData("");
      setImageContent("");
      setEtchingSymbol("");
      setEtchingName("");
      setInitialBuyAmount("");
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };

  const handleDeposit = async () => {
    const currentWindow: any = window;
    try {
      if (currentWindow?.unisat) {
        if (userInfo.userId && depositAmount) {
          setLoading(true);
          const walletType = "Unisat";
          const res = await preDepositFunc(
            walletType,
            userInfo.userId,
            depositAmount
          );
          if (currentWindow?.unisat) {
            const signedPsbt = await currentWindow?.unisat.signPsbt(
              res.psbtHex
            );

            const depositRes = await depositFunc(
              userInfo.userId,
              res.depositId,
              signedPsbt
            );
            getTxs();
            toast.success(depositRes.msg);
          }
          setLoading(false);
        } else {
          console.log("Invalid parameters");
        }
      } else {
        toast.error("Please install unisat");
      }
    } catch (error) {
      setLoading(false);
      console.log("error :>> ", error);
      toast.error("Something went wrong");
    }
  };

  const handleWithdraw = async () => {
    try {
      if (userInfo.userId && runeId && withdrawAmount) {
        setLoading(true);
        const preWithdrawRes = await preWithdrawFunc(
          userInfo.userId,
          runeId,
          withdrawAmount
        );
        console.log("preWithdrawRes :>> ", preWithdrawRes);
        if (runeId === "btc") {
          const signedPsbt = await unisatSignPsbt(preWithdrawRes?.psbt);
          const withdrawRes = await withdrawFunc(
            userInfo.userId,
            runeId,
            withdrawAmount,
            preWithdrawRes.requestId,
            signedPsbt
          );
          console.log("withdrawRes :>> ", withdrawRes);
          toast.success(withdrawRes.msg);
        } else {
          const withdrawRes = await withdrawFunc(
            userInfo.userId,
            runeId,
            withdrawAmount,
            preWithdrawRes.requestId,
            ""
          );
          console.log("withdrawRes :>> ", withdrawRes);
          toast.success(withdrawRes.msg);
        }
        getTxs();
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

  const handlePreBuy = async () => {
    try {
      if (userInfo.userId && runeId && buyRuneAmount) {
        setLoading(true);
        const res = await pumpPreBuyFunc(
          userInfo.userId,
          runeId,
          buyRuneAmount
        );
        setBuyPsbtData(res?.requestData);
        setLoading(false);
        const ePrice = res?.estimatePrice;
        if (ePrice) {
          setBuyFlag(true);
          setSellFlag(false);
          setEstimatePrice(ePrice);
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
        buyRuneAmount &&
        estimatePrice &&
        slippage &&
        buyPsbtData
      ) {
        setLoading(true);
        const signedPsbt = await unisatSignPsbt(buyPsbtData?.psbt);
        const res = await pumpBuyFunc(
          userInfo.userId,
          runeId,
          buyRuneAmount,
          estimatePrice,
          buyPsbtData.requestId,
          slippage,
          signedPsbt
        );
        toast.success(res.msg);
        initialize();
        setBuyFlag(false);
        getRunes(userInfo);
        setLoading(false);
      } else {
        toast.error("Invalid parameters");
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
          sellRuneAmount
        );
        const ePrice = res?.estimatePrice;
        console.log("estimatePrice :>> ", ePrice);
        setEstimatePrice(ePrice);
        setSellFlag(true);
        setBuyFlag(false);
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
        getRunes(userInfo);
        setLoading(false);
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

  const base64ToHex = (base64String: string) => {
    const raw = atob(base64String);
    let result = "";
    for (let i = 0; i < raw.length; i++) {
      const hex = raw.charCodeAt(i).toString(16);
      result += hex.length === 2 ? hex : "0" + hex;
    }
    return result;
  };

  const handleImageUpload = (event: any) => {
    console.log("here");
    // if (event.target.files && event.target.files[0]) {
    const file = event.target.files[0];
    setImageData(file);

    const reader = new FileReader();

    reader.onload = (e) => {
      // setImagePreview(e.target?.result as string);
      console.log(e.target?.result as string);
    };
    if (file) {
      const reader = new FileReader();

      reader.onload = function () {
        // The result attribute contains the data URL, which is a Base64 string
        const base64String = reader.result as string;
        // Display the Base64 string in a textarea
        const hexString = base64ToHex(base64String.split(",")[1]);
        setImageContent(hexString);
      };

      // Read the file as a Data URL (Base64 string)
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    const currentRef = fileInputRef.current;
    if (currentRef) {
      currentRef.addEventListener("change", handleImageUpload);
    }
    return () => {
      if (currentRef) {
        currentRef.removeEventListener("change", handleImageUpload);
      }
    };
  }, []);

  useEffect(() => {
    initialize();
    // eslint-disable-next-line
  }, [userInfo]);

  // Get Estimate Price if you are in buying

  // Get Buy Price Every 3 seconds
  useEffect(() => {
    if (socket) {
      const id = setInterval(() => {
        if (buyFlag) {
          socket.current.emit("lemme-know-buy-price", {
            runeId,
            buyRuneAmount,
          });
        }
      }, 3000);
      return () => clearInterval(id);
    }
    // eslint-disable-next-line
  }, [socket, buyFlag, runeId, buyRuneAmount]);

  // Get Sell Price Every 3 seconds
  useEffect(() => {
    if (socket) {
      const id = setInterval(() => {
        if (sellFlag) {
          socket.current.emit("lemme-know-sell-price", {
            runeId,
            sellRuneAmount,
          });
        }
      }, 3000);
      return () => clearInterval(id);
    }
    // eslint-disable-next-line
  }, [socket, sellFlag, runeId, sellRuneAmount]);

  useEffect(() => {
    if (socket) {
      socket.current.on("buy-price", (data: any) => {
        setEstimatePrice(data.estimatePrice || 0);
      });
      socket.current.on("sell-price", (data: any) => {
        setEstimatePrice(data.estimatePrice || 0);
      });
      return () => {
        socket.current.off("buy-price");
        socket.current.off("sell-price");
      };
    }
  }, [socket]);

  return (
    <main className="p-3 min-h-screen">
      <Header />
      <div className="flex flex-col gap-3">
        {/* --- Rune List --- */}
        <div className="p-10">
          <div className="flex items-center gap-3">
            <div>Runes</div>
            <Button onClick={() => getRunes(userInfo)} color="primary">
              Reload
            </Button>
          </div>
          <div className="gap-3 grid grid-cols-8">
            <div>No</div>
            <div>ID</div>
            <div>Symbol</div>
            <div>Name</div>
            <div>Amount</div>
            <div>Price</div>
            <div>Rune Progress Bar</div>
            <div>Rune Balance</div>
          </div>
          {runes.map((item, index) => {
            const progress =
              ((item.runeAmount - item.remainAmount) / item.runeAmount) * 100;
            return (
              <div key={index} className="gap-3 grid grid-cols-8">
                <div>{index + 1}</div>
                <div>{item.runeId}</div>
                <div>{item.runeSymbol}</div>
                <div>{item.runeName}</div>
                <div>{item.remainAmount}</div>
                <div>{`${item.pool / item.remainAmount} sats`}</div>
                <div className="flex items-center gap-2">
                  <span>{`${progress}%`}</span>
                  <Progress
                    size="md"
                    aria-label="Loading..."
                    value={progress}
                    className="max-w-md"
                  />
                </div>
                <div>{item.balance ? item.balance : 0}</div>
              </div>
            );
          })}
        </div>
        <div className="p-10">
          <Tabs aria-label="Options" color="primary">
            <Tab key="etching" title="Etching">
              <Card>
                <CardBody className="flex flex-col gap-3">
                  {/* Etching */}
                  <div className="text-center">Etching</div>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      {imageData && (
                        <Image
                          alt="rune meme"
                          // @ts-ignore
                          src={URL.createObjectURL(imageData)}
                          width={50}
                          height={50}
                        ></Image>
                      )}
                      <Button color="success" onClick={handleUploadImage}>
                        Upload Image
                      </Button>
                      <Input
                        type="file"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleImageUpload}
                      />
                    </div>
                    <Input
                      type="text"
                      label="Rune Symbol"
                      value={etchingSymbol}
                      onChange={(e) => setEtchingSymbol(e.target.value)}
                    />
                    <Input
                      type="text"
                      label="Rune Name"
                      value={etchingName}
                      onChange={(e) => setEtchingName(e.target.value)}
                    />
                    <Input
                      type="text"
                      label="First buy rune amount"
                      value={initialBuyAmount}
                      onChange={(e) => setInitialBuyAmount(e.target.value)}
                    />
                    <Button
                      color="success"
                      onClick={() => handleEtchingRune()}
                      isLoading={loading}
                    >
                      Etching
                    </Button>
                  </div>
                </CardBody>
              </Card>
            </Tab>
            <Tab key="payment" title="Deposit & Withdraw">
              <Card>
                <CardBody className="flex flex-col gap-5">
                  <div className="justify-between gap-3 grid grid-cols-2">
                    {/* Deposit */}
                    <div className="flex flex-col gap-3">
                      <div className="text-center">Deposit</div>
                      <div className="flex flex-col gap-3">
                        <Input
                          type="text"
                          label="Deposit Amount"
                          value={depositAmount}
                          onChange={(e) => setDepositAmount(e.target.value)}
                        />
                        <Button
                          color="success"
                          onClick={() => handleDeposit()}
                          isLoading={loading}
                        >
                          {loading ? "Loading" : "Deposit"}
                        </Button>
                      </div>
                    </div>

                    {/* Withdraw */}
                    <div className="flex flex-col gap-3">
                      <div className="text-center">Withdraw</div>
                      <div className="flex flex-col gap-3">
                        <Input
                          type="text"
                          label="Rune ID"
                          value={runeId}
                          onChange={(e) => setRuneId(e.target.value)}
                        />
                        <Input
                          type="text"
                          label="Withdraw Amount"
                          value={withdrawAmount}
                          onChange={(e) => setWithdrawAmount(e.target.value)}
                        />
                        <Button
                          color="danger"
                          onClick={() => handleWithdraw()}
                          isLoading={loading}
                        >
                          {loading ? "Loading" : "Withdraw"}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Payment History */}
                  <div className="p-10">
                    <div>Payment History</div>
                    <div className="gap-3 grid grid-cols-5">
                      <div>No</div>
                      <div>Type</div>
                      <div>RuneID</div>
                      <div>Amount</div>
                      <div>TxId</div>
                    </div>

                    {allTransactions.map((item, index) => (
                      <div key={index} className="gap-3 grid grid-cols-5">
                        <div>{index + 1}</div>
                        <div className="uppercase">{item.type}</div>
                        <div>{item.runeId}</div>
                        <div>{item.amount / satsmultiple}</div>
                        <div>{`${item.txId.slice(0, 8)}...${item.txId.slice(
                          item.txId.length - 8,
                          item.txId.length - 1
                        )}`}</div>
                      </div>
                    ))}
                  </div>
                </CardBody>
              </Card>
            </Tab>
            <Tab key="trade" title="Buy & Sell">
              <Card>
                <CardBody className="flex flex-col gap-3">
                  <CardBody className="gap-3 grid grid-cols-2">
                    {/* Buy */}
                    <div className="flex flex-col gap-3">
                      <div className="text-center">Buy</div>
                      <div className="flex flex-col gap-3">
                        <Input
                          type="text"
                          label="Rune ID"
                          value={runeId}
                          onChange={(e) => {
                            setBuyFlag(false);
                            setRuneId(e.target.value);
                          }}
                        />
                        <Input
                          type="text"
                          label="Buy Rune Amount"
                          value={buyRuneAmount}
                          onChange={(e) => {
                            setBuyFlag(false);
                            setBuyRuneAmount(e.target.value);
                          }}
                        />
                        <Input
                          type="number"
                          label="Slippage (%)"
                          value={`${slippage}`}
                          min={0}
                          onChange={(e) => {
                            setBuyFlag(false);
                            setSlippage(e.target.value);
                          }}
                        />
                        {buyFlag ? (
                          <div className="flex flex-col items-center gap-3">
                            <div>{`You should pay ${
                              estimatePrice / satsmultiple
                            } btc`}</div>
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
                          >
                            Buy
                          </Button>
                        )}
                      </div>
                    </div>
                    {/* Sell */}
                    <div className="flex flex-col gap-3">
                      <div className="text-center">Sell</div>
                      <div className="flex flex-col gap-3">
                        <Input
                          type="text"
                          label="Rune ID"
                          value={runeId}
                          onChange={(e) => {
                            setSellFlag(false);
                            setRuneId(e.target.value);
                          }}
                        />
                        <Input
                          type="text"
                          label="Sell Rune Amount"
                          value={sellRuneAmount}
                          onChange={(e) => {
                            setSellFlag(false);
                            setSellRuneAmount(e.target.value);
                          }}
                        />
                        <Input
                          type="number"
                          label="Slippage (%)"
                          value={`${slippage}`}
                          min={0}
                          onChange={(e) => {
                            setSellFlag(false);
                            setSlippage(e.target.value);
                          }}
                        />
                        {sellFlag ? (
                          <div className="flex flex-col items-center gap-3">
                            <div>{`You would get ${
                              estimatePrice / satsmultiple
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
                          >
                            Sell
                          </Button>
                        )}
                      </div>
                    </div>{" "}
                  </CardBody>

                  {/* Transaction History */}
                  <div className="p-10">
                    <div>Transaction History</div>
                    <div className="gap-3 grid grid-cols-7">
                      <div>No</div>
                      <div>ID</div>
                      <div>Symbol</div>
                      <div>Name</div>
                      <div>Amount</div>
                      <div>Price</div>
                      <div>Type</div>
                    </div>
                    {pumpActions.map((item, index) => (
                      <div key={index} className="gap-3 grid grid-cols-7">
                        <div>{index + 1}</div>
                        <div>{item.runeId}</div>
                        <div>{item.runeSymbol}</div>
                        <div>{item.runeName}</div>
                        <div>{item.runeAmount}</div>
                        <div>{item.btcAmount / satsmultiple}</div>
                        <div>{item.type == 0 ? "Buy" : "Sell"}</div>
                      </div>
                    ))}
                  </div>
                </CardBody>
              </Card>
            </Tab>
          </Tabs>
        </div>
      </div>
    </main>
  );
}
