"use client";
import { Psbt } from "bitcoinjs-lib";

export const calcTokenPrice = (runeItem: any) => {
  const k = runeItem.runeAmount * runeItem.pool;
  const tokenPrice = k / runeItem.remainAmount;
  return tokenPrice.toFixed(6) || 0;
};

export const unisatSignPsbt = async (unsignedPsbt: string) => {
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

export const displayAddress = (address: string) => {
  try {
    return `${address.slice(0, 5)}...${address.slice(
      address.length - 6,
      address.length - 1
    )}`;
  } catch (error) {
    return "";
  }
};

export const displayPercentage = (part: any, total: any) => {
  try {
    let p = Number(part);
    let t = Number(total);

    return Number(((p / t) * 100).toFixed(2));
  } catch (error) {
    return 0;
  }
};
