"use client";

import { io, Socket } from "socket.io-client";
import type {
  Bar,
  LibrarySymbolInfo,
  ResolutionString,
  SubscribeBarsCallback,
} from "../../../../public/libraries/charting_library/charting_library";

import { queryClient } from "../providers";
import { Chart } from "../../utils/types";

let socket: Socket | undefined = undefined;
let initialTimeStamp: number = new Date().getTime();
let lastUpdated = 0;

if (typeof window !== "undefined") {
  socket = io("http://localhost:5000/");
}

type SubscriptionItem = {
  subscriberUID: string;
  resolution: ResolutionString;
  lastBar: Bar;
  handlers: {
    id: string;
    callback: SubscribeBarsCallback;
  }[];
  pairIndex: number;
};

const channelToSubscription: any = new Map<number, SubscriptionItem>();

if (socket) {
  socket.on("connect", () => {
    console.log("[socket] Connected", socket!.id);
    initialTimeStamp = new Date().getTime();
  });

  socket.on("disconnect", (reason) => {
    console.log("[socket] Disconnected:", reason);
  });

  socket.on("connect_error", (error) => {
    if (socket!.active) {
      // temporary failure, the socket will automatically try to reconnect
    } else {
      // the connection was denied by the server
      // in that case, `socket.connect()` must be manually called in order to reconnect
      console.log("[socket] Error:", error.message);
    }
  });

  socket.on("currentPrices", (priceUpdates) => {
    const tradeTime = new Date().getTime();

    let state: any = queryClient.getQueryState<Chart>(["charts"]);
    // Initialize chart data if it doesn't exist
    if (!state || !state.data) {
      queryClient.setQueryData<any>(["charts"], {
        time: tradeTime,
        closes: [],
      });
      state = queryClient.getQueryState<Chart>(["charts"]);
    }
    if (!state || !state.data || !priceUpdates) {
      return;
    }
    // console.log('priceUpdates :>> ', priceUpdates);
    // for (let i = 0; i < priceUpdates.length; i++) {
    //   const price = priceUpdates[i];
    //   // const index = priceUpdates[i];
    //   // const price = priceUpdates[i + 1];

    //   // if (state.data.closes.length < index) {
    //   //   while (state.data.closes.length < index) state.data.closes.push(0);
    //   // }

    //   state.data.closes[i] = price;
    // }
    state.data.closes = priceUpdates.reverse();
    let itemIndex = 0;
    for (const pairIndex of channelToSubscription.keys()) {
      const subscriptionItem = channelToSubscription.get(pairIndex);
      if (!subscriptionItem) {
        continue;
      }

      const lastBar = subscriptionItem.lastBar;
      const resolution = subscriptionItem.resolution;
      const nextBarTime = getNextBarTime(lastBar.time, +resolution);

      let bar: Bar;

      if (tradeTime >= nextBarTime) {
        bar = {
          time: nextBarTime,
          open: state.data.closes[itemIndex].open,
          high: state.data.closes[itemIndex].high,
          low: state.data.closes[itemIndex].low,
          close: state.data.closes[itemIndex].close,
        };
        console.log("[socket] Generate new bar", bar);
      } else {
        bar = {
          ...lastBar,
          high: Math.max(lastBar.high, state.data.closes[itemIndex].high),
          low: Math.min(lastBar.low, state.data.closes[itemIndex].low),
          close: state.data.closes[itemIndex].close,
        };
      }
      itemIndex++;
      subscriptionItem.lastBar = bar;
      console.log("bar :>> ", bar);
      // Send data to every subscriber of that symbol
      subscriptionItem.handlers.forEach((handler: any) =>
        handler.callback(bar)
      );
    }

    queryClient.setQueryData<Chart | undefined>(["charts"], (oldData) => {
      if (!oldData) {
        return oldData;
      }

      const priceData: Chart = {
        ...oldData,
        time: tradeTime,
      };

      for (let i = 0; i < priceUpdates.length; i += 2) {
        const index = priceUpdates[i];
        const price = priceUpdates[i + 1];

        if (priceData.closes.length < index) {
          while (priceData.closes.length < index) priceData.closes.push(0);
        }

        priceData.closes[index] = price;
      }

      return priceData;
    });
  });
}

// barTime is millisec, resolution is mins
function getNextBarTime(barTime: number, resolution: number) {
  const previousSegment = Math.floor(barTime / 1000 / 60 / resolution);
  return (previousSegment + 1) * 1000 * 60 * resolution;
}

export function subscribeOnStream(
  symbolInfo: LibrarySymbolInfo,
  resolution: ResolutionString,
  onRealtimeCallback: SubscribeBarsCallback,
  subscriberUID: string,
  onResetCacheNeededCallback: () => void,
  lastBar: Bar,
  pairIndex: number
) {
  const handler = {
    id: subscriberUID,
    callback: onRealtimeCallback,
  };
  let subscriptionItem = channelToSubscription.get(pairIndex);
  if (subscriptionItem) {
    // Already subscribed to the channel, use the existing subscription
    subscriptionItem.handlers.push(handler);
    return;
  }

  subscriptionItem = {
    subscriberUID,
    resolution,
    lastBar,
    handlers: [handler],
    pairIndex,
  } as SubscriptionItem;
  channelToSubscription.set(pairIndex, subscriptionItem);
  console.log("[subscribeBars]: Subscribe to streaming. Channel:", pairIndex);
}

export function unsubscribeFromStream(subscriberUID: string) {
  // Find a subscription with id === subscriberUID
  for (const pairIndex of channelToSubscription.keys()) {
    const subscriptionItem = channelToSubscription.get(pairIndex);

    if (!subscriptionItem) {
      continue;
    }

    const handlerIndex = subscriptionItem.handlers.findIndex(
      (handler: any) => handler.id === subscriberUID
    );

    if (handlerIndex !== -1) {
      // Remove from handlers
      subscriptionItem.handlers.splice(handlerIndex, 1);

      if (subscriptionItem.handlers.length === 0) {
        // Unsubscribe from the channel if it was the last handler
        console.log(
          "[unsubscribeBars]: Unsubscribe from streaming. Channel:",
          pairIndex
        );
        // socket.emit("SubRemove", { subs: [channelString] });
        channelToSubscription.delete(pairIndex);
        break;
      }
    }
  }
}
