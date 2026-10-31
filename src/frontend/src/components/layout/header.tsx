"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  Clock,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { formatDate } from "@/lib/utils";

export function Header({ onOpenMobile }: { onOpenMobile: () => void }) {
  const pathname = usePathname();
  const { demoClock, user, role } = useAuth();
  const isCustomer = role === "customer" || pathname.startsWith("/portal");

  const getPageTitle = (path: string) => {
    if (path.startsWith("/dashboard")) return "Revenue Command Center";
    if (path.startsWith("/catalog")) return "Product Studio";
    if (path.startsWith("/customers")) return "Customer Management";
    if (path.startsWith("/subscriptions/")) return "Subscription Details";
    if (path.startsWith("/subscriptions")) return "Subscription Center";
    if (path.startsWith("/invoices")) return "Invoice & Payment Operations";
    if (path.startsWith("/guardian")) return "Revenue Guardian";
    if (path.startsWith("/time-machine")) return "Billing Time Machine";
    if (path.startsWith("/portal")) return "Customer Self-Service Command Center";
    if (path.startsWith("/settings")) return "Settings & Staff Operations";
    return "Brightloop OS";
  };

  return (
    <header className="h-16 bg-[#FFFFFF] border-b border-[#D8E0DE] px-4 md:px-8 flex items-center justify-between sticky top-0 z-20 shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobile}
          className="md:hidden p-2 text-[#53636D] hover:text-[#202C33] hover:bg-[#EDF2F0] rounded-lg"
          aria-label="Open navigation"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-base font-bold text-[#202C33] tracking-tight flex items-center gap-2">
            {getPageTitle(pathname)}
          </h2>
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-[#53636D]">
            <span>Brightloop</span>
            <span>/</span>
            <span className="capitalize">
              {isCustomer ? `${user?.business_name || "Acme Technologies"} Portal` : pathname.split("/")[1] || "dashboard"}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2.5 sm:gap-3.5">
        {isCustomer ? (
          <>
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#E7F2EF] border border-[#287D73]/30 text-[#20665E] text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-[#24734D]" />
              <span>{user?.business_name || "Acme Technologies"}</span>
              <span className="text-[#82929E]">|</span>
              <span className="font-mono text-[10px]">GST Verified</span>
            </div>
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#F4F6F5] border border-[#D8E0DE] text-[#202C33] text-[11px] font-semibold">
              <span>Enterprise Tier</span>
            </div>
          </>
        ) : (
          <>
            {/* Simulation Clock indicator */}
            <Link
              href="/time-machine"
              title="Billing simulation clock"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#E7F2EF] border border-[#287D73]/30 text-[#20665E] text-xs font-semibold hover:bg-[#D5EAE4] transition-colors"
            >
              <Clock className="w-3.5 h-3.5 text-[#287D73] animate-pulse" />
              <span className="hidden lg:inline text-[#202C33]/60 font-medium">Clock:</span>
              <span className="tabular-nums font-semibold">{formatDate(demoClock)}</span>
            </Link>

            {/* Revenue Guardian indicator */}
            <Link
              href="/guardian"
              title="Revenue Guardian Issues"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#FDF1F2] border border-[#B42332]/30 text-[#B42332] text-xs font-semibold hover:bg-[#F9E2E4] transition-colors"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-[#B42332]" />
              <span className="hidden sm:inline">Guardian:</span>
              <span>4 Open</span>
            </Link>

            {/* Demo Mode Badge */}
            <div className="hidden md:flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#F8EDE6] border border-[#B86F4B]/30 text-[#96600C] text-[11px] font-semibold">
              <Sparkles className="w-3 h-3 text-[#B86F4B]" />
              <span>Demo Environment</span>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
