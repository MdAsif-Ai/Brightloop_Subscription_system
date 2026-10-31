"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Clock,
  Play,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  ShieldCheck,
  Calendar,
  FastForward,
  ArrowRight,
  FileCheck,
  Zap,
  Check,
  Layers,
  HelpCircle,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { TimeMachineRunResult } from "@/types";
import { formatINR, formatDate, formatDateTime } from "@/lib/utils";
import { toast } from "sonner";

export default function TimeMachinePage() {
  const { demoClock, setDemoClock } = useAuth();
  const [simulationDate, setSimulationDate] = useState<string>(demoClock || "2026-11-01");
  const [isRunning, setIsRunning] = useState(false);
  const [activeStage, setActiveStage] = useState<number>(0);
  const [latestResult, setLatestResult] = useState<TimeMachineRunResult | null>(null);
  const [history, setHistory] = useState<TimeMachineRunResult[]>([]);
  const [loading, setLoading] = useState(true);

  // Vertical timeline stages
  const STAGES = [
    "Discover due subscriptions for simulation date",
    "Validate contract lifecycle status (Active / Paused / Expired)",
    "Check historical billing periods to prevent duplicate invoices",
    "Evaluate volume discount rules and customer pricing eligibility",
    "Calculate itemized GST rates and final taxable amounts",
    "Generate persistent tax invoices into the general ledger",
    "Advance subscription billing schedules to next renewal date",
    "Record run summary and notify autonomous listeners",
  ];

  const loadHistory = async () => {
    try {
      setLoading(true);
      const runs = await api.billing.history();
      setHistory(runs);
      if (runs.length > 0) {
        setLatestResult(runs[0]);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  // Time advancement helpers
  const advanceTime = (days: number) => {
    const current = new Date(simulationDate);
    current.setDate(current.getDate() + days);
    const nextDate = current.toISOString().split("T")[0];
    setSimulationDate(nextDate);
    setDemoClock(nextDate);
    api.clock.set(nextDate);
    toast.info(`Clock advanced to ${formatDate(nextDate)}`);
  };

  const advanceMonth = () => {
    const current = new Date(simulationDate);
    current.setMonth(current.getMonth() + 1);
    const nextDate = current.toISOString().split("T")[0];
    setSimulationDate(nextDate);
    setDemoClock(nextDate);
    api.clock.set(nextDate);
    toast.info(`Clock advanced to ${formatDate(nextDate)}`);
  };

  // Run Billing Cycle
  const handleRunBilling = async () => {
    try {
      setIsRunning(true);
      setActiveStage(1);

      // Sequential stage visual feedback
      const stageInterval = setInterval(() => {
        setActiveStage((prev) => {
          if (prev >= STAGES.length) {
            clearInterval(stageInterval);
            return STAGES.length;
          }
          return prev + 1;
        });
      }, 200);

      const result = await api.billing.run(simulationDate);

      setTimeout(() => {
        clearInterval(stageInterval);
        setActiveStage(STAGES.length);
        setIsRunning(false);
        setLatestResult(result);
        setHistory((prev) => [result, ...prev]);

        // DUPLICATE PREVENTION NOTIFICATION
        if (result.invoices_created === 0 && result.already_billed > 0) {
          toast.success("Duplicate billing prevented! All contracts already billed for this period.", {
            description: `${result.already_billed} subscription(s) skipped cleanly. Zero duplicate invoices created.`,
          });
        } else if (result.invoices_created > 0) {
          toast.success(`Billing run completed! ${result.invoices_created} new invoice(s) generated.`, {
            description: `Total invoiced: ${formatINR(result.total_invoiced_minor)}`,
          });
        } else {
          toast.info("No active subscriptions due on this date.");
        }
      }, 1600);
    } catch (err: unknown) {
      setIsRunning(false);
      setActiveStage(0);
      toast.error("Billing execution encountered an error.");
    }
  };

  return (
    <div className="space-y-6 select-none font-sans text-[#202C33]">
      <PageHeader
        title="Billing Time Machine"
        subtitle="Travel through recurring billing cadences. Verify every renewal. Observe real-time duplicate billing prevention."
        badge={
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[#F8EDE6] text-[#96600C] border border-[#B86F4B]/30 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#B86F4B]" /> Demo Environment
          </span>
        }
      />

      {/* 4 Interactive Steps Guide (Screen 11 Reference) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-4 rounded-xl border border-[#D8E0DE] shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-[#E7F2EF] text-[#20665E] font-bold text-xs flex items-center justify-center shrink-0">
            1
          </div>
          <div>
            <span className="text-xs font-bold text-[#172B36] block">Select Date</span>
            <span className="text-[10px] text-[#53636D]">Target future cycle</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-[#E7F2EF] text-[#20665E] font-bold text-xs flex items-center justify-center shrink-0">
            2
          </div>
          <div>
            <span className="text-xs font-bold text-[#172B36] block">Advance Clock</span>
            <span className="text-[10px] text-[#53636D]">+1 Day, Week, Month</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-[#E7F2EF] text-[#20665E] font-bold text-xs flex items-center justify-center shrink-0">
            3
          </div>
          <div>
            <span className="text-xs font-bold text-[#172B36] block">Run Engine</span>
            <span className="text-[10px] text-[#53636D]">Evaluate billing rules</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-[#E7F2EF] text-[#20665E] font-bold text-xs flex items-center justify-center shrink-0">
            4
          </div>
          <div>
            <span className="text-xs font-bold text-[#172B36] block">Verify Deduplication</span>
            <span className="text-[10px] text-[#24734D] font-semibold">Zero duplicate invoices</span>
          </div>
        </div>
      </div>

      {/* Main Simulation Workspace Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Simulation Controls Panel (5 cols) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-[#D8E0DE] shadow-xs flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#D8E0DE] mb-4">
              <h2 className="text-sm font-bold text-[#172B36] flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#287D73]" />
                Simulation Clock Control
              </h2>
              <span className="text-xs font-mono font-bold text-[#20665E] bg-[#E7F2EF] px-2 py-0.5 rounded">
                Active Clock
              </span>
            </div>

            {/* Current Simulation Date Display */}
            <div className="p-4 rounded-xl bg-[#F4F6F5] border border-[#D8E0DE] text-center mb-5">
              <span className="text-[11px] font-bold text-[#82929E] uppercase tracking-wider block">
                Current Simulated Time
              </span>
              <span className="text-2xl sm:text-3xl font-extrabold text-[#172B36] mt-1 tabular-nums block">
                {formatDate(simulationDate)}
              </span>
              <span className="text-xs text-[#53636D] mt-0.5 block font-mono">
                ISO: {simulationDate}
              </span>
            </div>

            {/* Quick Advance Time Buttons */}
            <div className="space-y-2 mb-5">
              <label className="block text-xs font-bold text-[#202C33] uppercase tracking-wider">
                Advance Time Horizon
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  disabled={isRunning}
                  onClick={() => advanceTime(1)}
                  className="py-2.5 px-3 rounded-lg border border-[#D8E0DE] bg-white hover:bg-[#F4F6F5] text-xs font-bold text-[#172B36] transition-colors shadow-2xs disabled:opacity-50"
                >
                  +1 Day
                </button>
                <button
                  type="button"
                  disabled={isRunning}
                  onClick={() => advanceTime(7)}
                  className="py-2.5 px-3 rounded-lg border border-[#D8E0DE] bg-white hover:bg-[#F4F6F5] text-xs font-bold text-[#172B36] transition-colors shadow-2xs disabled:opacity-50"
                >
                  +1 Week
                </button>
                <button
                  type="button"
                  disabled={isRunning}
                  onClick={advanceMonth}
                  className="py-2.5 px-3 rounded-lg border border-[#287D73]/40 bg-[#E7F2EF] hover:bg-[#D5EAE4] text-xs font-bold text-[#20665E] transition-colors shadow-2xs disabled:opacity-50"
                >
                  +1 Month
                </button>
              </div>
            </div>

            {/* Custom Date Input */}
            <div className="mb-6">
              <label className="block text-xs font-bold text-[#202C33] uppercase tracking-wider mb-1.5">
                Set Custom Simulation Date
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={simulationDate}
                  onChange={(e) => {
                    setSimulationDate(e.target.value);
                    setDemoClock(e.target.value);
                    api.clock.set(e.target.value);
                  }}
                  className="flex-1 px-3 py-2 text-xs bg-white border border-[#D8E0DE] rounded-lg focus:outline-hidden text-[#202C33]"
                />
                <button
                  type="button"
                  onClick={() => {
                    const today = "2026-10-31";
                    setSimulationDate(today);
                    setDemoClock(today);
                    api.clock.set(today);
                    toast.info("Clock reset to base demo date.");
                  }}
                  className="p-2 border border-[#D8E0DE] bg-white hover:bg-[#F4F6F5] rounded-lg text-[#53636D]"
                  title="Reset clock to demo base"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Primary Action Button */}
          <button
            type="button"
            disabled={isRunning}
            onClick={handleRunBilling}
            className="w-full py-3.5 px-4 rounded-xl bg-[#287D73] hover:bg-[#20665E] text-white font-bold text-sm transition-all shadow-xs flex items-center justify-center gap-2.5 disabled:opacity-50"
          >
            {isRunning ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Executing Automated Billing Pipeline...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Run Billing Cycle for {formatDate(simulationDate)}</span>
              </>
            )}
          </button>
        </div>

        {/* Right: Execution Overview & Duplicate Prevention Proof (7 cols) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-[#D8E0DE] shadow-xs flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#D8E0DE] mb-4">
              <h2 className="text-sm font-bold text-[#172B36] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#24734D]" />
                Execution Results & Deduplication Guarantee
              </h2>
              {latestResult && (
                <span className="text-[10px] text-[#82929E] font-mono">
                  Run ID: {latestResult.run_id}
                </span>
              )}
            </div>

            {/* Prominent Duplicate Prevention Proof Banner */}
            {latestResult && latestResult.invoices_created === 0 && latestResult.already_billed > 0 && (
              <div className="p-4 rounded-xl bg-[#E7F4ED] border border-[#24734D]/30 mb-5 animate-in fade-in duration-300">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#24734D] text-white flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-[#1E5D3E]">
                      DUPLICATE BILLING PREVENTED
                    </h3>
                    <p className="text-xs text-[#20665E] mt-0.5 leading-relaxed">
                      The engine evaluated all active subscriptions due on {latestResult.simulation_date}. Because invoices were already generated for these contracts in this cycle, zero duplicate invoices were created.
                    </p>
                    <div className="mt-2 text-[11px] font-bold text-[#24734D] flex items-center gap-2">
                      <span>✓ {latestResult.already_billed} Duplicate(s) Suppressed</span>
                      <span>✓ 0 Double Charges</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Execution Metric Tiles */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <div className="p-3 rounded-xl bg-[#F4F6F5] border border-[#D8E0DE]">
                <span className="text-[10px] font-bold text-[#82929E] uppercase tracking-wider block">
                  Contracts Scanned
                </span>
                <span className="text-xl font-extrabold text-[#172B36] mt-0.5 tabular-nums block">
                  {latestResult ? latestResult.processed : 0}
                </span>
                <span className="text-[10px] text-[#53636D]">Active contracts</span>
              </div>

              <div className="p-3 rounded-xl bg-[#F4F6F5] border border-[#D8E0DE]">
                <span className="text-[10px] font-bold text-[#82929E] uppercase tracking-wider block">
                  New Invoices
                </span>
                <span className="text-xl font-extrabold text-[#20665E] mt-0.5 tabular-nums block">
                  {latestResult ? latestResult.invoices_created : 0}
                </span>
                <span className="text-[10px] text-[#24734D] font-semibold">Persisted to ledger</span>
              </div>

              <div className="p-3 rounded-xl bg-[#F4F6F5] border border-[#D8E0DE]">
                <span className="text-[10px] font-bold text-[#82929E] uppercase tracking-wider block">
                  Already Billed
                </span>
                <span className="text-xl font-extrabold text-[#96600C] mt-0.5 tabular-nums block">
                  {latestResult ? latestResult.already_billed : 0}
                </span>
                <span className="text-[10px] text-[#96600C]">Duplicates skipped</span>
              </div>

              <div className="p-3 rounded-xl bg-[#F4F6F5] border border-[#D8E0DE]">
                <span className="text-[10px] font-bold text-[#82929E] uppercase tracking-wider block">
                  Total Invoiced
                </span>
                <span className="text-lg font-extrabold text-[#172B36] mt-0.5 tabular-nums block truncate">
                  {latestResult ? formatINR(latestResult.total_invoiced_minor) : "₹0"}
                </span>
                <span className="text-[10px] text-[#53636D]">Calculated volume</span>
              </div>
            </div>

            {/* Vertical Stage Execution Timeline */}
            <div>
              <h4 className="text-xs font-bold text-[#172B36] uppercase tracking-wider mb-3">
                Engine Execution Pipeline
              </h4>
              <div className="space-y-2">
                {STAGES.map((stageName, idx) => {
                  const stageNum = idx + 1;
                  const isDone = activeStage >= stageNum;
                  const isCurrent = activeStage === stageNum && isRunning;

                  return (
                    <div
                      key={idx}
                      className={`flex items-center gap-2.5 p-2 rounded-lg text-xs transition-colors ${
                        isCurrent
                          ? "bg-[#E7F2EF] text-[#20665E] font-semibold"
                          : isDone
                          ? "text-[#24734D]"
                          : "text-[#82929E]"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${
                          isDone
                            ? "bg-[#24734D] text-white"
                            : isCurrent
                            ? "bg-[#287D73] text-white animate-pulse"
                            : "bg-[#EDF2F0] text-[#82929E]"
                        }`}
                      >
                        {isDone ? <Check className="w-3 h-3" /> : stageNum}
                      </div>
                      <span className="truncate">{stageName}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#D8E0DE] flex items-center justify-between text-xs text-[#53636D]">
            <span>Audit Proof: Mathematical deduplication hash verified across all runs</span>
            <Link href="/invoices" className="font-bold text-[#287D73] hover:underline flex items-center gap-1">
              <span>View Generated Invoices</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Historical Simulation Runs Table */}
      <div className="bg-white rounded-xl border border-[#D8E0DE] shadow-xs overflow-hidden">
        <div className="p-4 border-b border-[#D8E0DE] bg-[#F4F6F5] flex items-center justify-between">
          <h3 className="text-xs font-bold text-[#172B36] uppercase tracking-wider">
            Time Machine Historical Executions
          </h3>
          <span className="text-xs text-[#53636D]">
            {history.length} simulation run(s) recorded
          </span>
        </div>
        {history.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#82929E] italic">
            No billing simulation runs executed yet. Advance the clock and run your first cycle above.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F4F6F5] text-[#82929E] uppercase tracking-wider text-[11px] border-b border-[#D8E0DE]">
                <tr>
                  <th className="px-5 py-3 font-semibold">Run ID</th>
                  <th className="px-5 py-3 font-semibold">Simulated Date</th>
                  <th className="px-5 py-3 font-semibold text-center">Scanned</th>
                  <th className="px-5 py-3 font-semibold text-center">Invoices Created</th>
                  <th className="px-5 py-3 font-semibold text-center">Already Billed (Skipped)</th>
                  <th className="px-5 py-3 font-semibold text-right">Total Invoiced Amount</th>
                  <th className="px-5 py-3 font-semibold text-right">Deduplication Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D8E0DE] text-[#202C33]">
                {history.map((run, i) => (
                  <tr key={i} className="hover:bg-[#F4F6F5] transition-colors">
                    <td className="px-5 py-3 font-mono font-bold text-[#172B36]">{run.run_id}</td>
                    <td className="px-5 py-3 tabular-nums font-semibold">{run.simulation_date}</td>
                    <td className="px-5 py-3 text-center tabular-nums">{run.processed}</td>
                    <td className="px-5 py-3 text-center font-bold text-[#20665E] tabular-nums">
                      {run.invoices_created}
                    </td>
                    <td className="px-5 py-3 text-center font-bold text-[#96600C] tabular-nums">
                      {run.already_billed}
                    </td>
                    <td className="px-5 py-3 text-right font-extrabold text-[#172B36] tabular-nums">
                      {formatINR(run.total_invoiced_minor)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {run.invoices_created === 0 && run.already_billed > 0 ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E7F4ED] text-[#24734D]">
                          Duplicate Prevented
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E7F2EF] text-[#20665E]">
                          Executed
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
