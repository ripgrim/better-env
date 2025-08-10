import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@/index.css";
import { Providers } from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",  
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://better-env.com'),
  title: "better-env",
  description: "Ship faster. Get paid instantly.",
  icons: {
    icon: '/icon.svg',
  },
  openGraph: {
    title: "better-env",
    description: "Ship faster. Get paid instantly.",
    url: "https://better-env.com",
    siteName: "better-env",
    images: [
      {
        url: "/ogimage.png",
        width: 1200,
        height: 630,
        alt: "better-env - Ship faster. Get paid instantly.",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "better-env",
    description: "Ship faster. Get paid instantly.",
    images: ["/og-image.png"],
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
            <div className="grid grid-rows-[auto_1fr] h-svh w-full">
              {children}
            </div>
          </Providers>
      </body>
    </html>
  );
}
