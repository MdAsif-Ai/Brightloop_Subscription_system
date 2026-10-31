"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  ArrowRight,
  Eye,
  EyeOff,
  Check,
  X,
  KeyRound,
  UserPlus,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { Auth3DScene } from "@/components/auth/auth-3d-scene";

interface AuthViewProps {
  initialMode: "signin" | "signup";
}

export function AuthView({ initialMode }: AuthViewProps) {
  const router = useRouter();
  const { login } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">(initialMode);

  // Sync mode with browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      if (typeof window !== "undefined") {
        if (window.location.pathname.includes("signup")) {
          setMode("signup");
        } else {
          setMode("signin");
        }
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Smooth mode switcher (swaps infinity loop and card sides)
  const switchMode = (newMode: "signin" | "signup", e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    setMode(newMode);
    if (typeof window !== "undefined") {
      window.history.pushState(null, "", newMode === "signin" ? "/login" : "/signup");
    }
  };

  // Sign In State
  const [email, setEmail] = useState("admin@brightloop.os");
  const [password, setPassword] = useState("Brightloop#2026");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);

  // Sign Up State
  const [fullName, setFullName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [signupLoading, setSignupLoading] = useState(false);

  // Password Validation
  const hasMinLength = signupPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(signupPassword);
  const hasLowercase = /[a-z]/.test(signupPassword);
  const hasSpecial = /[^A-Za-z0-9]/.test(signupPassword);
  const isPasswordValid = hasMinLength && hasUppercase && hasLowercase && hasSpecial;
  const passwordsMatch = signupPassword === confirmPassword && signupPassword.length > 0;

  const handleSignInSubmit = (e: React.FormEvent) => {
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

  const handleSignUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordValid) {
      toast.error("Please satisfy all password security requirements.");
      return;
    }
    if (!passwordsMatch) {
      toast.error("Passwords do not match.");
      return;
    }

    setSignupLoading(true);
    setTimeout(() => {
      login(signupEmail, "customer");
      toast.success("Account created successfully! Welcome to your customer portal.");
      router.push("/portal");
    }, 500);
  };

  return (
    <div className="min-h-screen relative flex flex-col bg-[#070E13] text-white overflow-hidden selection:bg-[#287D73]/40 selection:text-white">
      {/* 3D Bright Infinity Loop Animation (smoothly glides right when in signin mode, left when in signup mode) */}
      <Auth3DScene position={mode === "signin" ? "right" : "left"} />

      {/* Top Left Brand Header */}
      <div className="fixed top-6 left-6 z-40">
        <Link
          href="/"
          className="inline-flex items-center gap-2.5 font-bold tracking-tight text-xl group"
        >
          <div className="w-9 h-9 rounded-xl bg-[#287D73] flex items-center justify-center text-white shadow-lg shadow-[#287D73]/40 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5 fill-white" />
          </div>
          <span className="font-semibold tracking-tight text-white text-lg">
            Brightloop{" "}
            <span className="text-[#A3D9D2] text-xs font-bold px-1.5 py-0.5 rounded-md bg-[#1D5A52] border border-[#287D73]/60 ml-0.5">
              OS
            </span>
          </span>
        </Link>
      </div>

      {/* Main Sliding Arena: Card slides between Left (Sign In) and Right (Sign Up) */}
      <div className="flex-1 w-full max-w-6xl mx-auto flex items-center px-4 sm:px-8 md:px-12 py-20 relative z-10">
        <div className="w-full relative min-h-[580px] flex items-center">
          {/* Sliding Card Container */}
          <div
            className={`w-full md:w-1/2 flex items-center justify-center transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              mode === "signin" ? "md:translate-x-0" : "md:translate-x-full"
            }`}
          >
            <div className="w-full max-w-md relative bg-[#0E1A22]/90 backdrop-blur-2xl p-7 sm:p-8 rounded-2xl border border-white/15 shadow-2xl shadow-black/70 overflow-hidden">
              {/* Top decorative gradient rim */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#287D73] to-transparent opacity-80" />

              {mode === "signin" ? (
                /* ============================================================ */
                /* SIGN IN FORM (Positioned on the LEFT, Infinity on the RIGHT) */
                /* ============================================================ */
                <div key="signin" className="animate-in fade-in duration-300">
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
                    <div>
                      <h2 className="text-2xl font-bold text-white tracking-tight">Sign In</h2>
                      <p className="text-xs text-[#9EB1BC] mt-0.5">Access your Brightloop OS revenue workspace.</p>
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#287D73]/20 border border-[#287D73]/40 text-[#A3D9D2] text-[11px] font-mono">
                      <KeyRound className="w-3 h-3" />
                      <span>256-BIT</span>
                    </div>
                  </div>

                  {/* Quick Demo Access Switcher */}
                  <div className="mb-6 p-3.5 bg-[#070E13]/80 border border-white/10 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-[#A3D9D2] flex items-center gap-1.5">
                        <span className="text-amber-400">⚡</span>
                        <span>Quick Demo 1-Click Access:</span>
                      </span>
                      <span className="text-[10px] text-[#82929E] font-mono">Instant Role</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => handleQuickLogin("admin@brightloop.os", "admin")}
                        className="px-2 py-2 text-xs font-semibold bg-[#12222B] text-white hover:bg-[#287D73] hover:text-white rounded-lg border border-white/10 hover:border-[#287D73] transition-colors shadow-xs text-center active:scale-95"
                      >
                        Lead Admin
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickLogin("ananya@brightloop.os", "staff")}
                        className="px-2 py-2 text-xs font-semibold bg-[#12222B] text-white hover:bg-[#287D73] hover:text-white rounded-lg border border-white/10 hover:border-[#287D73] transition-colors shadow-xs text-center active:scale-95"
                      >
                        Staff Ops
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickLogin("aarav@acmetech.io", "customer")}
                        className="px-2 py-2 text-xs font-semibold bg-[#12222B] text-white hover:bg-[#287D73] hover:text-white rounded-lg border border-white/10 hover:border-[#287D73] transition-colors shadow-xs text-center active:scale-95"
                      >
                        Customer
                      </button>
                    </div>
                  </div>

                  <form onSubmit={handleSignInSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-[#D6E0E1] uppercase tracking-wider mb-1.5">
                        Work Email
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@company.com"
                        className="w-full px-3.5 py-2.5 text-sm bg-[#070E13]/90 border border-white/15 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#287D73]/40 focus:border-[#287D73] transition-colors text-white placeholder-[#82929E]"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-[#D6E0E1] uppercase tracking-wider">
                          Password
                        </label>
                        <Link
                          href="/forgot-password"
                          className="text-xs font-semibold text-[#A3D9D2] hover:text-white hover:underline transition-colors"
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
                          className="w-full px-3.5 py-2.5 text-sm bg-[#070E13]/90 border border-white/15 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#287D73]/40 focus:border-[#287D73] transition-colors text-white placeholder-[#82929E] pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#82929E] hover:text-white transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <label className="flex items-center gap-2 cursor-pointer text-[#9EB1BC] hover:text-white transition-colors">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="w-4 h-4 rounded border-white/20 bg-[#070E13] text-[#287D73] focus:ring-[#287D73]"
                        />
                        <span>Remember this workstation</span>
                      </label>
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 px-4 bg-[#287D73] hover:bg-[#20665E] text-white font-semibold text-sm rounded-lg transition-colors shadow-lg shadow-[#287D73]/25 hover:shadow-[#287D73]/45 flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98]"
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
                    </div>
                  </form>

                  <div className="mt-6 pt-5 border-t border-white/10 text-center">
                    <p className="text-xs text-[#9EB1BC]">
                      Don&apos;t have an account?{" "}
                      <button
                        type="button"
                        onClick={(e) => switchMode("signup", e)}
                        className="text-[#A3D9D2] font-bold hover:text-white hover:underline transition-colors ml-1 cursor-pointer"
                      >
                        Create an account
                      </button>
                    </p>
                  </div>
                </div>
              ) : (
                /* ============================================================ */
                /* SIGN UP FORM (Positioned on the RIGHT, Infinity on the LEFT) */
                /* ============================================================ */
                <div key="signup" className="animate-in fade-in duration-300">
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
                    <div>
                      <h2 className="text-2xl font-bold text-white tracking-tight">Create your account</h2>
                      <p className="text-xs text-[#9EB1BC] mt-0.5">Start managing your organization&apos;s subscription contracts.</p>
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#287D73]/20 border border-[#287D73]/40 text-[#A3D9D2] text-[11px] font-mono">
                      <UserPlus className="w-3 h-3" />
                      <span>CUSTOMER</span>
                    </div>
                  </div>

                  <form onSubmit={handleSignUpSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-xs font-bold text-[#D6E0E1] uppercase tracking-wider mb-1">
                          Full Name
                        </label>
                        <input
                          type="text"
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Aarav Sharma"
                          className="w-full px-3 py-2 text-sm bg-[#070E13]/90 border border-white/15 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#287D73]/40 focus:border-[#287D73] text-white placeholder-[#82929E] transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#D6E0E1] uppercase tracking-wider mb-1">
                          Organization
                        </label>
                        <input
                          type="text"
                          required
                          value={businessName}
                          onChange={(e) => setBusinessName(e.target.value)}
                          placeholder="Acme Tech"
                          className="w-full px-3 py-2 text-sm bg-[#070E13]/90 border border-white/15 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#287D73]/40 focus:border-[#287D73] text-white placeholder-[#82929E] transition-colors"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#D6E0E1] uppercase tracking-wider mb-1">
                        Work Email
                      </label>
                      <input
                        type="email"
                        required
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        placeholder="name@company.com"
                        className="w-full px-3.5 py-2.5 text-sm bg-[#070E13]/90 border border-white/15 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#287D73]/40 focus:border-[#287D73] text-white placeholder-[#82929E] transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#D6E0E1] uppercase tracking-wider mb-1">
                        Password
                      </label>
                      <div className="relative">
                        <input
                          type={showSignupPassword ? "text" : "password"}
                          required
                          value={signupPassword}
                          onChange={(e) => setSignupPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full px-3.5 py-2.5 text-sm bg-[#070E13]/90 border border-white/15 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#287D73]/40 focus:border-[#287D73] text-white placeholder-[#82929E] pr-10 transition-colors"
                        />
                        <button
                          type="button"
                          onClick={() => setShowSignupPassword(!showSignupPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#82929E] hover:text-white transition-colors"
                        >
                          {showSignupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>

                      {/* Password Requirements Checklist */}
                      <div className="mt-2.5 grid grid-cols-2 gap-1.5 text-[11px] bg-[#070E13]/80 p-2.5 rounded-lg border border-white/10">
                        <div
                          className={`flex items-center gap-1.5 ${
                            hasMinLength ? "text-[#A3D9D2] font-semibold" : "text-[#82929E]"
                          }`}
                        >
                          {hasMinLength ? (
                            <Check className="w-3.5 h-3.5 text-[#287D73]" />
                          ) : (
                            <X className="w-3.5 h-3.5 text-white/30" />
                          )}
                          <span>8+ characters</span>
                        </div>
                        <div
                          className={`flex items-center gap-1.5 ${
                            hasUppercase ? "text-[#A3D9D2] font-semibold" : "text-[#82929E]"
                          }`}
                        >
                          {hasUppercase ? (
                            <Check className="w-3.5 h-3.5 text-[#287D73]" />
                          ) : (
                            <X className="w-3.5 h-3.5 text-white/30" />
                          )}
                          <span>1 uppercase</span>
                        </div>
                        <div
                          className={`flex items-center gap-1.5 ${
                            hasLowercase ? "text-[#A3D9D2] font-semibold" : "text-[#82929E]"
                          }`}
                        >
                          {hasLowercase ? (
                            <Check className="w-3.5 h-3.5 text-[#287D73]" />
                          ) : (
                            <X className="w-3.5 h-3.5 text-white/30" />
                          )}
                          <span>1 lowercase</span>
                        </div>
                        <div
                          className={`flex items-center gap-1.5 ${
                            hasSpecial ? "text-[#A3D9D2] font-semibold" : "text-[#82929E]"
                          }`}
                        >
                          {hasSpecial ? (
                            <Check className="w-3.5 h-3.5 text-[#287D73]" />
                          ) : (
                            <X className="w-3.5 h-3.5 text-white/30" />
                          )}
                          <span>1 special char</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#D6E0E1] uppercase tracking-wider mb-1">
                        Confirm Password
                      </label>
                      <input
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3.5 py-2.5 text-sm bg-[#070E13]/90 border border-white/15 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#287D73]/40 focus:border-[#287D73] text-white placeholder-[#82929E] transition-colors"
                      />
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={signupLoading}
                        className="w-full py-3 px-4 bg-[#287D73] hover:bg-[#20665E] text-white font-semibold text-sm rounded-lg transition-colors shadow-lg shadow-[#287D73]/25 hover:shadow-[#287D73]/45 flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98]"
                      >
                        {signupLoading ? (
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>
                            <span>Register Customer Account</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </div>
                  </form>

                  <div className="mt-6 pt-4 border-t border-white/10 text-center">
                    <p className="text-xs text-[#9EB1BC]">
                      Already registered?{" "}
                      <button
                        type="button"
                        onClick={(e) => switchMode("signin", e)}
                        className="text-[#A3D9D2] font-bold hover:text-white hover:underline transition-colors ml-1 cursor-pointer"
                      >
                        Sign in to workspace
                      </button>
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
