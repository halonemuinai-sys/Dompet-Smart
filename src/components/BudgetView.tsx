"use client";

import React, { useState, useMemo } from "react";
import { useAppState } from "@/hooks/useAppState";
import {
  TrendingUp,
  Percent,
  Plus,
  Trash2,
  Calendar,
  AlertCircle,
  PiggyBank,
  CheckCircle,
} from "lucide-react";

export function BudgetView() {
  const {
    categories,
    transactions,
    budgets,
    saveBudget,
    deleteBudget,
  } = useAppState();

  const [budgetMonth, setBudgetMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  const [filterMonth, setFilterMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  // Form states
  const [budgetCategory, setBudgetCategory] = useState("");
  const [budgetAmount, setBudgetAmount] = useState("");

  const formatRp = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(val);
  };

  const cleanNumber = (str: string) => {
    const clean = str.replace(/\D/g, "");
    return clean ? parseInt(clean, 10) : 0;
  };

  const handleAmountChange = (val: string, setter: (s: string) => void) => {
    const num = cleanNumber(val);
    setter(num ? new Intl.NumberFormat("id-ID").format(num) : "");
  };

  // Build category hierarchy options for dropdown
  const categoryOptions = useMemo(() => {
    const parents = categories.filter((c) => c.type === "expense" && !c.parentId);
    const list: { id: string; name: string; isParent: boolean; parentName?: string }[] = [];

    parents.forEach((p) => {
      const children = categories.filter((c) => c.parentId === p.id);
      if (children.length > 0) {
        list.push({ id: p.id, name: p.name, isParent: true });
        children.forEach((ch) => {
          list.push({ id: ch.id, name: ch.name, isParent: false, parentName: p.name });
        });
      } else {
        list.push({ id: p.id, name: p.name, isParent: false });
      }
    });
    return list;
  }, [categories]);

  // Filter budgets and calculate category expenditures
  const budgetsThisMonth = useMemo(() => {
    const list = budgets.filter((b) => b.month === filterMonth);

    // Calculate actual expenditure per category for this month
    const spentPerCat: Record<string, number> = {};
    transactions.forEach((t) => {
      const tMonth = t.date ? t.date.slice(0, 7) : "";
      if (tMonth !== filterMonth) return;

      if (t.type === "expense" && t.category !== "Transfer Keluar") {
        const cat = t.category || "Lainnya";
        spentPerCat[cat] = (spentPerCat[cat] || 0) + (Number(t.amount) || 0);
      }
    });

    let totalAllocated = 0;
    let totalSpent = 0;

    const data = list.map((b) => {
      const spent = spentPerCat[b.category] || 0;
      const limit = Number(b.limit) || 0;
      totalAllocated += limit;
      totalSpent += spent;

      const pctRaw = limit > 0 ? (spent / limit) * 100 : 0;
      const pct = Math.min(100, Math.round(pctRaw));

      let colorClass = "bg-emerald-500";
      let bgClass = "bg-emerald-50 border-emerald-100 text-emerald-600";
      if (pct >= 90) {
        colorClass = "bg-rose-500";
        bgClass = "bg-rose-50 border-rose-100 text-rose-600";
      } else if (pct >= 75) {
        colorClass = "bg-amber-500";
        bgClass = "bg-amber-50 border-amber-100 text-amber-600";
      }

      const remaining = limit - spent;
      const isOver = remaining < 0;

      return {
        ...b,
        limit,
        spent,
        pct,
        pctRaw,
        remaining,
        isOver,
        colorClass,
        bgClass,
      };
    });

    const totalPct = totalAllocated > 0 ? Math.round((totalSpent / totalAllocated) * 100) : 0;

    return {
      budgets: data,
      totalAllocated,
      totalSpent,
      totalPct,
    };
  }, [budgets, transactions, filterMonth]);

  // Submit budget
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!budgetMonth || !budgetCategory || !budgetAmount) {
      alert("Pilih bulan, kategori, dan isi nominal budget!");
      return;
    }

    const cleanAmt = cleanNumber(budgetAmount);
    if (cleanAmt <= 0) {
      alert("Nominal budget harus valid!");
      return;
    }

    // Resolve Category Name (use parent if subcategory)
    const parts = budgetCategory.split(" - ");
    const categoryName = parts.length > 1 ? parts[0] : budgetCategory;

    const res = await saveBudget(budgetMonth, categoryName, cleanAmt);
    if (res.status === "success") {
      setBudgetAmount("");
      alert("Budget berhasil disimpan!");
    } else {
      alert(res.message || "Gagal menyimpan budget.");
    }
  };

  // Delete budget
  const handleDeleteClick = async (id: string) => {
    if (confirm("Hapus limit budget ini?")) {
      const res = await deleteBudget(id);
      if (res.status !== "success") {
        alert(res.message || "Gagal menghapus budget.");
      }
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Form Column */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4">
            Set Batasan Anggaran
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Month */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Pilih Bulan
              </label>
              <input
                type="month"
                required
                value={budgetMonth}
                onChange={(e) => setBudgetMonth(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-3 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Kategori Pengeluaran
              </label>
              <select
                required
                value={budgetCategory}
                onChange={(e) => setBudgetCategory(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-3 text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="">-- Pilih Kategori --</option>
                {categoryOptions.map((opt, i) => (
                  <option
                    key={i}
                    value={opt.isParent ? opt.name : `${opt.parentName} - ${opt.name}`}
                    disabled={opt.isParent}
                    className={opt.isParent ? "font-bold bg-slate-100 text-slate-800" : ""}
                  >
                    {opt.isParent ? `● ${opt.name.toUpperCase()}` : `   └─ ${opt.name}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Limit Anggaran
              </label>
              <input
                type="text"
                required
                value={budgetAmount}
                onChange={(e) => handleAmountChange(e.target.value, setBudgetAmount)}
                placeholder="Rp 0"
                className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-md shadow-indigo-100 transition-transform hover:scale-[1.01]"
            >
              Simpan Limit Budget
            </button>
          </form>
        </div>
      </div>

      {/* Grid Display Column */}
      <div className="lg:col-span-2 space-y-6">
        {/* Total Summary */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Monitoring Anggaran
              </p>
              <h3 className="text-xl font-black text-slate-800 mt-1">
                {formatRp(budgetsThisMonth.totalSpent)} /{" "}
                <span className="text-slate-400 font-bold">
                  {formatRp(budgetsThisMonth.totalAllocated)}
                </span>
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Filter:
              </span>
              <input
                type="month"
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 bg-white outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-sm"
              />
            </div>
          </div>

          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                budgetsThisMonth.totalPct >= 90
                  ? "bg-rose-500"
                  : budgetsThisMonth.totalPct >= 75
                  ? "bg-amber-500"
                  : "bg-indigo-600"
              }`}
              style={{ width: `${Math.min(100, budgetsThisMonth.totalPct)}%` }}
            />
          </div>

          <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            <span>Terpakai: {budgetsThisMonth.totalPct}%</span>
            <span>
              Sisa Limit:{" "}
              {formatRp(Math.max(0, budgetsThisMonth.totalAllocated - budgetsThisMonth.totalSpent))}
            </span>
          </div>
        </div>

        {/* Display Items List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {budgetsThisMonth.budgets.length === 0 ? (
            <div className="col-span-2 bg-white border border-slate-100 rounded-2xl p-12 text-center text-slate-400 font-semibold shadow-sm">
              Belum ada limit budget diatur untuk bulan ini.
            </div>
          ) : (
            budgetsThisMonth.budgets.map((b) => (
              <div
                key={b.id}
                className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm relative overflow-hidden group flex flex-col justify-between min-h-[140px]"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-xl border ${b.bgClass}`}>
                      <PiggyBank className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-800 text-sm leading-none">
                        {b.category}
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-1">Limit: {formatRp(b.limit)}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteClick(b.id)}
                    className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                    title="Hapus"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="mt-4">
                  <div className="flex justify-between text-[10px] font-bold mb-1 items-end">
                    <span className={`font-semibold ${b.isOver ? "text-rose-600" : "text-slate-600"}`}>
                      {formatRp(b.spent)} terpakai
                    </span>
                    <span className={b.isOver ? "text-rose-600 font-black" : "text-slate-600 font-black"}>
                      {b.pctRaw.toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${b.colorClass} rounded-full`}
                      style={{ width: `${b.pct}%` }}
                    />
                  </div>
                  <p
                    className={`text-[9px] text-right font-bold mt-1.5 uppercase ${
                      b.isOver ? "text-rose-500" : "text-slate-400"
                    }`}
                  >
                    {b.isOver ? `Over budget ${formatRp(Math.abs(b.remaining))}` : `Sisa ${formatRp(b.remaining)}`}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
