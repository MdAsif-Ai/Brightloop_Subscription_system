"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Receipt,
  Search,
  Filter,
  CreditCard,
  Printer,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FileText,
  DollarSign,
  ArrowRight,
  Plus,
  Info,
  Clock,
  ShieldAlert,
  ArrowUpRight,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { Modal } from "@/components/ui/modal";
import { api } from "@/lib/api";
import { Invoice, Payment, InvoiceStatus } from "@/types";
import { formatINR, formatDate, formatDateTime } from "@/lib/utils";
import { toast } from "sonner";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"invoices" | "payments">("invoices");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Invoice Detail / Drawer
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showXRay, setShowXRay] = useState(false);

  // Payment Recording Modal
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<Payment["payment_method"]>("bank_transfer");
  const [paymentDate, setPaymentDate] = useState("2026-10-31");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [submittingPayment, setSubmittingPayment] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [invs, pays] = await Promise.all([
        api.invoices.list(),
        api.payments.list(),
      ]);
      setInvoices(invs);
      setPayments(pays);
    } catch {
      toast.error("Failed to load invoice records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Summary Metrics calculations
  let totalInvoicedMinor = 0;
  let totalPaidMinor = 0;
  let totalOutstandingMinor = 0;
  let overdueCount = 0;

  for (const inv of invoices) {
    if (inv.status !== "canceled") {
      totalInvoicedMinor += inv.total_minor;
      totalPaidMinor += inv.amount_paid_minor;
      totalOutstandingMinor += inv.outstanding_minor;
      if (inv.is_overdue && inv.outstanding_minor > 0) {
        overdueCount++;
      }
    }
  }

  // Filtered invoices
  const filteredInvoices = invoices.filter((inv) => {
    const matchesStatus = statusFilter === "all" || inv.status === statusFilter;
    const matchesSearch =
      inv.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.subscription_number.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Handle Record Payment
  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    const amountRupees = parseFloat(paymentAmount);
    if (isNaN(amountRupees) || amountRupees <= 0) {
      toast.error("Please enter a valid positive payment amount.");
      return;
    }

    const amountMinor = Math.round(amountRupees * 100);
    if (amountMinor > selectedInvoice.outstanding_minor) {
      toast.error(
        `Amount cannot exceed the current outstanding balance of ${formatINR(
          selectedInvoice.outstanding_minor
        )}.`
      );
      return;
    }

    try {
      setSubmittingPayment(true);
      const result = await api.payments.create({
        invoice_id: selectedInvoice.id,
        amount_minor: amountMinor,
        payment_method: paymentMethod,
        payment_date: paymentDate,
        reference_number: referenceNumber || `REF-${Math.floor(Math.random() * 1000000)}`,
        notes: paymentNotes,
      });

      // Update local state
      setInvoices(invoices.map((i) => (i.id === result.invoice.id ? result.invoice : i)));
      setSelectedInvoice(result.invoice);
      setPayments([result.payment, ...payments]);
      setIsPaymentModalOpen(false);
      toast.success(`Payment of ${formatINR(amountMinor)} recorded against ${result.invoice.invoice_number}.`);

      // Reset
      setPaymentAmount("");
      setReferenceNumber("");
      setPaymentNotes("");
    } catch {
      toast.error("Failed to record payment.");
    } finally {
      setSubmittingPayment(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 select-none font-sans text-[#202C33]">
      <PageHeader
        title="Invoices & Settlement Ledger"
        subtitle="Financial reconciliation workspace, audit-trace calculations, and verified payment recordings."
      />

      {/* 13.1 Financial Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-[#D8E0DE] shadow-xs">
          <span className="text-[11px] font-bold text-[#82929E] uppercase tracking-wider block">Total Invoiced</span>
          <span className="text-2xl font-extrabold text-[#172B36] mt-1 tabular-nums block">
            {formatINR(totalInvoicedMinor)}
          </span>
          <span className="text-[10px] text-[#53636D]">Cumulative billings</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#D8E0DE] shadow-xs">
          <span className="text-[11px] font-bold text-[#82929E] uppercase tracking-wider block">Settled Collections</span>
          <span className="text-2xl font-extrabold text-[#24734D] mt-1 tabular-nums block">
            {formatINR(totalPaidMinor)}
          </span>
          <span className="text-[10px] text-[#24734D] font-semibold">Recorded payments</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#D8E0DE] shadow-xs">
          <span className="text-[11px] font-bold text-[#82929E] uppercase tracking-wider block">Outstanding Receivable</span>
          <span className="text-2xl font-extrabold text-[#96600C] mt-1 tabular-nums block">
            {formatINR(totalOutstandingMinor)}
          </span>
          <span className="text-[10px] text-[#53636D]">Pending reconciliation</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#D8E0DE] shadow-xs">
          <span className="text-[11px] font-bold text-[#82929E] uppercase tracking-wider block">Overdue Invoices</span>
          <span className="text-2xl font-extrabold text-[#B42332] mt-1 tabular-nums block">
            {overdueCount} Invoices
          </span>
          <span className="text-[10px] text-[#B42332] font-semibold">Past terms</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#D8E0DE]">
        <button
          onClick={() => setActiveTab("invoices")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
            activeTab === "invoices"
              ? "border-[#287D73] text-[#287D73]"
              : "border-transparent text-[#53636D] hover:text-[#172B36]"
          }`}
        >
          <Receipt className="w-4 h-4" /> Tax Invoices ({invoices.length})
        </button>
        <button
          onClick={() => setActiveTab("payments")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
            activeTab === "payments"
              ? "border-[#287D73] text-[#287D73]"
              : "border-transparent text-[#53636D] hover:text-[#172B36]"
          }`}
        >
          <CreditCard className="w-4 h-4" /> Payment Receipts ({payments.length})
        </button>
      </div>

      {/* TAB 1: Invoices */}
      {activeTab === "invoices" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full max-w-sm">
              <Search className="w-4 h-4 text-[#82929E] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search invoice #, customer, sub #..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 text-xs bg-white border border-[#D8E0DE] rounded-lg focus:outline-hidden text-[#202C33]"
              />
            </div>

            {/* Status Filter Rails (Reference Screen 09) */}
            <div className="flex items-center gap-1.5 text-xs overflow-x-auto pb-1">
              {[
                { label: "All Invoices", value: "all" },
                { label: "Confirmed", value: "confirmed" },
                { label: "Paid", value: "paid" },
                { label: "Draft", value: "draft" },
              ].map((st) => (
                <button
                  key={st.value}
                  onClick={() => setStatusFilter(st.value)}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                    statusFilter === st.value
                      ? "bg-[#172B36] text-white shadow-xs"
                      : "bg-white text-[#53636D] border border-[#D8E0DE] hover:bg-[#F4F6F5]"
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[#D8E0DE] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F4F6F5] text-[#82929E] uppercase tracking-wider text-[11px] border-b border-[#D8E0DE]">
                  <tr>
                    <th className="px-5 py-3.5 font-semibold">Invoice #</th>
                    <th className="px-5 py-3.5 font-semibold">Subscriber</th>
                    <th className="px-5 py-3.5 font-semibold">Contract Ref</th>
                    <th className="px-5 py-3.5 font-semibold">Issue Date</th>
                    <th className="px-5 py-3.5 font-semibold">Due Date</th>
                    <th className="px-5 py-3.5 font-semibold text-right">Invoiced Amount</th>
                    <th className="px-5 py-3.5 font-semibold text-right">Outstanding</th>
                    <th className="px-5 py-3.5 font-semibold text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D8E0DE] text-[#202C33]">
                  {filteredInvoices.map((inv) => (
                    <tr
                      key={inv.id}
                      onClick={() => {
                        setSelectedInvoice(inv);
                        setShowXRay(false);
                      }}
                      className="hover:bg-[#F4F6F5] cursor-pointer transition-colors"
                    >
                      <td className="px-5 py-3.5 font-mono font-bold text-[#172B36]">
                        {inv.invoice_number}
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-[#172B36]">
                        {inv.customer_name}
                      </td>
                      <td className="px-5 py-3.5 text-[#53636D] font-mono">
                        {inv.subscription_number}
                      </td>
                      <td className="px-5 py-3.5 text-[#53636D] tabular-nums">
                        {inv.issue_date}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`tabular-nums ${inv.is_overdue ? "text-[#B42332] font-bold" : "text-[#53636D]"}`}>
                          {inv.due_date}
                        </span>
                        {inv.is_overdue && (
                          <span className="ml-1.5 px-1.5 py-0.2 rounded-xs bg-[#FDF1F2] text-[#B42332] text-[10px] font-bold">
                            OVERDUE
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right font-extrabold text-[#172B36] tabular-nums">
                        {formatINR(inv.total_minor)}
                      </td>
                      <td className="px-5 py-3.5 text-right font-bold tabular-nums">
                        <span className={inv.outstanding_minor > 0 ? "text-[#96600C]" : "text-[#24734D]"}>
                          {formatINR(inv.outstanding_minor)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center">
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Payments Ledger (Reference Screen 10) */}
      {activeTab === "payments" && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-[#D8E0DE] shadow-xs overflow-hidden">
            <div className="p-4 border-b border-[#D8E0DE] bg-[#F4F6F5] flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-[#172B36]">Payment Ledger</h3>
                <p className="text-xs text-[#53636D]">Verified settlement audit trail</p>
              </div>
              <span className="text-xs text-[#53636D]">{payments.length} recorded payments</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F4F6F5] text-[#82929E] uppercase tracking-wider text-[11px] border-b border-[#D8E0DE]">
                  <tr>
                    <th className="px-5 py-3.5 font-semibold">Reference #</th>
                    <th className="px-5 py-3.5 font-semibold">Subscriber</th>
                    <th className="px-5 py-3.5 font-semibold">Linked Invoice</th>
                    <th className="px-5 py-3.5 font-semibold">Settlement Date</th>
                    <th className="px-5 py-3.5 font-semibold">Method</th>
                    <th className="px-5 py-3.5 font-semibold text-right">Settled Amount</th>
                    <th className="px-5 py-3.5 font-semibold text-center">Audit Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D8E0DE] text-[#202C33]">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-[#F4F6F5] transition-colors">
                      <td className="px-5 py-3.5 font-mono font-bold text-[#172B36]">{p.reference_number}</td>
                      <td className="px-5 py-3.5 font-semibold text-[#172B36]">{p.customer_name}</td>
                      <td className="px-5 py-3.5 text-[#53636D] font-mono">{p.invoice_number}</td>
                      <td className="px-5 py-3.5 text-[#53636D] tabular-nums">{p.payment_date}</td>
                      <td className="px-5 py-3.5 capitalize font-medium text-[#53636D]">
                        {p.payment_method.replace("_", " ")}
                      </td>
                      <td className="px-5 py-3.5 text-right font-extrabold text-[#24734D] tabular-nums">
                        {formatINR(p.amount_minor)}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E7F2EF] text-[#20665E] uppercase tracking-wider">
                          Settled
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

      {/* Invoice Detail Drawer with INVOICE X-RAY (Explain Calculation) */}
      {selectedInvoice && (
        <Modal
          isOpen={!!selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          title={`Invoice ${selectedInvoice.invoice_number}`}
          description={`Billed to: ${selectedInvoice.customer_name} • Issued: ${selectedInvoice.issue_date}`}
          variant="drawer"
        >
          <div className="space-y-6">
            {/* Top Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-[#F4F6F5] rounded-xl border border-[#D8E0DE]">
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    selectedInvoice.status === "paid"
                      ? "bg-[#E7F2EF] text-[#20665E]"
                      : "bg-[#FDF6EC] text-[#96600C]"
                  }`}
                >
                  {selectedInvoice.status}
                </span>
                <span className="text-xs text-[#53636D]">
                  Due: <strong className="text-[#172B36]">{selectedInvoice.due_date}</strong>
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="px-2.5 py-1 text-xs font-semibold bg-white border border-[#D8E0DE] hover:bg-[#EDF2F0] rounded-md flex items-center gap-1.5 shadow-2xs"
                >
                  <Printer className="w-3.5 h-3.5" /> Print Invoice
                </button>

                <button
                  onClick={() => setShowXRay(!showXRay)}
                  className={`px-2.5 py-1 text-xs font-bold rounded-md flex items-center gap-1.5 transition-colors ${
                    showXRay
                      ? "bg-[#287D73] text-white"
                      : "bg-[#E7F2EF] text-[#20665E] border border-[#287D73]/30 hover:bg-[#D5EAE4]"
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {showXRay ? "Hide X-Ray" : "Explain Calculation (X-Ray)"}
                </button>
              </div>
            </div>

            {/* INVOICE X-RAY PANEL (Feature 16) */}
            {showXRay && (
              <div className="p-4 bg-[#172B36] text-white rounded-xl border border-[#263E49] space-y-3 animate-in fade-in duration-200">
                <div className="flex items-center justify-between pb-2 border-b border-[#263E49]">
                  <span className="text-xs font-bold text-[#A3D9D2] flex items-center gap-1.5 uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5" /> Invoice X-Ray Mathematical Trace
                  </span>
                  <span className="text-[10px] text-[#9EB1BC] font-mono">GST Snapshot Audit</span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-[#D6E0E1]">
                    <span>Base Catalog Unit Price:</span>
                    <span className="font-mono tabular-nums">
                      {formatINR(selectedInvoice.items[0]?.base_price_minor || 0)}
                    </span>
                  </div>
                  {selectedInvoice.items[0]?.variant_name && (
                    <div className="flex justify-between text-[#D6E0E1]">
                      <span>Variant Surcharge ({selectedInvoice.items[0].variant_name}):</span>
                      <span className="font-mono text-[#A3D9D2] tabular-nums">
                        +{formatINR(selectedInvoice.items[0].variant_adjustment_minor)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-[#D6E0E1]">
                    <span>Quantity Billed:</span>
                    <span className="font-mono tabular-nums">{selectedInvoice.items[0]?.quantity || 1} units</span>
                  </div>
                  <div className="flex justify-between font-semibold text-white pt-1 border-t border-[#263E49]">
                    <span>Contract Subtotal:</span>
                    <span className="font-mono tabular-nums">{formatINR(selectedInvoice.subtotal_minor)}</span>
                  </div>
                  {selectedInvoice.discount_minor > 0 && (
                    <div className="flex justify-between text-[#B86F4B]">
                      <span>Applied Volume Discount:</span>
                      <span className="font-mono tabular-nums">-{formatINR(selectedInvoice.discount_minor)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[#A3D9D2]">
                    <span>Taxable Base:</span>
                    <span className="font-mono tabular-nums">
                      {formatINR(selectedInvoice.subtotal_minor - selectedInvoice.discount_minor)}
                    </span>
                  </div>
                  <div className="flex justify-between text-[#D6E0E1]">
                    <span>Applied GST ({selectedInvoice.items[0]?.tax_rate || 18}%):</span>
                    <span className="font-mono text-[#A3D9D2] tabular-nums">
                      +{formatINR(selectedInvoice.tax_minor)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-extrabold text-white pt-2 border-t border-[#263E49]">
                    <span>Final Invoiced Total:</span>
                    <span className="font-mono text-[#A3D9D2] tabular-nums">
                      {formatINR(selectedInvoice.total_minor)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Standard Printable Invoice Representation */}
            <div className="p-6 bg-white border border-[#D8E0DE] rounded-xl space-y-4 print-container">
              <div className="flex justify-between pb-4 border-b border-[#D8E0DE]">
                <div>
                  <h3 className="font-extrabold text-base text-[#172B36]">BRIGHTLOOP OS</h3>
                  <div className="text-xs text-[#53636D]">Autonomous Subscription Billing System</div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-sm text-[#172B36]">{selectedInvoice.invoice_number}</div>
                  <div className="text-[11px] text-[#53636D]">Issue: {selectedInvoice.issue_date}</div>
                </div>
              </div>

              <div className="text-xs space-y-1">
                <div className="font-bold text-[#172B36]">Billed To:</div>
                <div className="text-[#53636D]">{selectedInvoice.customer_name}</div>
                <div className="text-[#53636D]">{selectedInvoice.customer_email}</div>
              </div>

              {/* Line items table */}
              <table className="w-full text-left text-xs border border-[#D8E0DE] rounded-md overflow-hidden">
                <thead className="bg-[#F4F6F5] text-[#82929E] uppercase text-[10px] font-bold">
                  <tr>
                    <th className="p-2.5">Product & Variant</th>
                    <th className="p-2.5 text-center">Qty</th>
                    <th className="p-2.5 text-right">Unit Price</th>
                    <th className="p-2.5 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D8E0DE] text-[#202C33]">
                  {selectedInvoice.items.map((it, idx) => (
                    <tr key={idx}>
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

              {/* Totals */}
              <div className="space-y-1.5 text-xs pt-2 border-t border-[#D8E0DE]">
                <div className="flex justify-between text-[#53636D]">
                  <span>Subtotal:</span>
                  <span className="tabular-nums font-semibold">{formatINR(selectedInvoice.subtotal_minor)}</span>
                </div>
                {selectedInvoice.discount_minor > 0 && (
                  <div className="flex justify-between text-[#B86F4B]">
                    <span>Discount:</span>
                    <span className="tabular-nums font-semibold">-{formatINR(selectedInvoice.discount_minor)}</span>
                  </div>
                )}
                <div className="flex justify-between text-[#53636D]">
                  <span>GST ({selectedInvoice.tax_label || "18%"}):</span>
                  <span className="tabular-nums font-semibold">+{formatINR(selectedInvoice.tax_minor)}</span>
                </div>
                <div className="flex justify-between text-sm font-extrabold text-[#172B36] pt-1 border-t border-[#D8E0DE]">
                  <span>Total Amount:</span>
                  <span className="text-[#20665E] tabular-nums">{formatINR(selectedInvoice.total_minor)}</span>
                </div>
                <div className="flex justify-between text-xs text-[#53636D]">
                  <span>Amount Paid:</span>
                  <span className="text-[#24734D] font-bold tabular-nums">
                    {formatINR(selectedInvoice.amount_paid_minor)}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-bold text-[#172B36]">
                  <span>Remaining Balance:</span>
                  <span className="text-[#B42332] font-extrabold tabular-nums">
                    {formatINR(selectedInvoice.outstanding_minor)}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-[#D8E0DE] flex items-center justify-between">
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="px-4 py-2 text-xs font-semibold text-[#53636D] hover:bg-[#F4F6F5] rounded-lg"
              >
                Close Drawer
              </button>

              {selectedInvoice.outstanding_minor > 0 && (
                <button
                  onClick={() => {
                    setPaymentAmount((selectedInvoice.outstanding_minor / 100).toString());
                    setIsPaymentModalOpen(true);
                  }}
                  className="px-4 py-2 text-xs font-bold text-white bg-[#287D73] hover:bg-[#20665E] rounded-lg shadow-xs flex items-center gap-1.5"
                >
                  <CreditCard className="w-4 h-4" /> Record Settlement Payment
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Record Payment Modal */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title="Record Payment Settlement"
        description={
          selectedInvoice
            ? `Post payment against invoice ${selectedInvoice.invoice_number} (Outstanding: ${formatINR(
                selectedInvoice.outstanding_minor
              )})`
            : "Post payment"
        }
      >
        <form onSubmit={handleRecordPayment} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#202C33] uppercase tracking-wider mb-1">
              Payment Amount (₹) *
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-white border border-[#D8E0DE] rounded-lg text-[#202C33]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#202C33] uppercase tracking-wider mb-1">
                Settlement Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full px-3 py-2 text-sm bg-white border border-[#D8E0DE] rounded-lg text-[#202C33]"
              >
                <option value="bank_transfer">Direct Bank Transfer</option>
                <option value="upi">UPI Settlement</option>
                <option value="card">Corporate Card</option>
                <option value="cash">Cash / Cheque</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#202C33] uppercase tracking-wider mb-1">
                Settlement Date
              </label>
              <input
                type="date"
                required
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-[#D8E0DE] rounded-lg text-[#202C33]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#202C33] uppercase tracking-wider mb-1">
              Bank / UPI Transaction Reference #
            </label>
            <input
              type="text"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="e.g. UTR-20261031-987654"
              className="w-full px-3.5 py-2 text-sm bg-white border border-[#D8E0DE] rounded-lg text-[#202C33]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#202C33] uppercase tracking-wider mb-1">
              Reconciliation Notes
            </label>
            <textarea
              rows={2}
              value={paymentNotes}
              onChange={(e) => setPaymentNotes(e.target.value)}
              placeholder="Verified via ICICI corporate banking gateway..."
              className="w-full px-3.5 py-2 text-sm bg-white border border-[#D8E0DE] rounded-lg text-[#202C33]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsPaymentModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-[#53636D]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingPayment}
              className="px-4 py-2 text-xs font-bold text-white bg-[#287D73] hover:bg-[#20665E] rounded-lg shadow-xs disabled:opacity-50"
            >
              {submittingPayment ? "Posting..." : "Confirm Payment"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
