"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  Play,
  X,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { SmoothScrollCanvas } from "@/components/landing/smooth-scroll-canvas";

export default function HomePage() {
  const { user, role } = useAuth();
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [demoStep, setDemoStep] = useState(0);

  const demoTourSteps = [
    {
      title: "Step 1: Revenue Command Center",
      description:
        "Real-time operational dashboard with MRR, ARR, active subscriber cohort analytics, and live billing pipeline status.",
      route: "/dashboard",
      highlight: "Normalized MRR & Revenue Flow Visualization",
    },
    {
      title: "Step 2: Product & Plan Architecture",
      description:
        "Configure complex billing cadences (Daily, Weekly, Monthly, Annual) with variant add-ons and automated tax/discount rules.",
      route: "/catalog",
      highlight: "Product Studio & Variant Pricing Engine",
    },
    {
      title: "Step 3: End-to-End Contract Lifecycle",
      description:
        "Draft quotations, validate expiration windows, convert directly to active subscriptions, and monitor renewal health.",
      route: "/subscriptions",
      highlight: "Quotation conversion & Lifecycle timelines",
    },
    {
      title: "Step 4: Billing Time Machine (Signature Innovation)",
      description:
        "Simulate the passage of time into future billing cycles to preview invoices and prove duplicate billing prevention mathematically.",
      route: "/time-machine",
      highlight: "Zero-duplicate recurring invoice engine",
    },
    {
      title: "Step 5: Revenue Guardian & Auto-Recovery",
      description:
        "Intelligent heuristic monitor that catches unbilled subscriptions, overdue payments, and missing invoices with 1-click recovery.",
      route: "/guardian",
      highlight: "Autonomous revenue leak recovery",
    },
  ];

  return (
    <div className="min-h-screen bg-[#070E13] text-white flex flex-col font-sans selection:bg-[#287D73]/30 selection:text-white">
      {/* Top Navigation */}
      <header className="sticky top-0 z-30 bg-[#070E13]/85 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2.5 font-bold tracking-tight text-xl text-white">
              <div className="w-8 h-8 rounded-lg bg-[#287D73] flex items-center justify-center text-white shadow-xs">
                <Sparkles className="w-4 h-4 fill-white" />
              </div>
              <span className="font-semibold tracking-tight">
                Brightloop <span className="text-[#A3D9D2] text-xs font-bold px-1.5 py-0.5 rounded-sm bg-[#287D73]/25 border border-[#287D73]/40 ml-0.5">OS</span>
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-[#9EB1BC]">
              <Link href="/time-machine" className="hover:text-white transition-colors">Time Machine</Link>
              <Link href="/guardian" className="hover:text-white transition-colors">Revenue Guardian</Link>
              <Link href="/subscriptions" className="hover:text-white transition-colors">Subscriptions</Link>
              <Link href="/catalog" className="hover:text-white transition-colors">Catalog Studio</Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <Link
                href={role === "customer" ? "/portal" : "/dashboard"}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#287D73] text-white text-sm font-semibold hover:bg-[#20665E] transition-colors shadow-xs"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-semibold text-[#9EB1BC] hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#287D73] text-white text-sm font-semibold hover:bg-[#20665E] transition-colors shadow-xs"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 3D Frame Sequence Experience (Ends cleanly at Frame 295) */}
      <main className="relative flex-1">
        <SmoothScrollCanvas onOpenDemo={() => setShowDemoModal(true)} />
      </main>

      {/* Interactive Walkthrough Modal */}
      {showDemoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs">
          <div className="bg-[#12222B] text-white rounded-2xl max-w-xl w-full border border-white/15 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-[#0B151B]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#287D73] text-white flex items-center justify-center font-bold">
                  <Play className="w-4 h-4 fill-white" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Brightloop OS Product Tour</h3>
                  <p className="text-xs text-[#9EB1BC]">Step {demoStep + 1} of {demoTourSteps.length}</p>
                </div>
              </div>
              <button
                onClick={() => setShowDemoModal(false)}
                className="p-1 rounded-md text-[#9EB1BC] hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="inline-block px-2.5 py-1 rounded bg-[#287D73]/30 text-[#A3D9D2] border border-[#287D73]/50 font-bold text-xs">
                {demoTourSteps[demoStep].highlight}
              </div>
              <h4 className="text-lg font-bold text-white">
                {demoTourSteps[demoStep].title}
              </h4>
              <p className="text-sm text-[#D6E0E1] leading-relaxed">
                {demoTourSteps[demoStep].description}
              </p>

              <div className="p-3.5 rounded-lg bg-[#070E13] border border-white/10 flex items-center justify-between text-xs">
                <span className="font-mono text-[#9EB1BC]">Target destination: {demoTourSteps[demoStep].route}</span>
                <Link
                  href={demoTourSteps[demoStep].route}
                  className="font-bold text-[#A3D9D2] hover:underline flex items-center gap-1"
                >
                  <span>Open Route</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            <div className="p-4 bg-[#0B151B] border-t border-white/10 flex items-center justify-between">
              <button
                disabled={demoStep === 0}
                onClick={() => setDemoStep((s) => Math.max(0, s - 1))}
                className="px-3.5 py-1.5 rounded-md border border-white/10 text-xs font-semibold text-[#9EB1BC] disabled:opacity-40 hover:bg-white/5"
              >
                Previous
              </button>
              <div className="flex gap-1.5">
                {demoTourSteps.map((_, idx) => (
                  <div
                    key={idx}
                    className={`w-2 h-2 rounded-full ${
                      idx === demoStep ? "bg-[#287D73]" : "bg-white/20"
                    }`}
                  />
                ))}
              </div>
              {demoStep < demoTourSteps.length - 1 ? (
                <button
                  onClick={() => setDemoStep((s) => Math.min(demoTourSteps.length - 1, s + 1))}
                  className="px-4 py-1.5 rounded-md bg-[#287D73] text-white text-xs font-semibold hover:bg-[#20665E]"
                >
                  Next Step
                </button>
              ) : (
                <Link
                  href="/dashboard"
                  className="px-4 py-1.5 rounded-md bg-[#287D73] text-white text-xs font-semibold hover:bg-[#20665E]"
                >
                  Enter App
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
