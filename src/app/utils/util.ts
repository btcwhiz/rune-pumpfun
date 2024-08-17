import moment from "moment";
import { NEXT_POOL_AMOUNT } from "../config/config";

export const getTimeDifference = (date: any) => {
  const now = moment();
  const diff = now.diff(moment(date));
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
  if (diff > NEXT_POOL_AMOUNT) {
    runeAmount = runeAmount - NEXT_POOL_AMOUNT;
  }
  let progress = (diff / runeAmount) * 100;
  if (poolstate === 1) progress = 100;
  return progress;
};
