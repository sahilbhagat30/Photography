import type { Metadata } from "next";
import { Lexend, Playfair_Display } from "next/font/google";
import "./globals.css";
import Cursor from "@/components/Cursor";
import LenisProvider from "@/components/LenisProvider";

const lexend = Lexend({ subsets: ["latin"], variable: "--font-lexend", weight: ["300","400","500","600","700","800","900"] });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair", weight: ["400", "500", "600", "700", "800", "900"], style: ["normal", "italic"] });

export const metadata: Metadata = {
  title: "Sahil Bhagat",
  description: "Data Engineer & Analytics Professional specializing in cloud infrastructure, BI, and data pipelines.",
  metadataBase: new URL("https://sahilbhagat30.github.io"),
  openGraph: {
    title: "Sahil Bhagat",
    description: "Data Engineer & Analytics Professional specializing in cloud infrastructure, BI, and data pipelines.",
    url: "https://sahilbhagat30.github.io",
    siteName: "Sahil Bhagat",
    locale: "en_US",
    type: "website",
  },
  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${lexend.variable} ${playfair.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans text-foreground bg-background">
        {/* Custom cursor — above everything */}
        <Cursor />
        <LenisProvider>{children}</LenisProvider>
      </body>
    </html>
  );
}
