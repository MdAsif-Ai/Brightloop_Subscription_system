import React from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-12 text-center bg-white rounded-xl border border-dashed border-[#D8E0DE]",
        className
      )}
    >
      {icon && (
        <div className="p-3 bg-[#F4F6F5] text-[#53636D] rounded-full mb-3">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-[#202C33]">{title}</h3>
      <p className="text-sm text-[#53636D] max-w-sm mt-1 mb-5">{description}</p>
      {action}
    </div>
  );
}
