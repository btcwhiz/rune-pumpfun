"use client";

import type { Metadata } from "next";
// import { Inter } from "next/font/google";
// import { QueryClient, QueryClientProvider } from "react-query";
import { NextUIProvider } from "@nextui-org/system";
import { Toaster } from "react-hot-toast";
import NextTopLoader from "nextjs-toploader";
import { MainProvider } from "./contexts/MainContext";
import "./globals.css";
import Header from "./components/header";
import Trend from "./components/trend";

// const inter = Inter({ subsets: ["latin"] });

// export const queryClient = new QueryClient();

export const metadata: Metadata = {
  title: "Runed.com - Rune Launchpad on Bitcoin",
  description:
    "Launch your Runes on Bitcoin with Runed.com – the ultimate launchpad for digital inscriptions and assets.",
  keywords:
    "Pump Fun Bitcoin, Pump Fun BTC, Bitcoin, Runes, Rune Launchpad, Digital Inscriptions, BTC Launchpad, Bitcoin Assets, Token Launch, Bitcoin Collectibles, Bitcoin Tokens.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <NextTopLoader color="#FD9800" />
        <Toaster />
        {/* <QueryClientProvider client={queryClient}> */}
        <NextUIProvider>
          <MainProvider>
            <div className="flex flex-col items-center">
              <Header></Header>
              <Trend></Trend>
              {children}
            </div>
          </MainProvider>
        </NextUIProvider>
        {/* </QueryClientProvider> */}
      </body>
    </html>
  );
}
