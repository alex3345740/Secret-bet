import type { Metadata } from "next";
import { Outfit, Pixelify_Sans } from "next/font/google";
import "@/styles/tokens.css";
import "./globals.css";
import { RootProviders } from "@/providers/root-providers";
import { AppShell } from "@/components/layout/app-shell";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const pixelify = Pixelify_Sans({
  subsets: ["latin"],
  variable: "--font-pixelify",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Secret Bet",
  description: "Private Solana casino with MagicBlock ER/PER and VRF-backed rounds."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${outfit.variable} ${pixelify.variable}`}>
      <body className="font-outfit antialiased">
        <RootProviders>
          <AppShell>{children}</AppShell>
        </RootProviders>
      </body>
    </html>
  );
}
