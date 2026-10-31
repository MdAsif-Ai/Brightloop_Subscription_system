"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  Plus,
  Shield,
  Building,
  Mail,
  CheckCircle2,
  Lock,
  UserCheck,
  CreditCard,
  Sliders,
  Save,
  Clock,
  AlertCircle,
  FileText,
  Key,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { Modal } from "@/components/ui/modal";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { StaffAccount } from "@/types";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

type SettingsTab = "organization" | "staff" | "billing" | "security";

export default function SettingsPage() {
  const { role, user } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>("staff");
  const [staffList, setStaffList] = useState<StaffAccount[]>([]);
  const [loading, setLoading] = useState(true);

  // Add staff modal
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [staffName, setStaffName] = useState("");
  const [staffEmail, setStaffEmail] = useState("");
  const [creating, setCreating] = useState(false);

  // Organization state
  const [orgName, setOrgName] = useState("Brightloop Software Pvt Ltd");
  const [gstin, setGstin] = useState("29AABCB1234F1Z8");
  const [currency, setCurrency] = useState("INR (₹)");
  const [supportEmail, setSupportEmail] = useState("billing@brightloop.os");
  const [savingOrg, setSavingOrg] = useState(false);

  const loadStaff = async () => {
    try {
      setLoading(true);
      const res = await api.staff.list();
      setStaffList(res);
    } catch {
      toast.error("Failed to load staff list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, []);

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (role !== "admin") {
      toast.error("Only administrators can create staff accounts.");
      return;
    }

    try {
      setCreating(true);
      const created = await api.staff.create({
        name: staffName,
        email: staffEmail,
      });

      setStaffList((prev) => [...prev, created]);
      setIsAddStaffOpen(false);
      setStaffName("");
      setStaffEmail("");
      toast.success(`Staff account for ${created.name} created successfully.`);
    } catch {
      toast.error("Failed to create staff account.");
    } finally {
      setCreating(false);
    }
  };

  const handleSaveOrg = (e: React.FormEvent) => {
    e.preventDefault();
    setSavingOrg(true);
    setTimeout(() => {
      setSavingOrg(false);
      toast.success("Organization parameters updated.");
    }, 400);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings & System Governance"
        subtitle="Configure organization parameters, staff operators, billing engine rules, and access policies."
      >
        {activeTab === "staff" && role === "admin" && (
          <button
            onClick={() => setIsAddStaffOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#287D73] hover:bg-[#20665E] rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add Staff Member
          </button>
        )}
      </PageHeader>

      {/* Screen 15: Two-column settings architecture */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1 space-y-1">
          <nav className="bg-white rounded-xl border border-[#D8E0DE] p-2 space-y-1 shadow-xs">
            <button
              onClick={() => setActiveTab("staff")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-colors text-left ${
                activeTab === "staff"
                  ? "bg-[#E7F2EF] text-[#287D73] font-bold"
                  : "text-[#53636D] hover:bg-[#F4F6F5] hover:text-[#202C33]"
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Team & Staff Accounts</span>
              <span className="ml-auto text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-white border border-[#D8E0DE] text-[#53636D]">
                {staffList.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("organization")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-colors text-left ${
                activeTab === "organization"
                  ? "bg-[#E7F2EF] text-[#287D73] font-bold"
                  : "text-[#53636D] hover:bg-[#F4F6F5] hover:text-[#202C33]"
              }`}
            >
              <Building className="w-4 h-4" />
              <span>Organization Profile</span>
            </button>

            <button
              onClick={() => setActiveTab("billing")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-colors text-left ${
                activeTab === "billing"
                  ? "bg-[#E7F2EF] text-[#287D73] font-bold"
                  : "text-[#53636D] hover:bg-[#F4F6F5] hover:text-[#202C33]"
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>Billing & Engine Rules</span>
            </button>

            <button
              onClick={() => setActiveTab("security")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-colors text-left ${
                activeTab === "security"
                  ? "bg-[#E7F2EF] text-[#287D73] font-bold"
                  : "text-[#53636D] hover:bg-[#F4F6F5] hover:text-[#202C33]"
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Security & Authorizations</span>
            </button>
          </nav>

          <div className="bg-[#E7F2EF] border border-[#B8C7C3] rounded-xl p-4 text-xs text-[#20665E] space-y-2">
            <div className="flex items-center gap-2 font-bold text-[#172B36]">
              <Lock className="w-3.5 h-3.5 text-[#287D73]" /> Role-Based Access Active
            </div>
            <p className="text-[11px] leading-relaxed text-[#263E49]">
              Only administrators can create staff accounts and alter discount rules. Staff have operational access to customers, subscriptions, and invoices.
            </p>
          </div>
        </div>

        {/* Right Active Panel */}
        <div className="lg:col-span-3 space-y-6">
          {activeTab === "staff" && (
            <div className="bg-white rounded-xl border border-[#D8E0DE] shadow-xs overflow-hidden">
              <div className="p-5 border-b border-[#D8E0DE] bg-[#F4F6F5]/50 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-[#202C33] text-sm">Staff & Operator Directory</h3>
                  <p className="text-xs text-[#53636D]">
                    Staff members handle customer billing and subscription operations with protected pricing rules.
                  </p>
                </div>
                <div className="text-xs font-semibold text-[#53636D] bg-white border border-[#D8E0DE] px-2.5 py-1 rounded-md">
                  {staffList.length} Accounts Provisioned
                </div>
              </div>

              {loading ? (
                <div className="p-8 text-center text-xs text-[#53636D]">Loading staff directory...</div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F4F6F5] text-[#53636D] uppercase tracking-wider text-[11px] border-b border-[#D8E0DE]">
                    <tr>
                      <th className="px-5 py-3 font-semibold">Staff Member</th>
                      <th className="px-5 py-3 font-semibold">Email</th>
                      <th className="px-5 py-3 font-semibold text-center">Assigned Role</th>
                      <th className="px-5 py-3 font-semibold text-center">Status</th>
                      <th className="px-5 py-3 font-semibold text-right">Provisioned</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#D8E0DE] text-[#202C33]">
                    {staffList.map((st) => (
                      <tr key={st.id} className="hover:bg-[#F4F6F5]/50 transition-colors">
                        <td className="px-5 py-3.5 font-bold text-[#202C33] flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-[#172B36] text-white font-bold text-xs flex items-center justify-center">
                            {st.name[0]}
                          </div>
                          <span>{st.name}</span>
                        </td>
                        <td className="px-5 py-3.5 text-[#53636D] font-mono">{st.email}</td>
                        <td className="px-5 py-3.5 text-center">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                              st.role === "admin"
                                ? "bg-[#172B36] text-white border-[#172B36]"
                                : "bg-[#E7F2EF] text-[#287D73] border-[#B8C7C3]"
                            }`}
                          >
                            {st.role}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <StatusBadge status={st.status} size="sm" />
                        </td>
                        <td className="px-5 py-3.5 text-right text-[#53636D] font-mono">
                          {formatDate(st.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {activeTab === "organization" && (
            <div className="bg-white rounded-xl border border-[#D8E0DE] shadow-xs p-6 space-y-6">
              <div className="border-b border-[#D8E0DE] pb-4">
                <h3 className="font-bold text-[#202C33] text-sm">Organization & Entity Details</h3>
                <p className="text-xs text-[#53636D]">
                  Legal merchant entity information rendered on official invoices and customer contracts.
                </p>
              </div>

              <form onSubmit={handleSaveOrg} className="space-y-4 max-w-xl">
                <div>
                  <label className="block text-xs font-bold text-[#53636D] uppercase tracking-wider mb-1.5">
                    Legal Merchant Entity Name
                  </label>
                  <input
                    type="text"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-white border border-[#D8E0DE] rounded-lg text-[#202C33] focus:outline-none focus:border-[#287D73]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#53636D] uppercase tracking-wider mb-1.5">
                    Goods & Services Tax Identification Number (GSTIN)
                  </label>
                  <input
                    type="text"
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-white border border-[#D8E0DE] rounded-lg text-[#202C33] font-mono focus:outline-none focus:border-[#287D73]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#53636D] uppercase tracking-wider mb-1.5">
                      Base Operating Currency
                    </label>
                    <input
                      type="text"
                      disabled
                      value={currency}
                      className="w-full px-3.5 py-2 text-xs bg-[#F4F6F5] border border-[#D8E0DE] rounded-lg text-[#53636D] font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#53636D] uppercase tracking-wider mb-1.5">
                      Merchant Support Email
                    </label>
                    <input
                      type="email"
                      value={supportEmail}
                      onChange={(e) => setSupportEmail(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs bg-white border border-[#D8E0DE] rounded-lg text-[#202C33] focus:outline-none focus:border-[#287D73]"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={savingOrg}
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-[#287D73] hover:bg-[#20665E] rounded-lg transition-colors shadow-xs"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {savingOrg ? "Updating..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === "billing" && (
            <div className="bg-white rounded-xl border border-[#D8E0DE] shadow-xs p-6 space-y-6">
              <div className="border-b border-[#D8E0DE] pb-4">
                <h3 className="font-bold text-[#202C33] text-sm">Recurring Billing Engine Parameters</h3>
                <p className="text-xs text-[#53636D]">
                  Operational tolerances for automated generation, renewal schedules, and duplicate mitigation.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-[#D8E0DE] rounded-xl p-4 bg-[#F4F6F5]/50 space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#53636D]">
                    Currency Decimal Precision
                  </span>
                  <div className="text-sm font-bold text-[#202C33]">Minor Currency Units (Paise)</div>
                  <p className="text-[11px] text-[#53636D]">
                    All amounts stored as integers in minor units on the server, divided by 100 for display.
                  </p>
                </div>

                <div className="border border-[#D8E0DE] rounded-xl p-4 bg-[#F4F6F5]/50 space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#53636D]">
                    Duplicate Billing Protection
                  </span>
                  <div className="text-sm font-bold text-[#24734D] flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Strict Idempotency Active
                  </div>
                  <p className="text-[11px] text-[#53636D]">
                    Subscriptions already billed for the active period are skipped during Time Machine runs.
                  </p>
                </div>

                <div className="border border-[#D8E0DE] rounded-xl p-4 bg-[#F4F6F5]/50 space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#53636D]">
                    Default Invoice Payment Terms
                  </span>
                  <div className="text-sm font-bold text-[#202C33]">Net 7 Days</div>
                  <p className="text-[11px] text-[#53636D]">
                    Invoices default to due dates 7 days following the billing period anchor.
                  </p>
                </div>

                <div className="border border-[#D8E0DE] rounded-xl p-4 bg-[#F4F6F5]/50 space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#53636D]">
                    Revenue Guardian Scanning
                  </span>
                  <div className="text-sm font-bold text-[#287D73] flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Continuous Health Audit
                  </div>
                  <p className="text-[11px] text-[#53636D]">
                    Heuristic engine flags missing invoices, overdue balances, and 7-day expiration risks.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div className="bg-white rounded-xl border border-[#D8E0DE] shadow-xs p-6 space-y-6">
              <div className="border-b border-[#D8E0DE] pb-4">
                <h3 className="font-bold text-[#202C33] text-sm">Role-Based Authorization Matrix</h3>
                <p className="text-xs text-[#53636D]">
                  Strict operational boundaries enforced between Administrators, Staff, and Customer users.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-[#D8E0DE] rounded-lg overflow-hidden">
                  <thead className="bg-[#F4F6F5] text-[#53636D] uppercase tracking-wider text-[11px] border-b border-[#D8E0DE]">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Capability / Operation</th>
                      <th className="px-4 py-3 font-semibold text-center">Administrator</th>
                      <th className="px-4 py-3 font-semibold text-center">Staff Operator</th>
                      <th className="px-4 py-3 font-semibold text-center">Customer</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#D8E0DE] text-[#202C33]">
                    <tr>
                      <td className="px-4 py-3 font-medium">Create Products & Subscription Plans</td>
                      <td className="px-4 py-3 text-center text-[#24734D] font-bold">Allowed</td>
                      <td className="px-4 py-3 text-center text-[#B42332] font-semibold">Read Only</td>
                      <td className="px-4 py-3 text-center text-[#53636D]">No Access</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium">Modify Discount & Tax Rules</td>
                      <td className="px-4 py-3 text-center text-[#24734D] font-bold">Allowed</td>
                      <td className="px-4 py-3 text-center text-[#B42332] font-semibold">Restricted</td>
                      <td className="px-4 py-3 text-center text-[#53636D]">No Access</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium">Create Quotations & Confirm Subscriptions</td>
                      <td className="px-4 py-3 text-center text-[#24734D] font-bold">Allowed</td>
                      <td className="px-4 py-3 text-center text-[#24734D] font-bold">Allowed</td>
                      <td className="px-4 py-3 text-center text-[#53636D]">Accept Only</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium">Execute Billing Time Machine Runs</td>
                      <td className="px-4 py-3 text-center text-[#24734D] font-bold">Allowed</td>
                      <td className="px-4 py-3 text-center text-[#24734D] font-bold">Allowed</td>
                      <td className="px-4 py-3 text-center text-[#53636D]">No Access</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium">Execute Revenue Guardian Recovery</td>
                      <td className="px-4 py-3 text-center text-[#24734D] font-bold">Allowed</td>
                      <td className="px-4 py-3 text-center text-[#24734D] font-bold">Allowed</td>
                      <td className="px-4 py-3 text-center text-[#53636D]">No Access</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium">Self-Service Pause / Close Subscriptions</td>
                      <td className="px-4 py-3 text-center text-[#24734D] font-bold">Allowed</td>
                      <td className="px-4 py-3 text-center text-[#24734D] font-bold">Allowed</td>
                      <td className="px-4 py-3 text-center text-[#24734D] font-bold">Allowed</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Staff Modal */}
      <Modal
        isOpen={isAddStaffOpen}
        onClose={() => setIsAddStaffOpen(false)}
        title="Provision Staff Operator Account"
        description="Create operational credentials with restricted pricing and rule permissions."
        maxWidth="md"
      >
        <form onSubmit={handleCreateStaff} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#53636D] uppercase tracking-wider mb-1">
              Staff Member Full Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Ananya Deshmukh"
              value={staffName}
              onChange={(e) => setStaffName(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-white border border-[#D8E0DE] rounded-lg text-[#202C33] focus:outline-none focus:border-[#287D73]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#53636D] uppercase tracking-wider mb-1">
              Work Email Address *
            </label>
            <input
              type="email"
              required
              placeholder="ananya@brightloop.os"
              value={staffEmail}
              onChange={(e) => setStaffEmail(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-white border border-[#D8E0DE] rounded-lg text-[#202C33] focus:outline-none focus:border-[#287D73]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#53636D] uppercase tracking-wider mb-1">
              Assigned Role
            </label>
            <input
              type="text"
              disabled
              value="Staff (Operations)"
              className="w-full px-3.5 py-2 text-xs bg-[#F4F6F5] border border-[#D8E0DE] rounded-lg text-[#53636D] font-medium"
            />
            <p className="text-[11px] text-[#53636D] mt-1">
              Staff accounts have full operational capabilities across customers and billing, but cannot modify tax or discount rules.
            </p>
          </div>

          <div className="pt-4 border-t border-[#D8E0DE] flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddStaffOpen(false)}
              className="px-4 py-2 text-xs font-medium text-[#53636D] hover:bg-[#F4F6F5] rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating}
              className="px-4 py-2 text-xs font-bold text-white bg-[#287D73] hover:bg-[#20665E] rounded-lg shadow-xs flex items-center gap-1.5"
            >
              {creating && (
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              Create Staff Account
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
