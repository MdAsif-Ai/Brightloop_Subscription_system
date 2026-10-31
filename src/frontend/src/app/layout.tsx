import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Brightloop OS — Premium Subscription Management & Autonomous Revenue Operations",
  description:
    "One platform. Every subscription. Complete revenue control. High-reliability recurring billing, Billing Time Machine, and Revenue Guardian.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#F4F6F5] text-[#202C33]">
        <AuthProvider>
          {children}
          <Toaster
            position="top-right"
            richColors
            closeButton
            theme="light"
          />
        </AuthProvider>
      </body>
    </html>
  );
}
