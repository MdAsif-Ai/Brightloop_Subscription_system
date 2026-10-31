"use client";

import React, { useState, useEffect } from "react";
import {
  Boxes,
  Plus,
  Search,
  Percent,
  Receipt,
  Layers,
  Check,
  Calendar,
  AlertCircle,
  Tag,
  ShieldAlert,
  Edit2,
  Trash2,
  Package,
  Cpu,
  Database,
  Cloud,
  CheckCircle2,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { Modal } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty-state";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Product, SubscriptionPlan, TaxRule, DiscountRule, BillingFrequency } from "@/types";
import { formatINR, formatDate } from "@/lib/utils";
import { toast } from "sonner";

export default function CatalogPage() {
  const { role } = useAuth();
  const [activeTab, setActiveTab] = useState<"products" | "plans" | "pricing">("products");

  // Data states
  const [products, setProducts] = useState<Product[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [taxRules, setTaxRules] = useState<TaxRule[]>([]);
  const [discounts, setDiscounts] = useState<DiscountRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal states
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isTaxModalOpen, setIsTaxModalOpen] = useState(false);
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);

  // New Product Form State
  const [newProductName, setNewProductName] = useState("");
  const [newProductType, setNewProductType] = useState<Product["type"]>("software");
  const [newProductSalesPrice, setNewProductSalesPrice] = useState("2000"); // in rupees
  const [newProductCostPrice, setNewProductCostPrice] = useState("800");
  const [newProductDescription, setNewProductDescription] = useState("");
  const [variantsList, setVariantsList] = useState<Array<{ name: string; price_adjustment: string }>>([
    { name: "Odoo Integration Engine", price_adjustment: "560" },
  ]);

  // New Plan Form State
  const [newPlanName, setNewPlanName] = useState("");
  const [newPlanDescription, setNewPlanDescription] = useState("");
  const [newPlanFreq, setNewPlanFreq] = useState<BillingFrequency>("monthly");
  const [newPlanMinQty, setNewPlanMinQty] = useState("5");
  const [newPlanPrice, setNewPlanPrice] = useState("2000");
  const [newPlanAllowPause, setNewPlanAllowPause] = useState(true);
  const [newPlanAllowRenewal, setNewPlanAllowRenewal] = useState(true);
  const [newPlanAllowEarlyClosure, setNewPlanAllowEarlyClosure] = useState(true);
  const [newPlanAutoClose, setNewPlanAutoClose] = useState(false);

  // New Tax Form State
  const [newTaxName, setNewTaxName] = useState("");
  const [newTaxRate, setNewTaxRate] = useState("18");

  // New Discount Form State
  const [newDiscountName, setNewDiscountName] = useState("");
  const [newDiscountType, setNewDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [newDiscountValue, setNewDiscountValue] = useState("10");
  const [newDiscountMinQty, setNewDiscountMinQty] = useState("5");

  const loadAll = async () => {
    try {
      setLoading(true);
      const [prods, plns, txs, discs] = await Promise.all([
        api.products.list(),
        api.plans.list(),
        api.taxRules.list(),
        api.discounts.list(),
      ]);
      setProducts(prods);
      setPlans(plns);
      setTaxRules(txs);
      setDiscounts(discs);
    } catch {
      toast.error("Failed to load catalog records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  // Handle Create Product
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const salesPriceMinor = Math.round(parseFloat(newProductSalesPrice || "0") * 100);
      const costPriceMinor = Math.round(parseFloat(newProductCostPrice || "0") * 100);

      const variants = variantsList
        .filter((v) => v.name.trim())
        .map((v) => ({
          id: `var-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          name: v.name.trim(),
          price_adjustment_minor: Math.round(parseFloat(v.price_adjustment || "0") * 100),
        }));

      const created = await api.products.create({
        name: newProductName,
        type: newProductType,
        sales_price_minor: salesPriceMinor,
        cost_price_minor: costPriceMinor,
        description: newProductDescription,
        variants,
      });

      setProducts([created, ...products]);
      setIsProductModalOpen(false);
      toast.success(`Product "${created.name}" created successfully.`);

      setNewProductName("");
      setNewProductDescription("");
    } catch (err: unknown) {
      toast.error("Failed to create product.");
    }
  };

  // Handle Create Plan
  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const priceMinor = Math.round(parseFloat(newPlanPrice || "0") * 100);
      const created = await api.plans.create({
        name: newPlanName,
        description: newPlanDescription,
        frequency: newPlanFreq,
        min_quantity: parseInt(newPlanMinQty, 10) || 1,
        price_minor: priceMinor,
        allow_pause: newPlanAllowPause,
        allow_renewal: newPlanAllowRenewal,
        allow_early_closure: newPlanAllowEarlyClosure,
        auto_close_on_expiry: newPlanAutoClose,
      });

      setPlans([created, ...plans]);
      setIsPlanModalOpen(false);
      toast.success(`Subscription Plan "${created.name}" created successfully.`);

      setNewPlanName("");
      setNewPlanDescription("");
    } catch {
      toast.error("Failed to create plan.");
    }
  };

  // Handle Create Tax Rule
  const handleCreateTax = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const rate = parseFloat(newTaxRate);
      const created = await api.taxRules.create({
        name: newTaxName,
        rate_percentage: isNaN(rate) ? 18 : rate,
        is_active: true,
      });
      setTaxRules([created, ...taxRules]);
      setIsTaxModalOpen(false);
      toast.success(`Tax Rule "${created.name}" created.`);
      setNewTaxName("");
    } catch {
      toast.error("Failed to create tax rule.");
    }
  };

  // Handle Create Discount Rule
  const handleCreateDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (role === "staff") {
      toast.error("Staff members do not have permission to modify pricing rules.");
      return;
    }
    try {
      const val = parseFloat(newDiscountValue);
      const created = await api.discounts.create({
        name: newDiscountName,
        type: newDiscountType,
        value: isNaN(val) ? 10 : val,
        min_quantity: parseInt(newDiscountMinQty, 10) || 1,
        scope: "whole_subscription",
        is_active: true,
      });
      setDiscounts([created, ...discounts]);
      setIsDiscountModalOpen(false);
      toast.success(`Discount rule "${created.name}" created.`);
      setNewDiscountName("");
    } catch {
      toast.error("Failed to create discount rule.");
    }
  };

  const getProductIcon = (type: string) => {
    switch (type) {
      case "software":
        return <Package className="w-5 h-5 text-[#287D73]" />;
      case "service":
        return <Cloud className="w-5 h-5 text-[#315F82]" />;
      default:
        return <Database className="w-5 h-5 text-[#B86F4B]" />;
    }
  };

  // Filtered products
  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 select-none font-sans text-[#202C33]">
      <PageHeader
        title="Product Studio"
        subtitle="Configure catalog products, variant price adjustments, recurring plans, and enterprise tax/discount rules."
      >
        {activeTab === "products" && (
          <button
            onClick={() => setIsProductModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#287D73] hover:bg-[#20665E] rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Create Product
          </button>
        )}
        {activeTab === "plans" && (
          <button
            onClick={() => setIsPlanModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#287D73] hover:bg-[#20665E] rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Create Plan
          </button>
        )}
        {activeTab === "pricing" && (
          <div className="flex gap-2">
            <button
              onClick={() => setIsTaxModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#202C33] bg-white border border-[#D8E0DE] hover:bg-[#F4F6F5] rounded-lg shadow-2xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add Tax Rule
            </button>
            <button
              onClick={() => {
                if (role === "staff") {
                  toast.error("Staff members have read-only access to discount rules.");
                  return;
                }
                setIsDiscountModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#287D73] hover:bg-[#20665E] rounded-lg shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Create Discount Rule
            </button>
          </div>
        )}
      </PageHeader>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#D8E0DE]">
        <button
          onClick={() => setActiveTab("products")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
            activeTab === "products"
              ? "border-[#287D73] text-[#287D73]"
              : "border-transparent text-[#53636D] hover:text-[#172B36]"
          }`}
        >
          <Boxes className="w-4 h-4" /> Products & Variants
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#E7F2EF] text-[#20665E] font-bold">
            {products.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("plans")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
            activeTab === "plans"
              ? "border-[#287D73] text-[#287D73]"
              : "border-transparent text-[#53636D] hover:text-[#172B36]"
          }`}
        >
          <Layers className="w-4 h-4" /> Subscription Plans
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#E7F2EF] text-[#20665E] font-bold">
            {plans.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("pricing")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
            activeTab === "pricing"
              ? "border-[#287D73] text-[#287D73]"
              : "border-transparent text-[#53636D] hover:text-[#172B36]"
          }`}
        >
          <Percent className="w-4 h-4" /> Tax & Discount Rules
        </button>
      </div>

      {/* Tab 1: Product-Card Gallery (Reference Screen 04) */}
      {activeTab === "products" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative w-full max-w-sm">
              <Search className="w-4 h-4 text-[#82929E] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search products or categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 text-xs bg-white border border-[#D8E0DE] rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#287D73]/20 focus:border-[#287D73] text-[#202C33]"
              />
            </div>
            <span className="text-xs text-[#53636D]">
              Showing {filteredProducts.length} catalog items
            </span>
          </div>

          {filteredProducts.length === 0 ? (
            <EmptyState
              title="No products found"
              description="Create your first subscription software product or clear search filter."
              action={
                <button
                  onClick={() => setIsProductModalOpen(true)}
                  className="px-4 py-2 text-xs font-bold text-white bg-[#287D73] hover:bg-[#20665E] rounded-lg transition-colors"
                >
                  Create Product
                </button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredProducts.map((p) => (
                <div
                  key={p.id}
                  className="bg-white rounded-2xl border border-[#D8E0DE]/70 p-6 shadow-xs flex flex-col justify-between hover:border-[#287D73]/40 transition-all group"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-[#E7F2EF] flex items-center justify-center shrink-0">
                        {getProductIcon(p.type)}
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#E7F2EF] text-[#20665E]">
                        {p.status}
                      </span>
                    </div>

                    <h3 className="font-bold text-[#172B36] text-base group-hover:text-[#287D73] transition-colors">
                      {p.name}
                    </h3>
                    <p className="text-xs text-[#53636D] mt-1 line-clamp-2 leading-relaxed">
                      {p.description || "Core enterprise software subscription product module."}
                    </p>

                    <div className="mt-4 p-3.5 rounded-xl bg-[#F4F6F5] border border-[#D8E0DE]/60 space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-[#53636D]">Base Unit Price:</span>
                        <span className="font-bold text-[#172B36] tabular-nums">
                          {formatINR(p.sales_price_minor)}
                        </span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-[#82929E]">Cost of Goods:</span>
                        <span className="text-[#53636D] tabular-nums">
                          {formatINR(p.cost_price_minor)}
                        </span>
                      </div>
                    </div>

                    {/* Configured Variants */}
                    <div className="mt-3">
                      <div className="text-[11px] font-bold text-[#82929E] uppercase mb-1.5">
                        Add-on Variants ({p.variants?.length || 0})
                      </div>
                      {p.variants && p.variants.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {p.variants.map((v) => (
                            <span
                              key={v.id}
                              className="px-2 py-0.5 bg-[#FFFFFF] text-[#202C33] rounded-md text-[10px] font-semibold border border-[#D8E0DE]"
                            >
                              {v.name}{" "}
                              <span className="text-[#287D73] font-bold">
                                (+{formatINR(v.price_adjustment_minor)})
                              </span>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[#82929E] italic text-xs">Standard variant only</span>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-[#D8E0DE] flex items-center justify-between text-xs">
                    <span className="text-[11px] text-[#82929E] capitalize font-medium">Type: {p.type}</span>
                    <button
                      onClick={() => toast.info(`Product ${p.name} is synchronized with catalog engine.`)}
                      className="text-[#287D73] font-bold hover:underline"
                    >
                      Configure →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Subscription Plans Comparison (Reference Screen 05) */}
      {activeTab === "plans" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {plans.map((pln) => (
            <div
              key={pln.id}
              className="bg-white rounded-2xl border border-[#D8E0DE]/70 p-6 shadow-xs flex flex-col justify-between hover:border-[#287D73]/40 transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#20665E] bg-[#E7F2EF] px-2.5 py-0.5 rounded-full">
                    {pln.frequency} Cadence
                  </span>
                  <span className="text-[10px] text-[#82929E] font-mono">Plan</span>
                </div>

                <h3 className="font-bold text-[#172B36] text-lg mt-1">{pln.name}</h3>
                <p className="text-xs text-[#53636D] mt-1 mb-4 leading-relaxed">
                  {pln.description || "Recurring automated subscription billing plan schedule."}
                </p>

                <div className="mb-4">
                  <span className="text-2xl font-extrabold text-[#172B36] tabular-nums">
                    {formatINR(pln.price_minor || 0)}
                  </span>
                  <span className="text-xs text-[#53636D] ml-1">/ {pln.frequency}</span>
                </div>

                <div className="bg-[#F4F6F5] rounded-xl p-3.5 space-y-1.5 text-xs border border-[#D8E0DE]/60 mb-4">
                  <div className="flex justify-between">
                    <span className="text-[#53636D]">Minimum Order:</span>
                    <span className="font-semibold text-[#172B36]">{pln.min_quantity} units</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#53636D]">Lifecycle Policy:</span>
                    <span className="font-semibold text-[#287D73]">Auto-renewing</span>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-[#53636D]">
                  <div className="flex items-center gap-2">
                    <CheckCircle2
                      className={`w-3.5 h-3.5 ${pln.allow_pause ? "text-[#24734D]" : "text-[#82929E]"}`}
                    />
                    <span>Customer pause allowed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2
                      className={`w-3.5 h-3.5 ${pln.allow_renewal ? "text-[#24734D]" : "text-[#82929E]"}`}
                    />
                    <span>Auto-renewal supported</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2
                      className={`w-3.5 h-3.5 ${pln.allow_early_closure ? "text-[#24734D]" : "text-[#82929E]"}`}
                    />
                    <span>Early contract closure</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-[#D8E0DE] flex items-center justify-between text-xs">
                <span className="text-[#82929E]">Status: Active</span>
                <span className="text-[#287D73] font-bold">Configured</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: Tax & Discount Rules */}
      {activeTab === "pricing" && (
        <div className="space-y-8">
          {/* Tax Rules Section */}
          <div className="bg-white rounded-xl border border-[#D8E0DE] shadow-xs overflow-hidden">
            <div className="p-5 border-b border-[#D8E0DE] bg-[#F4F6F5] flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-[#172B36]">Tax Rules</h3>
                <p className="text-xs text-[#53636D]">Configured automated tax schedules applied on invoice generation</p>
              </div>
              <button
                onClick={() => setIsTaxModalOpen(true)}
                className="text-xs font-semibold text-[#287D73] hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Rule
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F4F6F5] text-[#82929E] uppercase tracking-wider text-[11px] border-b border-[#D8E0DE]">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Tax Name</th>
                    <th className="px-5 py-3 font-semibold">Tax Rate</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 font-semibold text-right">Scope</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D8E0DE] text-[#202C33]">
                  {taxRules.map((tx) => (
                    <tr key={tx.id} className="hover:bg-[#F4F6F5] transition-colors">
                      <td className="px-5 py-3 font-bold text-[#172B36]">{tx.name}</td>
                      <td className="px-5 py-3 font-semibold text-[#287D73] tabular-nums">
                        {tx.rate_percentage}%
                      </td>
                      <td className="px-5 py-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E7F2EF] text-[#20665E]">
                          Active
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right text-[#53636D]">Line-item applicable</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Discount Rules Section */}
          <div className="bg-white rounded-xl border border-[#D8E0DE] shadow-xs overflow-hidden">
            <div className="p-5 border-b border-[#D8E0DE] bg-[#F4F6F5] flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-[#172B36]">Discount Rules (Admin Managed)</h3>
                <p className="text-xs text-[#53636D]">Volume discounts and whole-contract deductions</p>
              </div>
              {role === "admin" && (
                <button
                  onClick={() => setIsDiscountModalOpen(true)}
                  className="text-xs font-semibold text-[#287D73] hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Rule
                </button>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F4F6F5] text-[#82929E] uppercase tracking-wider text-[11px] border-b border-[#D8E0DE]">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Rule Name</th>
                    <th className="px-5 py-3 font-semibold">Type</th>
                    <th className="px-5 py-3 font-semibold">Benefit Value</th>
                    <th className="px-5 py-3 font-semibold">Min Quantity</th>
                    <th className="px-5 py-3 font-semibold text-right">Scope</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D8E0DE] text-[#202C33]">
                  {discounts.map((disc) => (
                    <tr key={disc.id} className="hover:bg-[#F4F6F5] transition-colors">
                      <td className="px-5 py-3 font-bold text-[#172B36]">{disc.name}</td>
                      <td className="px-5 py-3 capitalize text-[#53636D]">{disc.type}</td>
                      <td className="px-5 py-3 font-semibold text-[#B86F4B] tabular-nums">
                        {disc.type === "percentage" ? `${disc.value}%` : formatINR(disc.value * 100)}
                      </td>
                      <td className="px-5 py-3 text-[#53636D]">{disc.min_quantity} units</td>
                      <td className="px-5 py-3 text-right capitalize text-[#53636D]">
                        {disc.scope.replace("_", " ")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Create Product Modal with Live Price Preview */}
      <Modal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        title="Create Catalog Product"
      >
        <form onSubmit={handleCreateProduct} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#202C33] uppercase tracking-wider mb-1">
              Product Name
            </label>
            <input
              type="text"
              required
              value={newProductName}
              onChange={(e) => setNewProductName(e.target.value)}
              placeholder="e.g. Enterprise ERP Platform"
              className="w-full px-3.5 py-2 text-sm bg-white border border-[#D8E0DE] rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#287D73]/20 focus:border-[#287D73] text-[#202C33]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#202C33] uppercase tracking-wider mb-1">
                Category
              </label>
              <select
                value={newProductType}
                onChange={(e) => setNewProductType(e.target.value as any)}
                className="w-full px-3 py-2 text-sm bg-white border border-[#D8E0DE] rounded-lg focus:outline-hidden text-[#202C33]"
              >
                <option value="software">Software (Recurring)</option>
                <option value="service">Cloud Service</option>
                <option value="addon">Add-on Module</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#202C33] uppercase tracking-wider mb-1">
                Sales Price (₹)
              </label>
              <input
                type="number"
                required
                value={newProductSalesPrice}
                onChange={(e) => setNewProductSalesPrice(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-white border border-[#D8E0DE] rounded-lg focus:outline-hidden text-[#202C33]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#202C33] uppercase tracking-wider mb-1">
              Description / Notes
            </label>
            <textarea
              rows={2}
              value={newProductDescription}
              onChange={(e) => setNewProductDescription(e.target.value)}
              placeholder="Core ERP modules including financial accounting and subscription operations..."
              className="w-full px-3.5 py-2 text-sm bg-white border border-[#D8E0DE] rounded-lg focus:outline-hidden text-[#202C33]"
            />
          </div>

          {/* Variants Configuration */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-[#202C33] uppercase tracking-wider">
                Product Variants & Surcharges
              </label>
              <button
                type="button"
                onClick={() => setVariantsList([...variantsList, { name: "", price_adjustment: "0" }])}
                className="text-xs font-semibold text-[#287D73] hover:underline"
              >
                + Add Variant
              </button>
            </div>
            <div className="space-y-2">
              {variantsList.map((variant, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Variant Name (e.g. Odoo Engine)"
                    value={variant.name}
                    onChange={(e) => {
                      const updated = [...variantsList];
                      updated[idx].name = e.target.value;
                      setVariantsList(updated);
                    }}
                    className="flex-1 px-3 py-1.5 text-xs bg-white border border-[#D8E0DE] rounded-lg text-[#202C33]"
                  />
                  <div className="w-32 relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-[#82929E]">+₹</span>
                    <input
                      type="number"
                      placeholder="560"
                      value={variant.price_adjustment}
                      onChange={(e) => {
                        const updated = [...variantsList];
                        updated[idx].price_adjustment = e.target.value;
                        setVariantsList(updated);
                      }}
                      className="w-full pl-8 pr-2 py-1.5 text-xs bg-white border border-[#D8E0DE] rounded-lg text-[#202C33]"
                    />
                  </div>
                  {variantsList.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setVariantsList(variantsList.filter((_, i) => i !== idx))}
                      className="px-2 text-red-500 hover:text-red-700 text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Live Price Preview Box */}
          <div className="p-3.5 rounded-lg bg-[#E7F2EF] border border-[#287D73]/30 text-xs space-y-1">
            <div className="flex justify-between text-[#53636D]">
              <span>Base Unit Price:</span>
              <span className="font-semibold text-[#172B36]">₹{newProductSalesPrice || 0}</span>
            </div>
            {variantsList[0]?.name && (
              <div className="flex justify-between text-[#53636D]">
                <span>Variant ({variantsList[0].name}):</span>
                <span className="font-semibold text-[#287D73]">+₹{variantsList[0].price_adjustment || 0}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-[#172B36] pt-1 border-t border-[#287D73]/20">
              <span>Final Effective Unit Price:</span>
              <span className="text-[#20665E]">
                ₹{(parseFloat(newProductSalesPrice || "0") + parseFloat(variantsList[0]?.price_adjustment || "0")).toLocaleString()}
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsProductModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-[#53636D] hover:bg-[#F4F6F5] rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-[#287D73] hover:bg-[#20665E] rounded-lg shadow-xs"
            >
              Save Product
            </button>
          </div>
        </form>
      </Modal>

      {/* Create Plan Modal */}
      <Modal
        isOpen={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen(false)}
        title="Create Subscription Plan"
      >
        <form onSubmit={handleCreatePlan} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#202C33] uppercase tracking-wider mb-1">
              Plan Name
            </label>
            <input
              type="text"
              required
              value={newPlanName}
              onChange={(e) => setNewPlanName(e.target.value)}
              placeholder="e.g. Business Pro"
              className="w-full px-3.5 py-2 text-sm bg-white border border-[#D8E0DE] rounded-lg text-[#202C33]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#202C33] uppercase tracking-wider mb-1">
                Cadence Frequency
              </label>
              <select
                value={newPlanFreq}
                onChange={(e) => setNewPlanFreq(e.target.value as any)}
                className="w-full px-3 py-2 text-sm bg-white border border-[#D8E0DE] rounded-lg text-[#202C33]"
              >
                <option value="daily">Daily Pass</option>
                <option value="weekly">Weekly Sprint</option>
                <option value="monthly">Monthly Subscription</option>
                <option value="yearly">Annual Enterprise</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#202C33] uppercase tracking-wider mb-1">
                Base Plan Price (₹)
              </label>
              <input
                type="number"
                required
                value={newPlanPrice}
                onChange={(e) => setNewPlanPrice(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-white border border-[#D8E0DE] rounded-lg text-[#202C33]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#202C33] uppercase tracking-wider mb-1">
              Minimum Subscriber Quantity
            </label>
            <input
              type="number"
              value={newPlanMinQty}
              onChange={(e) => setNewPlanMinQty(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-white border border-[#D8E0DE] rounded-lg text-[#202C33]"
            />
          </div>

          <div className="space-y-2 pt-2 border-t border-[#D8E0DE] text-xs">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={newPlanAllowPause}
                onChange={(e) => setNewPlanAllowPause(e.target.checked)}
                className="w-4 h-4 text-[#287D73] rounded border-[#D8E0DE]"
              />
              <span>Allow subscriber to pause contract</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={newPlanAllowRenewal}
                onChange={(e) => setNewPlanAllowRenewal(e.target.checked)}
                className="w-4 h-4 text-[#287D73] rounded border-[#D8E0DE]"
              />
              <span>Enable automated recurring renewal</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={newPlanAllowEarlyClosure}
                onChange={(e) => setNewPlanAllowEarlyClosure(e.target.checked)}
                className="w-4 h-4 text-[#287D73] rounded border-[#D8E0DE]"
              />
              <span>Allow early contract closure</span>
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsPlanModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-[#53636D] hover:bg-[#F4F6F5] rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-[#287D73] hover:bg-[#20665E] rounded-lg shadow-xs"
            >
              Save Plan
            </button>
          </div>
        </form>
      </Modal>

      {/* Create Tax Modal */}
      <Modal
        isOpen={isTaxModalOpen}
        onClose={() => setIsTaxModalOpen(false)}
        title="Add Tax Rule"
      >
        <form onSubmit={handleCreateTax} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#202C33] uppercase tracking-wider mb-1">
              Tax Rule Name
            </label>
            <input
              type="text"
              required
              value={newTaxName}
              onChange={(e) => setNewTaxName(e.target.value)}
              placeholder="e.g. GST (18%)"
              className="w-full px-3.5 py-2 text-sm bg-white border border-[#D8E0DE] rounded-lg text-[#202C33]"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#202C33] uppercase tracking-wider mb-1">
              Rate Percentage (%)
            </label>
            <input
              type="number"
              step="0.1"
              required
              value={newTaxRate}
              onChange={(e) => setNewTaxRate(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-white border border-[#D8E0DE] rounded-lg text-[#202C33]"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsTaxModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-[#53636D]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-[#287D73] hover:bg-[#20665E] rounded-lg"
            >
              Save Tax Rule
            </button>
          </div>
        </form>
      </Modal>

      {/* Create Discount Modal */}
      <Modal
        isOpen={isDiscountModalOpen}
        onClose={() => setIsDiscountModalOpen(false)}
        title="Create Discount Rule"
      >
        <form onSubmit={handleCreateDiscount} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#202C33] uppercase tracking-wider mb-1">
              Discount Name
            </label>
            <input
              type="text"
              required
              value={newDiscountName}
              onChange={(e) => setNewDiscountName(e.target.value)}
              placeholder="e.g. Volume License Discount"
              className="w-full px-3.5 py-2 text-sm bg-white border border-[#D8E0DE] rounded-lg text-[#202C33]"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#202C33] uppercase tracking-wider mb-1">
                Type
              </label>
              <select
                value={newDiscountType}
                onChange={(e) => setNewDiscountType(e.target.value as any)}
                className="w-full px-3 py-2 text-sm bg-white border border-[#D8E0DE] rounded-lg text-[#202C33]"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Deduction (₹)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#202C33] uppercase tracking-wider mb-1">
                Value {newDiscountType === "percentage" ? "(%)" : "(₹)"}
              </label>
              <input
                type="number"
                required
                value={newDiscountValue}
                onChange={(e) => setNewDiscountValue(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-white border border-[#D8E0DE] rounded-lg text-[#202C33]"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-[#202C33] uppercase tracking-wider mb-1">
              Minimum Quantity
            </label>
            <input
              type="number"
              value={newDiscountMinQty}
              onChange={(e) => setNewDiscountMinQty(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-white border border-[#D8E0DE] rounded-lg text-[#202C33]"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsDiscountModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-[#53636D]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-[#287D73] hover:bg-[#20665E] rounded-lg"
            >
              Save Discount Rule
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
