"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowRight, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setIsSuccess(true);
      toast.success("Password updated successfully.");
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

        {isSuccess ? (
          <div className="text-center py-4 space-y-4">
            <div className="w-12 h-12 bg-[#E7F2EF] text-[#24734D] rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-[#172B36]">Password Updated</h2>
            <p className="text-xs text-[#53636D] max-w-xs mx-auto">
              Your password has been changed. You can now sign in with your new credentials.
            </p>
            <div className="pt-4">
              <button
                type="button"
                onClick={() => router.push("/login")}
                className="w-full py-2.5 px-4 bg-[#287D73] hover:bg-[#20665E] text-white font-semibold text-sm rounded-lg transition-colors shadow-xs"
              >
                Proceed to Sign In
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-[#172B36] tracking-tight">Set new password</h2>
              <p className="text-xs text-[#53636D] mt-1">
                Please enter a secure new password for your account.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#202C33] uppercase tracking-wider mb-1">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#D8E0DE] rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#287D73]/20 focus:border-[#287D73] text-[#202C33] pr-10"
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

              <div>
                <label className="block text-xs font-bold text-[#202C33] uppercase tracking-wider mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#D8E0DE] rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#287D73]/20 focus:border-[#287D73] text-[#202C33]"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-[#287D73] hover:bg-[#20665E] text-white font-semibold text-sm rounded-lg transition-colors shadow-xs flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Update Password</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
