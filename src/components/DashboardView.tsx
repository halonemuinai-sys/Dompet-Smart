"use client";

import React, { useState, useMemo } from "react";
import { useAppState } from "@/hooks/useAppState";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Percent,
  AlertCircle,
  HelpCircle,
  Clock,
  ArrowRight,
  ChevronRight,
  ShieldCheck,
  Zap,
  Plus,
  Minus,
  DollarSign,
  CreditCard,
  Coins,
  FileText,
  ShoppingBag,
  Calendar,
} from "lucide-react";

export function DashboardView({ onSwitchTab }: { onSwitchTab: (tab: string) => void }) {
  const {
    banks,
    transactions,
    budgets,
    deposits,
    cryptos,
    ecommerce,
    subscriptions,
  } = useAppState();

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return String(d.getMonth() + 1).padStart(2, "0");
  });
  const [selectedYear, setSelectedYear] = useState(() => {
    return String(new Date().getFullYear());
  });

  const [isBalanceHidden, setIsBalanceHidden] = useState(false);

  // Helper format rupiah
  const formatRp = (amount: number) => {
    if (isBalanceHidden) return "Rp ●●●●●●";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const periodString = `${selectedYear}-${selectedMonth}`;

  // Monthly stats memo
  const stats = useMemo(() => {
    let income = 0;
    let expense = 0;
    let savingsDiscount = 0;
    const catSpend: Record<string, number> = {};

    transactions.forEach((t) => {
      const tMonth = t.date ? t.date.slice(0, 7) : "";
      if (tMonth !== periodString) return;

      const amt = Number(t.amount) || 0;
      const disc = Number(t.discount) || 0;
      const isTransfer = t.category === "Transfer Masuk" || t.category === "Transfer Keluar" ||
                        t.categoryName === "Transfer Masuk" || t.categoryName === "Transfer Keluar";

      if (t.type === "income") {
        if (!isTransfer) income += amt;
      } else if (t.type === "expense") {
        if (!isTransfer) {
          expense += amt;
          savingsDiscount += disc;
          const cat = t.categoryName || t.category || "Lainnya";
          catSpend[cat] = (catSpend[cat] || 0) + amt;
        }
      }
    });

    const cashflow = income - expense;
    const savingRate = income > 0 ? Math.round((cashflow / income) * 100) : 0;

    return {
      income,
      expense,
      savingsDiscount,
      cashflow,
      savingRate,
      catSpend,
    };
  }, [transactions, periodString]);

  // Bank stats calculations
  const bankStats = useMemo(() => {
    let totalAssets = 0;
    let totalDebt = 0;

    banks.forEach((b) => {
      const bal = Number(b.currentBalance) || 0;
      const isDebt = b.account_type === "paylater" || b.account_type === "credit_card";
      if (isDebt) {
        if (bal < 0) totalDebt += Math.abs(bal);
      } else {
        totalAssets += bal;
      }
    });

    const activeDeposits = deposits
      .filter((d) => d.status === "active")
      .reduce((sum, d) => sum + (Number(d.amount) || 0), 0);

    const activeCryptos = cryptos.reduce((sum, c) => sum + (Number(c.value_idr) || 0), 0);

    const netWorth = totalAssets + activeDeposits + activeCryptos - totalDebt;

    return {
      totalAssets: totalAssets + activeDeposits + activeCryptos,
      totalDebt,
      activeDeposits,
      activeCryptos,
      netWorth,
    };
  }, [banks, deposits, cryptos]);

  // Financial health score
  const health = useMemo(() => {
    let score = 50;
    score += Math.min(30, stats.savingRate);

    const dti = stats.income > 0 ? bankStats.totalDebt / stats.income : (bankStats.totalDebt > 0 ? 1 : 0);
    score -= Math.min(25, Math.round(dti * 50));
    score = Math.max(10, Math.min(100, score));

    let badge = "WARNING";
    let badgeClass = "bg-rose-50 text-rose-600 border-rose-100";
    let tip = "Waspada! Pengeluaran atau hutang Anda cukup tinggi dibanding pemasukan.";

    if (score >= 80) {
      badge = "EXCELLENT";
      badgeClass = "bg-emerald-50 text-emerald-600 border-emerald-100";
      tip = "Kondisi keuangan sangat sehat! Pertahankan rasio menabung Anda.";
    } else if (score >= 60) {
      badge = "GOOD";
      badgeClass = "bg-emerald-50 text-emerald-600 border-emerald-100";
      tip = "Keuangan stabil. Coba kurangi cicilan/paylater untuk skor lebih tinggi.";
    }

    return { score, badge, badgeClass, tip, dti: Math.round(dti * 100) };
  }, [stats.savingRate, stats.income, bankStats.totalDebt]);

  // Forecast cashflow
  const forecast = useMemo(() => {
    const today = new Date();
    const isCurrentMonth = today.getFullYear().toString() === selectedYear &&
      String(today.getMonth() + 1).padStart(2, "0") === selectedMonth;

    if (!isCurrentMonth) {
      return { val: stats.cashflow, pct: 0, desc: "Berdasarkan data bulan terpilih." };
    }

    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const currentDay = today.getDate();
    const avgDailyExpense = currentDay > 0 ? stats.expense / currentDay : 0;
    const projectedExpense = avgDailyExpense * daysInMonth;
    const projectedCashflow = stats.income - projectedExpense;

    const diffPct = stats.income > 0 ? Math.round((projectedCashflow / stats.income) * 100) : 0;

    return {
      val: projectedCashflow,
      pct: diffPct,
      desc: stats.cashflow < 0
        ? "Waspada! Jika tren belanja berlanjut, pengeluaran Anda akan melebihi pemasukan bulan ini."
        : "Tren pengeluaran stabil. Diproyeksikan neraca kas Anda akan positif hingga akhir bulan.",
    };
  }, [stats.cashflow, stats.income, stats.expense, selectedMonth, selectedYear]);

  // Budgets calculations
  const budgetStats = useMemo(() => {
    const monthlyBudgets = budgets.filter((b) => b.month === periodString);
    let totalAllocated = 0;
    let totalSpentInBudgets = 0;

    monthlyBudgets.forEach((b) => {
      totalAllocated += Number(b.limit) || 0;
      totalSpentInBudgets += stats.catSpend[b.category] || 0;
    });

    const usagePct = totalAllocated > 0 ? Math.round((totalSpentInBudgets / totalAllocated) * 100) : 0;

    return {
      budgets: monthlyBudgets,
      totalAllocated,
      totalSpentInBudgets,
      usagePct,
    };
  }, [budgets, periodString, stats.catSpend]);

  // Top spending categories list (sorted)
  const topCategories = useMemo(() => {
    return Object.keys(stats.catSpend)
      .map((name) => ({ name, amount: stats.catSpend[name] }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 3);
  }, [stats.catSpend]);

  // Active Subscriptions
  const activeSubs = useMemo(() => {
    return subscriptions.filter((s) => s.status === "active").slice(0, 2);
  }, [subscriptions]);

  // Recent transactions list
  const recentTransactions = useMemo(() => {
    return transactions.slice(0, 5);
  }, [transactions]);

  // E-commerce monthly total
  const ecomMonthlyTotal = useMemo(() => {
    return ecommerce
      .filter((e) => e.date && e.date.slice(0, 7) === periodString)
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [ecommerce, periodString]);

  // Dynamic layout helper properties
  const sisaBudget = budgetStats.totalAllocated > 0
    ? (budgetStats.totalAllocated - budgetStats.totalSpentInBudgets)
    : stats.cashflow;

  const sisaBudgetText = sisaBudget < 0 ? "Over budget!" : "Sisa anggaran";

  const budgetTotalSpent = budgetStats.totalAllocated > 0 ? budgetStats.totalSpentInBudgets : stats.expense;
  const budgetTotalLimit = budgetStats.totalAllocated > 0 ? budgetStats.totalAllocated : stats.income;
  const budgetUsagePercentage = budgetTotalLimit > 0 ? Math.round((budgetTotalSpent / budgetTotalLimit) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            Dashboard
          </h1>
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mt-1">
            Ringkasan keuangan Anda bulan{" "}
            <span className="text-emerald-600 font-black">
              {new Date(parseInt(selectedYear), parseInt(selectedMonth) - 1).toLocaleString("id-ID", {
                month: "long",
                year: "numeric",
              })}
            </span>
          </p>
        </div>

        {/* Right side: Period selector and NET CASH FLOW */}
        <div className="flex flex-wrap items-center gap-6">
          {/* Period Selector */}
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
              Pilih Periode
            </span>
            <div className="flex gap-1.5">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 bg-white outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-sm"
              >
                <option value="01">Jan</option>
                <option value="02">Feb</option>
                <option value="03">Mar</option>
                <option value="04">Apr</option>
                <option value="05">Mei</option>
                <option value="06">Jun</option>
                <option value="07">Jul</option>
                <option value="08">Ags</option>
                <option value="09">Sep</option>
                <option value="10">Okt</option>
                <option value="11">Nov</option>
                <option value="12">Des</option>
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 bg-white outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-sm"
              >
                <option value="2024">2024</option>
                <option value="2025">2025</option>
                <option value="2026">2026</option>
                <option value="2027">2027</option>
              </select>
            </div>
          </div>

          {/* Net Cash Flow summary label */}
          <div className="text-right">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">
              Net Cash Flow
            </p>
            <p className={`text-lg font-black tracking-tight ${stats.cashflow >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
              {stats.cashflow >= 0 ? "+" : ""}
              {formatRp(stats.cashflow)}
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards Row (7 Cards Layout) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {/* 1. Total Saldo */}
        <div className="bg-slate-900 text-white rounded-2xl p-4 flex flex-col justify-between border border-slate-800 shadow-sm min-h-[110px] relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-12 h-12 bg-emerald-500/10 rounded-bl-full pointer-events-none" />
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[8px] font-bold uppercase tracking-wider">Total Saldo</span>
            <Wallet className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3">
            <h3 className="text-base font-black tracking-tight leading-tight truncate">
              {formatRp(bankStats.totalAssets)}
            </h3>
            <p className="text-[9px] text-slate-500 mt-0.5">{banks.length} Akun</p>
          </div>
        </div>

        {/* 2. Pemasukan */}
        <div className="bg-white rounded-2xl p-4 flex flex-col justify-between border border-slate-100 hover:border-emerald-200 transition-colors shadow-sm min-h-[110px] relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-12 h-12 bg-emerald-50 rounded-bl-full pointer-events-none" />
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[8px] font-bold uppercase tracking-wider">Pemasukan</span>
            <div className="p-1 bg-emerald-50 rounded text-emerald-600">
              <Plus className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-base font-black tracking-tight leading-tight text-emerald-600 truncate">
              {formatRp(stats.income)}
            </h3>
            <p className="text-[9px] text-slate-400 mt-0.5">Gaji & lainnya</p>
          </div>
        </div>

        {/* 3. Pengeluaran */}
        <div className="bg-white rounded-2xl p-4 flex flex-col justify-between border border-slate-100 hover:border-rose-200 transition-colors shadow-sm min-h-[110px] relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-12 h-12 bg-rose-50 rounded-bl-full pointer-events-none" />
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[8px] font-bold uppercase tracking-wider">Pengeluaran</span>
            <div className="p-1 bg-rose-50 rounded text-rose-600">
              <TrendingDown className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-base font-black tracking-tight leading-tight text-rose-600 truncate">
              {formatRp(stats.expense)}
            </h3>
            <p className="text-[9px] text-slate-400 mt-0.5">Bulan ini</p>
          </div>
        </div>

        {/* 4. Sisa Budget */}
        <div className="bg-white rounded-2xl p-4 flex flex-col justify-between border border-slate-100 hover:border-emerald-200 transition-colors shadow-sm min-h-[110px] relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-12 h-12 bg-emerald-50 rounded-bl-full pointer-events-none" />
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[8px] font-bold uppercase tracking-wider">Sisa Budget</span>
            <div className="p-1 bg-emerald-50 rounded text-emerald-600">
              <FileText className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className={`text-base font-black tracking-tight leading-tight truncate ${sisaBudget >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
              {sisaBudget >= 0 ? "+" : ""}
              {formatRp(sisaBudget)}
            </h3>
            <p className={`text-[9px] font-bold mt-0.5 ${sisaBudget >= 0 ? "text-slate-400" : "text-rose-500"}`}>
              {sisaBudgetText}
            </p>
          </div>
        </div>

        {/* 5. Total Hemat */}
        <div className="bg-white rounded-2xl p-4 flex flex-col justify-between border border-slate-100 hover:border-teal-200 transition-colors shadow-sm min-h-[110px] relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-12 h-12 bg-teal-50/50 rounded-bl-full pointer-events-none" />
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[8px] font-bold uppercase tracking-wider">Total Hemat</span>
            <div className="p-1 bg-teal-50 rounded text-teal-600">
              <Coins className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-base font-black tracking-tight leading-tight text-teal-600 truncate">
              {formatRp(stats.savingsDiscount)}
            </h3>
            <p className="text-[9px] text-slate-400 mt-0.5">Diskon belanja</p>
          </div>
        </div>

        {/* 6. Total Hutang */}
        <div className="bg-white rounded-2xl p-4 flex flex-col justify-between border border-slate-100 hover:border-orange-200 transition-colors shadow-sm min-h-[110px] relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-12 h-12 bg-orange-50/50 rounded-bl-full pointer-events-none" />
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[8px] font-bold uppercase tracking-wider">Total Hutang</span>
            <div className="p-1 bg-orange-50 rounded text-orange-600">
              <CreditCard className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-base font-black tracking-tight leading-tight text-orange-600 truncate">
              {formatRp(bankStats.totalDebt)}
            </h3>
            <p className="text-[9px] text-slate-400 mt-0.5">Paylater & CC</p>
          </div>
        </div>

        {/* 7. Saving Rate Card */}
        <div className="bg-emerald-600 text-white rounded-2xl p-4 flex items-center justify-between shadow-md min-h-[110px] relative overflow-hidden group">
          <div className="relative w-12 h-12 shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="rgba(255,255,255,0.15)"
                strokeWidth="3.5"
              />
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#ffffff"
                strokeWidth="3.5"
                strokeDasharray={`${Math.max(0, Math.min(100, stats.savingRate))}, 100`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[9px] font-black text-white">{stats.savingRate}%</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[8px] font-bold text-emerald-200 uppercase tracking-widest">Saving Rate</span>
            <h3 className="text-base font-black leading-none mt-0.5">{stats.savingRate}%</h3>
            <p className="text-[7px] text-emerald-100/75 mt-1 leading-normal">% tersisa dari pemasukan</p>
          </div>
        </div>
      </div>

      {/* Financial Health, Forecast & Top Categories Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Financial Health */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between relative overflow-hidden min-h-[220px]">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                Financial Health
              </h3>
              <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold border ${health.badgeClass}`}>
                {health.badge}
              </span>
            </div>

            <div className="flex items-center gap-6 mt-3">
              {/* Score circle */}
              <div className="relative w-20 h-20 shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#f1f5f9"
                    strokeWidth="3.5"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="url(#healthGradDashboard)"
                    strokeWidth="3.5"
                    strokeDasharray={`${health.score}, 100`}
                    strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient id="healthGradDashboard" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#14b8a6" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-lg font-black text-slate-800 leading-none">{health.score}</span>
                  <span className="text-[7px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Score</span>
                </div>
              </div>

              {/* Tips & Details */}
              <div className="space-y-3 flex-1">
                <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                  {health.tip}
                </p>

                {/* Sub KPI Small Cards */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                    <p className="text-[7px] text-slate-400 font-bold uppercase tracking-wider">Debt Ratio</p>
                    <p className="text-[10px] font-extrabold text-slate-700">{health.dti}%</p>
                  </div>
                  <div className="bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                    <p className="text-[7px] text-slate-400 font-bold uppercase tracking-wider">Savings</p>
                    <p className={`text-[10px] font-extrabold ${stats.savingRate >= 20 ? "text-emerald-600" : "text-rose-500"}`}>
                      {stats.savingRate >= 20 ? "Ideal" : "Low"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Ramalan Arus Kas / Forecast */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-2xl p-6 shadow-md relative overflow-hidden flex flex-col justify-between min-h-[220px]">
          <div className="absolute top-0 right-0 p-4 opacity-15">
            <Zap className="w-16 h-16" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-emerald-200 uppercase tracking-widest">
              Ramalan Arus Kas
            </h3>
            <p className="text-[8px] font-bold text-emerald-300 uppercase tracking-widest mt-0.5">
              Monthly Cashflow Forecast
            </p>
            <div className="flex items-center gap-2 mt-4">
              <h2 className="text-2xl font-black tracking-tight">{formatRp(forecast.val)}</h2>
              <span className={`text-[9px] font-extrabold bg-white/20 border border-white/10 px-2 py-0.5 rounded-full uppercase`}>
                {forecast.val >= 0 ? "Surplus" : "Defisit"}
              </span>
            </div>
            <p className="text-xs text-emerald-100/90 leading-relaxed font-semibold mt-3">
              {forecast.desc}
            </p>
          </div>
          <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-white h-full transition-all duration-1000"
              style={{ width: `${Math.max(10, Math.min(100, stats.savingRate))}%` }}
            />
          </div>
        </div>

        {/* Alokasi Terbesar */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between min-h-[220px]">
          <div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-4 pb-2 border-b border-slate-50">
              Alokasi Terbesar
            </h3>

            <div className="space-y-4">
              {topCategories.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6 italic">
                  Belum ada data pengeluaran dicatat.
                </p>
              ) : (
                topCategories.map((cat, i) => {
                  const colors = ["bg-emerald-600", "bg-blue-500", "bg-teal-500"];
                  const pct = stats.expense > 0 ? Math.round((cat.amount / stats.expense) * 100) : 0;
                  return (
                    <div key={cat.name} className="space-y-1">
                      <div className="flex justify-between text-xs font-bold text-slate-700">
                        <span className="truncate max-w-[150px]">{cat.name}</span>
                        <span>
                          {new Intl.NumberFormat("id-ID").format(cat.amount)} ({pct}%)
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${colors[i] || "bg-slate-400"} rounded-full`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Penggunaan Budget Bulan Ini (Full Width Progress) */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-3">
        <div className="flex justify-between items-center text-xs font-bold text-slate-700">
          <span className="uppercase tracking-wider">Penggunaan Budget Bulan Ini</span>
          <span className={budgetUsagePercentage >= 90 ? "text-rose-500 font-extrabold" : "text-emerald-600 font-extrabold"}>
            {budgetUsagePercentage}% terpakai
          </span>
        </div>

        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              budgetUsagePercentage >= 90
                ? "bg-rose-500"
                : budgetUsagePercentage >= 75
                ? "bg-amber-500"
                : "bg-emerald-600"
            }`}
            style={{ width: `${Math.min(100, budgetUsagePercentage)}%` }}
          />
        </div>

        <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold">
          <span>{formatRp(budgetTotalSpent)}</span>
          <span>Target: {formatRp(budgetTotalLimit)}</span>
        </div>
      </div>

      {/* Smart Financial Advisor Alert Insight */}
      <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-5 shadow-sm flex items-start gap-4">
        <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-md shrink-0">
          <Zap className="w-4 h-4" />
        </div>
        <div className="space-y-1.5 flex-1">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-black text-emerald-900 uppercase tracking-wider">
              Smart Financial Advisor
            </h4>
            <span className="text-[8px] bg-emerald-100 text-emerald-600 border border-emerald-200 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
              INSIGHT
            </span>
          </div>
          <p className="text-xs text-emerald-800 leading-relaxed font-semibold">
            {stats.income === 0 ? (
              "Belum ada pemasukan tercatat untuk periode ini. Masukkan data pemasukan utama Anda untuk menganalisa target menabung ideal 20%."
            ) : stats.cashflow < 0 ? (
              `Waspada! Pengeluaran Anda melebihi pemasukan sebesar ${formatRp(
                Math.abs(stats.cashflow)
              )}. Segera tinjau pengeluaran terbesar Anda!`
            ) : stats.savingRate >= 20 ? (
              `Luar biasa! Rasio menabung Anda mencapai ${stats.savingRate}% (${formatRp(
                stats.cashflow
              )}). Anda di jalur yang tepat menuju kebebasan finansial!`
            ) : (
              `Anda berhasil menghemat ${stats.savingRate}%. Butuh tambahan hemat sekitar ${formatRp(
                stats.income * 0.2 - stats.cashflow
              )} lagi bulan ini agar mencapai rasio tabungan ideal sebesar 20%.`
            )}
          </p>
        </div>
      </div>

      {/* Bottom KPI & Tracking Section (Without Transaksi Terakhir, Perfectly Balanced) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Asset & Portfolio Summary */}
        <div className="space-y-4">
          {/* Kekayaan Bersih */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between min-h-[125px] relative overflow-hidden group">
            <div className="absolute right-0 top-0 w-24 h-24 bg-gradient-to-bl from-emerald-50 to-transparent rounded-bl-full pointer-events-none transition-all group-hover:scale-110" />
            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Kekayaan Bersih
              </span>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight mt-2">
                {formatRp(bankStats.netWorth)}
              </h3>
              <p className="text-[10px] text-slate-400 mt-2 leading-relaxed font-semibold">
                Formulasi: Saldo + Deposito ({formatRp(bankStats.activeDeposits)}) + Kripto ({formatRp(bankStats.activeCryptos)}) &minus; Hutang/Paylater ({formatRp(bankStats.totalDebt)})
              </p>
            </div>
          </div>

          {/* Deposito & Kripto in a 2-column grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Deposito */}
            <div
              onClick={() => onSwitchTab("portfolio")}
              className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center justify-between hover:border-emerald-200 hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <Percent className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block">
                    Deposito
                  </span>
                  <span className="text-xs font-black text-slate-700 mt-0.5 block">
                    {formatRp(bankStats.activeDeposits)}
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 transition-colors" />
            </div>

            {/* Kripto */}
            <div
              onClick={() => onSwitchTab("portfolio")}
              className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center justify-between hover:border-amber-200 hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-50 text-amber-500 rounded-xl">
                  <Coins className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block">
                    Kripto
                  </span>
                  <span className="text-xs font-black text-slate-700 mt-0.5 block">
                    {formatRp(bankStats.activeCryptos)}
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-amber-500 transition-colors" />
            </div>
          </div>
        </div>

        {/* Right Column: E-commerce, Budget & Subscriptions */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* E-Commerce */}
            <div
              onClick={() => onSwitchTab("ecommerce")}
              className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center justify-between hover:border-orange-200 hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-50 text-orange-500 rounded-xl">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block">
                    E-Commerce
                  </span>
                  <span className="text-xs font-black text-slate-700 mt-0.5 block">
                    {formatRp(ecomMonthlyTotal)}
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-orange-500 transition-colors" />
            </div>

            {/* Status Budget */}
            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex flex-col justify-between min-h-[76px]">
              <div className="flex justify-between items-center">
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-emerald-500" /> Status Budget
                </span>
                <button
                  onClick={() => onSwitchTab("budget")}
                  className="text-[8px] text-emerald-600 font-extrabold hover:underline cursor-pointer"
                >
                  Kelola &rarr;
                </button>
              </div>

              <div className="mt-1">
                {budgetStats.totalAllocated === 0 ? (
                  <button
                    onClick={() => onSwitchTab("budget")}
                    className="text-[10px] text-emerald-600 font-black hover:underline block text-left"
                  >
                    Set Budget Sekarang
                  </button>
                ) : (
                  <div className="space-y-1">
                    <div className="flex justify-between text-[8px] font-bold text-slate-500">
                      <span>Terpakai {budgetStats.usagePct}%</span>
                      <span>Sisa {formatRp(Math.max(0, budgetStats.totalAllocated - budgetStats.totalSpentInBudgets))}</span>
                    </div>
                    <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-600 rounded-full"
                        style={{ width: `${Math.min(100, budgetStats.usagePct)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tagihan Langganan */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between min-h-[125px] relative overflow-hidden group">
            <div className="flex justify-between items-center border-b border-slate-50 pb-2">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-emerald-500" /> Tagihan Langganan
              </span>
              <button
                onClick={() => onSwitchTab("subscription")}
                className="text-[9px] text-emerald-600 font-extrabold hover:underline cursor-pointer"
              >
                Detail &rarr;
              </button>
            </div>

            <div className="flex-1 flex flex-col justify-center mt-2.5">
              {activeSubs.length === 0 ? (
                <p className="text-center text-xs text-slate-400 font-semibold py-2">Tidak ada tagihan mendesak.</p>
              ) : (
                <div className="space-y-2">
                  {activeSubs.map((sub) => (
                    <div key={sub.id} className="flex justify-between items-center text-xs">
                      <div className="truncate max-w-[200px]">
                        <p className="font-bold text-slate-700 truncate">{sub.name}</p>
                        <p className="text-[9px] text-slate-400 font-medium">Jatuh Tempo: {sub.due_date} ({sub.billing_cycle})</p>
                      </div>
                      <span className="font-black text-slate-600 shrink-0">{formatRp(sub.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
