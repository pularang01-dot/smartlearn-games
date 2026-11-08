import type { Metadata, Viewport } from "next";
import { Fredoka, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast";
import { MotionPreference } from "@/components/ui/motion-preference";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta", display: "swap" });
const fredoka = Fredoka({ subsets: ["latin"], variable: "--font-fredoka", display: "swap" });

export const metadata: Metadata = {
  title: { default: "SmartLearn Games — Game belajar untuk Smartboard", template: "%s · SmartLearn Games" },
  description: "Buat dan mainkan game Benar/Salah interaktif untuk kelas Anda. Dirancang untuk layar sentuh Smartboard.",
  authors: [{ name: "Viky Aditama" }],
  creator: "Viky Aditama",
  publisher: "Viky Aditama",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#3345C7" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${jakarta.variable} ${fredoka.variable}`}>
      <body>
        <ToastProvider>
          <MotionPreference />
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}