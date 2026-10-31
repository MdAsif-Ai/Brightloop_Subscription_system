import React from "react";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
  size?: "sm" | "md";
}

export function StatusBadge({ status, className, size = "md" }: StatusBadgeProps) {
  const norm = (status || "").toLowerCase();

  let styles = "bg-[#EDF2F0] text-[#53636D] border-[#D8E0DE]";
  let label = status;

  if (["active", "paid", "resolved", "confirmed"].includes(norm)) {
    styles = "bg-[#E7F2EF] text-[#24734D] border-[#B8C7C3]";
  } else if (["quotation", "software", "addon"].includes(norm)) {
    styles = "bg-[#EBF3F8] text-[#315F82] border-[#C6DDEB]";
  } else if (["warning", "paused", "overdue", "pending"].includes(norm)) {
    styles = "bg-[#FDF7ED] text-[#96600C] border-[#F5DFB3]";
  } else if (["critical", "closed", "canceled", "failed"].includes(norm)) {
    styles = "bg-[#FDF1F2] text-[#B42332] border-[#F9D0D4]";
  } else if (["draft", "service", "invited"].includes(norm)) {
    styles = "bg-[#EDF2F0] text-[#53636D] border-[#D8E0DE]";
  }

  return (
    <span
      className={cn(
        "inline-flex items-center font-medium border uppercase tracking-wider rounded-full",
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
        styles,
        className
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-70" />
      {label}
    </span>
  );
}
