import type { Metadata, Viewport } from "next";
import { Nunito, DM_Sans } from "next/font/google";
import "./globals.css";
import StatusBar from "@/components/StatusBar";
import BottomNav from "@/components/BottomNav";
import SplashScreen from "@/components/SplashScreen";
import Providers from "@/components/Providers";

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-nunito",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Kotoka - Snap & Learn English",
  description:
    "Learn English vocabulary through your daily life. Snap photos, discover words, and build lasting memory with sensory tags.",
  icons: { icon: "/logo.png" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#effbfd",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${nunito.variable} ${dmSans.variable}`}>
      <body className="font-body bg-background min-h-screen">
        <Providers>
          <SplashScreen />
          <StatusBar />
          <main className="pt-14 pb-20 min-h-screen">
            <div className="max-w-[480px] mx-auto px-4">{children}</div>
          </main>
          <BottomNav />
        </Providers>
      </body>
    </html>
  );
}
