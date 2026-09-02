import type { Metadata } from "next";
import "./globals.css";
import LenisProvider from "@/components/LenisProvider";

export const metadata: Metadata = {
  title: "Sahil Bhagat — Photography",
  description: "Quiet weather, city rhythms, and lived-in moments photographed by Sahil Bhagat.",
  metadataBase: new URL("https://sahilbhagat30.github.io"),
  openGraph: {
    title: "Sahil Bhagat — Photography",
    description: "Quiet weather, city rhythms, and lived-in moments photographed by Sahil Bhagat.",
    url: "https://sahilbhagat30.github.io",
    siteName: "Sahil Bhagat",
    locale: "en_US",
    type: "website",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans text-foreground bg-background">
        <LenisProvider>{children}</LenisProvider>
      </body>
    </html>
  );
}
