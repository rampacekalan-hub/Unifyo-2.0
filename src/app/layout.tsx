import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getSiteConfig } from "@/config/site-settings";
import CookieConsent from "@/components/ui/CookieConsent";
import PageViewTracker from "@/components/analytics/PageViewTracker";
import InstallPrompt from "@/components/ui/InstallPrompt";
import UserPrefsProvider from "@/lib/prefsContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const config = getSiteConfig();

export const metadata: Metadata = {
  title: config.seo.title,
  description: config.seo.description,
  keywords: config.seo.keywords,
  metadataBase: new URL(config.seo.canonicalUrl),
  openGraph: {
    title: config.seo.title,
    description: config.seo.description,
    url: config.seo.canonicalUrl,
    siteName: config.name,
    // OG image je generovaný súborom src/app/opengraph-image.tsx (Next 16 file convention)
    locale: config.locale,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: config.seo.title,
    description: config.seo.description,
    creator: config.seo.twitterHandle,
    // Twitter image sa dopĺňa cez app/opengraph-image.tsx alebo twitter-image.tsx
  },
};

export const viewport: Viewport = {
  themeColor: "#6366f1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang={config.locale}
      className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {/* Single visual identity — dark is the canonical, polished theme.
            Light mode caused invisible-button bugs (automation toggles, etc)
            and forked the design language. forcedTheme locks it everywhere
            and ignores stored preference / system setting. */}
        <ThemeProvider
          attribute="class"
          forcedTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <UserPrefsProvider>
            <TooltipProvider>
              {children}
              <PageViewTracker />
              <CookieConsent />
              <InstallPrompt />
              <Toaster richColors position="bottom-right" theme="dark" />
            </TooltipProvider>
          </UserPrefsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
