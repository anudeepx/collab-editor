"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { FaGoogle } from "react-icons/fa";
import { Loader2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";

const HERO_VIDEO_URL =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260228_065522_522e2295-ba22-457e-8fdb-fbcd68109c73.mp4";


export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (session?.user) {
      router.replace("/documents");
    }
  }, [router, session]);

  const handleGoogleSignUp = async () => {
    setLoading(true);
    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: `${window.location.origin}/documents`,
      });
    } catch (error) {
      console.error("Google sign up failed:", error);
      toast.error("Google sign up failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="h-screen overflow-hidden bg-background text-foreground">
      <div className="relative flex h-full flex-col">
        <video
          autoPlay
          className="absolute inset-0 z-0 h-full w-full object-cover"
          loop
          muted
          playsInline
          preload="metadata"
        >
          <source src={HERO_VIDEO_URL} type="video/mp4" />
        </video>

        <div className="absolute inset-0 z-0 bg-background/70 backdrop-blur-[2px]" />

        <div className="relative z-10 flex w-full flex-1 flex-col">
          <nav className="flex items-center justify-between px-6 py-5 font-body md:px-12 lg:px-20">
            <Link
              href="/"
              className="text-xl font-semibold tracking-tight text-foreground"
            >
              {"\u2726"} CollabEditor
            </Link>

            <div className="hidden items-center gap-8 md:flex">
              <Button className="rounded-full px-5 text-sm font-medium">
                About
              </Button>
            </div>
          </nav>

          <main className="flex min-h-0 flex-1 flex-col items-center overflow-hidden px-6 pb-0 md:px-12 lg:px-20">
            <div className="relative flex w-full flex-1 flex-col items-center overflow-hidden pt-6 text-center">
              <div className="hero-reveal hero-reveal-delay-0 mb-6 inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-4 py-1.5 text-sm text-muted-foreground font-body">
                <span>Now with GPT-5 support (Coming Soon) {"\u2728"}</span>
              </div>

              <h1 className="hero-reveal hero-reveal-delay-1 max-w-xl text-center font-display text-5xl leading-[0.95] tracking-tight text-foreground md:text-6xl lg:text-[5rem]">
                Real-Time Collaborative Editor
              </h1>

              <p className="hero-reveal hero-reveal-delay-2 mt-4 max-w-[650px] text-center text-base leading-relaxed text-muted-foreground font-body md:text-lg">
                Edit together, instantly. No more emailing documents back and
                forth. Experience seamless
              </p>

              <div className="hero-reveal hero-reveal-delay-3 mt-5 flex items-center gap-3">
                <Button
                  className="rounded-full px-6 py-5 text-sm font-medium font-body"
                  onClick={handleGoogleSignUp}
                  disabled={loading || isPending}
                >
                  {loading || isPending ? (
                    <Loader2 size={16} className="animate-spin mr-2" />
                  ) : (
                    <FaGoogle className="mr-2 h-4 w-4 cursor-pointer" />
                  )}
                  {isPending ? "Checking session..." : "Sign In with Google"}
                </Button>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
