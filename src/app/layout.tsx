"use client";

// import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { QueryClient, QueryClientProvider } from "react-query";
import { NextUIProvider } from "@nextui-org/system";
import { Toaster } from "react-hot-toast";
import { MainProvider } from "./contexts/MainContext";
import "./globals.css";
import Header from "./components/header";

const inter = Inter({ subsets: ["latin"] });

export const queryClient = new QueryClient();

// export const metadata: Metadata = {
//   title: "BTC Pump.fun",
//   description: "Generated by Next Js",
// };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Toaster />
        <QueryClientProvider client={queryClient}>
          <NextUIProvider>
            <MainProvider>
              <div>
                <Header></Header>
                {children}
              </div>
            </MainProvider>
          </NextUIProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}
