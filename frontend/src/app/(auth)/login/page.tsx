"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowRight, Eye, EyeOff, ShieldCheck, CheckCircle2, Lock, Users, Building, ShieldAlert } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("admin@brightloop.os");
  const [password, setPassword] = useState("Brightloop#2026");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please provide both email and password.");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      login(email);
      toast.success("Welcome back to Brightloop OS");
      if (email.includes("acme") || email.includes("customer")) {
        router.push("/portal");
      } else {
        router.push("/dashboard");
      }
    }, 450);
  };

  const handleQuickLogin = (quickEmail: string, role: "admin" | "staff" | "customer") => {
    setEmail(quickEmail);
    setLoading(true);
    setTimeout(() => {
      login(quickEmail, role);
      toast.success(`Logged in as ${role.toUpperCase()}`);
      if (role === "customer") {
        router.push("/portal");
      } else {
        router.push("/dashboard");
      }
    }, 300);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#F4F6F5] text-[#202C33]">
      {/* Left Branding Panel */}
      <div className="md:w-1/2 bg-[#172B36] p-8 md:p-14 lg:p-16 flex flex-col justify-between text-white relative overflow-hidden">
        {/* Editorial Photo as Background with Deep Midnight Overlay */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <Image
            src="/images/auth-panel.jpg"
            alt="Brightloop Architecture"
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#172B36] via-[#172B36]/80 to-transparent" />
        </div>

        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-2.5 font-bold tracking-tight text-xl mb-12">
            <div className="w-8 h-8 rounded-lg bg-[#287D73] flex items-center justify-center text-white shadow-xs">
              <Sparkles className="w-4 h-4 fill-white" />
            </div>
            <span className="font-semibold tracking-tight">
              Brightloop <span className="text-[#A3D9D2] text-xs font-bold px-1.5 py-0.5 rounded-sm bg-[#1D5A52] border border-[#287D73]/60 ml-0.5">OS</span>
            </span>
          </Link>

          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-[#1D5A52] text-[#E7F2EF] text-[11px] font-bold tracking-wider uppercase mb-4 border border-[#287D73]/40">
            Enterprise Access
          </div>

          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight text-white mb-5">
            Welcome back to complete revenue control.
          </h1>
          <p className="text-[#B8C7C3] text-sm md:text-base max-w-md leading-relaxed">
            Eliminate missed renewals, erroneous billing, and manual reconciliation with proactive lifecycle intelligence.
          </p>
        </div>

        {/* 4 Trust Points */}
        <div className="relative z-10 my-8 space-y-3 max-w-md">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-[#12222B]/90 border border-[#263E49]">
            <Lock className="w-4 h-4 text-[#287D73] shrink-0" />
            <div>
              <span className="text-xs font-bold text-white block">Secure authentication</span>
              <span className="text-[11px] text-[#9EB1BC]">Multi-layered session control & token validation</span>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-[#12222B]/90 border border-[#263E49]">
            <Users className="w-4 h-4 text-[#287D73] shrink-0" />
            <div>
              <span className="text-xs font-bold text-white block">Role-based access</span>
              <span className="text-[11px] text-[#9EB1BC]">Granular Admin, Staff, and Customer permissions</span>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-[#12222B]/90 border border-[#263E49]">
            <ShieldCheck className="w-4 h-4 text-[#24734D] shrink-0" />
            <div>
              <span className="text-xs font-bold text-white block">Enterprise ready</span>
              <span className="text-[11px] text-[#9EB1BC]">Deduplication billing engine with complete audit trails</span>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-[#12222B]/90 border border-[#263E49]">
            <Building className="w-4 h-4 text-[#B86F4B] shrink-0" />
            <div>
              <span className="text-xs font-bold text-white block">Built for growing businesses</span>
              <span className="text-[11px] text-[#9EB1BC]">Support for complex variants, daily/weekly/annual plans</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-[#82929E]">
          Brightloop OS Enterprise Platform • Zero Neon • Midnight Ledger Design
        </div>
      </div>

      {/* Right Login Form */}
      <div className="md:w-1/2 p-6 sm:p-10 md:p-16 flex items-center justify-center bg-[#F4F6F5]">
        <div className="w-full max-w-md bg-white p-8 rounded-2xl border border-[#D8E0DE] shadow-xs">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-[#172B36] tracking-tight">Sign In</h2>
            <p className="text-xs text-[#53636D] mt-1">Access your Brightloop OS revenue workspace.</p>
          </div>

          {/* Quick Demo Access Switcher */}
          <div className="mb-6 p-3.5 bg-[#E7F2EF] border border-[#287D73]/30 rounded-xl">
            <span className="text-xs font-bold text-[#20665E] block mb-2">
              ⚡ Quick Demo 1-Click Access:
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin("admin@brightloop.os", "admin")}
                className="px-2 py-1.5 text-xs font-semibold bg-white text-[#20665E] hover:bg-[#287D73] hover:text-white rounded-md border border-[#287D73]/30 transition-colors shadow-2xs"
              >
                Lead Admin
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin("ananya@brightloop.os", "staff")}
                className="px-2 py-1.5 text-xs font-semibold bg-white text-[#20665E] hover:bg-[#287D73] hover:text-white rounded-md border border-[#287D73]/30 transition-colors shadow-2xs"
              >
                Staff Ops
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin("aarav@acmetech.io", "customer")}
                className="px-2 py-1.5 text-xs font-semibold bg-white text-[#20665E] hover:bg-[#287D73] hover:text-white rounded-md border border-[#287D73]/30 transition-colors shadow-2xs"
              >
                Customer Portal
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#202C33] uppercase tracking-wider mb-1.5">
                Work Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#D8E0DE] rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#287D73]/20 focus:border-[#287D73] transition-colors text-[#202C33]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-[#202C33] uppercase tracking-wider">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-semibold text-[#287D73] hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#D8E0DE] rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#287D73]/20 focus:border-[#287D73] transition-colors text-[#202C33] pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#53636D] hover:text-[#202C33]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-[#53636D]">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-[#D8E0DE] text-[#287D73] focus:ring-[#287D73]"
                />
                <span>Remember this workstation</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-[#287D73] hover:bg-[#20665E] text-white font-semibold text-sm rounded-lg transition-colors shadow-xs flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-[#D8E0DE] text-center">
            <p className="text-xs text-[#53636D]">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="text-[#287D73] font-bold hover:underline">
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
