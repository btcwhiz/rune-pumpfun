"use client";

import { useContext, useEffect, useRef, useState } from "react";
import { Button, Image, Input, Progress } from "@nextui-org/react";
import { Psbt } from "bitcoinjs-lib";
import Header from "./components/header";
import {
  authUser,
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
} from "./api/requests";
import { MainContext } from "./contexts/MainContext";
import { calcTokenPrice } from "./utils/pump";
import toast from "react-hot-toast";

export default function Home() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { ordinalAddress, userInfo, setUserInfo } = useContext(MainContext);

  const [buyFlag, setBuyFlag] = useState<boolean>(false);
  const [sellFlag, setSellFlag] = useState<boolean>(false);
  const [runeId, setRuneId] = useState<string>("");

  const [loading, setLoading] = useState<boolean>(false);

  // Etching
  const [imageData, setImageData] = useState<string>("");
  const [imageContent, setImageContent] = useState<string>("");
  const [etchingSymbol, setEtchingSymbol] = useState<string>("");
  const [etchingName, setEtchingName] = useState<string>("");
  const [initialBuyAmount, setInitialBuyAmount] = useState<string>("");

  const [buyPsbtData, setBuyPsbtData] = useState<{
    psbt: string;
    requestId: string;
  }>({ psbt: "", requestId: "" });

  const [depositAmount, setDepositAmount] = useState<string>("");
  const [withdrawAmount, setWithdrawAmount] = useState<string>("");
  const [buyRuneAmount, setBuyRuneAmount] = useState<string>("");
  const [estimatePrice, setEstimatePrice] = useState<number>(0);
  const [sellRuneAmount, setSellRuneAmount] = useState<string>("");
  const [runes, setRunes] = useState<any[]>([]);
  const [pumpActions, setPumpActions] = useState<any[]>([]);

  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const getRunes = async () => {
    if (userInfo.userId) {
      let runeRes: any = await getRuneFunc(userInfo.userId);
      setRunes(runeRes.runes);
    }
  };

  const getInitialData = async () => {
    try {
      const pActions = await getPumpActionFunc(userInfo.userId);
      // console.log("pActions :>> ", pActions);
      setPumpActions(pActions.pumpAction);
    } catch (error) {}
  };

  const getUserInfo = async () => {
    if (userInfo.paymentAddress) {
      const uInfo: any = await authUser(
        userInfo.paymentAddress,
        userInfo.paymentPublicKey,
        userInfo.ordinalAddress,
        userInfo.ordinalPublicKey
      );
      setUserInfo(uInfo);
    }
  };

  const init = () => {
    // setBuyFlag(false);
    // setSellFlag(false);
    setEstimatePrice(0);
    getUserInfo();
  };

  const handleEtchingRune = async () => {
    try {
      console.log(
        "imageContent etchingAmount etchingSymbol etchingName initialBuyAmount initialPrice :>> ",
        imageContent,
        etchingSymbol,
        etchingName,
        initialBuyAmount
      );
      if (
        !imageContent ||
        !etchingSymbol ||
        !etchingName ||
        !initialBuyAmount
      ) {
        return console.log("Invalid parameters");
      }

      if (
        !Number(initialBuyAmount) ||
        !Math.round(Number(initialBuyAmount)) ||
        Math.round(Number(initialBuyAmount)) > 1000000
      ) {
        return console.log("Invalid initial rune amount");
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

      console.log(res);
      toast.success(res.msg);
      setImageData("");
      setImageContent("");
      // setEtchingAmount("");
      setEtchingSymbol("");
      setEtchingName("");
      setInitialBuyAmount("");
      // setInitialPrice("");
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };

  const handleDeposit = async () => {
    console.log("depositAmount :>> ", depositAmount);
    const currentWindow: any = window;
    if (currentWindow?.unisat) {
      if (userInfo.userId && depositAmount) {
        setLoading(true);
        const walletType = "Unisat";
        const res = await preDepositFunc(
          walletType,
          userInfo.userId,
          depositAmount
        );
        console.log("res :>> ", res);
        console.log("res.depositId :>> ", res.depositId);
        console.log("res.psbtHex :>> ", res.psbtHex);
        console.log("res.psbtBase64 :>> ", res.psbtBase64);
        if (currentWindow?.unisat) {
          const signedPsbt = await currentWindow?.unisat.signPsbt(res.psbtHex);

          const depositRes = await depositFunc(
            userInfo.userId,
            res.depositId,
            signedPsbt
          );

          console.log("depositRes :>> ", depositRes);
          toast.success(depositRes.msg);
        }
        setLoading(false);
      } else {
        console.log("Invalid parameters");
      }
    } else {
      console.log("Please install unisat");
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

  const handlePreWithdraw = async () => {
    console.log("withdrawAmount :>> ", withdrawAmount);
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
    console.log("buyRuneAmount :>> ", buyRuneAmount);
    if (userInfo.userId && runeId && buyRuneAmount) {
      setLoading(true);
      const res = await pumpPreBuyFunc(userInfo.userId, runeId, buyRuneAmount);
      console.log("res :>> ", res);
      setBuyPsbtData(res?.requestData);
      setLoading(false);
      const ePrice = res?.estimatePrice;
      console.log("estimatePrice :>> ", ePrice);
      if (ePrice) {
        setBuyFlag(true);
        setSellFlag(false);
        setEstimatePrice(ePrice);
      }
    } else {
      console.log("Invalid parameters");
    }
  };

  const handleBuy = async () => {
    console.log(
      "buyRuneAmount, estimatePrice :>> ",
      buyRuneAmount,
      estimatePrice
    );
    if (
      userInfo.userId &&
      runeId &&
      buyRuneAmount &&
      estimatePrice &&
      buyPsbtData
    ) {
      setLoading(true);
      // const message = `You will buy ${buyRuneAmount} rune (ID: ${runeId}) from ${
      //   estimatePrice * Number(buyRuneAmount)
      // } BTC`;
      // const currentWindow: any = window;
      // const signature = await currentWindow?.unisat?.signMessage(message);
      // console.log("signature :>> ", signature);
      const signedPsbt = await unisatSignPsbt(buyPsbtData?.psbt);
      const res = await pumpBuyFunc(
        userInfo.userId,
        runeId,
        buyRuneAmount,
        estimatePrice,
        buyPsbtData.requestId,
        signedPsbt
      );
      setLoading(false);
      console.log("res :>> ", res);
      toast.success(res.msg);
      if (res) {
        setLoading(false);
        init();
        setBuyFlag(false);
      }
    } else {
      console.log("plz connect your wallet");
    }
  };

  const handlePreSell = async () => {
    console.log("sellRuneAmount :>> ", sellRuneAmount);
    if (userInfo.userId && runeId && sellRuneAmount) {
      setLoading(true);
      const res = await pumpPreSellFunc(
        userInfo.userId,
        runeId,
        sellRuneAmount
      );
      const ePrice = res?.estimatePrice;
      console.log("estimatePrice :>> ", ePrice);
      if (ePrice) {
        setEstimatePrice(ePrice);
        setSellFlag(true);
        setBuyFlag(false);
      }
      setLoading(false);
    } else {
      setLoading(false);
      console.log("plz connect your wallet");
    }
  };

  const handleSell = async () => {
    console.log(
      "sellRuneAmount, estimatePrice :>> ",
      sellRuneAmount,
      estimatePrice
    );
    if (userInfo.userId && runeId && sellRuneAmount && estimatePrice) {
      setLoading(true);
      const message = `You will sell ${sellRuneAmount} rune (ID: ${runeId}) and will get ${estimatePrice} BTC`;
      const currentWindow: any = window;
      const signature = await currentWindow?.unisat?.signMessage(message);
      console.log("signature :>> ", signature);
      const res = await pumpSellFunc(
        userInfo.userId,
        runeId,
        sellRuneAmount,
        estimatePrice,
        {
          signature,
          message,
        }
      );
      setLoading(false);
      console.log("res :>> ", res);
      toast.success(res.msg);
      if (res) {
        setLoading(false);
        init();
        setSellFlag(false);
      }
    } else {
      console.log("plz connect your wallet");
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
    // if (event.target.files && event.target.files[0]) {
    const file = event.target.files[0];
    setImageData(file);
    console.log("file==>", file);

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
        console.log(base64String);
        const hexString = base64ToHex(base64String.split(",")[1]);
        console.log(hexString);
        setImageContent(hexString);
      };

      // Read the file as a Data URL (Base64 string)
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    if (fileInputRef.current) {
      fileInputRef.current.addEventListener("change", handleImageUpload);
    }
    return () => {
      if (fileInputRef.current) {
        fileInputRef.current.removeEventListener("change", handleImageUpload);
      }
    };
  }, []);

  useEffect(() => {
    if (userInfo.userId) {
      getInitialData();
      getRunes();
    }
  }, [userInfo]);

  return (
    <main className="p-3 min-h-screen">
      <Header />
      <div>
        <div className="px-10">
          <div className="flex items-center gap-3">
            <div>Runes</div>
            <Button onClick={() => getRunes()} color="primary">
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
            const progress = Math.round(
              ((item.runeAmount - item.remainAmount) / item.runeAmount) * 100
            );
            return (
              <div key={index} className="gap-3 grid grid-cols-8">
                <div>{index + 1}</div>
                <div>{item.runeId}</div>
                <div>{item.runeSymbol}</div>
                <div>{item.runeName}</div>
                <div>{item.remainAmount}</div>
                <div>{`${(item.pool / item.remainAmount) * 10 ** 8} sats`}</div>
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
        <div className="gap-5 grid grid-cols-3 p-24">
          <div className="flex flex-col gap-3">
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
                <Button color="success" onClick={() => handleButtonClick()}>
                  Upload Image
                </Button>
                <Input
                  type="file"
                  className="hidden"
                  ref={fileInputRef}
                  // onChange={handleImageUpload}
                ></Input>
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
                label="First rune buy rune amount"
                value={initialBuyAmount}
                onChange={(e) => setInitialBuyAmount(e.target.value)}
              />
              <Button
                color="success"
                onClick={() => handleEtchingRune()}
                disabled={loading}
              >
                {loading ? "Loading" : "Etching"}
              </Button>
            </div>
          </div>
          <div className="flex flex-col justify-between gap-3">
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
                  disabled={loading}
                >
                  {loading ? "Loading" : "Deposit"}
                </Button>
              </div>
            </div>
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
                  onClick={() => handlePreWithdraw()}
                  disabled={loading}
                >
                  {loading ? "Loading" : "Withdraw"}
                </Button>
                {/* {withdrawFlag ? (
                  <Button color="danger" onClick={() => handleWithdraw()}>
                    Confirm
                  </Button>
                ) : (
                  
                )} */}
              </div>
            </div>
          </div>
          <div className="flex flex-col justify-between gap-3">
            <div className="flex flex-col gap-3">
              <div className="text-center">Buy</div>
              <div className="flex flex-col gap-3">
                <Input
                  type="text"
                  label="Rune ID"
                  value={runeId}
                  onChange={(e) => {
                    setRuneId(e.target.value);
                    setBuyFlag(false);
                    setEstimatePrice(0);
                  }}
                />
                <Input
                  type="text"
                  label="Buy Rune Amount"
                  value={buyRuneAmount}
                  onChange={(e) => {
                    setBuyRuneAmount(e.target.value);
                    setBuyFlag(false);
                    setEstimatePrice(0);
                  }}
                />
                {buyFlag ? (
                  <div className="flex flex-col items-center gap-3">
                    <div>{`You should pay ${estimatePrice} btc`}</div>
                    <Button
                      color="success"
                      onClick={() => {
                        if (!loading) handleBuy();
                      }}
                    >
                      Confirm
                    </Button>
                  </div>
                ) : (
                  <Button
                    color="success"
                    onClick={() => {
                      if (!loading) handlePreBuy();
                    }}
                    disabled={loading}
                  >
                    Buy
                  </Button>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <div className="text-center">Sell</div>
              <div className="flex flex-col gap-3">
                <Input
                  type="text"
                  label="Rune ID"
                  value={runeId}
                  onChange={(e) => {
                    setRuneId(e.target.value);
                    setSellFlag(false);
                    setEstimatePrice(0);
                  }}
                />
                <Input
                  type="text"
                  label="Sell Rune Amount"
                  value={sellRuneAmount}
                  onChange={(e) => {
                    setSellRuneAmount(e.target.value);
                    setSellFlag(false);
                    setEstimatePrice(0);
                  }}
                />
                {sellFlag ? (
                  <div className="flex flex-col items-center gap-3">
                    <div>{`You would get ${estimatePrice} btc`}</div>
                    <Button
                      color="danger"
                      onClick={() => {
                        if (!loading) handleSell();
                      }}
                      disabled={loading}
                    >
                      Confirm
                    </Button>
                  </div>
                ) : (
                  <Button
                    color="danger"
                    onClick={() => {
                      if (!loading) handlePreSell();
                    }}
                  >
                    Sell
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="px-10">
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
              <div>{item.btcAmount}</div>
              <div>{item.type == 0 ? "Buy" : "Sell"}</div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
