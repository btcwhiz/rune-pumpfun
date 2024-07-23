import axios from "axios";
import toast from "react-hot-toast";

export const authUser = async (
  paymentAddress: string,
  paymentPublicKey: string,
  ordinalAddress: string,
  ordinalPublicKey: string
) => {
  try {
    const urlEndpoint = `${process.env.NEXT_PUBLIC_API_URL}/api/user/auth-user`;
    const requestData = {
      paymentAddress,
      paymentPublicKey,
      ordinalAddress,
      ordinalPublicKey,
    };
    const res = await axios.post(urlEndpoint, requestData);
    return res.data;
  } catch (error: any) {
    const msg: any = error.response.data.msg || "Something went wrong";
    console.log("error :>> ", error);
    return null;
  }
};

export const preDepositFunc = async (
  walletType: string,
  userId: string,
  depositAmount: string
) => {
  try {
    const urlEndpoint = `${process.env.NEXT_PUBLIC_API_URL}/api/payment/pre-deposit`;
    const requestData = {
      walletType,
      userId,
      depositAmount,
    };
    console.log("requestData :>> ", requestData);
    const res = await axios.post(urlEndpoint, requestData);
    console.log("res :>> ", res);
    return res.data;
  } catch (error: any) {
    const msg: any = error.response.data.msg || "Something went wrong";
    console.log("error :>> ", error);
    return null;
  }
};

export const depositFunc = async (
  userId: string,
  depositId: string,
  signedPsbt: string
) => {
  try {
    const urlEndpoint = `${process.env.NEXT_PUBLIC_API_URL}/api/payment/deposit`;
    const requestData = {
      userId,
      depositId,
      signedPsbt,
    };
    console.log("requestData :>> ", requestData);
    const res = await axios.post(urlEndpoint, requestData);
    console.log("res :>> ", res);
    return res.data;
  } catch (error: any) {
    const msg: any = error.response.data.msg || "Something went wrong";
    console.log("error :>> ", error);
    return null;
  }
};

export const pumpPreBuyFunc = async (
  userId: string,
  runeId: string,
  runeAmount: string,
  slippage: string
) => {
  try {
    const urlEndpoint = `${process.env.NEXT_PUBLIC_API_URL}/api/pump/pre-buy-rune`;
    const requestData = {
      userId,
      runeId,
      runeAmount,
      slippage,
    };
    console.log("requestData :>> ", requestData);
    const res = await axios.post(urlEndpoint, requestData);
    console.log("res :>> ", res);
    return res.data;
  } catch (error: any) {
    const msg: any = error.response.data.msg || "Something went wrong";
    console.log("error :>> ", error);
    return null;
  }
};

export const pumpBuyFunc = async (
  userId: string,
  runeId: string,
  runeAmount: string,
  btcAmount: number,
  requestId: string,
  slippage: string,
  signedPsbt: string
) => {
  try {
    const urlEndpoint = `${process.env.NEXT_PUBLIC_API_URL}/api/pump/buy-rune`;
    const requestData = {
      userId,
      runeId,
      runeAmount,
      btcAmount,
      requestId,
      slippage,
      signedPsbt,
    };
    const res = await axios.post(urlEndpoint, requestData);
    return {
      status: true,
      ...res.data,
    };
  } catch (error: any) {
    console.log("error :>> ", error);
    const msg: any = error.response.data.msg || "Something went wrong";
    toast.error(msg);
    return {
      status: false,
    };
  }
};

export const pumpPreSellFunc = async (
  userId: string,
  runeId: string,
  runeAmount: string,
  slippage: string
) => {
  try {
    const urlEndpoint = `${process.env.NEXT_PUBLIC_API_URL}/api/pump/pre-sell-rune`;
    const requestData = {
      userId,
      runeId,
      runeAmount,
      slippage,
    };
    console.log("requestData :>> ", requestData);
    const res = await axios.post(urlEndpoint, requestData);
    console.log("res :>> ", res);
    return res.data;
  } catch (error: any) {
    const msg: any = error.response.data.msg || "Something went wrong";
    console.log("error :>> ", error);
    return null;
  }
};

export const pumpSellFunc = async (
  userId: string,
  runeId: string,
  runeAmount: string,
  btcAmount: number,
  slippage: string,
  messageData: any
) => {
  try {
    const urlEndpoint = `${process.env.NEXT_PUBLIC_API_URL}/api/pump/sell-rune`;
    const requestData = {
      userId,
      runeId,
      runeAmount,
      btcAmount,
      slippage,
      messageData,
    };
    const res = await axios.post(urlEndpoint, requestData);
    return res.data;
  } catch (error: any) {
    const msg: any = error.response.data.msg || "Something went wrong";
    console.log("error :>> ", error);
    return null;
  }
};

export const getAllTransactions = async (userId: string) => {
  try {
    const urlEndpoint = `${process.env.NEXT_PUBLIC_API_URL}/api/payment/get-transactions`;
    const requestData = {
      userId,
    };
    const res = await axios.post(urlEndpoint, requestData);
    return res.data;
  } catch (error: any) {
    const msg: any = error.response.data.msg || "Something went wrong";
    console.log("error :>> ", error);
    return null;
  }
};

export const preWithdrawFunc = async (
  userId: string,
  runeId: string,
  amount: string
) => {
  try {
    const urlEndpoint = `${process.env.NEXT_PUBLIC_API_URL}/api/payment/pre-withdraw`;
    const requestData = {
      userId,
      runeId,
      amount,
    };
    const res = await axios.post(urlEndpoint, requestData);
    return res.data;
  } catch (error: any) {
    const msg: any = error.response.data.msg || "Something went wrong";
    console.log("error :>> ", error);
    return null;
  }
};

export const withdrawFunc = async (
  userId: string,
  runeId: string,
  amount: string,
  requestId: any,
  signedPsbt: any
) => {
  try {
    const urlEndpoint = `${process.env.NEXT_PUBLIC_API_URL}/api/payment/withdraw`;
    const requestData = {
      userId,
      runeId,
      amount,
      requestId,
      signedPsbt,
    };
    const res = await axios.post(urlEndpoint, requestData);
    return res.data;
  } catch (error: any) {
    const msg: any = error.response.data.msg || "Something went wrong";
    console.log("error :>> ", error);
    return null;
  }
};

export const getPumpActionFunc = async (runeId: string) => {
  try {
    const urlEndpoint = `${process.env.NEXT_PUBLIC_API_URL}/api/pump/get-pump`;
    const res = await axios.post(urlEndpoint, { runeId });
    return res.data;
  } catch (error: any) {
    const msg: any = error.response.data.msg || "Something went wrong";
    console.log("error :>> ", error);
    return null;
  }
};

export const getRuneFunc = async () => {
  try {
    const urlEndpoint = `${process.env.NEXT_PUBLIC_API_URL}/api/etching/get-runes`;
    const res = await axios.post(urlEndpoint);
    return res.data;
  } catch (error: any) {
    const msg: any = error.response.data.msg || "Something went wrong";
    console.log("error :>> ", error);
    return null;
  }
};

export const getRuneBalance = async (userId: string, runeId: string) => {
  try {
    const urlEndpoint = `${process.env.NEXT_PUBLIC_API_URL}/api/etching/get-rune-balance/`;
    const res = await axios.post(urlEndpoint, {
      userId,
      runeId,
    });
    return res.data;
  } catch (error: any) {
    const msg: any = error.response.data.msg || "Something went wrong";
    console.log("error :>> ", error);
    return null;
  }
};

export const getRuneInfoFunc = async (runeId: string) => {
  try {
    const urlEndpoint = `${process.env.NEXT_PUBLIC_API_URL}/api/etching/get-rune/${runeId}`;
    const res = await axios.get(urlEndpoint);
    return res.data;
  } catch (error: any) {
    const msg: any = error.response.data.msg || "Something went wrong";
    console.log("error :>> ", error);
    return null;
  }
};

export const preEtchingRuneFunc = async (
  userId: string,
  imageString: string,
  saveData: object
) => {
  try {
    const requestData = {
      userId,
      imageString,
      saveData,
    };
    const urlEndpoint = `${process.env.NEXT_PUBLIC_API_URL}/api/etching/pre-etch-token`;
    const res = await axios.post(urlEndpoint, requestData);
    return {
      status: true,
      ...res.data,
    };
  } catch (error: any) {
    console.log("error :111>> ", error);
    const msg: any = error.response.data.msg || "Something went wrong";
    toast.error(msg);
    return {
      status: false,
    };
  }
};

export const etchingRuneFunc = async (
  userId: string,
  signedPsbt: string,
  waitEtchingId: string,
  requestId: string
) => {
  try {
    const requestData = {
      userId,
      signedPsbt,
      waitEtchingId,
      requestId,
    };
    const urlEndpoint = `${process.env.NEXT_PUBLIC_API_URL}/api/etching/etch-token`;
    const res = await axios.post(urlEndpoint, requestData);
    return {
      status: true,
      ...res.data,
    };
  } catch (error: any) {
    const msg: any = error.response.data.msg || "Something went wrong";
    toast.error(msg);
    console.log("error :>> ", error);
    return {
      status: false,
    };
  }
};
