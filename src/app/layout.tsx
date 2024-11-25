import type { Metadata, Viewport } from "next";
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
    "Launch your Runes on Bitcoin with Runed.com - the ultimate launchpad for digital inscriptions and assets.",
  keywords: [
    "Pump Fun Bitcoin, Pump Fun BTC, Bitcoin, Runes, Rune Launchpad, Digital Inscriptions, BTC Launchpad, Bitcoin Assets, Token Launch, Bitcoin Collectibles, Bitcoin Tokens.",
  ],
  authors: [{ name: "Nut Market", url: "https://nut.market" }],
  robots: "index, follow", // Ensures the page is indexed and links are followed
  openGraph: {
    title: "Runed.com - Rune Launchpad on Bitcoin", // Open Graph title for social sharing
    description:
      "Discover Runed.com, the premier launchpad for creating and managing Runes on Bitcoin. Join the revolution in digital inscriptions and assets.",
    type: "website", // Type of content
    url: "https://runed.com", // URL of the page
    images: [
      {
        url: "https://image.runed.com/images/runed.png", // Replace with the correct URL of your image
        width: 614, // Recommended width for OG images
        height: 614, // Recommended height for OG images
        alt: "Bill Tovitt Backend Portfolio", // Describes the image
      },
    ],
  },
  twitter: {
    card: "summary_large_image", // Optimized card type for Twitter
    title: "Runed.com - Rune Launchpad on Bitcoin",
    description:
      "Launch your Runes on Bitcoin with Runed.com - the ultimate launchpad for digital inscriptions and assets.",
    images: ["https://image.runed.com/images/runes_logo.png"],
    site: "@nutdotmarket", // Replace with your Twitter handle
  },
};

export const viewport: Viewport = {
  themeColor: "#FE0BEE",
  width: "device-width",
  initialScale: 1,
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
