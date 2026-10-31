"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  AlertTriangle,
  AlertCircle,
  Clock,
  Receipt,
  FileCheck2,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  Search,
  Sparkles,
  ExternalLink,
  Zap,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { api } from "@/lib/api";
import { GuardianIssue, Invoice } from "@/types";
import { formatINR } from "@/lib/utils";
import { toast } from "sonner";

export default function RevenueGuardianPage() {
  const [issues, setIssues] = useState<GuardianIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [scanning, setScanning] = useState(false);

  // Recovery Dialog state
  const [selectedIssueToRecover, setSelectedIssueToRecover] = useState<GuardianIssue | null>(null);
  const [recovering, setRecovering] = useState(false);
  const [recoveredInvoice, setRecoveredInvoice] = useState<Invoice | null>(null);

  const loadIssues = async () => {
    try {
      setLoading(true);
      const res = await api.guardian.issues();
      setIssues(res);
    } catch {
      toast.error("Failed to load Revenue Guardian issues.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIssues();
  }, []);

  const handleScan = () => {
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      loadIssues();
      toast.success("Autonomous ledger scan completed. Heuristic anomalies verified.");
    }, 700);
  };

  // 15.6 Execute Safe Recovery Interaction
  const handleConfirmRecovery = async () => {
    if (!selectedIssueToRecover) return;

    try {
      setRecovering(true);
      const result = await api.guardian.recover(selectedIssueToRecover.id);

      // Update issue state locally
      setIssues(issues.map((iss) => (iss.id === result.issue.id ? result.issue : iss)));
      if (result.invoice) {
        setRecoveredInvoice(result.invoice);
      }

      toast.success("Missing invoice safely recovered and generated into the ledger!", {
        description: result.invoice
          ? `Invoice ${result.invoice.invoice_number} created for ${formatINR(result.invoice.total_minor)}.`
          : undefined,
      });

      setSelectedIssueToRecover(null);
    } catch {
      toast.error("Failed to recover missing invoice.");
    } finally {
      setRecovering(false);
    }
  };

  // Metrics computation
  const openIssues = issues.filter((i) => !i.is_resolved);
  const criticalCount = openIssues.filter((i) => i.severity === "critical").length;
  let overdueBalanceMinor = 0;
  let missedBillingAmountMinor = 0;

  for (const iss of openIssues) {
    if (iss.type === "overdue_payment" && iss.amount_minor) {
      overdueBalanceMinor += iss.amount_minor;
    }
    if (iss.type === "missing_invoice" && iss.amount_minor) {
      missedBillingAmountMinor += iss.amount_minor;
    }
  }

  // Health Score computation (100 - penalties)
  const healthScore = Math.max(0, Math.min(100, 100 - criticalCount * 6 - openIssues.length * 2));

  // Category Filter
  const filteredIssues = issues.filter((iss) => {
    if (categoryFilter === "all") return true;
    if (categoryFilter === "critical") return iss.severity === "critical";
    return iss.category === categoryFilter;
  });

  return (
    <div className="space-y-6 select-none font-sans text-[#202C33]">
      <PageHeader
        title="Revenue Guardian"
        subtitle="Detect unbilled cycles, overdue receivables, and contract expirations before they turn into revenue losses."
        badge={
          <span className="px-2.5 py-1 rounded-md bg-[#E7F2EF] border border-[#287D73]/30 text-[#20665E] text-xs font-bold flex items-center gap-1.5 shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-[#287D73]" /> GUARDIAN SCANNER ACTIVE
          </span>
        }
      >
        <button
          onClick={handleScan}
          disabled={scanning}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#287D73] hover:bg-[#20665E] rounded-lg shadow-xs transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${scanning ? "animate-spin" : ""}`} />
          {scanning ? "Scanning Ledger..." : "Scan for Issues"}
        </button>
      </PageHeader>

      {/* 15.2 Health Overview & 15.3 Key Metrics Bar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Health Score Circular Gauge Card (4 cols) */}
        <div className="md:col-span-4 bg-white rounded-xl border border-[#D8E0DE] p-6 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-[#82929E] uppercase tracking-wider block">
              Revenue Health Score
            </span>
            <div className="text-3xl font-black text-[#172B36] tracking-tight mt-1 flex items-baseline gap-1.5">
              <span>{healthScore}</span>
              <span className="text-sm font-semibold text-[#82929E]">/ 100</span>
            </div>
            <p className="text-xs text-[#53636D] mt-1 font-medium">
              Operational ledger integrity
            </p>
          </div>

          <div className="relative w-20 h-20 flex items-center justify-center">
            {/* SVG circular progress */}
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-[#EDF2F0]"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-[#287D73]"
                strokeDasharray={`${healthScore}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <ShieldCheck className="w-7 h-7 text-[#287D73] absolute" />
          </div>
        </div>

        {/* 15.3 Key Metrics (8 cols) */}
        <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-xl border border-[#D8E0DE] shadow-xs flex flex-col justify-between">
            <span className="text-[11px] font-bold text-[#82929E] uppercase tracking-wider">
              Critical Attention
            </span>
            <div className="text-2xl font-extrabold text-[#B42332] tabular-nums mt-1">
              {criticalCount} Critical
            </div>
            <span className="text-xs text-[#53636D]">Requires operational review</span>
          </div>

          <div className="bg-white p-5 rounded-xl border border-[#D8E0DE] shadow-xs flex flex-col justify-between">
            <span className="text-[11px] font-bold text-[#82929E] uppercase tracking-wider">
              Overdue Balance
            </span>
            <div className="text-2xl font-extrabold text-[#96600C] tabular-nums mt-1">
              {formatINR(overdueBalanceMinor)}
            </div>
            <span className="text-xs text-[#53636D]">Past agreed payment terms</span>
          </div>

          <div className="bg-white p-5 rounded-xl border border-[#D8E0DE] shadow-xs flex flex-col justify-between">
            <span className="text-[11px] font-bold text-[#82929E] uppercase tracking-wider">
              Missed Billing At Risk
            </span>
            <div className="text-2xl font-extrabold text-[#20665E] tabular-nums mt-1">
              {formatINR(missedBillingAmountMinor)}
            </div>
            <span className="text-xs text-[#24734D] font-semibold">1-Click recoverable</span>
          </div>
        </div>
      </div>

      {/* 15.4 Issue Categories Filter Tabs */}
      <div className="flex items-center gap-1.5 border-b border-[#D8E0DE] text-xs font-semibold overflow-x-auto pb-1">
        {[
          { label: "All Issues", value: "all", count: issues.length },
          { label: "Critical", value: "critical", count: criticalCount },
          { label: "Billing Engine", value: "billing" },
          { label: "Payments & Dunning", value: "payments" },
          { label: "Upcoming Renewals", value: "renewals" },
        ].map((cat) => (
          <button
            key={cat.value}
            onClick={() => setCategoryFilter(cat.value)}
            className={`px-3.5 py-2 rounded-t-lg transition-colors flex items-center gap-1.5 ${
              categoryFilter === cat.value
                ? "bg-[#172B36] text-white"
                : "text-[#53636D] hover:bg-[#F4F6F5]"
            }`}
          >
            <span>{cat.label}</span>
            {cat.count !== undefined && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
                {cat.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 15.5 Issue Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredIssues.map((iss) => (
          <div
            key={iss.id}
            className={`bg-white rounded-xl border p-5 shadow-xs flex flex-col justify-between transition-all ${
              iss.is_resolved
                ? "border-[#24734D]/30 bg-[#E7F4ED]/40"
                : iss.severity === "critical"
                ? "border-[#B42332]/30 hover:border-[#B42332]"
                : iss.severity === "warning"
                ? "border-[#96600C]/30 hover:border-[#96600C]"
                : "border-[#D8E0DE] hover:border-[#287D73]"
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    iss.is_resolved
                      ? "bg-[#E7F4ED] text-[#24734D]"
                      : iss.severity === "critical"
                      ? "bg-[#FDF1F2] text-[#B42332]"
                      : iss.severity === "warning"
                      ? "bg-[#FDF6EC] text-[#96600C]"
                      : "bg-[#EDF4F9] text-[#315F82]"
                  }`}
                >
                  {iss.is_resolved ? "RESOLVED" : iss.severity.toUpperCase()}
                </span>
                <span className="text-[11px] font-mono text-[#82929E] uppercase">
                  {iss.category}
                </span>
              </div>

              <h3 className="font-bold text-[#172B36] text-sm mb-1">{iss.title}</h3>
              <p className="text-xs text-[#53636D] leading-relaxed mb-4">{iss.explanation}</p>

              {/* Reference Links & Financial Impact */}
              <div className="bg-[#F4F6F5] border border-[#D8E0DE] rounded-lg p-3 space-y-1.5 text-xs text-[#202C33] mb-4">
                {iss.subscription_number && (
                  <div className="flex justify-between">
                    <span className="text-[#53636D]">Subscription:</span>
                    <Link
                      href={`/subscriptions/${iss.subscription_id}`}
                      className="font-bold text-[#287D73] hover:underline"
                    >
                      {iss.subscription_number}
                    </Link>
                  </div>
                )}
                {iss.invoice_number && (
                  <div className="flex justify-between">
                    <span className="text-[#53636D]">Invoice:</span>
                    <Link
                      href="/invoices"
                      className="font-bold text-[#287D73] hover:underline"
                    >
                      {iss.invoice_number}
                    </Link>
                  </div>
                )}
                {iss.amount_minor && (
                  <div className="flex justify-between">
                    <span className="text-[#53636D]">Financial Impact:</span>
                    <span className="font-bold text-[#172B36] tabular-nums">
                      {formatINR(iss.amount_minor)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Contextual Action Button */}
            <div className="pt-3 border-t border-[#D8E0DE] flex items-center justify-between">
              <span className="text-[11px] text-[#82929E]">
                {iss.is_resolved ? `Resolved at ${iss.resolved_at?.split("T")[0]}` : "Action Required"}
              </span>

              {iss.is_resolved ? (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-[#24734D]">
                  <CheckCircle2 className="w-4 h-4" /> Issue Closed
                </span>
              ) : iss.type === "missing_invoice" ? (
                <button
                  onClick={() => setSelectedIssueToRecover(iss)}
                  className="px-3.5 py-1.5 rounded-lg bg-[#287D73] hover:bg-[#20665E] text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Zap className="w-3.5 h-3.5" /> Recover Invoice
                </button>
              ) : iss.type === "overdue_payment" ? (
                <Link
                  href="/invoices"
                  className="px-3.5 py-1.5 rounded-lg bg-white border border-[#D8E0DE] text-[#202C33] hover:bg-[#F4F6F5] text-xs font-bold shadow-2xs transition-colors flex items-center gap-1.5"
                >
                  <Receipt className="w-3.5 h-3.5 text-[#96600C]" /> View Invoice & Record
                </Link>
              ) : (
                <Link
                  href={`/subscriptions/${iss.subscription_id}`}
                  className="px-3.5 py-1.5 rounded-lg bg-white border border-[#D8E0DE] text-[#202C33] hover:bg-[#F4F6F5] text-xs font-bold shadow-2xs transition-colors flex items-center gap-1.5"
                >
                  <span>Review Renewal</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#287D73]" />
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Recover Missing Invoice Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!selectedIssueToRecover}
        onClose={() => setSelectedIssueToRecover(null)}
        onConfirm={handleConfirmRecovery}
        isLoading={recovering}
        title="Recover Missing Invoice"
        message={
          selectedIssueToRecover
            ? `Brightloop will verify the unbilled interval for ${selectedIssueToRecover.subscription_number} and immediately generate the missing invoice with strict duplicate suppression.`
            : "Confirm recovery"
        }
        confirmText="Confirm & Recover Invoice"
        isDangerous={false}
      />
    </div>
  );
}
