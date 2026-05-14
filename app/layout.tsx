import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/lib/providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "VerifySocial | AI Protection for Adult Content Creators",
  description: "Enterprise-grade safety & compliance platform for OnlyFans, Fansly, and adult content creators. AI-powered protection against risks.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}