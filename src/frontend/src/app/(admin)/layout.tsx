"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { useAuth } from "@/lib/auth-context";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, role } = useAuth();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    if (!user) {
      router.replace("/login");
      return;
    }
    // Strict RBAC: Customer accounts can never access Admin Operations
    if (role === "customer") {
      router.replace("/portal");
    }
  }, [user, role, router]);

  if (!isClient || !user || role === "customer") {
    return (
      <div className="min-h-screen bg-[#F4F6F5] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#287D73] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <AppShell>{children}</AppShell>;
}
