"use client";

import React from "react";
import { Modal } from "./modal";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDangerous?: boolean;
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  isDangerous = false,
  isLoading = false,
}: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="md">
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "p-2 rounded-full shrink-0",
              isDangerous ? "bg-[#FDF1F2] text-[#B42332]" : "bg-[#E7F2EF] text-[#287D73]"
            )}
          >
            <AlertTriangle className="w-5 h-5" />
          </div>
          <p className="text-sm text-[#53636D] leading-relaxed">{message}</p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#D8E0DE]">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-[#53636D] hover:text-[#202C33] hover:bg-[#F4F6F5] rounded-lg transition-colors"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={cn(
              "px-4 py-2 text-sm font-medium text-white rounded-lg shadow-xs transition-colors flex items-center gap-1.5",
              isDangerous
                ? "bg-[#B42332] hover:bg-[#961D2A]"
                : "bg-[#287D73] hover:bg-[#20665E]"
            )}
          >
            {isLoading && (
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}
