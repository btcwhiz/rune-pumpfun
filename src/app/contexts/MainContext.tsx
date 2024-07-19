"use client";

import { createContext, useState } from "react";

const defaultValue = {
  paymentAddress: "",
  paymentPubkey: "",
  ordinalAddress: "",
  ordinalPubkey: "",
  userInfo: {
    userId: "",
    btcBalance: 0,
    paymentAddress: "",
    paymentPublicKey: "",
    ordinalAddress: "",
    ordinalPublicKey: "",
  },
  setPaymentAddress: (param: any) => {},
  setPaymentPubkey: (param: any) => {},
  setOrdinalAddress: (param: any) => {},
  setOrdinalPubkey: (param: any) => {},
  setUserInfo: (param: any) => {},
};

export const MainContext = createContext(defaultValue);

export function MainProvider({ children }: { children: any }) {
  const [paymentAddress, setPaymentAddress] = useState<string>("");
  const [paymentPubkey, setPaymentPubkey] = useState<string>("");
  const [ordinalAddress, setOrdinalAddress] = useState<string>("");
  const [ordinalPubkey, setOrdinalPubkey] = useState<string>("");
  const [userInfo, setUserInfo] = useState<any>({
    userId: "",
    btcBalance: 0,
  });

  return (
    <MainContext.Provider
      value={{
        paymentAddress,
        paymentPubkey,
        ordinalAddress,
        ordinalPubkey,
        userInfo,
        setPaymentAddress,
        setPaymentPubkey,
        setOrdinalAddress,
        setOrdinalPubkey,
        setUserInfo,
      }}
    >
      {children}
    </MainContext.Provider>
  );
}
