"use client";

import React from "react";
import { Button } from "@nextui-org/react";

export default function Page() {
  return (
    <div className="flex justify-center gap-3">
      <div className="flex flex-col gap-3 border-1 bg-bgColor-light p-3 rounded-xl w-1/2">
        <div className="font-bold text-3xl text-center">Add Liquidity</div>
        <div className="flex flex-col gap-3">
          <div className="flex justify-center">
            <Button color="primary" className="w-44">
              Add
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
