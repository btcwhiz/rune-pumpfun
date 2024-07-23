"use client";

import React from "react";
import { useParams } from "next/navigation";

export default function Profile() {
  const { userId } = useParams();
  console.log("userId :>> ", userId);
  return <div>Profile</div>;
}
