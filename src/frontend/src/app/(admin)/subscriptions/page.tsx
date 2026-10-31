"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Repeat,
  Plus,
  Search,
  Filter,
  FileCheck2,
  Calendar,
  AlertTriangle,
  ArrowRight,
  ChevronRight,
  FileText,
  Percent,
  CheckCircle2,
  Clock,
  Printer,
  Sparkles,
  ArrowUpRight,
  Layers,
  Building,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { Modal } from "@/components/ui/modal";
import { api } from "@/lib/api";
import {
  Subscription,
  Customer,
  SubscriptionPlan,
  Product,
  TaxRule,
  DiscountRule,
  QuotationTemplate,
  SubscriptionStatus,
} from "@/types";
import { formatINR, formatDate } from "@/lib/utils";
import { toast } from "sonner";

export default function SubscriptionsPage() {
  const router = useRouter();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [taxRules, setTaxRules] = useState<TaxRule[]>([]);
  const [discounts, setDiscounts] = useState<DiscountRule[]>([]);
  const [quotationTemplates, setQuotationTemplates] = useState<QuotationTemplate[]>([]);

  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"subscriptions" | "quotations">("subscriptions");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Quotation Split-View Selection (Screen 07)
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);

  // Create Subscription / Quotation Multi-step Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"subscription" | "quotation">("subscription");
  const [step, setStep] = useState(1);

  // Form states
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [itemQuantity, setItemQuantity] = useState("10");
  const [selectedTaxId, setSelectedTaxId] = useState("");
  const [selectedDiscountId, setSelectedDiscountId] = useState("");
  const [startDate, setStartDate] = useState("2026-11-01");
  const [expiryDate, setExpiryDate] = useState("2027-11-01");
  const [paymentTerms, setPaymentTerms] = useState("Net 15");
  const [quotationValidityDays, setQuotationValidityDays] = useState("15");

  const loadData = async () => {
    try {
      setLoading(true);
      const [subs, custs, plns, prods, txs, discs, tpls] = await Promise.all([
        api.subscriptions.list(),
        api.customers.list(),
        api.plans.list(),
        api.products.list(),
        api.taxRules.list(),
        api.discounts.list(),
        api.quotations.listTemplates(),
      ]);
      setSubscriptions(subs);
      setCustomers(custs);
      setPlans(plns);
      setProducts(prods);
      setTaxRules(txs);
      setDiscounts(discs);
      setQuotationTemplates(tpls);

      // Default selections
      if (custs.length > 0) setSelectedCustomerId(custs[0].id);
      if (plns.length > 0) setSelectedPlanId(plns[0].id);
      if (prods.length > 0) {
        setSelectedProductId(prods[0].id);
        if (prods[0].variants?.length) setSelectedVariantId(prods[0].variants[0].id);
      }
      if (txs.length > 0) setSelectedTaxId(txs[0].id);

      // Select first quotation if exists
      const firstQuote = subs.find((s) => s.status === "quotation" || s.status === "draft");
      if (firstQuote) setSelectedQuoteId(firstQuote.id);
    } catch {
      toast.error("Failed to load subscription data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute stats
  const activeCount = subscriptions.filter((s) => s.status === "active").length;
  const draftCount = subscriptions.filter((s) => s.status === "draft").length;
  const quotationCount = subscriptions.filter((s) => s.status === "quotation").length;
  const pausedCount = subscriptions.filter((s) => s.status === "paused").length;

  const quotationsList = useMemo(() => {
    return subscriptions.filter(
      (s) => s.status === "quotation" || s.status === "draft"
    );
  }, [subscriptions]);

  const selectedQuote = useMemo(() => {
    return quotationsList.find((q) => q.id === selectedQuoteId) || quotationsList[0] || null;
  }, [quotationsList, selectedQuoteId]);

  const filteredSubscriptions = subscriptions.filter((s) => {
    const matchesStatus = statusFilter === "all" || s.status === statusFilter;
    const matchesSearch =
      s.subscription_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.plan_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Calculation for Step 5 Review
  const chosenProduct = products.find((p) => p.id === selectedProductId);
  const chosenVariant = chosenProduct?.variants.find((v) => v.id === selectedVariantId);
  const chosenPlan = plans.find((p) => p.id === selectedPlanId);
  const chosenCustomer = customers.find((c) => c.id === selectedCustomerId);
  const chosenTax = taxRules.find((t) => t.id === selectedTaxId);
  const chosenDiscount = discounts.find((d) => d.id === selectedDiscountId);

  const basePriceMinor = chosenProduct?.sales_price_minor || 0;
  const variantAdjMinor = chosenVariant?.price_adjustment_minor || 0;
  const unitPriceMinor = basePriceMinor + variantAdjMinor;
  const qty = parseInt(itemQuantity, 10) || 1;
  const subtotalMinor = unitPriceMinor * qty;

  let discountMinor = 0;
  if (chosenDiscount) {
    if (chosenDiscount.type === "percentage") {
      discountMinor = Math.round((subtotalMinor * chosenDiscount.value) / 100);
    } else {
      discountMinor = chosenDiscount.value;
    }
  }
  const taxableMinor = Math.max(0, subtotalMinor - discountMinor);
  const taxRate = chosenTax?.rate_percentage || 0;
  const taxMinor = Math.round((taxableMinor * taxRate) / 100);
  const estimatedTotalMinor = taxableMinor + taxMinor;

  // Handle Save Subscription or Quotation
  const handleSave = async (statusToSet: SubscriptionStatus) => {
    try {
      const created = await api.subscriptions.create({
        customer_id: chosenCustomer?.id,
        customer_name: chosenCustomer?.company_name,
        customer_email: chosenCustomer?.email,
        plan_id: chosenPlan?.id,
        plan_name: chosenPlan?.name,
        frequency: chosenPlan?.frequency || "monthly",
        recurring_amount_minor: estimatedTotalMinor,
        start_date: startDate,
        expiry_date: expiryDate,
        next_billing_date: startDate,
        payment_terms: paymentTerms,
        status: statusToSet,
        discount_id: chosenDiscount?.id,
        discount_name: chosenDiscount?.name,
        valid_until:
          statusToSet === "quotation"
            ? new Date(Date.now() + parseInt(quotationValidityDays, 10) * 86400000)
                .toISOString()
                .split("T")[0]
            : undefined,
        items: [
          {
            id: `sli-${Date.now()}`,
            product_id: chosenProduct?.id || "prod-1",
            product_name: chosenProduct?.name || "Software License",
            variant_id: chosenVariant?.id,
            variant_name: chosenVariant?.name,
            quantity: qty,
            unit_price_minor: unitPriceMinor,
            tax_rule_id: chosenTax?.id,
            tax_percentage: taxRate,
            amount_minor: subtotalMinor,
          },
        ],
      });

      setSubscriptions([created, ...subscriptions]);
      setIsCreateModalOpen(false);
      setStep(1);
      toast.success(
        statusToSet === "quotation"
          ? `Quotation created with validity until ${created.valid_until}`
          : `Subscription ${created.subscription_number} activated successfully.`
      );
    } catch {
      toast.error("Failed to save subscription.");
    }
  };

  // Convert Quotation into Confirmed Subscription
  const handleConfirmQuotation = async (quote: Subscription) => {
    try {
      const updated = await api.subscriptions.transition(quote.id, "confirm_quotation");
      setSubscriptions(subscriptions.map((s) => (s.id === updated.id ? updated : s)));
      toast.success(`Quotation ${quote.subscription_number} converted into active subscription!`);
    } catch {
      toast.error("Failed to confirm quotation.");
    }
  };

  return (
    <div className="space-y-6 select-none font-sans text-[#202C33]">
      <PageHeader
        title="Subscription & Quotation Center"
        subtitle="Manage recurring customer contracts, commercial quotations, and automated renewal schedules."
      >
        <button
          onClick={() => {
            setModalMode("quotation");
            setStep(1);
            setIsCreateModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#202C33] bg-white border border-[#D8E0DE] hover:bg-[#F4F6F5] rounded-lg shadow-2xs transition-colors"
        >
          <FileCheck2 className="w-3.5 h-3.5 text-[#287D73]" /> Create Quotation
        </button>

        <button
          onClick={() => {
            setModalMode("subscription");
            setStep(1);
            setIsCreateModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#287D73] hover:bg-[#20665E] rounded-lg shadow-xs transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> New Subscription
        </button>
      </PageHeader>

      {/* Top View Mode Switcher: Subscriptions vs Quotation Document Workflow */}
      <div className="flex items-center gap-2 border-b border-[#D8E0DE]">
        <button
          onClick={() => setViewMode("subscriptions")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
            viewMode === "subscriptions"
              ? "border-[#287D73] text-[#287D73]"
              : "border-transparent text-[#53636D] hover:text-[#172B36]"
          }`}
        >
          <Repeat className="w-4 h-4" /> Subscription Lifecycle
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#E7F2EF] text-[#20665E] font-bold">
            {activeCount} Active
          </span>
        </button>
        <button
          onClick={() => setViewMode("quotations")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
            viewMode === "quotations"
              ? "border-[#287D73] text-[#287D73]"
              : "border-transparent text-[#53636D] hover:text-[#172B36]"
          }`}
        >
          <FileText className="w-4 h-4" /> Quotation Proposals (Screen 07)
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#F8EDE6] text-[#96600C] font-bold">
            {quotationsList.length} Pending
          </span>
        </button>
      </div>

      {/* =========================================================================
          MODE 1: QUOTATIONS SPLIT-SCREEN SALES DOCUMENT WORKFLOW (Screen 07)
          ========================================================================= */}
      {viewMode === "quotations" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Quotation Document List */}
          <div className="lg:col-span-5 bg-white rounded-xl border border-[#D8E0DE] p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-[#D8E0DE]">
              <h3 className="text-sm font-bold text-[#172B36]">Proposals & Quotes</h3>
              <span className="text-xs text-[#53636D]">{quotationsList.length} total</span>
            </div>

            {quotationsList.length === 0 ? (
              <p className="text-xs text-[#82929E] italic p-4 text-center">
                No active quotation proposals. Click &quot;Create Quotation&quot; to draft one.
              </p>
            ) : (
              <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
                {quotationsList.map((quote) => {
                  const isSelected = selectedQuote?.id === quote.id;
                  return (
                    <div
                      key={quote.id}
                      onClick={() => setSelectedQuoteId(quote.id)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? "bg-[#E7F2EF] border-[#287D73] shadow-xs ring-1 ring-[#287D73]/30"
                          : "bg-white border-[#D8E0DE] hover:border-[#287D73]/50"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono font-bold text-xs text-[#172B36]">
                          {quote.subscription_number}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#F8EDE6] text-[#B86F4B]">
                          {quote.status}
                        </span>
                      </div>
                      <div className="font-semibold text-xs text-[#172B36]">{quote.customer_name}</div>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#D8E0DE]/70 text-xs">
                        <span className="text-[#53636D]">
                          Valid until: <strong className="text-[#172B36]">{quote.valid_until || "15 Nov 2026"}</strong>
                        </span>
                        <span className="font-extrabold text-[#172B36] tabular-nums">
                          {formatINR(quote.recurring_amount_minor)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Selected Quotation Document View */}
          <div className="lg:col-span-7 bg-white rounded-xl border border-[#D8E0DE] p-6 shadow-xs flex flex-col justify-between">
            {selectedQuote ? (
              <div className="space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between pb-4 border-b border-[#D8E0DE]">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#287D73] block mb-1">
                      Commercial Quotation Proposal
                    </span>
                    <h2 className="text-xl font-extrabold text-[#172B36]">
                      {selectedQuote.subscription_number}
                    </h2>
                    <p className="text-xs text-[#53636D] mt-0.5">
                      Prepared for <strong className="text-[#172B36]">{selectedQuote.customer_name}</strong> ({selectedQuote.customer_email})
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-2.5 py-1 rounded bg-[#E7F2EF] text-[#20665E] font-bold text-xs">
                      Valid Until: {selectedQuote.valid_until || "15 Nov 2026"}
                    </span>
                    <div className="text-[11px] text-[#82929E] mt-1">Net 15 Terms</div>
                  </div>
                </div>

                {/* Line Items Table */}
                <div>
                  <h4 className="text-xs font-bold uppercase text-[#82929E] tracking-wider mb-2">
                    Contract Line Items
                  </h4>
                  <table className="w-full text-left text-xs border border-[#D8E0DE] rounded-lg overflow-hidden">
                    <thead className="bg-[#F4F6F5] text-[#82929E] uppercase text-[10px] font-bold">
                      <tr>
                        <th className="p-2.5">Product / Variant</th>
                        <th className="p-2.5 text-center">Qty</th>
                        <th className="p-2.5 text-right">Unit Price</th>
                        <th className="p-2.5 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#D8E0DE] text-[#202C33]">
                      {selectedQuote.items?.map((it, i) => (
                        <tr key={i}>
                          <td className="p-2.5 font-medium">
                            {it.product_name}
                            {it.variant_name && (
                              <span className="text-[11px] text-[#287D73] block font-semibold">
                                + {it.variant_name}
                              </span>
                            )}
                          </td>
                          <td className="p-2.5 text-center tabular-nums">{it.quantity}</td>
                          <td className="p-2.5 text-right tabular-nums">{formatINR(it.unit_price_minor)}</td>
                          <td className="p-2.5 text-right font-bold tabular-nums">{formatINR(it.amount_minor)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pricing Breakdown Summary */}
                <div className="p-4 rounded-xl bg-[#F4F6F5] border border-[#D8E0DE] space-y-2 text-xs">
                  <div className="flex justify-between text-[#53636D]">
                    <span>Contract Cadence:</span>
                    <span className="font-semibold text-[#172B36] capitalize">{selectedQuote.frequency}</span>
                  </div>
                  <div className="flex justify-between text-[#53636D]">
                    <span>GST (18% itemized):</span>
                    <span className="font-semibold text-[#172B36] tabular-nums">
                      {formatINR(Math.round(selectedQuote.recurring_amount_minor * 0.18 / 1.18))}
                    </span>
                  </div>
                  <div className="flex justify-between font-extrabold text-sm text-[#172B36] pt-2 border-t border-[#D8E0DE]">
                    <span>Total Recurring Commitment:</span>
                    <span className="text-[#287D73] tabular-nums">
                      {formatINR(selectedQuote.recurring_amount_minor)}
                    </span>
                  </div>
                </div>

                {/* Working Actions */}
                <div className="pt-4 border-t border-[#D8E0DE] flex flex-wrap items-center justify-between gap-3">
                  <button
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#D8E0DE] text-xs font-semibold text-[#202C33] hover:bg-[#F4F6F5]"
                  >
                    <Printer className="w-3.5 h-3.5" /> Print / Download
                  </button>

                  <button
                    onClick={() => handleConfirmQuotation(selectedQuote)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#287D73] hover:bg-[#20665E] text-white text-xs font-bold shadow-xs transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm Quotation & Convert to Subscription</span>
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-[#82929E] italic text-center my-auto">
                Select a quotation proposal to inspect document details.
              </p>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          MODE 2: SUBSCRIPTION LIFECYCLE DIRECTORY (Screen 08)
          ========================================================================= */}
      {viewMode === "subscriptions" && (
        <div className="space-y-6">
          {/* Summary KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-[#D8E0DE] shadow-xs">
              <span className="text-[11px] font-bold text-[#82929E] uppercase tracking-wider block">
                Active Contracts
              </span>
              <span className="text-2xl font-extrabold text-[#20665E] mt-1 tabular-nums block">
                {activeCount}
              </span>
              <span className="text-[10px] text-[#24734D]">Generating recurring revenue</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-[#D8E0DE] shadow-xs">
              <span className="text-[11px] font-bold text-[#82929E] uppercase tracking-wider block">
                Quotations
              </span>
              <span className="text-2xl font-extrabold text-[#B86F4B] mt-1 tabular-nums block">
                {quotationCount}
              </span>
              <span className="text-[10px] text-[#96600C]">Pending conversion</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-[#D8E0DE] shadow-xs">
              <span className="text-[11px] font-bold text-[#82929E] uppercase tracking-wider block">
                Drafts
              </span>
              <span className="text-2xl font-extrabold text-[#82929E] mt-1 tabular-nums block">
                {draftCount}
              </span>
              <span className="text-[10px] text-[#53636D]">Under composition</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-[#D8E0DE] shadow-xs">
              <span className="text-[11px] font-bold text-[#82929E] uppercase tracking-wider block">
                Paused / Suspended
              </span>
              <span className="text-2xl font-extrabold text-[#96600C] mt-1 tabular-nums block">
                {pausedCount}
              </span>
              <span className="text-[10px] text-[#96600C]">Billing frozen</span>
            </div>
          </div>

          {/* Lifecycle Filter Tabs Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {[
                { label: "All Contracts", value: "all", count: subscriptions.length },
                { label: "Active", value: "active", count: activeCount },
                { label: "Quotation", value: "quotation", count: quotationCount },
                { label: "Draft", value: "draft", count: draftCount },
                { label: "Paused", value: "paused", count: pausedCount },
              ].map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setStatusFilter(tab.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                    statusFilter === tab.value
                      ? "bg-[#172B36] text-white"
                      : "bg-white text-[#53636D] hover:bg-[#F4F6F5] border border-[#D8E0DE]"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-[#82929E] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search contracts, plans, clients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3.5 py-1.5 text-xs bg-white border border-[#D8E0DE] rounded-lg focus:outline-hidden text-[#202C33]"
              />
            </div>
          </div>

          {/* Subscriptions Directory Table */}
          <div className="bg-white rounded-xl border border-[#D8E0DE] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F4F6F5] text-[#82929E] uppercase tracking-wider text-[11px] border-b border-[#D8E0DE]">
                  <tr>
                    <th className="px-5 py-3.5 font-semibold">Contract Number</th>
                    <th className="px-5 py-3.5 font-semibold">Subscriber</th>
                    <th className="px-5 py-3.5 font-semibold">Plan</th>
                    <th className="px-5 py-3.5 font-semibold">Cadence</th>
                    <th className="px-5 py-3.5 font-semibold text-right">Recurring Amount</th>
                    <th className="px-5 py-3.5 font-semibold">Next Renewal</th>
                    <th className="px-5 py-3.5 font-semibold text-center">Lifecycle Status</th>
                    <th className="px-5 py-3.5 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D8E0DE] text-[#202C33]">
                  {filteredSubscriptions.map((sub) => (
                    <tr
                      key={sub.id}
                      onClick={() => router.push(`/subscriptions/${sub.id}`)}
                      className="hover:bg-[#F4F6F5] cursor-pointer transition-colors"
                    >
                      <td className="px-5 py-3.5 font-mono font-bold text-[#172B36]">
                        {sub.subscription_number}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-[#172B36]">{sub.customer_name}</div>
                        <div className="text-[10px] text-[#82929E]">{sub.customer_email}</div>
                      </td>
                      <td className="px-5 py-3.5 font-medium">{sub.plan_name}</td>
                      <td className="px-5 py-3.5 capitalize text-[#53636D]">{sub.frequency}</td>
                      <td className="px-5 py-3.5 text-right font-extrabold text-[#172B36] tabular-nums">
                        {formatINR(sub.recurring_amount_minor)}
                      </td>
                      <td className="px-5 py-3.5 tabular-nums text-[#53636D]">
                        {sub.next_billing_date}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            sub.status === "active"
                              ? "bg-[#E7F2EF] text-[#20665E]"
                              : sub.status === "quotation"
                              ? "bg-[#F8EDE6] text-[#B86F4B]"
                              : sub.status === "paused"
                              ? "bg-[#FDF6EC] text-[#96600C]"
                              : "bg-[#F4F6F5] text-[#82929E]"
                          }`}
                        >
                          {sub.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <span className="inline-flex items-center text-xs font-bold text-[#287D73] hover:underline">
                          Inspect <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 5-Step Create Subscription / Quotation Drawer */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title={modalMode === "quotation" ? "Create Commercial Quotation" : "New Subscription Contract"}
        description={`Step ${step} of 5: ${
          step === 1
            ? "Select Customer"
            : step === 2
            ? "Choose Billing Plan"
            : step === 3
            ? "Add Catalog Products"
            : step === 4
            ? "Contract Schedule & Terms"
            : "Review & Issue"
        }`}
        variant="drawer"
      >
        <div className="space-y-6">
          {/* Progress Indicators */}
          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <div
                key={s}
                className={`flex-1 h-1.5 rounded-full ${
                  s <= step ? "bg-[#287D73]" : "bg-[#D8E0DE]"
                }`}
              />
            ))}
          </div>

          {/* Step 1: Customer */}
          {step === 1 && (
            <div className="space-y-4">
              <label className="block text-xs font-bold text-[#202C33] uppercase tracking-wider">
                Select Business Subscriber
              </label>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {customers.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => setSelectedCustomerId(c.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      selectedCustomerId === c.id
                        ? "bg-[#E7F2EF] border-[#287D73] ring-1 ring-[#287D73]/30"
                        : "bg-white border-[#D8E0DE] hover:bg-[#F4F6F5]"
                    }`}
                  >
                    <div className="font-bold text-xs text-[#172B36]">{c.company_name}</div>
                    <div className="text-[11px] text-[#53636D]">{c.email} • {c.contact_name}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Plan */}
          {step === 2 && (
            <div className="space-y-4">
              <label className="block text-xs font-bold text-[#202C33] uppercase tracking-wider">
                Select Subscription Plan
              </label>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {plans.map((pln) => (
                  <div
                    key={pln.id}
                    onClick={() => setSelectedPlanId(pln.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      selectedPlanId === pln.id
                        ? "bg-[#E7F2EF] border-[#287D73] ring-1 ring-[#287D73]/30"
                        : "bg-white border-[#D8E0DE] hover:bg-[#F4F6F5]"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-xs text-[#172B36]">{pln.name}</span>
                      <span className="text-[10px] font-bold text-[#20665E] uppercase">{pln.frequency}</span>
                    </div>
                    <div className="text-[11px] text-[#53636D] mt-1">{pln.description}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Product & Variant */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#202C33] uppercase tracking-wider mb-1">
                  Product
                </label>
                <select
                  value={selectedProductId}
                  onChange={(e) => {
                    setSelectedProductId(e.target.value);
                    const prod = products.find((p) => p.id === e.target.value);
                    if (prod?.variants.length) setSelectedVariantId(prod.variants[0].id);
                  }}
                  className="w-full px-3 py-2 text-sm bg-white border border-[#D8E0DE] rounded-lg text-[#202C33]"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({formatINR(p.sales_price_minor)})
                    </option>
                  ))}
                </select>
              </div>

              {chosenProduct?.variants && chosenProduct.variants.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-[#202C33] uppercase tracking-wider mb-1">
                    Variant / Integration
                  </label>
                  <select
                    value={selectedVariantId}
                    onChange={(e) => setSelectedVariantId(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-[#D8E0DE] rounded-lg text-[#202C33]"
                  >
                    {chosenProduct.variants.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} (+{formatINR(v.price_adjustment_minor)})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[#202C33] uppercase tracking-wider mb-1">
                  Quantity (Units / Seats)
                </label>
                <input
                  type="number"
                  min="1"
                  value={itemQuantity}
                  onChange={(e) => setItemQuantity(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-white border border-[#D8E0DE] rounded-lg text-[#202C33]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#202C33] uppercase tracking-wider mb-1">
                  Applicable Tax Rule
                </label>
                <select
                  value={selectedTaxId}
                  onChange={(e) => setSelectedTaxId(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-[#D8E0DE] rounded-lg text-[#202C33]"
                >
                  {taxRules.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.rate_percentage}%)
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Step 4: Terms & Schedule */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#202C33] uppercase tracking-wider mb-1">
                    Contract Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-[#D8E0DE] rounded-lg text-[#202C33]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#202C33] uppercase tracking-wider mb-1">
                    Contract Expiry Date
                  </label>
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-[#D8E0DE] rounded-lg text-[#202C33]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#202C33] uppercase tracking-wider mb-1">
                  Payment Terms
                </label>
                <select
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-[#D8E0DE] rounded-lg text-[#202C33]"
                >
                  <option value="Immediate">Due Upon Receipt</option>
                  <option value="Net 15">Net 15 Days</option>
                  <option value="Net 30">Net 30 Days</option>
                </select>
              </div>

              {modalMode === "quotation" && (
                <div>
                  <label className="block text-xs font-bold text-[#202C33] uppercase tracking-wider mb-1">
                    Quotation Validity Window (Days)
                  </label>
                  <input
                    type="number"
                    value={quotationValidityDays}
                    onChange={(e) => setQuotationValidityDays(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-white border border-[#D8E0DE] rounded-lg text-[#202C33]"
                  />
                </div>
              )}
            </div>
          )}

          {/* Step 5: Final Review */}
          {step === 5 && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#F4F6F5] border border-[#D8E0DE] space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#53636D]">Subscriber:</span>
                  <span className="font-bold text-[#172B36]">{chosenCustomer?.company_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#53636D]">Selected Plan:</span>
                  <span className="font-semibold text-[#172B36]">{chosenPlan?.name} ({chosenPlan?.frequency})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#53636D]">Product & Variant:</span>
                  <span className="font-semibold text-[#172B36]">
                    {chosenProduct?.name} {chosenVariant?.name ? `+ ${chosenVariant.name}` : ""}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#53636D]">Quantity:</span>
                  <span className="font-semibold text-[#172B36]">{qty} units</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-[#D8E0DE] text-sm font-extrabold text-[#172B36]">
                  <span>Total Recurring:</span>
                  <span className="text-[#20665E] tabular-nums">{formatINR(estimatedTotalMinor)}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleSave("draft")}
                  className="flex-1 py-2.5 rounded-lg border border-[#D8E0DE] text-xs font-semibold text-[#53636D] hover:bg-[#F4F6F5]"
                >
                  Save as Draft
                </button>
                <button
                  type="button"
                  onClick={() => handleSave(modalMode === "quotation" ? "quotation" : "active")}
                  className="flex-1 py-2.5 rounded-lg bg-[#287D73] hover:bg-[#20665E] text-white text-xs font-bold shadow-xs transition-colors"
                >
                  {modalMode === "quotation" ? "Issue Quotation Proposal" : "Confirm & Activate"}
                </button>
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          {step < 5 && (
            <div className="flex justify-between pt-4 border-t border-[#D8E0DE]">
              <button
                type="button"
                disabled={step === 1}
                onClick={() => setStep(step - 1)}
                className="px-4 py-2 text-xs font-semibold text-[#53636D] disabled:opacity-40"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#287D73] hover:bg-[#20665E] rounded-lg shadow-xs"
              >
                Continue
              </button>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
