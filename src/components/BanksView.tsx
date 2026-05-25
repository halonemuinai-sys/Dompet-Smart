"use client";

import React, { useState, useMemo } from "react";
import { useAppState } from "@/hooks/useAppState";
import { Modal } from "./ui/Modal";
import {
  CreditCard,
  Plus,
  Trash2,
  Edit2,
  DollarSign,
  Smartphone,
  Layers,
  Activity,
} from "lucide-react";

// E-wallet and E-money presets mapping
const EWALLET_BRANDS = ["GoPay", "OVO", "DANA", "ShopeePay", "LinkAja"];
const EMONEY_BRANDS = ["Flazz BCA", "E-Money Mandiri", "Brizzi BRI", "TapCash BNI", "KMT KRL"];

export function BanksView() {
  const { banks, addBank, deleteBank } = useAppState();

  const [activeFilter, setActiveFilter] = useState("all");

  // Form states
  const [bankType, setBankType] = useState("bank");
  const [bankName, setBankName] = useState("");
  const [ewalletBrand, setEwalletBrand] = useState("");
  const [emoneyBrand, setEmoneyBrand] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [initialBalance, setInitialBalance] = useState("");

  // Edit states
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editBankItem, setEditBankItem] = useState<any>(null);
  const [editName, setEditName] = useState("");
  const [editNo, setEditNo] = useState("");
  const [editBalance, setEditBalance] = useState("");

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
    if (!val) {
      setter("");
      return;
    }
    const num = cleanNumber(val);
    if (num === 0) {
      setter("0");
    } else {
      setter(new Intl.NumberFormat("id-ID").format(num));
    }
  };

  // Filter bank list
  const filteredBanks = useMemo(() => {
    if (activeFilter === "all") return banks;
    return banks.filter((b) => b.account_type === activeFilter);
  }, [banks, activeFilter]);

  // Asset and debt calculations
  const stats = useMemo(() => {
    let assets = 0;
    let debt = 0;

    banks.forEach((b) => {
      const bal = Number(b.currentBalance) || 0;
      const isDebt = b.account_type === "paylater" || b.account_type === "credit_card";
      if (isDebt) {
        if (bal < 0) debt += Math.abs(bal);
      } else {
        if (bal > 0) assets += bal;
      }
    });

    return { assets, debt };
  }, [banks]);

  // Handle new account submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let finalName = bankName;
    if (bankType === "ewallet") {
      if (!ewalletBrand) {
        alert("Pilih brand E-Wallet!");
        return;
      }
      finalName = ewalletBrand;
    } else if (bankType === "emoney") {
      if (!emoneyBrand) {
        alert("Pilih tipe E-Money!");
        return;
      }
      finalName = emoneyBrand;
    }

    if (!finalName) {
      alert("Nama akun bank wajib diisi!");
      return;
    }

    const cleanBal = cleanNumber(initialBalance);
    const numNo = accountNumber || "-";

    const res = await addBank(finalName, numNo, cleanBal, bankType);
    if (res.status === "success") {
      // Reset form
      setBankName("");
      setAccountNumber("");
      setInitialBalance("");
      setEwalletBrand("");
      setEmoneyBrand("");
    } else {
      alert(res.message || "Gagal membuat akun.");
    }
  };

  // Open Edit modal
  const handleEditClick = (b: any) => {
    setEditBankItem(b);
    setEditName(b.name);
    setEditNo(b.account_number);
    setEditBalance(new Intl.NumberFormat("id-ID").format(b.initial_balance));
    setIsEditOpen(true);
  };

  // Submit Edit changes
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName) {
      alert("Nama akun wajib diisi!");
      return;
    }
    alert("Untuk mengedit detail akun awal, silakan hapus dan buat ulang akun untuk menjaga sinkronisasi saldo transaksi.");
    setIsEditOpen(false);
  };

  // Delete account
  const handleDeleteClick = async (id: string) => {
    if (confirm("Hapus akun bank ini? Seluruh transaksi terkait akan ikut terhapus!")) {
      const res = await deleteBank(id);
      if (res.status !== "success") {
        alert(res.message || "Gagal menghapus akun.");
      }
    }
  };

  // Styling helper based on account type
  const getCardStyle = (b: any) => {
    const type = b.account_type;
    if (type === "ewallet") {
      if (b.name === "GoPay") return "from-emerald-500 to-green-600 text-white shadow-emerald-200/50";
      if (b.name === "OVO") return "from-purple-600 to-violet-700 text-white shadow-purple-200/50";
      if (b.name === "DANA") return "from-blue-500 to-sky-600 text-white shadow-blue-200/50";
      if (b.name === "ShopeePay") return "from-orange-500 to-red-600 text-white shadow-orange-200/50";
      return "from-teal-500 to-emerald-600 text-white shadow-teal-200/50";
    }
    if (type === "emoney") return "from-indigo-500 to-blue-600 text-white shadow-indigo-200/50";
    if (type === "credit_card") return "from-slate-800 to-slate-950 text-white shadow-slate-300";
    if (type === "paylater") return "from-rose-500 to-red-600 text-white shadow-rose-200/50";
    if (type === "cash") return "from-amber-400 to-orange-500 text-white shadow-amber-200/50";
    return "from-sky-600 to-indigo-700 text-white shadow-blue-200/50"; // default: bank
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Sidebar Filter and Form */}
      <div className="lg:col-span-1 space-y-6">
        {/* Filters */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-2">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            Tipe Rekening
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: "all", label: "Semua Akun" },
              { id: "bank", label: "🏦 Bank" },
              { id: "ewallet", label: "📱 E-Wallet" },
              { id: "emoney", label: "💳 E-Money" },
              { id: "credit_card", label: "💳 Kartu Kredit" },
              { id: "paylater", label: "💸 Paylater" },
              { id: "cash", label: "💵 Tunai" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id)}
                className={`py-2 px-3 text-xs font-bold rounded-xl border text-center transition-all ${
                  activeFilter === f.id
                    ? "bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm"
                    : "bg-slate-50/50 border-slate-100 text-slate-500 hover:bg-slate-50"
                } ${f.id === "all" ? "col-span-2" : ""}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Add bank form */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4">
            Tambah Akun Rekening
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Type */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Tipe Akun
              </label>
              <select
                value={bankType}
                onChange={(e) => setBankType(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-3 text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="bank">Bank / Rekening</option>
                <option value="ewallet">E-Wallet</option>
                <option value="emoney">E-Money</option>
                <option value="credit_card">Kartu Kredit</option>
                <option value="paylater">Paylater (Cicilan)</option>
                <option value="cash">Uang Tunai (Cash)</option>
              </select>
            </div>

            {/* Name input conditional */}
            {bankType === "ewallet" ? (
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Brand E-Wallet
                </label>
                <select
                  required
                  value={ewalletBrand}
                  onChange={(e) => setEwalletBrand(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-3 text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="">Pilih Brand...</option>
                  {EWALLET_BRANDS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>
            ) : bankType === "emoney" ? (
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Jenis E-Money
                </label>
                <select
                  required
                  value={emoneyBrand}
                  onChange={(e) => setEmoneyBrand(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-3 text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="">Pilih Jenis...</option>
                  {EMONEY_BRANDS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Nama Akun / Nama Bank
                </label>
                <input
                  type="text"
                  required
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder={
                    bankType === "paylater"
                      ? "Misal: Shopee Paylater"
                      : bankType === "credit_card"
                      ? "Misal: CC BCA Batman"
                      : bankType === "cash"
                      ? "Misal: Dompet Utama"
                      : "Misal: BCA, Bank Mandiri"
                  }
                  className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            )}

            {/* Account Number (skip for Cash) */}
            {bankType !== "cash" && (
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  {bankType === "ewallet" ? "Nomor HP E-Wallet" : "Nomor Rekening / Kartu"}
                </label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="Misal: 08123456... atau 123456..."
                  className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            )}

            {/* Initial Balance */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Saldo Awal
              </label>
              <input
                type="text"
                required
                value={initialBalance}
                onChange={(e) => handleAmountChange(e.target.value, setInitialBalance)}
                placeholder="Rp 0"
                className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-md shadow-indigo-100 hover:scale-[1.01] active:scale-[0.99] transition-transform"
            >
              Simpan Rekening
            </button>
          </form>
        </div>
      </div>

      {/* Main Grid Banks View */}
      <div className="lg:col-span-2 space-y-6">
        {/* Total Assets & Total Debts */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100 flex items-center gap-3 shadow-sm">
            <div className="p-2.5 bg-emerald-500 rounded-xl text-white">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                Total Aset Likuid
              </p>
              <p className="text-lg font-black text-emerald-700 mt-0.5">
                {formatRp(stats.assets)}
              </p>
            </div>
          </div>
          <div className="bg-rose-50 rounded-2xl p-4 border border-rose-100 flex items-center gap-3 shadow-sm">
            <div className="p-2.5 bg-rose-500 rounded-xl text-white">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                Total Hutang Kredit
              </p>
              <p className="text-lg font-black text-rose-700 mt-0.5">{formatRp(stats.debt)}</p>
            </div>
          </div>
        </div>

        {/* Bank Grid cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredBanks.length === 0 ? (
            <div className="col-span-2 bg-slate-50 border border-slate-100 rounded-2xl p-12 text-center text-slate-400 font-semibold">
              Belum ada akun rekening dengan tipe filter ini.
            </div>
          ) : (
            filteredBanks.map((b) => {
              const currentBalance = Number(b.currentBalance) || 0;
              const isNeg = currentBalance < 0;

              return (
                <div
                  key={b.id}
                  className={`rounded-2xl p-5 shadow-md bg-gradient-to-br flex flex-col justify-between min-h-[140px] relative overflow-hidden group border border-black/5 ${getCardStyle(
                    b
                  )}`}
                >
                  {/* Decorative card circle overlay */}
                  <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:bg-white/15 transition-all duration-300 pointer-events-none" />

                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold tracking-tight text-base leading-tight">
                          {b.name}
                        </span>
                        <span className="text-[8px] uppercase tracking-wider font-bold bg-white/20 px-1.5 py-0.5 rounded border border-white/10">
                          {b.account_type}
                        </span>
                      </div>
                      {b.account_number !== "-" && (
                        <p className="text-[10px] font-mono tracking-widest text-white/70 mt-1">
                          {b.account_number}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEditClick(b)}
                        className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white"
                        title="Edit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(b.id)}
                        className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white hover:text-rose-200"
                        title="Hapus"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4">
                    <p className="text-[8px] font-bold uppercase tracking-widest text-white/60">
                      Saldo Terkini
                    </p>
                    <p className="text-xl font-black tracking-tight mt-0.5">
                      {isNeg ? "-" : ""}
                      {formatRp(Math.abs(currentBalance))}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Edit Modal (Simulated message) */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setEditBankItem(null);
        }}
        title={`Edit Akun ${editName}`}
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <p className="text-xs text-slate-500 leading-relaxed">
            Untuk melakukan penyesuaian nominal saldo, silakan catat transaksi baru jenis
            pemasukan/pengeluaran atau edit/hapus transaksi lama yang salah input. Hal ini untuk
            mencegah ketidaksesuaian saldo audit.
          </p>
          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={() => {
                setIsEditOpen(false);
                setEditBankItem(null);
              }}
              className="py-2.5 px-6 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 text-xs"
            >
              Tutup
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
