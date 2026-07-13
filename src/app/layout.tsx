import type { Metadata } from "next";
import { Inter, Playfair_Display, Cormorant_Garamond, Great_Vibes, Montserrat } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { SessionProvider } from "@/components/session-provider";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-script",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const greatVibes = Great_Vibes({
  variable: "--font-hero",
  subsets: ["latin"],
  display: "swap",
  weight: ["400"],
});

const montserrat = Montserrat({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "House of Neelam — Rakhi Collection | Premium Handcrafted Rakhis",
  description: "Discover the finest handcrafted Rakhis at House of Neelam. Traditional, designer, and premium Rakhis celebrating the eternal bond of brother and sister. Order easily via WhatsApp.",
  keywords: ["Rakhi", "Raksha Bandhan", "Premium Rakhi", "Designer Rakhi", "Handcrafted Rakhi", "House of Neelam", "Rakhi Collection", "Traditional Rakhi", "Gold Rakhi", "Silver Rakhi"],
  authors: [{ name: "House of Neelam" }],
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "House of Neelam — Rakhi Collection",
    description: "Premium handcrafted Rakhis celebrating the eternal bond of love.",
    siteName: "House of Neelam",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "House of Neelam — Rakhi Collection",
    description: "Premium handcrafted Rakhis celebrating the eternal bond of love.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${playfair.variable} ${cormorant.variable} ${greatVibes.variable} ${montserrat.variable} antialiased bg-background text-foreground`}
      >
        <SessionProvider>{children}</SessionProvider>
        <Toaster />
        <SonnerToaster />
      </body>
    </html>
  );
}
