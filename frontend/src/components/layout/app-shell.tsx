"use client";

import React, { useState, Suspense } from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#F4F6F5]">
      {/* Desktop Persistent Sidebar */}
      <div className="hidden md:flex h-full shrink-0">
        <Suspense fallback={<div className="w-64 bg-[#172B36] h-full" />}>
          <Sidebar />
        </Suspense>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-[#172B36]/70 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative z-10 w-72 h-full">
            <Suspense fallback={<div className="w-72 bg-[#172B36] h-full" />}>
              <Sidebar onCloseMobile={() => setMobileMenuOpen(false)} />
            </Suspense>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <Suspense fallback={<div className="h-16 bg-white border-b border-[#D8E0DE]" />}>
          <Header onOpenMobile={() => setMobileMenuOpen(true)} />
        </Suspense>
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#F4F6F5]">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
