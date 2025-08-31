import type React from "react";
import type { Metadata } from "next";
import { Orbitron, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { WalletProvider } from "@/components/WalletProvider";
import { Toaster } from "@/components/ui/sonner";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Navbar } from "@/components/Navbar";
import { AuthProvider } from "@/contexts/AuthContext";

const orbitron = Orbitron({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-orbitron",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jetbrains",
});

export const metadata: Metadata = {
  title: "Axon | Mint Your Digital Persona",
  description:
    "Create, mint, and chat with AI-powered digital personas on ZetaChain. Link cross-chain assets and build your omnichain identity.",
  generator: "Axon",
  keywords: [
    "NFT",
    "ZetaChain",
    "AI",
    "Digital Persona",
    "Cross-chain",
    "Web3",
    "Blockchain",
  ],
  authors: [{ name: "Axon Team" }],
  creator: "Axon",
  publisher: "Axon",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://omnisoul.app",
    title: "Axon | Mint Your Digital Persona",
    description:
      "Create, mint, and chat with AI-powered digital personas on ZetaChain",
    siteName: "Axon",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Axon - Digital Persona Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Axon | Mint Your Digital Persona",
    description:
      "Create, mint, and chat with AI-powered digital personas on ZetaChain",
    images: ["/og-image.png"],
    creator: "@omnisoul",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "your-google-verification-code",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <style>{`
html {
  font-family: ${orbitron.style.fontFamily};
  --font-sans: ${orbitron.variable};
  --font-mono: ${jetbrainsMono.variable};
}
        `}</style>
      </head>
      <body
        className={`${orbitron.variable} ${jetbrainsMono.variable} antialiased dark`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <WalletProvider>
            <AuthProvider>
              <ErrorBoundary>
                <div className="relative min-h-screen scanlines">
                  <Navbar />
                  {children}
                </div>
                <Toaster />
              </ErrorBoundary>
            </AuthProvider>
          </WalletProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
