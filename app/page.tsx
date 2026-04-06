"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";

const HERO_VIDEO_URL =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260319_015952_e1deeb12-8fb7-4071-a42a-60779fc64ab6.mp4";

const navItems = ["Home", "Create Document", "View Documents"];

function PlayIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4 fill-foreground"
      viewBox="0 0 24 24"
    >
      <path d="M8 6.82v10.36c0 .8.87 1.28 1.54.86l8.14-5.18a1 1 0 0 0 0-1.72L9.54 5.96A1 1 0 0 0 8 6.82Z" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg aria-hidden="true" className="h-3.5 w-3.5" viewBox="0 0 24 24">
      <path
        d="m6 9 6 6 6-6"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.75"
      />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg aria-hidden="true" className="h-3.5 w-3.5" viewBox="0 0 24 24">
      <path
        d="m21 21-4.35-4.35m1.85-5.15a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.75"
      />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24">
      <path
        d="M15 18H6.5a1.5 1.5 0 0 1-1.27-2.3l1.02-1.62A6 6 0 0 0 7 10.88V9a5 5 0 1 1 10 0v1.88c0 1.1.3 2.17.85 3.08l1.02 1.62A1.5 1.5 0 0 1 17.6 18H15Zm0 0a3 3 0 0 1-6 0"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.75"
      />
    </svg>
  );
}

function MoreIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24">
      <circle cx="5" cy="12" r="1.6" fill="currentColor" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" />
      <circle cx="19" cy="12" r="1.6" fill="currentColor" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24">
      <path
        d="M12 5v14M5 12h14"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.75"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4 text-emerald-500" viewBox="0 0 24 24">
      <path
        d="m5 13 4 4L19 7"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

export default function Home() {
  return (
    <div className="h-screen overflow-hidden bg-background text-foreground">
      <div className="relative flex h-full flex-col">
        <video
          autoPlay
          className="absolute inset-0 z-0 h-full w-full object-cover"
          loop
          muted
          playsInline
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
              {navItems.map((item) => (
                <Link
                  key={item}
                  href="/"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {item}
                </Link>
              ))}
              <Button className="rounded-full px-5 text-sm font-medium">
                Get Started
              </Button>
            </div>
          </nav>

          <main className="flex min-h-0 flex-1 flex-col items-center overflow-hidden px-6 pb-0 md:px-12 lg:px-20">
            <div className="relative flex w-full flex-1 flex-col items-center overflow-hidden pt-6 text-center">
              <div className="hero-reveal hero-reveal-delay-0 mb-6 inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-4 py-1.5 text-sm text-muted-foreground font-body">
                <span>Now with GPT-5 support (Comming Soon) {"\u2728"}</span>
              </div>

              <h1 className="hero-reveal hero-reveal-delay-1 max-w-xl text-center font-display text-5xl leading-[0.95] tracking-tight text-foreground md:text-6xl lg:text-[5rem]">
                Real-Time Collaborative Editor
              </h1>

              <p className="hero-reveal hero-reveal-delay-2 mt-4 max-w-[650px] text-center text-base leading-relaxed text-muted-foreground font-body md:text-lg">
                Edit together, instantly. No more emailing documents back and forth. Experience seamless
              </p>

              <div className="hero-reveal hero-reveal-delay-3 mt-5 flex items-center gap-3">
                <Button className="rounded-full px-6 py-5 text-sm font-medium font-body">
                  Book a demo
                </Button>
                <Button
                  className="h-11 w-11 rounded-full border-0 bg-background p-0 shadow-[0_2px_12px_rgba(0,0,0,0.08)] hover:bg-background/80"
                  size="icon"
                  variant="ghost"
                >
                  <PlayIcon />
                </Button>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
