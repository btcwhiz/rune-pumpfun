"use client";

import Link from "next/link";
import { useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { MainContext } from "../contexts/MainContext";
import { getAllFeeHistories } from "../api/requests";

export default function Admin() {
  const router = useRouter();
  const { userInfo } = useContext(MainContext);

  const [feeHistory, setFeeHistory] = useState<any[]>([]);

  const getFeeHistory = async (userId: string) => {
    const res = await getAllFeeHistories(userId);
    setFeeHistory(res);
  };

  useEffect(() => {
    if (userInfo.role !== 1) {
      toast.error("You can't access this page");
      router.push("../");
    } else {
      getFeeHistory(userInfo.userId);
    }

    // eslint-disable-next-line
  }, [userInfo]);

  return (
    <main className="p-3 min-h-screen">
      <div className="flex flex-col gap-3">
        <div className="flex justify-center">
          <Link className="p-3 border rounded-xl" href={"/"}>
            Go Back
          </Link>
        </div>
        {userInfo.role === 1 && (
          <div className="flex justify-center">
            <div>
              <div className="font-bold text-center text-xl">Fee History</div>
              <div className="flex items-center">
                <div className="w-10">No</div>
                <div className="gap-3 grid grid-cols-2 w-full">
                  <div>Type</div>
                  <div>Amount</div>
                </div>
              </div>
              {feeHistory.map((item, index) => (
                <div key={index} className="flex items-center">
                  <div className="w-10">{index + 1}</div>
                  <div className="gap-3 grid grid-cols-2 w-full">
                    <div className="text-pink">
                      {item.type === 0 && "Deposit"}
                      {item.type === 1 && "Withdraw"}
                      {item.type === 2 && "Buy"}
                      {item.type === 3 && "Sell"}
                      {item.type === 4 && "Etching"}
                    </div>
                    <div>{`${item.amount} sats`}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
