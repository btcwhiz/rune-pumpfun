import React from "react";
export const ListboxWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="border-default-200 border-small dark:border-default-100 px-1 py-2 rounded-small w-full">
    {children}
  </div>
);
