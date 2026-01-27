import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "강화하기",
  description: "강화 시뮬레이션 게임",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${inter.className} min-h-screen bg-gray-950`}>
        <div className="flex flex-col min-h-screen">
          <header className="hidden md:block sticky top-0 z-40 bg-gray-950/80 backdrop-blur-sm">
            <Navigation />
          </header>
          <main className="flex-1 pb-20 md:pb-4">
            <div className="max-w-4xl mx-auto px-4 py-6">
              {children}
            </div>
          </main>
          <div className="md:hidden">
            <Navigation />
          </div>
        </div>
      </body>
    </html>
  );
}
