import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { ZenModeProvider } from "@/lib/zen-mode";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = "https://fractiunate.me/client-tools";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Client-Side Tools | Fractiunate",
    template: "%s | Client-Side Tools",
  },
  description: "Free browser-based developer tools. Favicon converter, QR code generator, TLS certificate generator, JSON/YAML formatter. 100% private - no uploads, no servers.",
  keywords: ["developer tools", "favicon converter", "QR code generator", "TLS certificates", "JSON formatter", "YAML formatter", "client-side", "privacy"],
  authors: [{ name: "Fractiunate" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "Client-Side Tools",
    title: "Client-Side Tools | Fractiunate",
    description: "Free browser-based developer tools. Favicon converter, QR code generator, TLS certificate generator, JSON/YAML formatter. 100% private - no uploads, no servers.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Client-Side Tools | Fractiunate",
    description: "Free browser-based developer tools. Favicon converter, QR code generator, TLS certificate generator, JSON/YAML formatter. 100% private.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ZenModeProvider>
          {children}
          <Toaster richColors position="bottom-right" />
        </ZenModeProvider>
      </body>
    </html>
  );
}
