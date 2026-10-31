"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  RefreshCw,
  Plus,
  Repeat,
  Receipt,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  PieChart as PieChartIcon,
  Calendar,
  AlertCircle,
  FileText,
  CreditCard,
  CheckCircle,
  Clock,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Zap,
  Building,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ArrowUpRight,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { api } from "@/lib/api";
import { RevenueAnalytics, Subscription, Invoice, Customer, Product } from "@/types";
import { formatINR, formatDate } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

export default function DashboardPage() {
  const router = useRouter();
  const { user, demoClock } = useAuth();

  const [analytics, setAnalytics] = useState<RevenueAnalytics | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [trendMetric, setTrendMetric] = useState<"revenue" | "mrr" | "collected">("revenue");
  const [timeFilter, setTimeFilter] = useState("Last 6 Months");

  const loadAllData = async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      const [analyticsRes, subsRes, invsRes, custsRes, prodsRes] = await Promise.all([
        api.analytics.overview(),
        api.subscriptions.list(),
        api.invoices.list(),
        api.customers.list(),
        api.products.list(),
      ]);

      setAnalytics(analyticsRes);
      setSubscriptions(subsRes);
      setInvoices(invsRes);
      setCustomers(custsRes);
      setProducts(prodsRes);

      if (isManual) toast.success("Dashboard refreshed with latest operational data.");
    } catch (err: unknown) {
      toast.error("Failed to load dashboard metrics.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Operational Attention Counters (derived from real records)
  const operationalCounts = useMemo(() => {
    const dueSubscriptions = subscriptions.filter((s) => {
      if (s.status !== "active") return false;
      const nextDate = new Date(s.next_billing_date).getTime();
      const simTime = new Date(demoClock).getTime();
      return nextDate <= simTime;
    });

    const pendingInvoices = invoices.filter(
      (inv) => inv.status !== "paid" && inv.status !== "canceled"
    );

    const subscriptionsAtRisk = subscriptions.filter(
      (s) => s.status === "paused" || s.status === "closed"
    );

    const pendingQuotations = subscriptions.filter(
      (s) => s.status === "quotation" || s.status === "draft"
    );

    return {
      invoicesToGenerate: dueSubscriptions.length,
      paymentsPending: pendingInvoices.length,
      subscriptionsAtRisk: subscriptionsAtRisk.length,
      quotationsToFollowUp: pendingQuotations.length,
    };
  }, [subscriptions, invoices, demoClock]);

  // Subscription Lifecycle distribution for Donut Chart
  const statusDistribution = useMemo(() => {
    const counts: Record<string, number> = {
      Active: 0,
      Quotation: 0,
      Draft: 0,
      Paused: 0,
      Closed: 0,
    };

    subscriptions.forEach((s) => {
      if (s.status === "active") counts.Active++;
      else if (s.status === "quotation") counts.Quotation++;
      else if (s.status === "draft") counts.Draft++;
      else if (s.status === "paused") counts.Paused++;
      else if (s.status === "closed") counts.Closed++;
    });

    // In case no subscriptions exist yet, fallback to analytics distribution
    if (Object.values(counts).every((v) => v === 0) && analytics) {
      return (analytics.distribution || []).map((item: { status: string; count: number; color: string }) => ({
        name: item.status.charAt(0).toUpperCase() + item.status.slice(1),
        count: item.count,
        color:
          item.status.toLowerCase() === "active"
            ? "#287D73" // muted teal
            : item.status.toLowerCase() === "quotation"
            ? "#B86F4B" // copper
            : item.status.toLowerCase() === "draft"
            ? "#82929E" // slate
            : item.status.toLowerCase() === "paused"
            ? "#96600C" // amber
            : "#53636D",
      }));
    }

    const colorMap: Record<string, string> = {
      Active: "#287D73", // muted teal
      Quotation: "#B86F4B", // burnished copper
      Draft: "#82929E", // slate
      Paused: "#96600C", // dark amber
      Closed: "#53636D", // slate charcoal
    };

    return Object.entries(counts).map(([name, count]) => ({
      name,
      count,
      color: colorMap[name],
    }));
  }, [subscriptions, analytics]);

  const totalSubsCount = useMemo(() => {
    return statusDistribution.reduce((acc: number, curr: { count: number }) => acc + curr.count, 0);
  }, [statusDistribution]);

  // Revenue Trend series data mapping
  const trendData = useMemo(() => {
    if (!analytics?.trend) return [];
    return analytics.trend.map((point: { month: string; recurring_revenue_minor: number; collections_minor: number }) => {
      let val = point.recurring_revenue_minor / 100;
      if (trendMetric === "mrr") val = point.recurring_revenue_minor / 100;
      else if (trendMetric === "collected") val = point.collections_minor / 100;
      return {
        month: point.month,
        value: val,
        formatted: formatINR(val * 100),
      };
    });
  }, [analytics, trendMetric]);

  const formatChartCurrency = (value: number) => {
    if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
    return `₹${value.toLocaleString()}`;
  };

  if (loading || !analytics) {
    return (
      <div className="space-y-6">
        <div className="h-44 bg-white border border-[#D8E0DE] rounded-2xl animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-white border border-[#D8E0DE] rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="h-80 bg-white border border-[#D8E0DE] rounded-2xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6 select-none font-sans text-[#202C33]">
      {/* =========================================================================
          SECTION B: DISTINCTIVE EDITORIAL HERO BAND
          ========================================================================= */}
      <div className="relative rounded-2xl border border-[#D8E0DE] bg-[#FFFFFF] shadow-xs overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12">
          {/* Left Column: Greeting & 4 Operational Attention Counters */}
          <div className="lg:col-span-4 p-6 sm:p-7 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-[#D8E0DE]">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">👋</span>
                <span className="text-xs font-bold uppercase tracking-wider text-[#287D73]">
                  Revenue Command Center
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#172B36] tracking-tight">
                Good morning, {user?.name?.split(" ")[0] || "Executive"}.
              </h1>
              <p className="text-xs text-[#53636D] mt-1.5 leading-relaxed">
                Revenue grows when operations run on autopilot. Here is today&apos;s real-time operational posture.
              </p>
            </div>

            {/* 4 Compact Operational Counters */}
            <div className="grid grid-cols-2 gap-3 pt-6 mt-4 border-t border-[#D8E0DE]">
              <div className="p-2.5 rounded-lg bg-[#F4F6F5] border border-[#D8E0DE]">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-[#53636D]">Due Invoices</span>
                  <div className="w-5 h-5 rounded-full bg-[#E7F2EF] text-[#287D73] flex items-center justify-center">
                    <Clock className="w-3 h-3" />
                  </div>
                </div>
                <div className="text-lg font-bold text-[#172B36] mt-1 tabular-nums">
                  {operationalCounts.invoicesToGenerate}
                </div>
                <span className="text-[10px] text-[#82929E]">Cycles to bill</span>
              </div>

              <div className="p-2.5 rounded-lg bg-[#F4F6F5] border border-[#D8E0DE]">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-[#53636D]">Unpaid Invoices</span>
                  <div className="w-5 h-5 rounded-full bg-[#FDF6EC] text-[#96600C] flex items-center justify-center">
                    <AlertTriangle className="w-3 h-3" />
                  </div>
                </div>
                <div className="text-lg font-bold text-[#172B36] mt-1 tabular-nums">
                  {operationalCounts.paymentsPending}
                </div>
                <span className="text-[10px] text-[#82929E]">Pending settlement</span>
              </div>

              <div className="p-2.5 rounded-lg bg-[#F4F6F5] border border-[#D8E0DE]">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-[#53636D]">At-Risk Subs</span>
                  <div className="w-5 h-5 rounded-full bg-[#FDF1F2] text-[#B42332] flex items-center justify-center">
                    <ShieldAlert className="w-3 h-3" />
                  </div>
                </div>
                <div className="text-lg font-bold text-[#172B36] mt-1 tabular-nums">
                  {operationalCounts.subscriptionsAtRisk}
                </div>
                <span className="text-[10px] text-[#82929E]">Paused / critical</span>
              </div>

              <div className="p-2.5 rounded-lg bg-[#F4F6F5] border border-[#D8E0DE]">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-[#53636D]">Quotations</span>
                  <div className="w-5 h-5 rounded-full bg-[#F8EDE6] text-[#B86F4B] flex items-center justify-center">
                    <FileText className="w-3 h-3" />
                  </div>
                </div>
                <div className="text-lg font-bold text-[#172B36] mt-1 tabular-nums">
                  {operationalCounts.quotationsToFollowUp}
                </div>
                <span className="text-[10px] text-[#82929E]">Follow up pending</span>
              </div>
            </div>
          </div>

          {/* Center Column: Today's Focus Action Panel */}
          <div className="lg:col-span-4 p-6 sm:p-7 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-[#D8E0DE] bg-[#F4F6F5]/50">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[#172B36] flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-[#287D73]" />
                  Today&apos;s Focus
                </span>
                <span className="text-[11px] font-semibold text-[#287D73] bg-[#E7F2EF] px-2 py-0.5 rounded-full border border-[#287D73]/30">
                  Prioritized
                </span>
              </div>
              <p className="text-xs text-[#53636D] mb-4">
                Recommended operational actions based on current contracts and billing schedules.
              </p>

              <div className="space-y-2.5">
                <Link
                  href="/time-machine"
                  className="flex items-center justify-between p-3 rounded-xl bg-white border border-[#D8E0DE] hover:border-[#287D73] hover:shadow-xs transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#E7F2EF] text-[#287D73] flex items-center justify-center font-bold shrink-0">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#172B36] group-hover:text-[#287D73] transition-colors">
                        Run Billing Cycle
                      </div>
                      <div className="text-[11px] text-[#53636D]">
                        Advance clock & generate next invoices
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#82929E] group-hover:text-[#287D73] group-hover:translate-x-0.5 transition-all" />
                </Link>

                <Link
                  href="/invoices"
                  className="flex items-center justify-between p-3 rounded-xl bg-white border border-[#D8E0DE] hover:border-[#287D73] hover:shadow-xs transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#FDF6EC] text-[#96600C] flex items-center justify-center font-bold shrink-0">
                      <Receipt className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#172B36] group-hover:text-[#287D73] transition-colors">
                        Reconcile Payments
                      </div>
                      <div className="text-[11px] text-[#53636D]">
                        {operationalCounts.paymentsPending} invoices awaiting settlement
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#82929E] group-hover:text-[#287D73] group-hover:translate-x-0.5 transition-all" />
                </Link>

                <Link
                  href="/guardian"
                  className="flex items-center justify-between p-3 rounded-xl bg-white border border-[#D8E0DE] hover:border-[#B42332] hover:shadow-xs transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#FDF1F2] text-[#B42332] flex items-center justify-center font-bold shrink-0">
                      <ShieldAlert className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#172B36] group-hover:text-[#B42332] transition-colors">
                        Review Guardian Queue
                      </div>
                      <div className="text-[11px] text-[#53636D]">
                        {analytics.guardian_issues_count} issues detected (1-click recovery)
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#82929E] group-hover:text-[#B42332] group-hover:translate-x-0.5 transition-all" />
                </Link>
              </div>
            </div>

            <div className="pt-3 mt-3 flex items-center justify-between text-[11px] text-[#82929E]">
              <span>Clock: {formatDate(demoClock)}</span>
              <span className="font-semibold text-[#24734D]">● Heuristics Synchronized</span>
            </div>
          </div>

          {/* Right Column: Dark Scenic Revenue Summary Panel */}
          <div className="lg:col-span-4 bg-[#172B36] text-white p-6 sm:p-7 relative overflow-hidden flex flex-col justify-between">
            {/* Subtle editorial photo background with dark overlay */}
            <div className="absolute inset-0 opacity-20 pointer-events-none">
              <Image
                src="/images/hero-editorial.jpg"
                alt="Scenic Enterprise Background"
                fill
                sizes="(max-width: 1024px) 100vw, 33vw"
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-[#172B36]/85" />
            </div>

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[11px] font-bold tracking-wider uppercase text-[#A3D9D2] bg-[#1D5A52] px-2 py-0.5 rounded border border-[#287D73]/60">
                  Revenue Summary
                </span>
                <button
                  onClick={() => loadAllData(true)}
                  disabled={refreshing}
                  className="p-1.5 rounded text-[#D6E0E1] hover:text-white hover:bg-[#263E49] transition-colors"
                  title="Reload metrics"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-[#A3D9D2]" : ""}`} />
                </button>
              </div>

              <div className="text-xs text-[#D6E0E1]">Normalized Monthly Recurring</div>
              <div className="text-3xl sm:text-4xl font-extrabold text-white mt-1 tabular-nums">
                {formatINR(analytics.mrr_minor)}
              </div>
              <div className="text-[11px] text-[#A3D9D2] mt-1 flex items-center gap-1 font-medium">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>+8.2% Normalized Run Rate</span>
              </div>
            </div>

            <div className="relative z-10 grid grid-cols-3 gap-2 pt-6 mt-4 border-t border-[#263E49] text-center">
              <div className="p-2 rounded bg-[#12222B] border border-[#263E49]">
                <div className="text-[10px] text-[#9EB1BC] uppercase font-semibold">Products</div>
                <div className="text-sm font-bold text-white mt-0.5 tabular-nums">
                  {products.length || 5}
                </div>
              </div>
              <div className="p-2 rounded bg-[#12222B] border border-[#263E49]">
                <div className="text-[10px] text-[#9EB1BC] uppercase font-semibold">Active Subs</div>
                <div className="text-sm font-bold text-white mt-0.5 tabular-nums">
                  {analytics.active_subscriptions.toLocaleString()}
                </div>
              </div>
              <div className="p-2 rounded bg-[#12222B] border border-[#263E49]">
                <div className="text-[10px] text-[#9EB1BC] uppercase font-semibold">Customers</div>
                <div className="text-sm font-bold text-white mt-0.5 tabular-nums">
                  {customers.length || 4}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SECTION C: FOUR COMPACT FINANCIAL METRIC TILES
          ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Revenue */}
        <div className="bg-white p-5 rounded-xl border border-[#D8E0DE] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[#53636D] font-semibold">
            <span>Total Invoiced Revenue</span>
            <div className="w-7 h-7 rounded-lg bg-[#E7F2EF] text-[#287D73] flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-2xl font-extrabold text-[#172B36] tabular-nums">
              {formatINR(analytics.total_collected_minor + analytics.outstanding_minor)}
            </div>
            <div className="text-[11px] text-[#24734D] font-semibold mt-0.5 flex items-center gap-1">
              <span>+14.8%</span>
              <span className="text-[#82929E] font-normal">vs prior quarter</span>
            </div>
          </div>
          <div className="pt-2 border-t border-[#D8E0DE] flex items-center justify-between text-[11px] text-[#53636D]">
            <span>Reporting period</span>
            <span className="font-semibold text-[#172B36]">FY 2026</span>
          </div>
        </div>

        {/* Metric 2: Monthly Recurring Revenue */}
        <div className="bg-white p-5 rounded-xl border border-[#D8E0DE] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[#53636D] font-semibold">
            <span>Monthly Recurring (MRR)</span>
            <div className="w-7 h-7 rounded-lg bg-[#E7F2EF] text-[#287D73] flex items-center justify-center">
              <Repeat className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-2xl font-extrabold text-[#172B36] tabular-nums">
              {formatINR(analytics.mrr_minor)}
            </div>
            <div className="text-[11px] text-[#24734D] font-semibold mt-0.5 flex items-center gap-1">
              <span>+8.2%</span>
              <span className="text-[#82929E] font-normal">normalized monthly</span>
            </div>
          </div>
          <div className="pt-2 border-t border-[#D8E0DE] flex items-center justify-between text-[11px] text-[#53636D]">
            <span>ARR Equivalent</span>
            <span className="font-semibold text-[#172B36]">
              {formatINR(analytics.mrr_minor * 12)}
            </span>
          </div>
        </div>

        {/* Metric 3: Active Subscriptions */}
        <div className="bg-white p-5 rounded-xl border border-[#D8E0DE] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[#53636D] font-semibold">
            <span>Active Subscriptions</span>
            <div className="w-7 h-7 rounded-lg bg-[#E7F2EF] text-[#287D73] flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-2xl font-extrabold text-[#172B36] tabular-nums">
              {analytics.active_subscriptions.toLocaleString()}
            </div>
            <div className="text-[11px] text-[#24734D] font-semibold mt-0.5 flex items-center gap-1">
              <span>98.4%</span>
              <span className="text-[#82929E] font-normal">renewal retention</span>
            </div>
          </div>
          <div className="pt-2 border-t border-[#D8E0DE] flex items-center justify-between text-[11px] text-[#53636D]">
            <span>Total contracts</span>
            <Link href="/subscriptions" className="font-semibold text-[#287D73] hover:underline">
              Inspect list →
            </Link>
          </div>
        </div>

        {/* Metric 4: Outstanding Balance */}
        <div className="bg-white p-5 rounded-xl border border-[#D8E0DE] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[#53636D] font-semibold">
            <span>Outstanding Balance</span>
            <div className="w-7 h-7 rounded-lg bg-[#FDF6EC] text-[#96600C] flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-2xl font-extrabold text-[#172B36] tabular-nums">
              {formatINR(analytics.outstanding_minor)}
            </div>
            <div className="text-[11px] text-[#96600C] font-semibold mt-0.5 flex items-center gap-1">
              <span>{operationalCounts.paymentsPending} invoices</span>
              <span className="text-[#82929E] font-normal">unsettled</span>
            </div>
          </div>
          <div className="pt-2 border-t border-[#D8E0DE] flex items-center justify-between text-[11px] text-[#53636D]">
            <span>Reconciled</span>
            <Link href="/invoices" className="font-semibold text-[#287D73] hover:underline">
              Open ledger →
            </Link>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SECTION D & E: SIGNATURE REVENUE FLOW PANEL & LIVE OPERATIONS
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Signature Revenue Flow (8 Cols) */}
        <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-[#D8E0DE] shadow-xs flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#D8E0DE]">
            <div>
              <h2 className="text-base font-bold text-[#172B36] flex items-center gap-2">
                <span>Revenue Flow</span>
                <span className="text-[11px] font-bold px-2 py-0.5 bg-[#E7F2EF] text-[#20665E] rounded-full border border-[#287D73]/30">
                  Signature Engine
                </span>
              </h2>
              <p className="text-xs text-[#53636D]">
                From catalog products to reconciled ledger — see where your revenue moves.
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-[#53636D]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#287D73]" /> Monthly MRR
              </span>
              <span className="flex items-center gap-1.5 text-[#53636D]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#B86F4B]" /> Enterprise
              </span>
              <span className="flex items-center gap-1.5 text-[#53636D]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#315F82]" /> Taxes & Add-ons
              </span>
            </div>
          </div>

          {/* Custom SVG Sankey-Style Flow Diagram */}
          <div className="py-6 overflow-x-auto">
            <div className="min-w-[620px] h-[220px] relative">
              <svg className="w-full h-full" viewBox="0 0 700 220" fill="none">
                {/* Flow 1: Enterprise ERP -> Central Aggregation */}
                <path
                  d="M 170 45 C 260 45, 270 110, 350 110"
                  stroke="#287D73"
                  strokeWidth="8"
                  strokeOpacity="0.45"
                  fill="none"
                />
                {/* Flow 2: Cloud Infra -> Central Aggregation */}
                <path
                  d="M 170 100 C 260 100, 270 110, 350 110"
                  stroke="#287D73"
                  strokeWidth="6"
                  strokeOpacity="0.35"
                  fill="none"
                />
                {/* Flow 3: Database Engine -> Central Aggregation */}
                <path
                  d="M 170 155 C 260 155, 270 110, 350 110"
                  stroke="#B86F4B"
                  strokeWidth="5"
                  strokeOpacity="0.4"
                  fill="none"
                />

                {/* Flow Out 1: Central Aggregation -> Monthly Recurring Subscriptions */}
                <path
                  d="M 370 110 C 450 110, 460 45, 530 45"
                  stroke="#287D73"
                  strokeWidth="8"
                  strokeOpacity="0.6"
                  fill="none"
                />
                {/* Flow Out 2: Central Aggregation -> Enterprise Annual Contracts */}
                <path
                  d="M 370 110 C 450 110, 460 110, 530 110"
                  stroke="#B86F4B"
                  strokeWidth="6"
                  strokeOpacity="0.5"
                  fill="none"
                />
                {/* Flow Out 3: Central Aggregation -> Add-on Products & Taxes */}
                <path
                  d="M 370 110 C 450 110, 460 175, 530 175"
                  stroke="#315F82"
                  strokeWidth="4"
                  strokeOpacity="0.45"
                  fill="none"
                />
              </svg>

              {/* Left Source Nodes */}
              <div className="absolute left-0 top-0 bottom-0 w-44 flex flex-col justify-between py-1">
                <div className="p-2.5 rounded-lg bg-[#F4F6F5] border border-[#D8E0DE] text-left">
                  <div className="text-[11px] font-bold text-[#172B36] truncate">Enterprise ERP</div>
                  <div className="text-[10px] text-[#287D73] font-semibold tabular-nums">₹25,60,000 (60%)</div>
                </div>
                <div className="p-2.5 rounded-lg bg-[#F4F6F5] border border-[#D8E0DE] text-left">
                  <div className="text-[11px] font-bold text-[#172B36] truncate">Cloud Infrastructure</div>
                  <div className="text-[10px] text-[#287D73] font-semibold tabular-nums">₹10,20,000 (24%)</div>
                </div>
                <div className="p-2.5 rounded-lg bg-[#F4F6F5] border border-[#D8E0DE] text-left">
                  <div className="text-[11px] font-bold text-[#172B36] truncate">Database & Modules</div>
                  <div className="text-[10px] text-[#B86F4B] font-semibold tabular-nums">₹7,00,000 (16%)</div>
                </div>
              </div>

              {/* Center Aggregation Node */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-32 p-3 rounded-xl bg-[#172B36] text-white text-center shadow-md border border-[#263E49]">
                <div className="text-[10px] text-[#A3D9D2] uppercase font-bold tracking-wider">Total Volume</div>
                <div className="text-sm font-extrabold tabular-nums mt-0.5">
                  {formatINR(analytics.total_collected_minor + analytics.outstanding_minor)}
                </div>
                <div className="text-[9px] text-[#9EB1BC] mt-0.5">Audited Run</div>
              </div>

              {/* Right Output Destination Nodes */}
              <div className="absolute right-0 top-0 bottom-0 w-44 flex flex-col justify-between py-1">
                <div className="p-2.5 rounded-lg bg-[#E7F2EF] border border-[#287D73]/30 text-right">
                  <div className="text-[11px] font-bold text-[#172B36]">Subscription MRR</div>
                  <div className="text-[10px] text-[#20665E] font-bold tabular-nums">₹24,82,400 (58%)</div>
                </div>
                <div className="p-2.5 rounded-lg bg-[#F8EDE6] border border-[#B86F4B]/30 text-right">
                  <div className="text-[11px] font-bold text-[#172B36]">Enterprise Annual</div>
                  <div className="text-[10px] text-[#96600C] font-bold tabular-nums">₹11,12,800 (26%)</div>
                </div>
                <div className="p-2.5 rounded-lg bg-[#EDF4F9] border border-[#315F82]/30 text-right">
                  <div className="text-[11px] font-bold text-[#172B36]">GST (18%) & Add-ons</div>
                  <div className="text-[10px] text-[#315F82] font-bold tabular-nums">₹6,84,800 (16%)</div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-[#D8E0DE] flex items-center justify-between text-xs text-[#53636D]">
            <span>Rule Evaluation: Continuous validation across tax schedules & volume discount rules</span>
            <Link href="/catalog" className="font-bold text-[#287D73] hover:underline flex items-center gap-1">
              <span>Inspect Pricing Rules</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Live Operations Panel (4 Cols) */}
        <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-[#D8E0DE] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#D8E0DE]">
              <h2 className="text-sm font-bold text-[#172B36] flex items-center gap-2">
                <span>Live Operations</span>
                <span className="w-2 h-2 rounded-full bg-[#24734D] animate-ping" />
              </h2>
              <span className="text-[11px] text-[#82929E]">Real-time events</span>
            </div>

            <div className="mt-4 space-y-3.5">
              {invoices.slice(0, 4).map((inv, idx) => (
                <div key={idx} className="flex items-start gap-3 text-xs">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                      inv.status === "paid"
                        ? "bg-[#E7F2EF] text-[#24734D]"
                        : "bg-[#FDF6EC] text-[#96600C]"
                    }`}
                  >
                    <Receipt className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#172B36] truncate">{inv.invoice_number}</span>
                      <span className="text-[10px] text-[#82929E] tabular-nums">{inv.issue_date}</span>
                    </div>
                    <div className="text-[#53636D] truncate">{inv.customer_name}</div>
                    <div className="text-[11px] font-semibold text-[#172B36] tabular-nums mt-0.5">
                      {formatINR(inv.total_minor)} • <span className="capitalize text-[#287D73]">{inv.status}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-[#D8E0DE]">
            <Link
              href="/invoices"
              className="w-full py-2 rounded-lg bg-[#F4F6F5] hover:bg-[#EDF2F0] text-center text-xs font-bold text-[#172B36] block transition-colors"
            >
              View Full Transaction Ledger →
            </Link>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SECTION F: UPCOMING RENEWALS PANEL
          ========================================================================= */}
      <div className="bg-white p-6 rounded-2xl border border-[#D8E0DE] shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-[#D8E0DE]">
          <div>
            <h2 className="text-sm font-bold text-[#172B36] flex items-center gap-2">
              <span>Upcoming Renewals</span>
              <span className="text-[11px] font-bold text-[#20665E] bg-[#E7F2EF] px-2 py-0.5 rounded-full">
                Next 7–30 Days
              </span>
            </h2>
            <p className="text-xs text-[#53636D]">
              Subscriptions scheduled for automatic recurring billing renewal.
            </p>
          </div>
          <Link
            href="/subscriptions"
            className="text-xs font-bold text-[#287D73] hover:underline flex items-center gap-1"
          >
            <span>All Subscriptions</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#D8E0DE] text-[11px] font-bold text-[#82929E] uppercase">
                <th className="pb-3 font-semibold">Subscriber</th>
                <th className="pb-3 font-semibold">Plan</th>
                <th className="pb-3 font-semibold">Cadence</th>
                <th className="pb-3 font-semibold">Renewal Date</th>
                <th className="pb-3 font-semibold">Scheduled Amount</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D8E0DE]/70">
              {subscriptions.slice(0, 5).map((sub) => {
                const daysLeft = Math.ceil(
                  (new Date(sub.next_billing_date).getTime() - new Date(demoClock).getTime()) /
                    (1000 * 60 * 60 * 24)
                );

                return (
                  <tr
                    key={sub.id}
                    onClick={() => router.push(`/subscriptions/${sub.id}`)}
                    className="hover:bg-[#F4F6F5] cursor-pointer transition-colors"
                  >
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-[#1D5A52] text-[#E7F2EF] font-bold text-[10px] flex items-center justify-center shrink-0">
                          {sub.customer_name[0]}
                        </div>
                        <div>
                          <div className="font-bold text-[#172B36]">{sub.customer_name}</div>
                          <div className="text-[10px] text-[#82929E] font-mono">{sub.subscription_number}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 font-medium text-[#202C33]">{sub.plan_name}</td>
                    <td className="py-3 capitalize text-[#53636D]">{sub.frequency}</td>
                    <td className="py-3">
                      <div className="font-medium tabular-nums text-[#172B36]">{sub.next_billing_date}</div>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                          daysLeft <= 3
                            ? "bg-[#FDF1F2] text-[#B42332]"
                            : daysLeft <= 7
                            ? "bg-[#FDF6EC] text-[#96600C]"
                            : "bg-[#E7F2EF] text-[#20665E]"
                        }`}
                      >
                        {daysLeft <= 0 ? "Due Today" : `in ${daysLeft} days`}
                      </span>
                    </td>
                    <td className="py-3 font-bold text-[#172B36] tabular-nums">
                      {formatINR(sub.recurring_amount_minor)}
                    </td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#E7F2EF] text-[#20665E]">
                        {sub.status}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <span className="inline-flex items-center text-xs font-bold text-[#287D73] hover:underline">
                        Details <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* =========================================================================
          SECTION G: LOWER ANALYTICAL REGION (3 Distinct Modules)
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Module 1: Subscription Health (4 Cols) */}
        <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-[#D8E0DE] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#D8E0DE]">
              <h2 className="text-sm font-bold text-[#172B36]">Subscription Health</h2>
              <span className="text-xs font-bold text-[#287D73] tabular-nums">
                {totalSubsCount} Total
              </span>
            </div>
            <p className="text-xs text-[#53636D] mt-1">Lifecycle distribution across subscriber cohorts</p>

            <div className="h-52 relative mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="count"
                  >
                    {statusDistribution.map((entry: { color: string; count: number; name: string }, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#172B36",
                      borderColor: "#263E49",
                      borderRadius: "8px",
                      color: "#FFFFFF",
                      fontSize: "12px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xl font-extrabold text-[#172B36] tabular-nums">
                  {statusDistribution.find((s: { name: string; count: number }) => s.name === "Active")?.count || 0}
                </span>
                <span className="text-[10px] text-[#82929E] font-semibold uppercase">Active</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-[#D8E0DE] text-xs">
            {statusDistribution.map((item: { name: string; count: number; color: string }) => (
              <div key={item.name} className="flex items-center justify-between p-1.5 rounded bg-[#F4F6F5]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-[#53636D] font-medium">{item.name}</span>
                </div>
                <span className="font-bold text-[#172B36] tabular-nums">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Module 2: Revenue Trend (5 Cols) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-[#D8E0DE] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#D8E0DE]">
              <div>
                <h2 className="text-sm font-bold text-[#172B36]">Revenue Trend</h2>
                <p className="text-xs text-[#53636D]">Monthly billing run progression</p>
              </div>

              {/* Metric Selector (Revenue, MRR, Collected) */}
              <div className="flex gap-1 bg-[#F4F6F5] p-1 rounded-lg border border-[#D8E0DE] text-[11px]">
                <button
                  onClick={() => setTrendMetric("revenue")}
                  className={`px-2 py-1 rounded font-semibold transition-colors ${
                    trendMetric === "revenue"
                      ? "bg-[#287D73] text-white"
                      : "text-[#53636D] hover:text-[#172B36]"
                  }`}
                >
                  Revenue
                </button>
                <button
                  onClick={() => setTrendMetric("mrr")}
                  className={`px-2 py-1 rounded font-semibold transition-colors ${
                    trendMetric === "mrr"
                      ? "bg-[#287D73] text-white"
                      : "text-[#53636D] hover:text-[#172B36]"
                  }`}
                >
                  MRR
                </button>
                <button
                  onClick={() => setTrendMetric("collected")}
                  className={`px-2 py-1 rounded font-semibold transition-colors ${
                    trendMetric === "collected"
                      ? "bg-[#287D73] text-white"
                      : "text-[#53636D] hover:text-[#172B36]"
                  }`}
                >
                  Collected
                </button>
              </div>
            </div>

            <div className="h-56 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#287D73" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#287D73" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#82929E" }} axisLine={false} />
                  <YAxis
                    tickFormatter={formatChartCurrency}
                    tick={{ fontSize: 10, fill: "#82929E" }}
                    axisLine={false}
                  />
                  <Tooltip
                    formatter={(val: any) => [`₹${Number(val).toLocaleString()}`, "Amount"]}
                    contentStyle={{
                      backgroundColor: "#172B36",
                      borderColor: "#263E49",
                      borderRadius: "8px",
                      color: "#FFFFFF",
                      fontSize: "12px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#287D73"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorValue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="pt-3 border-t border-[#D8E0DE] flex items-center justify-between text-xs text-[#53636D]">
            <span>Active Cadences: Daily, Weekly, Monthly, Annual</span>
            <span className="font-semibold text-[#172B36]">Currency: INR (₹)</span>
          </div>
        </div>

        {/* Module 3: At a Glance Actionable Insights (3 Cols) */}
        <div className="lg:col-span-3 bg-white p-6 rounded-2xl border border-[#D8E0DE] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#D8E0DE]">
              <h2 className="text-sm font-bold text-[#172B36]">At a Glance</h2>
              <span className="text-[11px] font-bold text-[#B86F4B] bg-[#F8EDE6] px-2 py-0.5 rounded-full">
                Intelligence
              </span>
            </div>
            <p className="text-xs text-[#53636D] mt-1">Operational health indicators</p>

            <div className="mt-4 space-y-3">
              <div className="p-3 rounded-xl bg-[#F4F6F5] border border-[#D8E0DE]">
                <div className="flex items-center justify-between text-xs font-bold text-[#172B36]">
                  <span>Guardian Alert</span>
                  <span className="text-[#B42332]">4 Issues</span>
                </div>
                <p className="text-[11px] text-[#53636D] mt-1">
                  Missing invoices & overdue payments require attention.
                </p>
                <Link
                  href="/guardian"
                  className="mt-2 inline-flex items-center text-xs font-bold text-[#287D73] hover:underline"
                >
                  Resolve in Guardian →
                </Link>
              </div>

              <div className="p-3 rounded-xl bg-[#F4F6F5] border border-[#D8E0DE]">
                <div className="flex items-center justify-between text-xs font-bold text-[#172B36]">
                  <span>Time Machine</span>
                  <span className="text-[#24734D]">Ready</span>
                </div>
                <p className="text-[11px] text-[#53636D] mt-1">
                  Preview future renewals with mathematical duplicate prevention.
                </p>
                <Link
                  href="/time-machine"
                  className="mt-2 inline-flex items-center text-xs font-bold text-[#287D73] hover:underline"
                >
                  Launch Simulator →
                </Link>
              </div>

              <div className="p-3 rounded-xl bg-[#F4F6F5] border border-[#D8E0DE]">
                <div className="flex items-center justify-between text-xs font-bold text-[#172B36]">
                  <span>Customer Portal</span>
                  <span className="text-[#315F82]">Autonomous</span>
                </div>
                <p className="text-[11px] text-[#53636D] mt-1">
                  Customers can pause, resume, and print invoices directly.
                </p>
                <Link
                  href="/portal"
                  className="mt-2 inline-flex items-center text-xs font-bold text-[#287D73] hover:underline"
                >
                  Open Subscriber Portal →
                </Link>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-[#D8E0DE] text-center">
            <span className="text-[11px] text-[#82929E]">Brightloop OS v2.0 • Enterprise Edition</span>
          </div>
        </div>
      </div>
    </div>
  );
}
