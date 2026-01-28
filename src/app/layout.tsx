import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "강화하기",
  description: "강화 시뮬레이션 게임",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${inter.className} h-[100dvh] bg-gray-950 overflow-hidden`}>
        <div className="flex flex-col h-full">
          <main className="flex-1 overflow-y-auto pb-14">
            <div className="max-w-lg mx-auto px-3 py-2">
              {children}
            </div>
          </main>
          <Navigation />
        </div>
      </body>
    </html>
  );
}
