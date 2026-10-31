"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  LayoutDashboard,
  Boxes,
  Users,
  Repeat,
  Receipt,
  FileSpreadsheet,
  ShieldAlert,
  Clock,
  Sparkles,
  CreditCard,
  LogOut,
  ChevronRight,
  ShieldCheck,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeColor?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export function Sidebar({ onCloseMobile }: { onCloseMobile?: () => void }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") || "overview";
  const { user, role, logout } = useAuth();

  const isCustomer = role === "customer" || pathname.startsWith("/portal");

  const adminSections: NavSection[] = [
    {
      title: "WORKSPACE",
      items: [
        {
          name: "Overview",
          href: "/dashboard",
          icon: LayoutDashboard,
        },
      ],
    },
    {
      title: "OPERATIONS",
      items: [
        {
          name: "Product Studio",
          href: "/catalog",
          icon: Boxes,
        },
        {
          name: "Customers",
          href: "/customers",
          icon: Users,
        },
        {
          name: "Subscriptions",
          href: "/subscriptions",
          icon: Repeat,
        },
        {
          name: "Invoices & Payments",
          href: "/invoices",
          icon: Receipt,
        },
      ],
    },
    {
      title: "INTELLIGENCE",
      items: [
        {
          name: "Revenue Guardian",
          href: "/guardian",
          icon: ShieldAlert,
          badge: "4 Issues",
          badgeColor: "bg-[#B42332]/20 text-[#F5B4B9] border border-[#B42332]/40",
        },
        {
          name: "Billing Time Machine",
          href: "/time-machine",
          icon: Clock,
          badge: "Demo",
          badgeColor: "bg-[#287D73]/20 text-[#A3D9D2] border border-[#287D73]/40",
        },
      ],
    },
    {
      title: "GOVERNANCE",
      items: [
        ...(role === "admin"
          ? [
              {
                name: "Settings & Staff",
                href: "/settings",
                icon: Users,
              },
            ]
          : []),
      ],
    },
  ].filter((section) => section.items.length > 0);

  const customerSections: NavSection[] = [
    {
      title: "PORTAL WORKSPACE",
      items: [
        {
          name: "Portal Overview",
          href: "/portal",
          icon: LayoutDashboard,
        },
      ],
    },
    {
      title: "LICENSES & CONTRACTS",
      items: [
        {
          name: "My Subscriptions",
          href: "/portal?tab=subscriptions",
          icon: Repeat,
          badge: "1 Active",
          badgeColor: "bg-[#287D73]/20 text-[#A3D9D2] border border-[#287D73]/40",
        },
      ],
    },
    {
      title: "FINANCE & BILLING",
      items: [
        {
          name: "Invoices & Receipts",
          href: "/portal?tab=invoices",
          icon: Receipt,
          badge: "2 Paid",
          badgeColor: "bg-[#24734D]/20 text-[#A3D9D2] border border-[#24734D]/40",
        },
        {
          name: "Payment Instruments",
          href: "/portal?tab=payments",
          icon: CreditCard,
        },
      ],
    },
    {
      title: "ORGANIZATION",
      items: [
        {
          name: "Company Account",
          href: "/portal?tab=account",
          icon: Building2,
        },
      ],
    },
  ];

  const sections = isCustomer ? customerSections : adminSections;
  const brandHref = isCustomer ? "/portal" : "/dashboard";

  return (
    <aside className="w-64 bg-[#172B36] text-[#D6E0E1] flex flex-col h-full border-r border-[#263E49] shrink-0 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-[#263E49]">
        <Link
          href={brandHref}
          className="flex items-center gap-2.5 font-bold text-white tracking-tight text-lg"
          onClick={onCloseMobile}
        >
          <div className="w-8 h-8 rounded-lg bg-[#287D73] flex items-center justify-center text-white shadow-xs">
            <Sparkles className="w-4 h-4 fill-white" />
          </div>
          <span className="font-semibold tracking-tight">
            Brightloop{" "}
            <span className="text-[#A3D9D2] text-[11px] font-bold px-1.5 py-0.5 rounded-sm bg-[#1D5A52] border border-[#287D73]/60 ml-0.5">
              {isCustomer ? "PORTAL" : "OS"}
            </span>
          </span>
        </Link>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3.5 py-5 space-y-6">
        {sections.map((section) => (
          <div key={section.title} className="space-y-1">
            <h3 className="px-2.5 text-[10px] font-bold text-[#82929E] uppercase tracking-wider mb-2">
              {section.title}
            </h3>
            {section.items.map((item) => {
              let isActive = false;
              if (isCustomer) {
                if (item.href === "/portal" && (!searchParams.get("tab") || currentTab === "overview")) {
                  isActive = true;
                } else if (item.href.includes("tab=")) {
                  const targetTab = item.href.split("tab=")[1];
                  isActive = currentTab === targetTab;
                }
              } else {
                isActive =
                  item.href === "/dashboard"
                    ? pathname === "/dashboard"
                    : pathname.startsWith(item.href);
              }
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onCloseMobile}
                  className={cn(
                    "flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors group",
                    isActive
                      ? "bg-[#1D5A52] text-white font-semibold shadow-xs"
                      : "text-[#B8C7C3] hover:text-white hover:bg-[#263E49]"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={cn(
                        "w-4 h-4 transition-colors",
                        isActive ? "text-[#E7F2EF]" : "text-[#82929E] group-hover:text-white"
                      )}
                    />
                    <span>{item.name}</span>
                  </div>
                  {item.badge ? (
                    <span
                      className={cn(
                        "text-[10px] font-semibold px-2 py-0.5 rounded-full",
                        item.badgeColor
                      )}
                    >
                      {item.badge}
                    </span>
                  ) : isActive ? (
                    <ChevronRight className="w-3.5 h-3.5 text-[#E7F2EF]/70" />
                  ) : null}
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* Authenticated User Profile */}
      <div className="p-3.5 border-t border-[#263E49] bg-[#12222B]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-[#1D5A52] text-[#E7F2EF] border border-[#287D73]/60 flex items-center justify-center font-bold text-xs shrink-0">
              {user?.name ? user.name[0].toUpperCase() : isCustomer ? "A" : "L"}
            </div>
            <div className="truncate">
              <div className="text-xs font-semibold text-white truncate">
                {user?.name || (isCustomer ? "Aarav Sharma" : "Alexander Wright")}
              </div>
              <div className="text-[11px] text-[#9EB1BC] truncate flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#24734D]" />
                <span className="capitalize">
                  {isCustomer
                    ? "Customer Account"
                    : role === "admin"
                    ? "Administrator"
                    : "Operations Staff"}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={logout}
            title="Sign Out"
            className="p-1.5 rounded-md text-[#9EB1BC] hover:text-white hover:bg-[#263E49] transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
