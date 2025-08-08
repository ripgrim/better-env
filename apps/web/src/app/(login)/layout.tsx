import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "better-env - Log in",
  description: "Ship faster. Get paid instantly.",  
  icons: {
    icon: "/icon.svg",
  },
  openGraph: {
    title: "better-env - Log in",
    description: "Ship faster. Get paid instantly.",
    url: "https://better-env/login",
    siteName: "better-env - Log in",
    images: [
      {
        url: "/ogimage.png",
        width: 1200,
        height: 630,
        alt: "better-env - Ship faster. Get paid instantly.",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      {children}
    </>
  );
}
