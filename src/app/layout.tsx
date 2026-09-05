import type { Metadata } from "next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://sahil-bhagat-photography.ugk2102.chatgpt.site";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

export const metadata: Metadata = {
  title: "Sahil Bhagat",
  description: "Quiet weather, city rhythms, and lived-in moments photographed by Sahil Bhagat.",
  metadataBase: new URL(siteUrl),
  openGraph: {
    title: "Sahil Bhagat",
    description: "Quiet weather, city rhythms, and lived-in moments photographed by Sahil Bhagat.",
    url: siteUrl,
    siteName: "Sahil Bhagat",
    locale: "en_US",
    type: "website",
  },
  icons: {
    icon: `${basePath}/favicon.ico`,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col text-foreground bg-background">
        {children}
      </body>
    </html>
  );
}
