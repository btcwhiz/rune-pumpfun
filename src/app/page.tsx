"use client";

import { useContext, useEffect, useRef, useState } from "react";
import { Button, Image, Input } from "@nextui-org/react";
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
  const [withdrawFlag, setWithdrawFlag] = useState<boolean>(false);
  const [etchingFlag, setEtchingFlag] = useState<boolean>(false);
  const [runeId, setRuneId] = useState<string>("");

  const [loading, setLoading] = useState<boolean>(false);

  // Etching
  const [imageData, setImageData] = useState<string>("");
  const [imageContent, setImageContent] = useState<string>("");
  const [etchingSymbol, setEtchingSymbol] = useState<string>("");
  const [etchingName, setEtchingName] = useState<string>("");
  const [divisibility, setDivisibility] = useState<string>("");

  // const [etchingPsbtData, setEtchingPsbtData] = useState<{
  //   waitEtchingId: string;
  //   psbt: string;
  //   requestId: string;
  // }>({ psbt: "", waitEtchingId: "", requestId: "" });

  // const [withdrawPsbtData, setWithdrawPsbtData] = useState<{
  //   psbt: string;
  //   requestId: string;
  // }>({ psbt: "", requestId: "" });

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
      const runeRes = await getRuneFunc(userInfo.userId);
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

  const handlePreEtchingRune = async () => {
    try {
      console.log(
        "imageContent etchingAmount etchingSymbol etchingName divisibility initialPrice :>> ",
        imageContent,
        etchingSymbol,
        etchingName,
        divisibility
      );
      if (!imageContent || !etchingSymbol || !etchingName || !divisibility) {
        return console.log("Invalid parameters");
      }
      setEtchingFlag(true);

      const { etchingPsbt, waitEtchingData }: any = await preEtchingRuneFunc(
        userInfo.userId,
        imageContent,
        etchingName,
        etchingSymbol
      );
      console.log("etchingPsbt :>> ", etchingPsbt);
      console.log("waitEtchingData :>> ", waitEtchingData);

      const signedPsbt = await unisatSignPsbt(etchingPsbt.psbt);
      const res = await etchingRuneFunc(
        userInfo.userId,
        imageContent,
        etchingName,
        etchingSymbol,
        divisibility,
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
      setDivisibility("");
      // setInitialPrice("");
      setEtchingFlag(false);
    } catch (error) {
      setEtchingFlag(false);
    }
  };

  // const handleEtchingRune = async () => {
  //   try {
  //     console.log(
  //       "imageContent etchingAmount etchingSymbol etchingName divisibility initialPrice :>> ",
  //       imageContent,
  //       etchingSymbol,
  //       etchingName,
  //       divisibility
  //     );
  //     if (!imageContent || !etchingSymbol || !etchingName || !divisibility) {
  //       return console.log("Invalid parameters");
  //     }
  //     const signedPsbt = await unisatSignPsbt(etchingPsbtData.psbt);
  //     const res = await etchingRuneFunc(
  //       userInfo.userId,
  //       imageContent,
  //       etchingName,
  //       etchingSymbol,
  //       divisibility,
  //       ordinalAddress,
  //       signedPsbt,
  //       etchingPsbtData.waitEtchingId,
  //       etchingPsbtData.requestId
  //     );

  //     console.log(res);
  //     toast.success(res.msg);
  //     setImageData("");
  //     setImageContent("");
  //     // setEtchingAmount("");
  //     setEtchingSymbol("");
  //     setEtchingName("");
  //     setDivisibility("");
  //     // setInitialPrice("");
  //     setEtchingFlag(false);
  //   } catch (error) {
  //     setEtchingFlag(false);
  //   }
  // };

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

  // const testFunc = async () => {
  //   const currentWindow: any = window;
  //   const paymentPublicKey = await currentWindow.unisat.getPublicKey();
  //   const ppsbt =
  //     "70736274ff0100b20200000002888793ba910e3bb98bc55267c3adeaea8bc2797e9b53c8ad9edb62da307c65540000000000ffffffff9a446d4028d2b3a987d235c7f3ad12fd925372269fc65dca61284c323426bb540000000000ffffffff02a086010000000000225120168e8713b5257109671b3556cef9255620c4f73981c53b550f97c31ae546dfca7837000000000000220020a140ba949814dee6c71c18e52781a988206d9c7867e1bba3f0bbd9ec5ed87ae5000000000001012ba086010000000000220020a140ba949814dee6c71c18e52781a988206d9c7867e1bba3f0bbd9ec5ed87ae522020370039194597286fed46ac6f69bc7d5fbb27dafcd745f08f4f0ff63f709a8401047304402200eb8d9240f73bcca7d078611877821e2ff3fadd7f08b6fb1b75c488fa9c3c66b02207a757ececa532bd28caf20f44ebb949858049cd11da3d3349534871c752ab6de0101054752210370039194597286fed46ac6f69bc7d5fbb27dafcd745f08f4f0ff63f709a840102103574915670c09bfcdaf0adf63644cf202a01ec125d3b6e3236410424a6b0d548452ae0001012ba086010000000000220020a140ba949814dee6c71c18e52781a988206d9c7867e1bba3f0bbd9ec5ed87ae522020370039194597286fed46ac6f69bc7d5fbb27dafcd745f08f4f0ff63f709a8401047304402205f497344d8cd118580927008a9ec9d1cad3ec58ea5eeff6bf71e5178eea2f7d902205d7db46781848193acdd83ee7ec0e17cd179401ccf3457dce716d26823cdd5a80101054752210370039194597286fed46ac6f69bc7d5fbb27dafcd745f08f4f0ff63f709a840102103574915670c09bfcdaf0adf63644cf202a01ec125d3b6e3236410424a6b0d548452ae000000";
  //   const tempPsbt = Psbt.fromHex(ppsbt);
  //   const inputCount = tempPsbt.inputCount;
  //   const inputArray = Array.from({ length: inputCount }, (_, i) => i);
  //   console.log("inputArray ==> ", inputArray);
  //   const toSignInputs: { index: number; publicKey: string }[] = [];
  //   inputArray.map((value: number) =>
  //     toSignInputs.push({
  //       index: value,
  //       publicKey: paymentPublicKey,
  //     })
  //   );
  //   console.log("toSignInputs ==> ", toSignInputs);
  //   const signedPsbt = await (window as any).unisat.signPsbt(ppsbt, {
  //     autoFinalized: false,
  //     toSignInputs,
  //   });
  //   console.log("signedPsbt :>> ", signedPsbt);
  // };

  const handlePreWithdraw = async () => {
    console.log("withdrawAmount :>> ", withdrawAmount);
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
  };

  // const handleWithdraw = async () => {
  //   console.log("withdrawAmount :>> ", withdrawAmount);
  //   if (userInfo.userId && runeId && withdrawAmount) {

  //     setWithdrawFlag(false);
  //   } else {
  //     // setWithdrawFlag(false);
  //     console.log("Invalid Parameters");
  //   }
  // };

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
      setBuyFlag(true);
      setSellFlag(false);
      setEstimatePrice(ePrice);
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
        estimatePrice * Number(buyRuneAmount),
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
      setLoading(false);
      const ePrice = res?.estimatePrice;
      console.log("estimatePrice :>> ", ePrice);
      setSellFlag(true);
      setBuyFlag(false);
      setEstimatePrice(ePrice);
    } else {
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
      const message = `You will sell ${sellRuneAmount} rune (ID: ${runeId}) and will get ${
        estimatePrice * Number(sellRuneAmount)
      } BTC`;
      const currentWindow: any = window;
      const signature = await currentWindow?.unisat?.signMessage(message);
      console.log("signature :>> ", signature);
      const res = await pumpSellFunc(
        userInfo.userId,
        runeId,
        sellRuneAmount,
        estimatePrice * Number(sellRuneAmount),
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
    // if (event.target.files.length) {
    //   setAvatar({
    //     preview: URL.createObjectURL(event.target.files[0]),
    //     raw: event.target.files[0],
    //   });
    //   console.log(avatar.preview);
    // }
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
          <div className="gap-3 grid grid-cols-7">
            <div>No</div>
            <div>ID</div>
            <div>Symbol</div>
            <div>Name</div>
            <div>Amount</div>
            <div>Price</div>
            <div>Rune Balance</div>
          </div>
          {runes.map((item, index) => (
            <div key={index} className="gap-3 grid grid-cols-7">
              <div>{index + 1}</div>
              <div>{item.runeId}</div>
              <div>{item.runeSymbol}</div>
              <div>{item.runeName}</div>
              <div>{item.remainAmount}</div>
              <div>{calcTokenPrice(item)}</div>
              <div>{item.balance ? item.balance : 0}</div>
            </div>
          ))}
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
              {/* <Input
                type="text"
                label="Etching Amount"
                value={etchingAmount}
                onChange={(e) => setEtchingAmount(e.target.value)}
              /> */}
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
              {/* <Input
                type="text"
                label="Initial Price"
                value={initialPrice}
                onChange={(e) => setInitialPrice(e.target.value)}
              /> */}
              <Input
                type="text"
                label="Rune divisibility"
                value={divisibility}
                onChange={(e) => setDivisibility(e.target.value)}
              />
              <Button
                color="success"
                onClick={() => handlePreEtchingRune()}
                disabled={etchingFlag}
              >
                {etchingFlag ? "Loading" : "Etching"}
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
                    <div>{`You should pay ${
                      estimatePrice * Number(buyRuneAmount)
                    } btc`}</div>
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
                    <div>{`You would get ${
                      estimatePrice * Number(sellRuneAmount)
                    } btc`}</div>
                    <Button
                      color="danger"
                      onClick={() => {
                        if (!loading) handleSell();
                      }}
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
