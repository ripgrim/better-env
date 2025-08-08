"use client"

import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { authClient } from "@better-env/auth/client";
// import Login from "@/components/bounty/login";

function LoginContent() {
  const handleSignIn = async () => {
    await authClient.signIn.social({
      provider: "github",
      callbackURL: "/",
    });
  }
  // const handleGitHubSignIn = async () => {
  //   try {
  //     const callbackURL = redirectUrl ? `${redirectUrl}` : `${baseUrl}/dashboard`;

  //     await authClient.signIn.social(
  //       {
  //         provider: "github",
  //         callbackURL
  //       },
  //       {
  //         onSuccess: () => {
  //           toast.success("Sign in successful");
  //         },
  //         onError: (error) => {
  //           toast.error(error.error.message || "Sign in failed");
  //         },
  //       }
  //     );
  //   } catch (error) {
  //     toast.error(error instanceof Error ? error.message : "Sign in failed");
  //   }
  // };

  return (
    //<Login/>
    <div>
      <Button onClick={handleSignIn}>Sign in</Button>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="bg-landing-background mx-auto w-full">
      {/* <Header /> */}
      <Suspense fallback={<div>Loading...</div>}>
        <LoginContent />
      </Suspense>
    </div>
  );
}
