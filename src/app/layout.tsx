import type { Metadata, Viewport } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Cursor } from "@/components/chrome/Cursor";
import { ScrubController } from "@/components/chrome/ScrubController";
import { ScrubBar } from "@/components/chrome/ScrubBar";
import { Terminal } from "@/components/chrome/Terminal";
import { Header } from "@/components/chrome/Header";

const display = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
});

const mono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
});

const TITLE = "Nandakishore Reddy, Full-Stack Developer";
const DESCRIPTION =
  "Full-stack developer from Hyderabad. React, Next.js, Go, Supabase, WebGL, n8n. Building systems that feel alive.";

export const metadata: Metadata = {
  metadataBase: new URL("https://nandakishore.dev"),
  title: { default: TITLE, template: "%s · Nandakishore Reddy" },
  description: DESCRIPTION,
  keywords: ["Nandakishore Reddy", "Full-Stack Developer", "React", "Next.js", "Go", "Supabase", "Three.js", "WebGL", "n8n", "Hyderabad"],
  authors: [{ name: "Nandakishore Reddy" }],
  creator: "Nandakishore Reddy",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "/",
    siteName: "Nandakishore Reddy",
    title: TITLE,
    description: DESCRIPTION,
    images: [{ url: "/og.png", width: 1200, height: 630, alt: TITLE }],
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION, images: ["/og.png"], creator: "@N9601" },
  robots: { index: true, follow: true },
  icons: { icon: [{ url: "/favicon.svg", type: "image/svg+xml" }], shortcut: "/favicon.svg", apple: "/favicon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#080808",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${mono.variable} h-full antialiased`}>
      <body className="min-h-full bg-bg text-fg">
        <ScrubController />
        <Header />
        <Cursor />
        <ScrubBar />
        <Terminal />
        {children}
      </body>
    </html>
  );
}
