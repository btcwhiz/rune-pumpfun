import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { NextUIProvider } from "@nextui-org/system";
import { Toaster } from "react-hot-toast";
import { MainProvider } from "./contexts/MainContext";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BTC Pump.fun",
  description: "Generated by Abracadabra",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Toaster />
        <NextUIProvider>
          <MainProvider>{children}</MainProvider>
        </NextUIProvider>
      </body>
    </html>
  );
}
