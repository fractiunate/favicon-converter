import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { ZenModeProvider } from "@/lib/zen-mode";
import { WorkspaceProvider } from "@/lib/workspace";
import { PomodoroProvider } from "@/lib/pomodoro-context";
import { GlobalPomodoroPlaybar } from "@/components/global-pomodoro-playbar";
import { FEATURE_FLAGS } from "@/lib/feature-flags";
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
  // Build the provider tree based on feature flags
  let content = (
    <>
      {children}
      <Toaster richColors position="bottom-right" />
    </>
  );

  // Wrap with PomodoroProvider if enabled
  if (FEATURE_FLAGS.POMODORO_ENABLED) {
    content = (
      <PomodoroProvider>
        {children}
        <GlobalPomodoroPlaybar />
        <Toaster richColors position="bottom-right" />
      </PomodoroProvider>
    );
  }

  // Wrap with WorkspaceProvider if enabled
  if (FEATURE_FLAGS.WORKSPACES_ENABLED) {
    content = <WorkspaceProvider>{content}</WorkspaceProvider>;
  }

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ZenModeProvider>
          {content}
        </ZenModeProvider>
      </body>
    </html>
  );
}
