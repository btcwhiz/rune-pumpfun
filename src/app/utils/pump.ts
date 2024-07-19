"use client";

export const calcTokenPrice = (runeItem: any) => {
  const k = runeItem.runeAmount * runeItem.pool;
  const tokenPrice = k / runeItem.remainAmount;
  return (tokenPrice).toFixed(6) || 0;
};
