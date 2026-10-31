import React from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  badge?: string;
  badgeVariant?: "success" | "warning" | "danger" | "info";
  href?: string;
  icon?: React.ReactNode;
  actionText?: string;
  className?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  badge,
  badgeVariant = "info",
  href,
  icon,
  actionText,
  className,
}: StatCardProps) {
  const content = (
    <div
      className={cn(
        "card-ui bg-white rounded-2xl border border-[#D8E0DE]/65 p-6 shadow-xs transition-all duration-200 hover:shadow-md hover:border-[#287D73]/35 relative flex flex-col justify-between group",
        className
      )}
    >
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold tracking-wider text-[#53636D] uppercase">
            {title}
          </span>
          {icon && <div className="text-[#53636D] group-hover:text-[#287D73] transition-colors">{icon}</div>}
        </div>
        <div className="text-2xl font-bold text-[#202C33] tabular-nums tracking-tight mb-1">
          {value}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-[#53636D]">
        <span>{subtitle}</span>
        {badge && (
          <span
            className={cn(
              "px-2 py-0.5 rounded-full text-[11px] font-medium border",
              badgeVariant === "success" && "bg-[#E7F2EF] text-[#24734D] border-[#B8C7C3]",
              badgeVariant === "warning" && "bg-[#FDF7ED] text-[#96600C] border-[#F5DFB3]",
              badgeVariant === "danger" && "bg-[#FDF1F2] text-[#B42332] border-[#F9D0D4]",
              badgeVariant === "info" && "bg-[#EBF3F8] text-[#315F82] border-[#C6DDEB]"
            )}
          >
            {badge}
          </span>
        )}
        {href && actionText && (
          <span className="inline-flex items-center text-[#287D73] font-semibold group-hover:underline">
            {actionText} <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
          </span>
        )}
      </div>
    </div>
  );

  if (href && !actionText) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
