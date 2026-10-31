"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  variant?: "dialog" | "drawer";
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl";
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  variant = "dialog",
  maxWidth = "xl",
}: ModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  if (variant === "drawer") {
    return (
      <div className="fixed inset-0 z-50 flex justify-end">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-[#172B36]/60 backdrop-blur-xs transition-opacity"
          onClick={onClose}
        />
        {/* Drawer content */}
        <div className="relative w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col z-10 overflow-hidden animate-in slide-in-from-right duration-200">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#D8E0DE] bg-[#F4F6F5]/80">
            <div>
              <h2 className="text-lg font-semibold text-[#202C33]">{title}</h2>
              {description && (
                <p className="text-xs text-[#53636D] mt-0.5">{description}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#53636D] hover:text-[#202C33] hover:bg-[#F4F6F5] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-6">{children}</div>
        </div>
      </div>
    );
  }

  const maxWidthClass = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "3xl": "max-w-3xl",
    "4xl": "max-w-4xl",
  }[maxWidth];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#172B36]/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />
      {/* Dialog content */}
      <div
        className={cn(
          "relative w-full bg-white rounded-xl shadow-2xl border border-[#D8E0DE] z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col",
          maxWidthClass
        )}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#D8E0DE] bg-[#F4F6F5]/80">
          <div>
            <h2 className="text-lg font-semibold text-[#202C33]">{title}</h2>
            {description && (
              <p className="text-xs text-[#53636D] mt-0.5">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#53636D] hover:text-[#202C33] hover:bg-[#F4F6F5] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
