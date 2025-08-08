import type { Metadata } from "next";
import { headers } from "next/headers";
import Sidebar from "@/components/dual-sidebar";
import { DeviceProvider } from "@/components/device-provider";
// import { SignedOut } from "@daveyplate/better-auth-ui";
// import RedirectToSignIn from "@/components/auth/redirect-to-signin";

export const metadata: Metadata = {
  title: "bounty",
  description: "bounty",
  icons: {
    icon: "/icon.svg",
  },
  openGraph: {
    title: "bounty - App",
    description: "Ship fast, get paid faster.",
    url: "https://bounty",
    siteName: "bounty",
    images: [
      {
        url: "/ogimage.png",
        width: 1200,
        height: 630,
        alt: "bounty.new - Ship fast, get paid faster.",
      },
    ],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const userAgent = headersList.get("user-agent") || "";

  return (
    <>
      <DeviceProvider userAgent={userAgent}>
        <Sidebar>
          {/* <SignedOut>
          <RedirectToSignIn />
        </SignedOut> */}
          {children}
        </Sidebar>
      </DeviceProvider>
    </>
  );
}
