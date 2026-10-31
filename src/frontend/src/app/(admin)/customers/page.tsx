"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Users,
  Plus,
  Search,
  Building2,
  Mail,
  MapPin,
  FileText,
  CreditCard,
  Repeat,
  ArrowRight,
  ExternalLink,
  Receipt,
  CheckCircle2,
  AlertCircle,
  Building,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { Modal } from "@/components/ui/modal";
import { api } from "@/lib/api";
import { Customer, Subscription, Invoice } from "@/types";
import { formatINR, formatDate } from "@/lib/utils";
import { toast } from "sonner";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Customer Drawer States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // New Customer Form State
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [notes, setNotes] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      const [custs, subs, invs] = await Promise.all([
        api.customers.list(),
        api.subscriptions.list(),
        api.invoices.list(),
      ]);
      setCustomers(custs);
      setSubscriptions(subs);
      setInvoices(invs);
    } catch {
      toast.error("Failed to load customer records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await api.customers.create({
        company_name: companyName,
        contact_name: contactName,
        email,
        billing_address: billingAddress,
        notes,
      });

      setCustomers([created, ...customers]);
      setIsAddModalOpen(false);
      toast.success(`Customer "${created.company_name}" added successfully.`);

      setCompanyName("");
      setContactName("");
      setEmail("");
      setBillingAddress("");
      setNotes("");
    } catch {
      toast.error("Failed to add customer.");
    }
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.contact_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Summary Metrics calculated only from actual records
  const summaryMetrics = useMemo(() => {
    const totalCustomers = customers.length;
    const activeSubscribers = customers.filter((c) => c.active_subscriptions_count > 0).length;
    const totalOutstanding = customers.reduce((sum, c) => sum + c.total_outstanding_minor, 0);

    // Sum recurring amounts of all active subscriptions
    const totalMRR = subscriptions
      .filter((s) => s.status === "active")
      .reduce((sum, s) => sum + s.recurring_amount_minor, 0);

    return {
      totalCustomers,
      activeSubscribers,
      totalOutstanding,
      annualizedARR: totalMRR * 12,
    };
  }, [customers, subscriptions]);

  // Customer-specific lists for the detail drawer
  const customerSubs = selectedCustomer
    ? subscriptions.filter((s) => s.customer_id === selectedCustomer.id)
    : [];
  const customerInvs = selectedCustomer
    ? invoices.filter((i) => i.customer_id === selectedCustomer.id)
    : [];

  return (
    <div className="space-y-6 select-none font-sans text-[#202C33]">
      <PageHeader
        title="Customer Directory"
        subtitle="Manage business subscriber accounts, contract allocations, and outstanding receivables."
      >
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#287D73] hover:bg-[#20665E] rounded-lg shadow-xs transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Add Customer
        </button>
      </PageHeader>

      {/* Compact Summary Strip (Reference Screen 06) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl bg-white border border-[#D8E0DE] shadow-xs">
          <span className="text-[11px] font-bold text-[#82929E] uppercase tracking-wider block">
            Registered Accounts
          </span>
          <span className="text-xl font-extrabold text-[#172B36] mt-1 tabular-nums block">
            {summaryMetrics.totalCustomers}
          </span>
          <span className="text-[10px] text-[#53636D]">Total business entities</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#D8E0DE] shadow-xs">
          <span className="text-[11px] font-bold text-[#82929E] uppercase tracking-wider block">
            Active Subscribers
          </span>
          <span className="text-xl font-extrabold text-[#20665E] mt-1 tabular-nums block">
            {summaryMetrics.activeSubscribers}
          </span>
          <span className="text-[10px] text-[#24734D] font-semibold">Active billing contracts</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#D8E0DE] shadow-xs">
          <span className="text-[11px] font-bold text-[#82929E] uppercase tracking-wider block">
            Total Outstanding
          </span>
          <span className="text-xl font-extrabold text-[#96600C] mt-1 tabular-nums block">
            {formatINR(summaryMetrics.totalOutstanding)}
          </span>
          <span className="text-[10px] text-[#53636D]">Pending reconciliation</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#D8E0DE] shadow-xs">
          <span className="text-[11px] font-bold text-[#82929E] uppercase tracking-wider block">
            Contract Volume (ARR)
          </span>
          <span className="text-xl font-extrabold text-[#172B36] mt-1 tabular-nums block">
            {formatINR(summaryMetrics.annualizedARR)}
          </span>
          <span className="text-[10px] text-[#287D73] font-semibold">Calculated from active subs</span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="w-4 h-4 text-[#82929E] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by company, email, contact..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-xs bg-white border border-[#D8E0DE] rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#287D73]/20 focus:border-[#287D73] text-[#202C33]"
          />
        </div>
        <span className="text-xs text-[#53636D]">
          {filteredCustomers.length} registered business accounts
        </span>
      </div>

      {/* Customer Directory Table */}
      <div className="bg-white rounded-xl border border-[#D8E0DE] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F4F6F5] text-[#82929E] uppercase tracking-wider text-[11px] border-b border-[#D8E0DE]">
              <tr>
                <th className="px-5 py-3.5 font-semibold">Subscriber / Company</th>
                <th className="px-5 py-3.5 font-semibold">Contact Email</th>
                <th className="px-5 py-3.5 font-semibold text-center">Active Subs</th>
                <th className="px-5 py-3.5 font-semibold text-right">Outstanding</th>
                <th className="px-5 py-3.5 font-semibold text-center">Status</th>
                <th className="px-5 py-3.5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D8E0DE] text-[#202C33]">
              {filteredCustomers.map((c) => {
                const initials = c.company_name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2);

                return (
                  <tr
                    key={c.id}
                    onClick={() => setSelectedCustomer(c)}
                    className="hover:bg-[#F4F6F5] cursor-pointer transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#1D5A52] text-[#E7F2EF] font-bold text-xs flex items-center justify-center shrink-0">
                          {initials}
                        </div>
                        <div>
                          <div className="font-bold text-[#172B36]">{c.company_name}</div>
                          {c.contact_name && (
                            <div className="text-[11px] text-[#53636D]">Attn: {c.contact_name}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-[#53636D]">{c.email}</td>
                    <td className="px-5 py-3.5 text-center font-bold text-[#172B36]">
                      {c.active_subscriptions_count}
                    </td>
                    <td className="px-5 py-3.5 text-right font-bold text-[#172B36] tabular-nums">
                      {formatINR(c.total_outstanding_minor)}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#E7F2EF] text-[#20665E]">
                        {c.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCustomer(c);
                        }}
                        className="text-xs font-bold text-[#287D73] hover:underline"
                      >
                        Inspect Dossier →
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Customer Drawer */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Register Business Customer"
        description="Add a new business organization account to the billing directory."
        variant="drawer"
      >
        <form onSubmit={handleCreateCustomer} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#202C33] uppercase tracking-wider mb-1">
              Company / Business Name *
            </label>
            <input
              type="text"
              required
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. Acme Technologies"
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#D8E0DE] rounded-lg text-[#202C33] focus:outline-hidden focus:ring-2 focus:ring-[#287D73]/20 focus:border-[#287D73]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#202C33] uppercase tracking-wider mb-1">
                Primary Contact Name
              </label>
              <input
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="e.g. Aarav Sharma"
                className="w-full px-3.5 py-2 text-sm bg-white border border-[#D8E0DE] rounded-lg text-[#202C33]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#202C33] uppercase tracking-wider mb-1">
                Billing Email *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="billing@acme.com"
                className="w-full px-3.5 py-2 text-sm bg-white border border-[#D8E0DE] rounded-lg text-[#202C33]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#202C33] uppercase tracking-wider mb-1">
              Registered Billing Address
            </label>
            <input
              type="text"
              value={billingAddress}
              onChange={(e) => setBillingAddress(e.target.value)}
              placeholder="Tech Park, Bengaluru, Karnataka"
              className="w-full px-3.5 py-2 text-sm bg-white border border-[#D8E0DE] rounded-lg text-[#202C33]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#202C33] uppercase tracking-wider mb-1">
              Internal Account Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Key enterprise account, annual contract renewal cycle..."
              className="w-full px-3.5 py-2 text-sm bg-white border border-[#D8E0DE] rounded-lg text-[#202C33]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-[#D8E0DE]">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-[#53636D]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-[#287D73] hover:bg-[#20665E] rounded-lg shadow-xs"
            >
              Save Customer
            </button>
          </div>
        </form>
      </Modal>

      {/* Customer Details Dossier Drawer */}
      {selectedCustomer && (
        <Modal
          isOpen={!!selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
          title={selectedCustomer.company_name}
          description={`Customer Account Dossier: ${selectedCustomer.email}`}
          variant="drawer"
        >
          <div className="space-y-6">
            {/* Account Status Card */}
            <div className="p-4 bg-[#F4F6F5] rounded-xl border border-[#D8E0DE] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#53636D]">Account Status:</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E7F2EF] text-[#20665E]">
                  {selectedCustomer.status}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#53636D]">Total Outstanding Balance:</span>
                <span className="text-base font-extrabold text-[#B42332] tabular-nums">
                  {formatINR(selectedCustomer.total_outstanding_minor)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#53636D]">Active Subscriptions:</span>
                <span className="font-bold text-[#172B36]">{selectedCustomer.active_subscriptions_count} contracts</span>
              </div>
            </div>

            {/* Subscriptions section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-[#172B36] uppercase tracking-wider flex items-center gap-1.5">
                  <Repeat className="w-3.5 h-3.5 text-[#287D73]" /> Linked Subscriptions ({customerSubs.length})
                </h4>
                <Link
                  href="/subscriptions"
                  className="text-xs font-bold text-[#287D73] hover:underline"
                >
                  + New Contract
                </Link>
              </div>

              {customerSubs.length === 0 ? (
                <p className="text-xs text-[#82929E] italic p-3 bg-[#F4F6F5] rounded-lg">
                  No active subscriptions found for this business.
                </p>
              ) : (
                <div className="space-y-2">
                  {customerSubs.map((sub) => (
                    <Link
                      key={sub.id}
                      href={`/subscriptions/${sub.id}`}
                      className="block p-3 rounded-lg border border-[#D8E0DE] bg-white hover:border-[#287D73] transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-[#172B36]">{sub.plan_name}</span>
                        <span className="text-[10px] font-bold text-[#20665E] bg-[#E7F2EF] px-2 py-0.5 rounded">
                          {sub.status}
                        </span>
                      </div>
                      <div className="flex justify-between text-[11px] text-[#53636D] mt-1.5">
                        <span>Cadence: {sub.frequency}</span>
                        <span className="font-bold text-[#172B36] tabular-nums">
                          {formatINR(sub.recurring_amount_minor)}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Invoices section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-[#172B36] uppercase tracking-wider flex items-center gap-1.5">
                  <Receipt className="w-3.5 h-3.5 text-[#287D73]" /> Invoices & Ledger ({customerInvs.length})
                </h4>
                <Link
                  href="/invoices"
                  className="text-xs font-bold text-[#287D73] hover:underline"
                >
                  Open Ledger
                </Link>
              </div>

              {customerInvs.length === 0 ? (
                <p className="text-xs text-[#82929E] italic p-3 bg-[#F4F6F5] rounded-lg">
                  No invoices generated yet for this customer.
                </p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {customerInvs.map((inv) => (
                    <div
                      key={inv.id}
                      className="p-2.5 rounded-lg border border-[#D8E0DE] bg-white flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-[#172B36] block">{inv.invoice_number}</span>
                        <span className="text-[10px] text-[#82929E]">Due: {inv.due_date}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-[#172B36] tabular-nums block">
                          {formatINR(inv.total_minor)}
                        </span>
                        <span className="text-[10px] font-semibold capitalize text-[#287D73]">
                          {inv.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-[#D8E0DE] flex justify-between">
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="px-4 py-2 text-xs font-semibold text-[#53636D] hover:bg-[#F4F6F5] rounded-lg"
              >
                Close Drawer
              </button>
              <Link
                href="/subscriptions"
                className="px-4 py-2 text-xs font-bold text-white bg-[#287D73] hover:bg-[#20665E] rounded-lg shadow-xs"
              >
                Create Subscription for Customer
              </Link>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
