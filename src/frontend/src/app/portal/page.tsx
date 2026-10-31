"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Sparkles,
  Repeat,
  Receipt,
  User,
  LogOut,
  Pause,
  Play,
  Printer,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  CreditCard,
  Building2,
  ArrowRight,
  Clock,
  Download,
  AlertCircle,
  FileText,
  Search,
  Check,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { StatusBadge } from "@/components/ui/status-badge";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { Subscription, Invoice } from "@/types";
import { formatINR, formatDate } from "@/lib/utils";
import { toast } from "sonner";

function CustomerPortalContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryTab = searchParams.get("tab") as "overview" | "subscriptions" | "invoices" | "payments" | "account" | null;
  const { user, role, logout } = useAuth();

  const [activeTab, setActiveTab] = useState<"overview" | "subscriptions" | "invoices" | "payments" | "account">(
    queryTab || "overview"
  );

  useEffect(() => {
    if (queryTab) {
      setActiveTab(queryTab);
    }
  }, [queryTab]);

  useEffect(() => {
    if (!user) {
      router.replace("/login");
    }
  }, [user, router]);

  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected invoice for detail/print
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Lifecycle pause/resume dialog
  const [actionSub, setActionSub] = useState<{ id: string; action: string } | null>(null);
  const [transitioning, setTransitioning] = useState(false);

  // Customer ID for isolated query (Acme Technologies cust-1 by default for demo)
  const customerId = "cust-1";

  const loadData = async () => {
    try {
      setLoading(true);
      const [subs, invs] = await Promise.all([
        api.subscriptions.list({ customer_id: customerId }),
        api.invoices.list({ customer_id: customerId }),
      ]);
      setSubscriptions(subs);
      setInvoices(invs);
    } catch {
      toast.error("Failed to load customer portal records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleExecuteTransition = async () => {
    if (!actionSub) return;
    try {
      setTransitioning(true);
      const updated = await api.subscriptions.transition(actionSub.id, actionSub.action);
      setSubscriptions((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      toast.success(`Subscription ${actionSub.action === "pause" ? "paused" : "resumed"} successfully.`);
      setActionSub(null);
    } catch {
      toast.error("Failed to update subscription status.");
    } finally {
      setTransitioning(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Metrics derived from real records
  const metrics = useMemo(() => {
    const activeSub = subscriptions.find((s) => s.status === "active") || subscriptions[0];
    const recurringCommitment = activeSub?.recurring_amount_minor || 2718720;
    const nextBillDate = activeSub?.next_billing_date || "2026-11-01";
    const totalOutstanding = invoices.reduce((sum, inv) => sum + (inv.outstanding_minor || 0), 0);

    return {
      monthlySpend: recurringCommitment,
      annualCommitment: recurringCommitment * 12,
      activePlansCount: subscriptions.filter((s) => s.status === "active").length,
      nextBillingDate: nextBillDate,
      totalOutstanding,
    };
  }, [subscriptions, invoices]);

  return (
    <AppShell>
      <div className="space-y-6 text-[#202C33] font-sans pb-12">
        {/* Editorial Customer Hero Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#D8E0DE]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold text-[#20665E] uppercase tracking-wider bg-[#E7F2EF] px-2.5 py-0.5 rounded-full border border-[#287D73]/30">
                Customer Workspace
              </span>
              <span className="text-xs text-[#53636D]">
                • {user?.business_name || "Acme Technologies Pvt Ltd"}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#172B36] tracking-tight">
              Welcome back, {user?.name ? user.name.split(" ")[0] : "Aarav"}
            </h1>
            <p className="text-xs text-[#53636D] mt-1">
              Review your enterprise software license allocation, upcoming recurring renewals, and official GST tax statements.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                toast.success("Account executive notified for license inquiry.");
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#287D73] hover:bg-[#20665E] rounded-lg shadow-xs transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" /> Request License Expansion
            </button>
          </div>
        </div>

        {/* 4 Compact Financial & Contract Metric Tiles (matches Dashboard quality) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Tile 1: Monthly Commitment */}
          <div className="bg-white p-5 rounded-2xl border border-[#D8E0DE]/70 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-[#53636D] font-semibold">
              <span>Monthly Recurring Spend</span>
              <div className="w-7 h-7 rounded-lg bg-[#E7F2EF] text-[#287D73] flex items-center justify-center">
                <Repeat className="w-4 h-4" />
              </div>
            </div>
            <div className="my-2">
              <div className="text-2xl font-extrabold text-[#172B36] tabular-nums">
                {formatINR(metrics.monthlySpend)}
              </div>
              <div className="text-[11px] text-[#24734D] font-semibold mt-0.5 flex items-center gap-1">
                <span>Active Commitment</span>
                <span className="text-[#82929E] font-normal">/ month</span>
              </div>
            </div>
            <div className="pt-2 border-t border-[#D8E0DE] flex items-center justify-between text-[11px] text-[#53636D]">
              <span>Annual Volume:</span>
              <span className="font-semibold text-[#172B36] tabular-nums">
                {formatINR(metrics.annualCommitment)}
              </span>
            </div>
          </div>

          {/* Tile 2: Active Licenses */}
          <div className="bg-white p-5 rounded-2xl border border-[#D8E0DE]/70 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-[#53636D] font-semibold">
              <span>Allocated Licenses</span>
              <div className="w-7 h-7 rounded-lg bg-[#E7F2EF] text-[#287D73] flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="my-2">
              <div className="text-2xl font-extrabold text-[#172B36] tabular-nums">
                10 Seats Active
              </div>
              <div className="text-[11px] text-[#24734D] font-semibold mt-0.5 flex items-center gap-1">
                <span>100% Capacity</span>
                <span className="text-[#82929E] font-normal">in use</span>
              </div>
            </div>
            <div className="pt-2 border-t border-[#D8E0DE] flex items-center justify-between text-[11px] text-[#53636D]">
              <span>Active Contracts:</span>
              <span className="font-semibold text-[#172B36]">{metrics.activePlansCount} Active Plan</span>
            </div>
          </div>

          {/* Tile 3: Next Renewal */}
          <div className="bg-white p-5 rounded-2xl border border-[#D8E0DE]/70 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-[#53636D] font-semibold">
              <span>Next Renewal Schedule</span>
              <div className="w-7 h-7 rounded-lg bg-[#E7F2EF] text-[#287D73] flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
            <div className="my-2">
              <div className="text-2xl font-extrabold text-[#172B36] tabular-nums">
                01 Nov 2026
              </div>
              <div className="text-[11px] text-[#20665E] font-semibold mt-0.5 flex items-center gap-1">
                <span>In 2 Days</span>
                <span className="text-[#82929E] font-normal">• Auto-Renew Enabled</span>
              </div>
            </div>
            <div className="pt-2 border-t border-[#D8E0DE] flex items-center justify-between text-[11px] text-[#53636D]">
              <span>Cycle:</span>
              <span className="font-semibold text-[#172B36]">Monthly Recurring</span>
            </div>
          </div>

          {/* Tile 4: Outstanding Invoices */}
          <div className="bg-white p-5 rounded-2xl border border-[#D8E0DE]/70 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-[#53636D] font-semibold">
              <span>Outstanding Receivables</span>
              <div className="w-7 h-7 rounded-lg bg-[#E7F2EF] text-[#24734D] flex items-center justify-center">
                <Receipt className="w-4 h-4" />
              </div>
            </div>
            <div className="my-2">
              <div className="text-2xl font-extrabold text-[#24734D] tabular-nums">
                {formatINR(metrics.totalOutstanding)}
              </div>
              <div className="text-[11px] text-[#24734D] font-semibold mt-0.5 flex items-center gap-1">
                <span>All Invoices Reconciled</span>
              </div>
            </div>
            <div className="pt-2 border-t border-[#D8E0DE] flex items-center justify-between text-[11px] text-[#53636D]">
              <span>Payment Mandate:</span>
              <span className="font-semibold text-[#287D73]">Auto-Debit Active</span>
            </div>
          </div>
        </div>

        {/* Tabbed Navigation Bar */}
        <div className="flex items-center gap-2 border-b border-[#D8E0DE]">
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
              activeTab === "overview"
                ? "border-[#287D73] text-[#287D73]"
                : "border-transparent text-[#53636D] hover:text-[#172B36]"
            }`}
          >
            <Sparkles className="w-4 h-4" /> Dashboard Overview
          </button>
          <button
            onClick={() => setActiveTab("subscriptions")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
              activeTab === "subscriptions"
                ? "border-[#287D73] text-[#287D73]"
                : "border-transparent text-[#53636D] hover:text-[#172B36]"
            }`}
          >
            <Repeat className="w-4 h-4" /> My Subscriptions ({subscriptions.length})
          </button>
          <button
            onClick={() => setActiveTab("invoices")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
              activeTab === "invoices"
                ? "border-[#287D73] text-[#287D73]"
                : "border-transparent text-[#53636D] hover:text-[#172B36]"
            }`}
          >
            <Receipt className="w-4 h-4" /> Invoices & Receipts ({invoices.length})
          </button>
          <button
            onClick={() => setActiveTab("payments")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
              activeTab === "payments"
                ? "border-[#287D73] text-[#287D73]"
                : "border-transparent text-[#53636D] hover:text-[#172B36]"
            }`}
          >
            <CreditCard className="w-4 h-4" /> Payment Instruments
          </button>
          <button
            onClick={() => setActiveTab("account")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
              activeTab === "account"
                ? "border-[#287D73] text-[#287D73]"
                : "border-transparent text-[#53636D] hover:text-[#172B36]"
            }`}
          >
            <Building2 className="w-4 h-4" /> Company Account
          </button>
        </div>

        {/* TAB 1: DASHBOARD OVERVIEW (Rich 2-Column Asymmetric SaaS Layout) */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column (8 Cols): Hero Contract Card + Invoices Ledger */}
            <div className="lg:col-span-8 space-y-6">
              {/* Active Contract Hero Card */}
              {subscriptions.map((s) => (
                <div
                  key={s.id}
                  className="bg-white rounded-2xl border border-[#D8E0DE]/70 p-6 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#D8E0DE]">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono font-bold text-[#287D73]">
                            {s.subscription_number}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#E7F2EF] text-[#20665E]">
                            {s.status}
                          </span>
                        </div>
                        <h2 className="text-xl font-extrabold text-[#172B36]">{s.plan_name}</h2>
                        <p className="text-xs text-[#53636D] mt-0.5 capitalize">
                          {s.frequency} Billing Cycle • Net Terms: {s.payment_terms}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-2xl font-extrabold text-[#172B36] tabular-nums block">
                          {formatINR(s.recurring_amount_minor)}
                        </span>
                        <span className="text-xs text-[#53636D]">per month</span>
                      </div>
                    </div>

                    {/* Seat Allocation Progress Bar */}
                    <div className="py-4 space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-[#53636D]">Enterprise Seat Allocation:</span>
                        <span className="text-[#172B36]">10 of 10 Seats Active (100% capacity)</span>
                      </div>
                      <div className="w-full bg-[#EDF2F0] h-2.5 rounded-full overflow-hidden">
                        <div className="bg-[#287D73] h-full rounded-full w-full" />
                      </div>
                    </div>

                    {/* Product Line Item Breakdown */}
                    <div className="bg-[#F4F6F5] rounded-xl p-4 border border-[#D8E0DE]/60 space-y-2 text-xs mb-4">
                      {s.items.map((it, idx) => (
                        <div key={idx} className="flex justify-between items-center text-[#202C33]">
                          <span className="font-semibold">
                            {it.product_name} ({it.quantity} Enterprise Seats)
                          </span>
                          <span className="font-bold tabular-nums">{formatINR(it.amount_minor)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between text-[#53636D] text-[11px] pt-1">
                        <span>Odoo Framework Extension:</span>
                        <span className="text-[#20665E] font-semibold">Included in variant</span>
                      </div>
                      <div className="flex justify-between text-[#53636D] text-[11px]">
                        <span>GST (18% itemized):</span>
                        <span className="font-semibold tabular-nums">
                          {formatINR(Math.round((s.recurring_amount_minor * 0.18) / 1.18))}
                        </span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-[#D8E0DE] text-xs font-extrabold text-[#172B36]">
                        <span>Total Recurring Commitment:</span>
                        <span className="text-[#287D73] tabular-nums">
                          {formatINR(s.recurring_amount_minor)}
                        </span>
                      </div>
                    </div>

                    {/* Contract Dates Grid */}
                    <div className="grid grid-cols-3 gap-3 p-3.5 bg-white border border-[#D8E0DE] rounded-xl text-xs mb-4">
                      <div>
                        <span className="text-[11px] text-[#82929E] block mb-0.5">Agreement Start:</span>
                        <span className="font-bold text-[#172B36]">{s.start_date}</span>
                      </div>
                      <div>
                        <span className="text-[11px] text-[#82929E] block mb-0.5">Next Renewal:</span>
                        <span className="font-bold text-[#20665E]">{s.next_billing_date}</span>
                      </div>
                      <div>
                        <span className="text-[11px] text-[#82929E] block mb-0.5">Term Expiry:</span>
                        <span className="font-bold text-[#172B36]">{s.expiry_date}</span>
                      </div>
                    </div>
                  </div>

                  {/* Self-Service Controls Bar */}
                  <div className="pt-4 border-t border-[#D8E0DE] flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      {s.status === "active" ? (
                        <button
                          onClick={() => setActionSub({ id: s.id, action: "pause" })}
                          className="px-3.5 py-2 text-xs font-semibold text-[#96600C] bg-[#FDF6EC] hover:bg-[#FCEFD9] border border-[#B86F4B]/30 rounded-lg transition-colors flex items-center gap-1.5"
                        >
                          <Pause className="w-3.5 h-3.5" /> Pause Contract
                        </button>
                      ) : s.status === "paused" ? (
                        <button
                          onClick={() => setActionSub({ id: s.id, action: "resume" })}
                          className="px-3.5 py-2 text-xs font-bold text-white bg-[#24734D] hover:bg-[#1E5D3E] rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                        >
                          <Play className="w-3.5 h-3.5" /> Resume Contract
                        </button>
                      ) : null}

                      <button
                        onClick={() => {
                          toast.success("License agreement downloaded (PDF).");
                        }}
                        className="px-3.5 py-2 text-xs font-semibold text-[#202C33] bg-[#F4F6F5] hover:bg-[#EDF2F0] border border-[#D8E0DE] rounded-lg transition-colors flex items-center gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5" /> Agreement PDF
                      </button>
                    </div>

                    <span className="text-[11px] text-[#53636D]">
                      Managed by Brightloop Autonomous Operations
                    </span>
                  </div>
                </div>
              ))}

              {/* Recent Invoices Table Card */}
              <div className="bg-white rounded-2xl border border-[#D8E0DE]/70 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#D8E0DE]">
                  <div>
                    <h3 className="font-bold text-base text-[#172B36]">Recent Tax Invoices & Receipts</h3>
                    <p className="text-xs text-[#53636D]">Official GST invoices generated for this subscription.</p>
                  </div>
                  <button
                    onClick={() => setActiveTab("invoices")}
                    className="text-xs font-bold text-[#287D73] hover:underline flex items-center gap-1"
                  >
                    View All ({invoices.length}) <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F4F6F5] text-[#82929E] uppercase tracking-wider text-[11px] border-b border-[#D8E0DE]">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Invoice #</th>
                        <th className="px-4 py-3 font-semibold">Issue Date</th>
                        <th className="px-4 py-3 font-semibold">Due Date</th>
                        <th className="px-4 py-3 font-semibold text-right">Amount</th>
                        <th className="px-4 py-3 font-semibold text-center">Status</th>
                        <th className="px-4 py-3 font-semibold text-right">Tax Invoice</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#D8E0DE] text-[#202C33]">
                      {invoices.map((inv) => (
                        <tr key={inv.id} className="hover:bg-[#F4F6F5]/50 transition-colors">
                          <td className="px-4 py-3.5 font-mono font-bold text-[#172B36]">
                            {inv.invoice_number}
                          </td>
                          <td className="px-4 py-3.5 text-[#53636D] tabular-nums">{inv.issue_date}</td>
                          <td className="px-4 py-3.5 text-[#53636D] tabular-nums">{inv.due_date}</td>
                          <td className="px-4 py-3.5 text-right font-extrabold text-[#172B36] tabular-nums">
                            {formatINR(inv.total_minor)}
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                inv.status === "paid"
                                  ? "bg-[#E7F2EF] text-[#20665E]"
                                  : "bg-[#FDF6EC] text-[#96600C]"
                              }`}
                            >
                              {inv.status}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <button
                              onClick={() => setSelectedInvoice(inv)}
                              className="text-xs font-bold text-[#287D73] hover:underline"
                            >
                              Print / View →
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right Column (4 Cols): Payment Method + Company Info + Enterprise SLA */}
            <div className="lg:col-span-4 space-y-6">
              {/* Payment Method on File Card */}
              <div className="bg-white rounded-2xl border border-[#D8E0DE]/70 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#D8E0DE]">
                  <h3 className="font-bold text-sm text-[#172B36] flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-[#287D73]" /> Payment Instrument
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E7F2EF] text-[#20665E]">
                    Verified
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-[#172B36] text-white space-y-3">
                  <div className="flex justify-between items-center text-xs text-[#A3D9D2]">
                    <span className="font-mono uppercase">Corporate Mandate</span>
                    <span className="font-bold">HDFC BANK</span>
                  </div>
                  <div className="font-mono text-base tracking-widest pt-1">
                    •••• •••• •••• 4021
                  </div>
                  <div className="flex justify-between items-center text-[11px] text-[#9EB1BC] pt-2 border-t border-[#263E49]">
                    <span>Aarav Sharma</span>
                    <span>EXP: 08/28</span>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-[#53636D]">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#24734D]" />
                    <span>Automated recurring debit enabled</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#24734D]" />
                    <span>Instant GST input tax credit matching</span>
                  </div>
                </div>
              </div>

              {/* Subscriber Organization Card */}
              <div className="bg-white rounded-2xl border border-[#D8E0DE]/70 p-6 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-[#D8E0DE]">
                  <h3 className="font-bold text-sm text-[#172B36] flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-[#287D73]" /> Company Profile
                  </h3>
                  <span className="text-xs text-[#287D73] font-bold">GST Active</span>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div>
                    <span className="text-[11px] text-[#82929E] block mb-0.5">Legal Entity:</span>
                    <span className="font-bold text-[#172B36]">
                      {user?.business_name || "Acme Technologies Pvt Ltd"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-[#82929E] block mb-0.5">GST Identification:</span>
                    <span className="font-mono font-bold text-[#172B36]">29AAACA1234A1Z5</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-[#82929E] block mb-0.5">Primary Contact:</span>
                    <span className="font-semibold text-[#172B36]">
                      {user?.name || "Aarav Sharma"} ({user?.email || "aarav@acmetech.io"})
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-[#82929E] block mb-0.5">Billing Address:</span>
                    <span className="text-[#53636D]">
                      Prestige Tech Park, Outer Ring Rd, Bengaluru, Karnataka 560103
                    </span>
                  </div>
                </div>
              </div>

              {/* Enterprise Success & SLA Card */}
              <div className="bg-white rounded-2xl border border-[#D8E0DE]/70 p-6 shadow-xs space-y-3">
                <h3 className="font-bold text-sm text-[#172B36] flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#24734D]" /> Enterprise Support & SLA
                </h3>
                <p className="text-xs text-[#53636D] leading-relaxed">
                  Your business subscription includes 24/7 dedicated customer success and a 99.99% uptime guarantee.
                </p>
                <div className="p-3 bg-[#F4F6F5] rounded-xl border border-[#D8E0DE] text-xs space-y-1">
                  <div className="text-[11px] text-[#82929E]">Dedicated Success Rep:</div>
                  <div className="font-bold text-[#172B36]">Rohan Gupta</div>
                  <div className="text-[11px] text-[#287D73] font-mono">support@brightloop.os</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: DETAILED SUBSCRIPTIONS */}
        {activeTab === "subscriptions" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-[#172B36]">Contract Licenses & Add-ons</h2>
              <p className="text-xs text-[#53636D]">Manage active plan specifications and self-service renewals.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {subscriptions.map((s) => (
                <div
                  key={s.id}
                  className="bg-white rounded-2xl border border-[#D8E0DE]/70 p-6 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-mono font-bold text-[#287D73]">
                        {s.subscription_number}
                      </span>
                      <StatusBadge status={s.status} size="sm" />
                    </div>

                    <h3 className="text-lg font-bold text-[#172B36] mb-1">{s.plan_name}</h3>
                    <p className="text-xs text-[#53636D] mb-4">
                      {s.frequency} Cadence • Payment Terms: {s.payment_terms}
                    </p>

                    <div className="bg-[#F4F6F5] rounded-xl p-4 border border-[#D8E0DE] text-xs space-y-2 mb-4">
                      {s.items.map((it, idx) => (
                        <div key={idx} className="flex justify-between">
                          <span className="font-semibold text-[#202C33]">
                            {it.product_name} ({it.quantity} seats)
                          </span>
                          <span className="font-bold tabular-nums">{formatINR(it.amount_minor)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between pt-2 border-t border-[#D8E0DE] font-bold text-[#172B36]">
                        <span>Recurring Amount:</span>
                        <span className="text-[#20665E] tabular-nums">
                          {formatINR(s.recurring_amount_minor)}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs text-[#53636D]">
                      <div className="flex justify-between">
                        <span>Start Date:</span>
                        <span className="font-bold text-[#172B36]">{s.start_date}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Next Renewal Date:</span>
                        <span className="font-bold text-[#20665E]">{s.next_billing_date}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Contract Term Expiry:</span>
                        <span className="font-bold text-[#172B36]">{s.expiry_date}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 mt-6 border-t border-[#D8E0DE] flex items-center justify-between">
                    <span className="text-xs text-[#82929E]">Contract Control:</span>
                    {s.status === "active" ? (
                      <button
                        onClick={() => setActionSub({ id: s.id, action: "pause" })}
                        className="px-3.5 py-1.5 text-xs font-semibold text-[#96600C] bg-[#FDF6EC] hover:bg-[#FCEFD9] border border-[#B86F4B]/30 rounded-lg transition-colors flex items-center gap-1.5"
                      >
                        <Pause className="w-3.5 h-3.5" /> Pause Contract
                      </button>
                    ) : s.status === "paused" ? (
                      <button
                        onClick={() => setActionSub({ id: s.id, action: "resume" })}
                        className="px-3.5 py-1.5 text-xs font-bold text-white bg-[#24734D] hover:bg-[#1E5D3E] rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                      >
                        <Play className="w-3.5 h-3.5" /> Resume Contract
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: INVOICES & RECEIPTS */}
        {activeTab === "invoices" && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-[#172B36]">Billing Statements & Tax Receipts</h2>
              <p className="text-xs text-[#53636D]">
                Download official GST tax invoices and view settlement history.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-[#D8E0DE]/70 shadow-xs overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F4F6F5] text-[#82929E] uppercase tracking-wider text-[11px] border-b border-[#D8E0DE]">
                  <tr>
                    <th className="px-5 py-3.5 font-semibold">Invoice #</th>
                    <th className="px-5 py-3.5 font-semibold">Issue Date</th>
                    <th className="px-5 py-3.5 font-semibold">Due Date</th>
                    <th className="px-5 py-3.5 font-semibold text-right">Invoice Total</th>
                    <th className="px-5 py-3.5 font-semibold text-right">Outstanding</th>
                    <th className="px-5 py-3.5 font-semibold text-center">Status</th>
                    <th className="px-5 py-3.5 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D8E0DE] text-[#202C33]">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-[#F4F6F5]/50 transition-colors">
                      <td className="px-5 py-3.5 font-mono font-bold text-[#172B36]">
                        {inv.invoice_number}
                      </td>
                      <td className="px-5 py-3.5 text-[#53636D] tabular-nums">{inv.issue_date}</td>
                      <td className="px-5 py-3.5 text-[#53636D] tabular-nums">{inv.due_date}</td>
                      <td className="px-5 py-3.5 text-right font-extrabold text-[#172B36] tabular-nums">
                        {formatINR(inv.total_minor)}
                      </td>
                      <td className="px-5 py-3.5 text-right font-semibold text-[#B42332] tabular-nums">
                        {formatINR(inv.outstanding_minor)}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <StatusBadge status={inv.status} size="sm" />
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => setSelectedInvoice(inv)}
                          className="text-xs font-bold text-[#287D73] hover:underline"
                        >
                          Print / View Tax Invoice →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: PAYMENT INSTRUMENTS */}
        {activeTab === "payments" && (
          <div className="bg-white rounded-2xl border border-[#D8E0DE]/70 p-6 shadow-xs max-w-2xl space-y-6">
            <div>
              <h2 className="text-xl font-bold text-[#172B36]">Payment Instruments on File</h2>
              <p className="text-xs text-[#53636D]">Active corporate auto-debit mandates and payment methods.</p>
            </div>

            <div className="p-5 rounded-2xl bg-[#172B36] text-white space-y-4">
              <div className="flex justify-between items-center text-xs text-[#A3D9D2]">
                <span className="font-mono uppercase font-bold">Primary Corporate Mandate</span>
                <span className="px-2 py-0.5 rounded bg-[#24734D] text-white text-[10px] font-bold">
                  ACTIVE AUTO-DEBIT
                </span>
              </div>
              <div className="font-mono text-xl tracking-widest pt-2">
                •••• •••• •••• 4021
              </div>
              <div className="flex justify-between items-center text-xs text-[#9EB1BC] pt-3 border-t border-[#263E49]">
                <div>
                  <span className="block text-[10px] uppercase text-[#82929E]">Account Holder</span>
                  <span className="font-bold text-white">Aarav Sharma</span>
                </div>
                <div className="text-right">
                  <span className="block text-[10px] uppercase text-[#82929E]">Issuing Bank</span>
                  <span className="font-bold text-white">HDFC Bank Limited</span>
                </div>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-2 border-b border-[#D8E0DE]">
                <span className="text-[#53636D]">Mandate Reference:</span>
                <span className="font-mono font-bold text-[#172B36]">MAN-8942-ACME-CORP</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#D8E0DE]">
                <span className="text-[#53636D]">Authorization Limit:</span>
                <span className="font-bold text-[#172B36]">₹1,00,000 per recurring cycle</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#D8E0DE]">
                <span className="text-[#53636D]">Auto-Debit Settlement Window:</span>
                <span className="font-semibold text-[#20665E]">1st of every calendar month</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: COMPANY ACCOUNT */}
        {activeTab === "account" && (
          <div className="bg-white rounded-2xl border border-[#D8E0DE]/70 p-6 shadow-xs max-w-2xl space-y-6">
            <div>
              <h2 className="text-xl font-bold text-[#172B36]">Company Account & Billing Profile</h2>
              <p className="text-xs text-[#53636D]">Registered subscriber organization details and tax identification.</p>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex justify-between py-2.5 border-b border-[#D8E0DE]">
                <span className="text-[#53636D]">Organization Legal Name:</span>
                <span className="font-bold text-[#172B36]">{user?.business_name || "Acme Technologies Pvt Ltd"}</span>
              </div>
              <div className="flex justify-between py-2.5 border-b border-[#D8E0DE]">
                <span className="text-[#53636D]">GSTIN:</span>
                <span className="font-mono font-bold text-[#172B36]">29AAACA1234A1Z5</span>
              </div>
              <div className="flex justify-between py-2.5 border-b border-[#D8E0DE]">
                <span className="text-[#53636D]">Primary Contact:</span>
                <span className="font-semibold text-[#172B36]">{user?.name || "Aarav Sharma"}</span>
              </div>
              <div className="flex justify-between py-2.5 border-b border-[#D8E0DE]">
                <span className="text-[#53636D]">Billing Email Address:</span>
                <span className="font-semibold text-[#172B36]">{user?.email || "aarav@acmetech.io"}</span>
              </div>
              <div className="flex justify-between py-2.5 border-b border-[#D8E0DE]">
                <span className="text-[#53636D]">Registered Office:</span>
                <span className="font-medium text-[#202C33] text-right max-w-xs">
                  Prestige Tech Park, Outer Ring Rd, Kadubeesanahalli, Bengaluru, Karnataka 560103
                </span>
              </div>
              <div className="flex justify-between py-2.5 border-b border-[#D8E0DE]">
                <span className="text-[#53636D]">Subscription Plan Tier:</span>
                <span className="font-bold text-[#20665E] uppercase bg-[#E7F2EF] px-2.5 py-0.5 rounded-full">
                  Enterprise Commercial Tier
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Invoice Detail / Print Modal */}
        {selectedInvoice && (
          <Modal
            isOpen={!!selectedInvoice}
            onClose={() => setSelectedInvoice(null)}
            title={`Tax Invoice ${selectedInvoice.invoice_number}`}
          >
            <div className="space-y-4 text-xs print-container">
              <div className="flex justify-between pb-3 border-b border-[#D8E0DE]">
                <div>
                  <h4 className="font-bold text-sm text-[#172B36]">Brightloop Software Pvt Ltd</h4>
                  <p className="text-[#53636D]">Official Subscription Tax Invoice</p>
                </div>
                <button
                  onClick={handlePrint}
                  className="no-print px-3 py-1.5 rounded-lg border border-[#D8E0DE] bg-[#F4F6F5] hover:bg-[#EDF2F0] font-bold text-xs flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" /> Print Tax Invoice
                </button>
              </div>

              <div className="p-3.5 bg-[#F4F6F5] rounded-xl border border-[#D8E0DE] flex justify-between">
                <div>
                  <div className="font-bold text-[#172B36]">{selectedInvoice.customer_name}</div>
                  <div className="text-[#53636D]">{selectedInvoice.customer_email}</div>
                  <div className="text-[11px] text-[#82929E] mt-1 font-mono">GSTIN: 29AAACA1234A1Z5</div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-[#172B36]">{selectedInvoice.invoice_number}</div>
                  <div className="text-[#53636D]">Issue Date: {selectedInvoice.issue_date}</div>
                  <div className="text-[#53636D]">Due Date: {selectedInvoice.due_date}</div>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-[#D8E0DE]">
                <div className="flex justify-between">
                  <span>Subtotal Amount:</span>
                  <span className="font-semibold tabular-nums">{formatINR(selectedInvoice.subtotal_minor)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Goods & Services Tax (GST 18%):</span>
                  <span className="font-semibold tabular-nums">{formatINR(selectedInvoice.tax_minor)}</span>
                </div>
                <div className="flex justify-between font-extrabold text-sm text-[#172B36] pt-2 border-t border-[#D8E0DE]">
                  <span>Total Invoiced Amount:</span>
                  <span className="text-[#20665E] tabular-nums">{formatINR(selectedInvoice.total_minor)}</span>
                </div>
              </div>
            </div>
          </Modal>
        )}

        {/* Contract Pause / Resume Confirm Dialog */}
        <ConfirmDialog
          isOpen={!!actionSub}
          onClose={() => setActionSub(null)}
          onConfirm={handleExecuteTransition}
          isLoading={transitioning}
          title={actionSub?.action === "pause" ? "Pause Subscription Contract" : "Resume Subscription"}
          message={
            actionSub?.action === "pause"
              ? "Pausing your contract will temporarily suspend automated recurring billing until you resume."
              : "Resuming will reactivate your contract schedule for the next recurring cycle."
          }
          confirmText={actionSub?.action === "pause" ? "Confirm Pause" : "Resume Billing"}
          isDangerous={actionSub?.action === "pause"}
        />
      </div>
    </AppShell>
  );
}

export default function CustomerPortalPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F4F6F5] flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-[#287D73] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <CustomerPortalContent />
    </Suspense>
  );
}
