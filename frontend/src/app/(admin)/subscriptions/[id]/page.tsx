"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Pause,
  Play,
  XCircle,
  RefreshCw,
  FileCheck2,
  Receipt,
  Building2,
  Calendar,
  AlertTriangle,
  FileText,
  ShieldCheck,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { api } from "@/lib/api";
import { Subscription, Invoice } from "@/types";
import { formatINR, formatDate } from "@/lib/utils";
import { toast } from "sonner";

export default function SubscriptionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const subId = params.id as string;

  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  // Transition Dialog state
  const [dialogAction, setDialogAction] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const sub = await api.subscriptions.get(subId);
      setSubscription(sub);

      const invs = await api.invoices.list({ subscription_id: sub.id });
      setInvoices(invs);
    } catch {
      toast.error("Failed to load subscription details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (subId) loadData();
  }, [subId]);

  const handleExecuteTransition = async () => {
    if (!dialogAction || !subscription) return;
    try {
      setIsTransitioning(true);
      const updated = await api.subscriptions.transition(subscription.id, dialogAction);
      setSubscription(updated);
      toast.success(`Subscription transition to "${updated.status}" confirmed by server.`);
      setDialogAction(null);
    } catch {
      toast.error("Failed to perform lifecycle transition.");
    } finally {
      setIsTransitioning(false);
    }
  };

  if (loading || !subscription) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 bg-white border border-[#D8E0DE] rounded-md animate-pulse" />
        <div className="h-40 bg-white border border-[#D8E0DE] rounded-xl animate-pulse" />
        <div className="h-64 bg-white border border-[#D8E0DE] rounded-xl animate-pulse" />
      </div>
    );
  }

  // Lifecycle steps sequence
  const lifecycleSteps = ["draft", "quotation", "confirmed", "active", "closed"];
  const currentStepIndex = lifecycleSteps.indexOf(subscription.status);

  return (
    <div className="space-y-6 select-none font-sans text-[#202C33]">
      {/* Return button and Header */}
      <div>
        <Link
          href="/subscriptions"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#53636D] hover:text-[#172B36] mb-3 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Subscription Center
        </Link>
        <PageHeader
          title={`${subscription.subscription_number} — ${subscription.plan_name}`}
          subtitle={`Customer: ${subscription.customer_name} • Contact: ${subscription.customer_email}`}
          badge={
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[#E7F2EF] text-[#20665E]">
              {subscription.status}
            </span>
          }
        >
          {/* Action buttons based on lifecycle state */}
          <div className="flex items-center gap-2">
            {subscription.status === "quotation" && (
              <button
                onClick={() => setDialogAction("confirm_quotation")}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-[#287D73] hover:bg-[#20665E] rounded-lg shadow-xs transition-colors"
              >
                <FileCheck2 className="w-3.5 h-3.5" /> Confirm Quotation
              </button>
            )}

            {subscription.status === "confirmed" && (
              <button
                onClick={() => setDialogAction("activate")}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-[#24734D] hover:bg-[#1E5D3E] rounded-lg shadow-xs transition-colors"
              >
                <Play className="w-3.5 h-3.5" /> Activate Contract
              </button>
            )}

            {subscription.status === "active" && (
              <button
                onClick={() => setDialogAction("pause")}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#96600C] bg-[#FDF6EC] hover:bg-[#FCEFD9] border border-[#B86F4B]/30 rounded-lg transition-colors"
              >
                <Pause className="w-3.5 h-3.5" /> Pause Contract
              </button>
            )}

            {subscription.status === "paused" && (
              <button
                onClick={() => setDialogAction("resume")}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-[#24734D] hover:bg-[#1E5D3E] rounded-lg shadow-xs transition-colors"
              >
                <Play className="w-3.5 h-3.5" /> Resume Billing
              </button>
            )}

            {subscription.status === "active" && (
              <button
                onClick={() => setDialogAction("renew")}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#202C33] bg-white border border-[#D8E0DE] hover:bg-[#F4F6F5] rounded-lg transition-colors shadow-2xs"
              >
                <RefreshCw className="w-3.5 h-3.5 text-[#287D73]" /> Renew +1 Yr
              </button>
            )}

            {["active", "paused", "quotation", "draft"].includes(subscription.status) && (
              <button
                onClick={() => setDialogAction("close")}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#B42332] bg-[#FDF1F2] hover:bg-[#FCE4E6] border border-[#B42332]/30 rounded-lg transition-colors"
              >
                <XCircle className="w-3.5 h-3.5" /> Terminate Contract
              </button>
            )}

            <Link
              href="/invoices"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#202C33] bg-white border border-[#D8E0DE] hover:bg-[#F4F6F5] rounded-lg transition-colors shadow-2xs"
            >
              <Receipt className="w-3.5 h-3.5" /> View Invoices
            </Link>
          </div>
        </PageHeader>
      </div>

      {/* 12.1 Lifecycle Timeline Progress Bar */}
      <div className="bg-white rounded-xl border border-[#D8E0DE] p-6 shadow-xs">
        <h3 className="text-xs font-bold text-[#172B36] uppercase tracking-wider mb-5">
          Contract Lifecycle Progression
        </h3>
        <div className="relative flex items-center justify-between">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-[#D8E0DE] -z-0" />
          {lifecycleSteps.map((step, idx) => {
            const isCompleted = currentStepIndex > idx || subscription.status === step;
            const isCurrent = subscription.status === step;

            return (
              <div key={step} className="flex flex-col items-center relative z-10">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${
                    isCurrent
                      ? "bg-[#287D73] text-white ring-4 ring-[#E7F2EF]"
                      : isCompleted
                      ? "bg-[#24734D] text-white"
                      : "bg-[#EDF2F0] text-[#82929E]"
                  }`}
                >
                  {isCompleted && !isCurrent ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    idx + 1
                  )}
                </div>
                <span
                  className={`text-[11px] font-semibold uppercase tracking-wider mt-2 capitalize ${
                    isCurrent ? "text-[#287D73] font-bold" : isCompleted ? "text-[#24734D]" : "text-[#82929E]"
                  }`}
                >
                  {step}
                </span>
              </div>
            );
          })}
        </div>
        {subscription.status === "paused" && (
          <div className="mt-4 p-3 bg-[#FDF6EC] border border-[#B86F4B]/30 rounded-lg text-xs text-[#96600C] flex items-center gap-2">
            <Pause className="w-4 h-4 text-[#96600C] shrink-0" />
            <span>Contract is currently <strong>PAUSED</strong>. Billing time machine will skip generating invoices during this cycle.</span>
          </div>
        )}
      </div>

      {/* 12.2 Subscription Overview Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-[#D8E0DE] shadow-xs">
          <span className="text-[11px] font-bold text-[#82929E] uppercase tracking-wider">Billing Cadence</span>
          <div className="text-sm font-bold text-[#172B36] mt-1 capitalize">
            {subscription.frequency} Cycle
          </div>
          <span className="text-[11px] text-[#53636D]">Terms: {subscription.payment_terms}</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#D8E0DE] shadow-xs">
          <span className="text-[11px] font-bold text-[#82929E] uppercase tracking-wider">Recurring Amount</span>
          <div className="text-base font-extrabold text-[#20665E] mt-1 tabular-nums">
            {formatINR(subscription.recurring_amount_minor)}
          </div>
          <span className="text-[11px] text-[#53636D]">Itemized with 18% GST</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#D8E0DE] shadow-xs">
          <span className="text-[11px] font-bold text-[#82929E] uppercase tracking-wider">Next Renewal Date</span>
          <div className="text-sm font-bold text-[#172B36] mt-1 tabular-nums">
            {subscription.next_billing_date}
          </div>
          <span className="text-[11px] text-[#53636D]">Start: {subscription.start_date}</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#D8E0DE] shadow-xs">
          <span className="text-[11px] font-bold text-[#82929E] uppercase tracking-wider">Contract Expiry</span>
          <div className="text-sm font-bold text-[#172B36] mt-1 tabular-nums">
            {subscription.expiry_date}
          </div>
          <span className="text-[11px] text-[#24734D] font-semibold">Renewable contract</span>
        </div>
      </div>

      {/* 12.3 Product Lines Table */}
      <div className="bg-white rounded-xl border border-[#D8E0DE] shadow-xs overflow-hidden">
        <div className="p-4 border-b border-[#D8E0DE] bg-[#F4F6F5] flex items-center justify-between">
          <h3 className="text-xs font-bold text-[#172B36] uppercase tracking-wider">
            Contract Product Lines
          </h3>
          <span className="text-xs text-[#53636D]">
            {subscription.items.length} line item(s)
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F4F6F5] text-[#82929E] uppercase tracking-wider text-[11px] border-b border-[#D8E0DE]">
              <tr>
                <th className="px-5 py-3 font-semibold">Product Name</th>
                <th className="px-5 py-3 font-semibold">Configured Variant</th>
                <th className="px-5 py-3 font-semibold text-center">Quantity</th>
                <th className="px-5 py-3 font-semibold text-right">Unit Price</th>
                <th className="px-5 py-3 font-semibold text-right">Tax Rate</th>
                <th className="px-5 py-3 font-semibold text-right">Recurring Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D8E0DE] text-[#202C33]">
              {subscription.items.map((it) => (
                <tr key={it.id}>
                  <td className="px-5 py-3 font-bold text-[#172B36]">{it.product_name}</td>
                  <td className="px-5 py-3 text-[#53636D]">{it.variant_name || "Standard Variant"}</td>
                  <td className="px-5 py-3 text-center tabular-nums font-semibold">{it.quantity}</td>
                  <td className="px-5 py-3 text-right tabular-nums">{formatINR(it.unit_price_minor)}</td>
                  <td className="px-5 py-3 text-right tabular-nums">{it.tax_percentage || 18}%</td>
                  <td className="px-5 py-3 text-right font-bold text-[#172B36] tabular-nums">
                    {formatINR(it.amount_minor)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 12.4 Billing History Ledger */}
      <div className="bg-white rounded-xl border border-[#D8E0DE] shadow-xs overflow-hidden">
        <div className="p-4 border-b border-[#D8E0DE] bg-[#F4F6F5] flex items-center justify-between">
          <h3 className="text-xs font-bold text-[#172B36] uppercase tracking-wider">
            Generated Invoices & Billing History
          </h3>
          <span className="text-xs text-[#53636D]">
            {invoices.length} historical invoices
          </span>
        </div>
        {invoices.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#82929E] italic">
            No invoices generated yet. Use the Billing Time Machine to advance the simulation clock and execute renewal billing.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F4F6F5] text-[#82929E] uppercase tracking-wider text-[11px] border-b border-[#D8E0DE]">
                <tr>
                  <th className="px-5 py-3 font-semibold">Invoice ID</th>
                  <th className="px-5 py-3 font-semibold">Billing Period</th>
                  <th className="px-5 py-3 font-semibold">Due Date</th>
                  <th className="px-5 py-3 font-semibold text-right">Invoiced Total</th>
                  <th className="px-5 py-3 font-semibold text-right">Balance Due</th>
                  <th className="px-5 py-3 font-semibold text-center">Status</th>
                  <th className="px-5 py-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D8E0DE] text-[#202C33]">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-[#F4F6F5] transition-colors">
                    <td className="px-5 py-3 font-bold font-mono text-[#172B36]">{inv.invoice_number}</td>
                    <td className="px-5 py-3 text-[#53636D]">
                      {inv.period_start} → {inv.period_end}
                    </td>
                    <td className="px-5 py-3 tabular-nums">{inv.due_date}</td>
                    <td className="px-5 py-3 text-right font-bold text-[#172B36] tabular-nums">
                      {formatINR(inv.total_minor)}
                    </td>
                    <td className="px-5 py-3 text-right font-semibold text-[#B42332] tabular-nums">
                      {formatINR(inv.outstanding_minor)}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          inv.status === "paid"
                            ? "bg-[#E7F2EF] text-[#20665E]"
                            : "bg-[#FDF6EC] text-[#96600C]"
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link
                        href="/invoices"
                        className="text-xs font-bold text-[#287D73] hover:underline"
                      >
                        Inspect →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Dialog for Destructive or Lifecycle Actions */}
      <ConfirmDialog
        isOpen={!!dialogAction}
        onClose={() => setDialogAction(null)}
        onConfirm={handleExecuteTransition}
        isLoading={isTransitioning}
        title={`Confirm Subscription Action: ${dialogAction?.replace("_", " ").toUpperCase()}`}
        message={
          dialogAction === "pause"
            ? "Are you sure you want to pause this subscription? The billing engine will automatically suppress recurring invoices during paused cycles."
            : dialogAction === "close"
            ? "Are you sure you want to terminate this contract? This will permanently close the subscription lifecycle."
            : "Confirm transition of this contract lifecycle state. Changes are persisted immediately."
        }
        confirmText="Confirm Transition"
        isDangerous={dialogAction === "close"}
      />
    </div>
  );
}
