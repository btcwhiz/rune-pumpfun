import moment from "moment-timezone";
import { NEXT_POOL_AMOUNT, SATS_MULTIPLE } from "../config/config";
import { getStorage } from "./stoage";

export const getTimeDifference = (date: any) => {
  // Set the timezone to PT (Pacific Time)
  const now = moment().tz("America/Los_Angeles");
  const targetDate = moment(date).tz("America/Los_Angeles");

  const diff = now.diff(targetDate);
  const duration = moment.duration(diff);

  if (duration.asMinutes() < 60) {
    return `${Math.floor(duration.asMinutes())}m ago`;
  } else if (duration.asHours() < 24) {
    return `${Math.floor(duration.asHours())}h ago`;
  } else {
    return `${Math.floor(duration.asDays())}d ago`;
  }
};

export const calcProgress = (
  remainAmount: number,
  runeAmount: number,
  poolstate: number
) => {
  let diff = runeAmount - remainAmount;
  // if (diff > NEXT_POOL_AMOUNT) {
  //   runeAmount = runeAmount - NEXT_POOL_AMOUNT;
  // }
  let progress = (diff / runeAmount) * 100;
  if (poolstate === 1) progress = 100;
  return progress;
};

export const calcAvailableRune = (
  stage: number,
  totalSupply: number,
  remainAmount: number,
  stage2Percent: number,
  dexPercent: number
) => {
  try {
    const stage2Amount = (totalSupply * stage2Percent) / 100,
      dexAmount = (totalSupply * dexPercent) / 100;
    if (stage === 0) {
      return remainAmount - stage2Amount - dexAmount;
    } else if (stage === 1) {
      return remainAmount - dexAmount;
    } else {
      return remainAmount;
    }
  } catch (error) {
    console.log("available rune calc error :>> ", error);
    return 0;
  }
};

export const displayBtc = (btcAmount: number) => {
  return Number((btcAmount / SATS_MULTIPLE).toFixed(8));
};

export const getWallet = () => {
  return getStorage("wallet");
};

export const displayRune = (runeName: string) => {
  try {
    let displayTxt = runeName?.split(".")[0];
    if (displayTxt.length > 5) {
      displayTxt = runeName?.split("•")[0];
    }
    if (displayTxt.length > 5) {
      displayTxt = displayTxt.slice(0, 4);
    }
    return displayTxt;
  } catch (error) {
    return "";
  }
};



export const displayDate = (date: string) => {
  // Convert the date string to a moment object in the local timezone
  const localDate = moment.tz(date, moment.tz.guess());

  // Format the date as MM/DD/YY
  return localDate.format("MM/DD/YY");
};