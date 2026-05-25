"use client";

import React, { useState, useMemo } from "react";
import { useAppState } from "@/hooks/useAppState";
import {
  ShoppingBag,
  Plus,
  Trash2,
  Calendar,
  Layers,
  CreditCard,
  ExternalLink,
} from "lucide-react";

export function EcommerceView() {
  const {
    banks,
    categories,
    ecomPlatforms,
    ecommerce,
    addEcomTransaction,
    deleteEcomTransaction,
  } = useAppState();

  // Form states
  const [purchaseDate, setPurchaseDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [platformId, setPlatformId] = useState("");
  const [itemName, setItemName] = useState("");
  const [categorySelect, setCategorySelect] = useState("");
  const [amount, setAmount] = useState("");
  const [bankId, setBankId] = useState("");
  const [tenor, setTenor] = useState("1"); // Default: 1 month (no installment)

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

  // Submit shopping log
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!purchaseDate || !platformId || !itemName || !categorySelect || !amount || !bankId) {
      alert("Isi data belanja dengan lengkap!");
      return;
    }

    const cleanAmt = cleanNumber(amount);
    if (cleanAmt <= 0) {
      alert("Nominal belanja harus valid!");
      return;
    }

    // Resolve Category Name (use parent if subcategory)
    const parts = categorySelect.split(" - ");
    const categoryName = parts.length > 1 ? parts[0] : categorySelect;

    const payload = {
      date: purchaseDate,
      platformId,
      itemName,
      categoryName,
      amount: cleanAmt,
      bankId,
      tenor: parseInt(tenor, 10),
    };

    const res = await addEcomTransaction(payload);
    if (res.status === "success") {
      setItemName("");
      setAmount("");
      setTenor("1");
      alert("Transaksi e-commerce dan pengeluaran kas berhasil disimpan!");
    } else {
      alert(res.message || "Gagal menyimpan data.");
    }
  };

  // Delete transaction
  const handleDeleteClick = async (id: string) => {
    if (confirm("Hapus catatan belanja ini? Pengeluaran kas terkait juga akan ikut dihapus!")) {
      const res = await deleteEcomTransaction(id);
      if (res.status !== "success") {
        alert(res.message || "Gagal menghapus data.");
      }
    }
  };

  // Total summary calculation
  const totalSpend = useMemo(() => {
    return ecommerce.reduce((sum, e) => sum + Number(e.amount), 0);
  }, [ecommerce]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Form Column */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4">
            Catat Belanja Online
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Platform */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Platform E-Commerce
              </label>
              <select
                required
                value={platformId}
                onChange={(e) => setPlatformId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-3 text-sm bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                <option value="">Pilih Platform...</option>
                {ecomPlatforms.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.platform} {p.store_name ? `(${p.store_name})` : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Item Name */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Nama Barang
              </label>
              <input
                type="text"
                required
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="Misal: Sepatu Olahraga Mizuno"
                className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
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

            {/* Amount */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Total Belanja
              </label>
              <input
                type="text"
                required
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value, setAmount)}
                placeholder="Rp 0"
                className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Date */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Tanggal
                </label>
                <input
                  type="date"
                  required
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              {/* Tenor / Installments */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Tenor (Cicilan)
                </label>
                <select
                  value={tenor}
                  onChange={(e) => setTenor(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="1">Tunai (1x)</option>
                  <option value="3">3 Bulan</option>
                  <option value="6">6 Bulan</option>
                  <option value="12">12 Bulan</option>
                  <option value="24">24 Bulan</option>
                </select>
              </div>
            </div>

            {/* Funding account */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Dibayar Menggunakan
              </label>
              <select
                required
                value={bankId}
                onChange={(e) => setBankId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-3 text-sm bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                <option value="">Pilih Akun Rekening...</option>
                {banks.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-sm shadow-md shadow-orange-200/50 transition-transform hover:scale-[1.01]"
            >
              Catat Belanja
            </button>
          </form>
        </div>
      </div>

      {/* Main Grid View list */}
      <div className="lg:col-span-2 space-y-6">
        {/* Total stats */}
        <div className="bg-orange-50 border border-orange-100 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Total Pengeluaran E-Commerce
            </p>
            <h3 className="text-xl font-black text-orange-700 mt-1">{formatRp(totalSpend)}</h3>
          </div>
          <div className="p-3 bg-orange-500 text-white rounded-2xl">
            <ShoppingBag className="w-6 h-6" />
          </div>
        </div>

        {/* Display Items List */}
        <div className="space-y-4">
          {ecommerce.length === 0 ? (
            <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center text-slate-400 font-semibold shadow-sm">
              Belum ada log transaksi e-commerce yang dicatat.
            </div>
          ) : (
            ecommerce.map((e) => (
              <div
                key={e.id}
                className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm relative overflow-hidden group flex flex-col sm:flex-row justify-between sm:items-center gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-extrabold text-slate-800 text-sm">{e.item_name}</h4>
                    <span className="text-[8px] bg-orange-50 text-orange-600 border border-orange-100 px-2 py-0.5 rounded font-bold uppercase">
                      {e.platform}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-semibold">
                    Kategori: <span className="font-bold text-slate-700">{e.category}</span> &bull; Pembayaran:{" "}
                    <span className="font-bold text-slate-700">{e.bank_name}</span>
                  </p>
                  <div className="flex items-center gap-3 text-[9px] text-slate-400 font-semibold mt-1">
                    <span>Tanggal: {e.date}</span>
                    <span>&bull;</span>
                    <span>
                      Tenor:{" "}
                      <span className="font-bold text-slate-600">
                        {e.tenor > 1 ? `${e.tenor} Bulan (Cicilan)` : "Tunai"}
                      </span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                  <span className="font-black text-slate-700 text-base">{formatRp(e.amount)}</span>
                  <button
                    onClick={() => handleDeleteClick(e.id)}
                    className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Hapus Belanja"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
