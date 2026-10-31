"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Sparkles, ArrowLeft, Mail, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setIsSubmitted(true);
      toast.success("Password recovery instructions dispatched.");
    }, 500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F6F5] p-4 text-[#202C33]">
      <div className="w-full max-w-md bg-white border border-[#D8E0DE] rounded-2xl p-8 shadow-xs">
        <div className="flex items-center gap-2 font-bold text-[#172B36] tracking-tight text-lg mb-6">
          <div className="w-7 h-7 rounded-lg bg-[#287D73] flex items-center justify-center text-white">
            <Sparkles className="w-4 h-4 fill-white" />
          </div>
          <span>Brightloop OS</span>
        </div>

        {isSubmitted ? (
          <div className="text-center py-4 space-y-4">
            <div className="w-12 h-12 bg-[#E7F2EF] text-[#24734D] rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-[#172B36]">Check your email</h2>
            <p className="text-xs text-[#53636D] max-w-xs mx-auto leading-relaxed">
              If an account matches <span className="font-semibold text-[#172B36]">{email}</span>, we have sent instructions to reset your password.
            </p>
            <div className="pt-4">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#287D73] hover:underline"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Return to sign in
              </Link>
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-[#172B36] tracking-tight">Reset password</h2>
              <p className="text-xs text-[#53636D] mt-1">
                Enter your work email address and we will send you a recovery link.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#202C33] uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#D8E0DE] rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#287D73]/20 focus:border-[#287D73] text-[#202C33] pl-9"
                  />
                  <Mail className="w-4 h-4 text-[#82929E] absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-[#287D73] hover:bg-[#20665E] text-white font-semibold text-sm rounded-lg transition-colors shadow-xs flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  "Send Recovery Link"
                )}
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-[#D8E0DE] text-center">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-[#53636D] hover:text-[#172B36]"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to sign in
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
