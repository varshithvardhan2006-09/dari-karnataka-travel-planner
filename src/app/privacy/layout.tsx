import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy · Dari (ದಾರಿ)",
  description: "What data Dari uses to plan a Karnataka trip, where it goes, and what is never collected.",
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
