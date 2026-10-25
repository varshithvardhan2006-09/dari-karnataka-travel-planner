import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Hanken_Grotesk, Noto_Sans_Kannada } from "next/font/google";
import "./globals.css";
import { LangProvider } from "@/lib/i18n/useLang";
import Navbar from "@/components/Navbar";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#8E1F2F",
};

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-bricolage",
  display: "swap",
});

const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-hanken",
  display: "swap",
});

const notoSansKannada = Noto_Sans_Kannada({
  subsets: ["kannada"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-noto-kannada",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://dari-karnataka-travel-planner.vercel.app"),
  title: "Dari (ದಾರಿ) - AI Travel Planner for Karnataka",
  description:
    "Plan personalized Karnataka itineraries based on interests, available time, and budget. Authentic places, routes, costs, and Kannada phrases.",
  keywords: ["Karnataka", "Travel Planner", "Kannada", "Itinerary", "AI Planner", "Mysuru", "Hampi", "Gokarna"],
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "Dari (ದಾರಿ) - AI Travel Planner for Karnataka",
    description: "Personalized Karnataka itineraries built only from real places with Kannada phrases for every stop.",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Dari - AI Travel Planner for Karnataka",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Dari (ದಾರಿ) - AI Travel Planner for Karnataka",
    description: "Personalized Karnataka itineraries built only from real places with Kannada phrases for every stop.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${bricolage.variable} ${hanken.variable} ${notoSansKannada.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#F2F4F1] text-[#14202B]">
        <LangProvider>
          <Navbar />
          <main className="flex-1 flex flex-col">{children}</main>
        </LangProvider>
      </body>
    </html>
  );
}
