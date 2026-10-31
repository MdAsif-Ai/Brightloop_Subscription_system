"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowRight, Eye, EyeOff, Check, X, ShieldCheck, CheckCircle2, Lock, FileSpreadsheet, Repeat } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

export default function SignupPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [fullName, setFullName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Password rules validation
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const isPasswordValid = hasMinLength && hasUppercase && hasLowercase && hasSpecial;
  const passwordsMatch = password === confirmPassword && password.length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordValid) {
      toast.error("Please satisfy all password security requirements.");
      return;
    }
    if (!passwordsMatch) {
      toast.error("Passwords do not match.");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      login(email, "customer");
      toast.success("Account created successfully! Welcome to your customer portal.");
      router.push("/portal");
    }, 500);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#F4F6F5] text-[#202C33]">
      {/* Left Branding Panel */}
      <div className="md:w-5/12 bg-[#172B36] p-8 md:p-14 flex flex-col justify-between text-white relative overflow-hidden">
        {/* Background Editorial Image with Midnight Overlay */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <Image
            src="/images/auth-panel.jpg"
            alt="Brightloop Architecture"
            fill
            sizes="(max-width: 768px) 100vw, 42vw"
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
            Subscriber Onboarding
          </div>

          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight leading-tight text-white mb-4">
            Instant visibility into your subscriptions & invoices.
          </h1>
          <p className="text-[#B8C7C3] text-sm leading-relaxed mb-6">
            Register your organization to access your autonomous self-service portal, view billing intervals, download tax invoices, and manage contracts.
          </p>

          <div className="bg-[#12222B]/90 border border-[#263E49] rounded-xl p-4 text-xs text-[#D6E0E1] space-y-3">
            <div className="flex items-center gap-2.5">
              <FileSpreadsheet className="w-4 h-4 text-[#287D73] shrink-0" />
              <span>Real-time invoice calculation breakdown (Invoice X-Ray)</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Repeat className="w-4 h-4 text-[#24734D] shrink-0" />
              <span>Direct contract management & renewal control</span>
            </div>
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-[#B86F4B] shrink-0" />
              <span>Automated tax compliance with GST itemization</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-[#82929E] mt-8">
          Public registration provisions a Customer Account. Staff & Admin accounts are managed by organization administrators.
        </div>
      </div>

      {/* Right Registration Form */}
      <div className="md:w-7/12 p-6 sm:p-10 md:p-16 flex items-center justify-center overflow-y-auto bg-[#F4F6F5]">
        <div className="w-full max-w-md bg-white p-8 rounded-2xl border border-[#D8E0DE] shadow-xs">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-[#172B36] tracking-tight">Create your Brightloop account</h2>
            <p className="text-xs text-[#53636D] mt-1">Start managing your organization&apos;s subscription contracts.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-[#202C33] uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Aarav Sharma"
                  className="w-full px-3.5 py-2 text-sm bg-white border border-[#D8E0DE] rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#287D73]/20 focus:border-[#287D73] text-[#202C33]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#202C33] uppercase tracking-wider mb-1">
                  Organization Name
                </label>
                <input
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Acme Technologies"
                  className="w-full px-3.5 py-2 text-sm bg-white border border-[#D8E0DE] rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#287D73]/20 focus:border-[#287D73] text-[#202C33]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#202C33] uppercase tracking-wider mb-1">
                Work Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full px-3.5 py-2 text-sm bg-white border border-[#D8E0DE] rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#287D73]/20 focus:border-[#287D73] text-[#202C33]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#202C33] uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2 text-sm bg-white border border-[#D8E0DE] rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#287D73]/20 focus:border-[#287D73] text-[#202C33] pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#53636D] hover:text-[#202C33]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password Requirements Checklist */}
              <div className="mt-2 grid grid-cols-2 gap-1.5 text-[11px] text-[#53636D] bg-[#F4F6F5] p-2.5 rounded-lg border border-[#D8E0DE]">
                <div className={`flex items-center gap-1.5 ${hasMinLength ? "text-[#24734D] font-semibold" : "text-[#53636D]"}`}>
                  {hasMinLength ? <Check className="w-3.5 h-3.5 text-[#24734D]" /> : <X className="w-3.5 h-3.5 text-[#82929E]" />}
                  <span>8+ characters</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasUppercase ? "text-[#24734D] font-semibold" : "text-[#53636D]"}`}>
                  {hasUppercase ? <Check className="w-3.5 h-3.5 text-[#24734D]" /> : <X className="w-3.5 h-3.5 text-[#82929E]" />}
                  <span>1 uppercase letter</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasLowercase ? "text-[#24734D] font-semibold" : "text-[#53636D]"}`}>
                  {hasLowercase ? <Check className="w-3.5 h-3.5 text-[#24734D]" /> : <X className="w-3.5 h-3.5 text-[#82929E]" />}
                  <span>1 lowercase letter</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasSpecial ? "text-[#24734D] font-semibold" : "text-[#53636D]"}`}>
                  {hasSpecial ? <Check className="w-3.5 h-3.5 text-[#24734D]" /> : <X className="w-3.5 h-3.5 text-[#82929E]" />}
                  <span>1 special character</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#202C33] uppercase tracking-wider mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2 text-sm bg-white border border-[#D8E0DE] rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#287D73]/20 focus:border-[#287D73] text-[#202C33]"
              />
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
                  <span>Register Customer Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-[#D8E0DE] text-center">
            <p className="text-xs text-[#53636D]">
              Already registered?{" "}
              <Link href="/login" className="text-[#287D73] font-bold hover:underline">
                Sign in to workspace
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
