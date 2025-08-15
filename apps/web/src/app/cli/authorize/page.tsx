"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { authClient } from "@better-env/auth/client";
import { trpc, trpcClient } from "@/utils/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export default function DeviceAuthorizePage() {
  const [userCode, setUserCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const { data: session } = authClient.useSession();

  const authorizeDevice = useMutation({
    mutationFn: async (input: { userCode: string }) => {
      if (!input || !input.userCode) {
        throw new Error("Invalid input: userCode is required");
      }
      
      const response = await fetch('/api/cli/authorize-device', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ userCode: input.userCode }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error?.message || 'Authorization failed');
      }
      
      return data;
    },
    onSuccess: () => {
      setSuccess(true);
      setError("");
      setIsLoading(false);
    },
    onError: (error: any) => {
      setError(error.message);
      setIsLoading(false);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session?.user?.id) {
      setError("You must be logged in to authorize a device");
      return;
    }

    if (!userCode.trim()) {
      setError("Please enter the device code");
      return;
    }

    setIsLoading(true);
    setError("");

    authorizeDevice.mutate({
      userCode: userCode.trim().toUpperCase(),
    });
  };

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>
              You need to be logged in to authorize a device
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full" 
              onClick={() => router.push("/login")}
            >
              Log In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-green-600">Device Authorized!</CardTitle>
            <CardDescription>
              Your CLI device has been successfully authorized. You can now return to your terminal.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full" 
              onClick={() => router.push("/")}
            >
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Authorize CLI Device</CardTitle>
          <CardDescription>
            Enter the code displayed in your terminal to authorize your CLI access
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="userCode">Device Code</Label>
              <Input
                id="userCode"
                type="text"
                placeholder="Enter 8-character code"
                value={userCode}
                onChange={(e) => setUserCode(e.target.value)}
                className="text-center font-mono text-lg tracking-wider"
                maxLength={8}
                autoFocus
              />
            </div>

            {error && (
              <div className="text-sm text-red-600 text-center bg-red-50 p-2 rounded">
                {error}
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading || !userCode.trim()}
            >
              {isLoading ? "Authorizing..." : "Authorize Device"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            <p>Logged in as: <strong>{session.user.email}</strong></p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}