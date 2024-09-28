import React from "react";
export const ListboxWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="border-2 bg-bgColor-dark px-1 py-2 border-bgColor-stroke rounded-small w-full">
    {children}
  </div>
);
