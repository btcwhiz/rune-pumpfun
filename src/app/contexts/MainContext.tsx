"use client";

import { createContext, useState } from "react";

const defaultValue = {
  paymentAddress: "",
  paymentPubkey: "",
  ordinalAddress: "",
  ordinalPubkey: "",
  multisigWallet: "",
  multiBalance: "",
  userInfo: {
    profileId: "",
    userId: "",
    btcBalance: 0,
    paymentAddress: "",
    paymentBalance: 0,
    paymentPublicKey: "",
    ordinalAddress: "",
    ordinalPublicKey: "",
    multisigWallet: "",
    multiBalance: "",
    role: 0,
  },
  userRunes: [],
  setUserRunes: (param: any) => {},
  setPaymentAddress: (param: any) => {},
  setPaymentPubkey: (param: any) => {},
  setOrdinalAddress: (param: any) => {},
  setOrdinalPubkey: (param: any) => {},
  setUserInfo: (param: any) => {},
  setMultisigWallet: (param: any) => {},
  setMultiBalance: (param: any) => {},
};

export const MainContext = createContext(defaultValue);

export function MainProvider({ children }: { children: any }) {
  const [paymentAddress, setPaymentAddress] = useState<string>("");
  const [paymentPubkey, setPaymentPubkey] = useState<string>("");
  const [ordinalAddress, setOrdinalAddress] = useState<string>("");
  const [ordinalPubkey, setOrdinalPubkey] = useState<string>("");
  const [multisigWallet, setMultisigWallet] = useState<string>("");
  const [multiBalance, setMultiBalance] = useState<string>("");
  const [userRunes, setUserRunes] = useState<any>([]);
  const [userInfo, setUserInfo] = useState<any>({
    userId: "",
    paymentBalance: 0,
    btcBalance: 0,
  });

  return (
    <MainContext.Provider
      value={{
        paymentAddress,
        paymentPubkey,
        ordinalAddress,
        ordinalPubkey,
        multisigWallet,
        multiBalance,
        userInfo,
        userRunes,
        setUserRunes,
        setPaymentAddress,
        setPaymentPubkey,
        setOrdinalAddress,
        setOrdinalPubkey,
        setMultisigWallet,
        setMultiBalance,
        setUserInfo,
      }}
    >
      {children}
    </MainContext.Provider>
  );
}
