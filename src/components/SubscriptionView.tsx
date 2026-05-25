"use client";

import React, { useState, useMemo } from "react";
import { useAppState } from "@/hooks/useAppState";
import {
  Bell,
  Plus,
  Trash2,
  Calendar,
  Layers,
  CreditCard,
  CheckCircle,
  XCircle,
} from "lucide-react";

export function SubscriptionView() {
  const {
    banks,
    categories,
    subscriptions,
    addSubscription,
    updateSubscription,
    deleteSubscription,
  } = useAppState();

  // Form states
  const [subName, setSubName] = useState("");
  const [subEmail, setSubEmail] = useState("");
  const [subAmount, setSubAmount] = useState("");
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [dueDate, setDueDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [categorySelect, setCategorySelect] = useState("");
  const [bankId, setBankId] = useState("");

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

  // Build category hierarchy options
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

  // Submit subscription
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!subName || !subAmount || !billingCycle || !dueDate || !categorySelect || !bankId) {
      alert("Isi data tagihan langganan dengan lengkap!");
      return;
    }

    const cleanAmt = cleanNumber(subAmount);
    if (cleanAmt <= 0) {
      alert("Nominal tagihan harus valid!");
      return;
    }

    const parts = categorySelect.split(" - ");
    const categoryName = parts.length > 1 ? parts[0] : categorySelect;

    const payload = {
      name: subName,
      email: subEmail,
      amount: cleanAmt,
      billingCycle,
      dueDate,
      categoryName,
      bankId,
    };

    const res = await addSubscription(payload);
    if (res.status === "success") {
      setSubName("");
      setSubEmail("");
      setSubAmount("");
      setDueDate(new Date().toISOString().split("T")[0]);
      alert("Tagihan langganan berhasil disimpan!");
    } else {
      alert(res.message || "Gagal menyimpan data.");
    }
  };

  // Toggle active/inactive status
  const handleToggleStatus = async (sub: any) => {
    const nextStatus = sub.status === "active" ? "inactive" : "active";
    const res = await updateSubscription({
      id: sub.id,
      name: sub.name,
      email: sub.email,
      amount: sub.amount,
      billingCycle: sub.billing_cycle,
      dueDate: sub.due_date,
      categoryName: sub.category,
      bankId: sub.bank_id,
      status: nextStatus,
    });
    if (res.status !== "success") {
      alert(res.message || "Gagal memperbarui status.");
    }
  };

  // Delete subscription
  const handleDeleteClick = async (id: string) => {
    if (confirm("Hapus catatan langganan ini?")) {
      const res = await deleteSubscription(id);
      if (res.status !== "success") {
        alert(res.message || "Gagal menghapus data.");
      }
    }
  };

  // Monthly total calculation
  const monthlyTotal = useMemo(() => {
    return subscriptions
      .filter((s) => s.status === "active" && s.billing_cycle === "monthly")
      .reduce((sum, s) => sum + Number(s.amount), 0);
  }, [subscriptions]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Form Column */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4">
            Tambah Tagihan Langganan
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Nama Layanan
              </label>
              <input
                type="text"
                required
                value={subName}
                onChange={(e) => setSubName(e.target.value)}
                placeholder="Misal: Netflix, Spotify, iCloud"
                className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            {/* Email (optional) */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Email Terdaftar <span className="text-slate-300">(Opsional)</span>
              </label>
              <input
                type="email"
                value={subEmail}
                onChange={(e) => setSubEmail(e.target.value)}
                placeholder="Misal: user@mail.com"
                className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            {/* Amount */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Nominal Tagihan
              </label>
              <input
                type="text"
                required
                value={subAmount}
                onChange={(e) => handleAmountChange(e.target.value, setSubAmount)}
                placeholder="Rp 0"
                className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Cycle */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Siklus Tagihan
                </label>
                <select
                  value={billingCycle}
                  onChange={(e) => setBillingCycle(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="monthly">Bulanan</option>
                  <option value="yearly">Tahunan</option>
                </select>
              </div>

              {/* Due date */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Jatuh Tempo
                </label>
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Kategori Pengeluaran
              </label>
              <select
                required
                value={categorySelect}
                onChange={(e) => setCategorySelect(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-3 text-sm bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
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

            {/* Funding account */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Sumber Dana Pembayaran
              </label>
              <select
                required
                value={bankId}
                onChange={(e) => setBankId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-3 text-sm bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                <option value="">Pilih Akun Bank...</option>
                {banks.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold text-sm shadow-md shadow-violet-200/50 transition-transform hover:scale-[1.01]"
            >
              Catat Langganan
            </button>
          </form>
        </div>
      </div>

      {/* Display List Column */}
      <div className="lg:col-span-2 space-y-6">
        {/* Total Stats */}
        <div className="bg-violet-50 border border-violet-100 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Total Tagihan Bulanan (Bulanan Aktif)
            </p>
            <h3 className="text-xl font-black text-violet-700 mt-1">{formatRp(monthlyTotal)}</h3>
          </div>
          <div className="p-3 bg-violet-600 text-white rounded-2xl">
            <Bell className="w-6 h-6" />
          </div>
        </div>

        {/* Display Items List */}
        <div className="space-y-4">
          {subscriptions.length === 0 ? (
            <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center text-slate-400 font-semibold shadow-sm">
              Belum ada data tagihan langganan yang dicatat.
            </div>
          ) : (
            subscriptions.map((s) => {
              const isActive = s.status === "active";
              return (
                <div
                  key={s.id}
                  className={`bg-white rounded-2xl p-5 border border-slate-100 shadow-sm relative overflow-hidden group flex flex-col sm:flex-row justify-between sm:items-center gap-4 ${
                    !isActive ? "opacity-60 bg-slate-50/50" : ""
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-slate-800 text-sm leading-none">
                        {s.name}
                      </h4>
                      <span
                        className={`text-[8px] uppercase tracking-wider font-bold px-2 py-0.5 rounded border ${
                          isActive
                            ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                            : "bg-slate-100 text-slate-500 border-slate-200"
                        }`}
                      >
                        {isActive ? "Aktif" : "Nonaktif"}
                      </span>
                    </div>
                    {s.email && (
                      <p className="text-[10px] text-slate-400 font-mono">{s.email}</p>
                    )}
                    <p className="text-[10px] text-slate-400 font-semibold mt-1">
                      Kategori: <span className="font-bold text-slate-700">{s.category}</span> &bull; Pembayaran:{" "}
                      <span className="font-bold text-slate-700">{s.bank_name}</span>
                    </p>
                    <div className="flex items-center gap-3 text-[9px] text-slate-400 font-semibold mt-1">
                      <span>Jatuh Tempo: {s.due_date}</span>
                      <span>&bull;</span>
                      <span className="capitalize">Siklus: {s.billing_cycle === "monthly" ? "Bulanan" : "Tahunan"}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                    <span className="font-black text-slate-700 text-base">{formatRp(s.amount)}</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleToggleStatus(s)}
                        className={`py-1 px-2.5 rounded-lg font-bold text-[9px] border transition-all ${
                          isActive
                            ? "bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200"
                            : "bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border-emerald-100"
                        }`}
                      >
                        {isActive ? "Nonaktifkan" : "Aktifkan"}
                      </button>
                      <button
                        onClick={() => handleDeleteClick(s.id)}
                        className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Hapus Langganan"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
