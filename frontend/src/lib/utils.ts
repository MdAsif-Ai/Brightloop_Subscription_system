import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a minor currency amount (e.g., paise) or standard rupee amount to INR string.
 * @param amountInMinor - amount in paise (minor units, e.g. 200000 = ₹2,000.00)
 */
export function formatINR(amountInMinor: number | string | undefined | null): string {
  if (amountInMinor === undefined || amountInMinor === null) return "₹0";
  const num = typeof amountInMinor === "string" ? parseFloat(amountInMinor) : amountInMinor;
  if (isNaN(num)) return "₹0";
  
  const rupees = num / 100;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
    minimumFractionDigits: rupees % 1 === 0 ? 0 : 2,
  }).format(rupees);
}

/**
 * Formats standard rupee number (not in minor units)
 */
export function formatRupees(rupees: number | string | undefined | null): string {
  if (rupees === undefined || rupees === null) return "₹0";
  const num = typeof rupees === "string" ? parseFloat(rupees) : rupees;
  if (isNaN(num)) return "₹0";

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
    minimumFractionDigits: num % 1 === 0 ? 0 : 2,
  }).format(num);
}

export function formatDate(dateStr: string | Date | undefined | null): string {
  if (!dateStr) return "—";
  try {
    const d = typeof dateStr === "string" ? parseISO(dateStr) : dateStr;
    return format(d, "dd MMM yyyy");
  } catch {
    return String(dateStr);
  }
}

export function formatDateTime(dateStr: string | Date | undefined | null): string {
  if (!dateStr) return "—";
  try {
    const d = typeof dateStr === "string" ? parseISO(dateStr) : dateStr;
    return format(d, "dd MMM yyyy, hh:mm a");
  } catch {
    return String(dateStr);
  }
}
