import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Key, LogOut } from "lucide-react"
// import SubmissionCard from "@/components/bounty/submission-card"
import { useState, useEffect } from "react"
import { authClient } from "@better-env/auth/client"
import { toast } from "sonner"
import { useRouter, useSearchParams } from "next/navigation"
import Bounty from "@/components/icons/bounty"
import Image from "next/image"
import { GithubIcon, Wendys } from "../icons"
import Google from "../icons/google"

/*const cards = {
  "ahmet": {
    name: "Ahmet",
    description: "look sir coderabbit says my code good",
    bounty: 100,
    status: "open",
    rank: "Rank 500",
    image: "https://avatars.githubusercontent.com/u/37756565?v=4",
    id: "ahmet",
    screenshot: "https://pbs.twimg.com/media/Gwi-mbBWUBc90r_?format=jpg&name=large"
  },
  "sergio": {
    name: "Sergio",
    description: "I made ur website use tweakcn now pay me!!",
    bounty: 25,
    status: "open",
    rank: "Rank 0",
    image: "https://pbs.twimg.com/profile_images/1939906364119109632/vu8pOSiH_400x400.jpg",
    id: "ahmet",
    screenshot: "https://pbs.twimg.com/media/GwjyS7FX0AMIz4H?format=png&name=small"
  },
  "nizzy": {
    name: "nizzy",
    description: "Here's my submission",
    bounty: 1000,
    status: "open",
    rank: "Rank 186",
    image: "https://pbs.twimg.com/profile_images/1884987569961570304/TP3OWz64_400x400.jpg",
    id: "ahmet",
    screenshot: "https://pbs.twimg.com/media/Gwl0qdhWgAAoJdK?format=jpg&name=large"
  }
}*/

export default function Login() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, isPending } = authClient.useSession();

  // Get callback URL from search params, default to dashboard
  const callbackUrl = searchParams.get('callback') || "/";

  useEffect(() => {
   if (!PublicKeyCredential.isConditionalMediationAvailable ||
       !PublicKeyCredential.isConditionalMediationAvailable()) {
     return;
   }
 
  void authClient.signIn.passkey({ autoFill: true })
}, [])

  const handleGitHubSignIn = async () => {
    try {
      setLoading(true)
      await authClient.signIn.social(
        {
          provider: "github",
          callbackURL: callbackUrl
        },
        {
          onSuccess: () => {
            toast.success("Sign in successful");
          },
          onError: (error) => {
            toast.error(error.error.message || "Sign in failed");
            setLoading(false)
          },
        }
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Sign in failed");
      setLoading(false)
    }
  };

  const handleGoogleSignIn = () => {
    toast.info("Coming soon!");
  };

  const handleGoToDashboard = () => {
    router.push(callbackUrl);
  };

  const handlePasskeySignIn = async () => {
    try {
      await authClient.signIn.passkey({
        autoFill: false,
        fetchOptions: {
          onSuccess: () => {
            toast.success("Signed in successfully");
            router.push(callbackUrl);
          },
        },
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Sign in failed");
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background border border-border-light text-text-primary">
      {/* Left Column: Login Section */}
      <div className="flex-1 flex items-center justify-center p-8 md:p-12">
        <div className="max-w-md w-full space-y-8">
          {/* Mobile Bounty Icon */}
          <div className="lg:hidden flex justify-center mb-8">
            <Bounty className="w-24 h-28 text-primary" />
          </div>

          {isPending ? (
            <div className="text-center space-y-4">
              <div className="animate-pulse">
                <div className="h-12 bg-muted rounded mb-4"></div>
                <div className="h-4 bg-muted rounded mb-2"></div>
                <div className="h-4 bg-muted rounded w-3/4 mx-auto"></div>
              </div>
            </div>
          ) : session ? (
            <div className="text-center space-y-6">
              <div className="space-y-2">
                <h1 className="text-4xl md:text-4xl font-bold">Welcome back!</h1>
                <p className="text-lg text-text-tertiary">You&apos;re already signed in</p>
              </div>
              <div className="space-y-4">
                <div className="flex flex-col items-center space-y-4">
                  <div className="flex items-center w-full space-x-3">
                    {session.user.image && (
                      <Image
                        src={session.user.image}
                        alt={session.user.name || "User"}
                        className="w-12 h-12 rounded-full border-2 border-muted"
                        width={48}
                        height={48}
                      />
                    )}
                    <div className="text-left">
                      <p className="text-text-primary font-medium">{session.user.name}</p>
                      <p className="text-text-tertiary text-sm">{session.user.email}</p>
                    </div>
                  </div>
                  <Button
                    onClick={handleGoToDashboard}
                    className="oauthButton w-full max-w-[466px] min-w-[240px] h-12 px-6 py-3 bg-[#303030] text-[#f3f3f3] rounded-lg flex items-center justify-center gap-3 shadow-button-custom"
                  >
                    Go to Dashboard
                  </Button>
                  <Button
                    variant="destructive"
                    className="oauthButton w-full max-w-[466px] min-w-[240px] h-12 px-6 py-3 rounded-lg flex items-center justify-center gap-3 shadow-button-custom hover:bg-[#383838]"
                    onClick={() => authClient.signOut({
                      fetchOptions: {
                        onSuccess: () => {
                          toast.success("Signed out successfully");
                          window.location.href = "/login";
                        }
                      }
                    })}
                  >
                    <LogOut className="w-5 h-5" />
                    Sign Out
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="text-center space-y-2">
                <h1 className="text-4xl md:text-5xl font-bold">Get started</h1>
                <p className="text-lg text-text-tertiary">Sign in to your account</p>
              </div>
              <div className="hidden">
                <label htmlFor="name">Username:</label>
                <input type="text" name="name" autoComplete="username webauthn" />
                <label htmlFor="password">Password:</label>
                <input type="password" name="password" autoComplete="current-password webauthn" />
              </div>
              <div className="flex flex-col justify-center items-center space-y-4">
                <Button
                  onClick={handleGitHubSignIn}
                  disabled={loading}
                  className="w-full max-w-[466px] min-w-[240px] h-12 px-6 py-3 bg-background text-foreground rounded-lg flex items-center justify-center gap-3 shadow-button-custom hover:bg-muted"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-t-border-light border-border rounded-full animate-spin" />
                  ) : (
                    <GithubIcon className="w-5 h-5 fill-text-primary" />
                  )}
                  {loading ? 'Signing in…' : 'Continue with GitHub'}
                </Button>
                <Button
                  onClick={handleGoogleSignIn}
                  className="w-full max-w-[466px] min-w-[240px] h-12 px-6 py-3 bg-background text-foreground rounded-lg flex items-center justify-center gap-3 hover:bg-muted"
                >
                  <Wendys className="w-6 h-6" />
                  Continue with Wendy&apos;s
                </Button>
                <Button
                  onClick={handleGoogleSignIn}
                  className="w-full max-w-[466px] min-w-[240px] h-12 px-6 py-3 bg-background text-foreground rounded-lg flex items-center justify-center gap-3 hover:bg-muted"
                >
                  <Google className="w-6 h-6" />
                  Continue with Google
                </Button>
                <Button
                  onClick={handlePasskeySignIn}
                  disabled={loading}
                  variant="text"
                  className="h-4 px-6 text-text-tertiary rounded-lg flex items-center justify-center gap-3 hover:text-text-tertiary/80"
                >
                  <Key className="w-6 h-6" />
                  {loading ? 'Signing in…' : 'Have a passkey?'}
                </Button>
                <p className="text-center text-sm text-text-tertiary mt-8 ">
                  {"By continuing, you accept our "}
                  <Link href="#" className="underline text-text-tertiary hover:text-text-primary">
                    Terms of Service
                  </Link>
                  {" and "}
                  <Link href="#" className="underline text-text-tertiary hover:text-text-primary">
                    Privacy Policy
                  </Link>
                  .
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
