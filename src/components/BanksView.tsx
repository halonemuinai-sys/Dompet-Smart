"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
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
  LayoutGrid,
  Building2,
  Receipt,
  Coins,
  Wallet,
  ShoppingBag,
  ChevronRight,
  ShieldCheck,
  TrendingUp,
  ArrowUpRight,
  PlusCircle,
  Percent,
} from "lucide-react";

// Lightweight, fluid React Count-Up Component
function AnimatedNumber({ value, formatter }: { value: number; formatter: (val: number) => string }) {
  const [displayValue, setDisplayValue] = useState(0);
  const startValueRef = useRef(0);
  const startTimeRef = useRef<number | null>(null);
  const duration = 1000; // 1s animation duration

  useEffect(() => {
    startValueRef.current = displayValue;
    startTimeRef.current = null;
    let animationFrameId: number;

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const progress = Math.min((timestamp - startTimeRef.current) / duration, 1);
      
      // Easing: easeOutCubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      
      const currentVal = startValueRef.current + (value - startValueRef.current) * easeProgress;
      setDisplayValue(currentVal);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        setDisplayValue(value);
      }
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [value]);

  return <>{formatter(displayValue)}</>;
}

// E-wallet and E-money presets mapping
const EWALLET_BRANDS = ["GoPay", "OVO", "DANA", "ShopeePay", "LinkAja"];
const EMONEY_BRANDS = ["Flazz BCA", "E-Money Mandiri", "Brizzi BRI", "TapCash BNI", "KMT KRL"];

export function BanksView() {
  const { banks, addBank, deleteBank } = useAppState();

  const [activeFilter, setActiveFilter] = useState("all");
  const [animateCards, setAnimateCards] = useState(false);

  useEffect(() => {
    setAnimateCards(true);
  }, []);

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
      if (b.name === "GoPay") return "from-emerald-500 to-teal-600 text-white shadow-emerald-500/10";
      if (b.name === "OVO") return "from-indigo-950 via-slate-900 to-slate-950 text-white shadow-slate-950/20 border border-slate-800/80";
      if (b.name === "DANA") return "from-cyan-500 to-blue-600 text-white shadow-cyan-500/10";
      if (b.name === "ShopeePay") return "from-orange-500 to-rose-600 text-white shadow-orange-500/10";
      return "from-teal-500 to-cyan-600 text-white shadow-teal-500/10";
    }
    if (type === "emoney") return "from-slate-700 via-slate-800 to-slate-900 text-white shadow-slate-700/10 border border-slate-600/30";
    if (type === "credit_card") return "from-slate-900 via-slate-900 to-slate-950 text-white shadow-slate-950/20 border border-slate-800/60";
    if (type === "paylater") return "from-rose-500 to-red-600 text-white shadow-rose-500/10";
    if (type === "cash") return "from-amber-500 to-orange-500 text-white shadow-amber-500/20";
    return "from-sky-500 via-blue-600 to-indigo-700 text-white shadow-cyan-500/15"; // default: bank
  };

  const getCardWatermark = (b: any) => {
    const type = b.account_type;
    if (type === "paylater") return ShoppingBag;
    if (type === "credit_card") return CreditCard;
    if (type === "cash") return Wallet;
    if (type === "ewallet") return Smartphone;
    if (type === "emoney") return Coins;
    return Building2;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Sidebar Filter and Form */}
      <div className="lg:col-span-1 space-y-6">
        {/* Filters */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-2">
          <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-3">
            Tipe Rekening
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: "all", label: "Semua Akun", icon: LayoutGrid, iconColor: "text-cyan-500" },
              { id: "bank", label: "Bank", icon: Building2, iconColor: "text-indigo-500" },
              { id: "ewallet", label: "E-Wallet", icon: Smartphone, iconColor: "text-orange-500" },
              { id: "emoney", label: "E-Money", icon: CreditCard, iconColor: "text-sky-500" },
              { id: "credit_card", label: "Kartu Kredit", icon: CreditCard, iconColor: "text-blue-500" },
              { id: "paylater", label: "Paylater", icon: Percent, iconColor: "text-emerald-500" },
              { id: "cash", label: "Tunai", icon: Wallet, iconColor: "text-green-500" },
            ].map((f) => {
              const IconComponent = f.icon;
              const isActive = activeFilter === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setActiveFilter(f.id)}
                  className={`py-2.5 px-3 text-xs font-bold rounded-xl border flex items-center gap-2 transition-all ${
                    isActive
                      ? "bg-gradient-to-r from-cyan-50 to-blue-50 border-cyan-200 text-cyan-800 shadow-sm font-extrabold"
                      : "bg-white border-slate-100 text-slate-600 hover:bg-slate-50"
                  } ${f.id === "all" ? "col-span-2 justify-center" : "justify-start"}`}
                >
                  <IconComponent className={`w-3.5 h-3.5 ${isActive ? "text-cyan-600" : f.iconColor} shrink-0`} />
                  <span>{f.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Add bank form */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 bg-cyan-50 text-cyan-600 rounded-xl border border-cyan-100/80 shrink-0">
              <PlusCircle className="w-4 h-4" />
            </div>
            <h3 className="text-[10px] font-extrabold text-slate-800 uppercase tracking-wider">
              Tambah Akun Rekening
            </h3>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Type */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Tipe Akun
              </label>
              <select
                value={bankType}
                onChange={(e) => setBankType(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-3 text-sm bg-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all"
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
                  className="w-full rounded-xl border border-slate-200 p-3 text-sm bg-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all"
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
                  className="w-full rounded-xl border border-slate-200 p-3 text-sm bg-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all"
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
                  className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all"
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
                  className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all"
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
                className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-bold text-sm shadow-md shadow-cyan-100 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2"
            >
              <PlusCircle className="w-4 h-4 shrink-0" />
              <span>Simpan Rekening</span>
            </button>
          </form>
        </div>
      </div>

      {/* Main Grid Banks View */}
      <div className="lg:col-span-2 space-y-6">
        {/* Total Assets & Total Debts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Total Assets Card */}
          <div
            className={`bg-white/80 backdrop-blur-md rounded-3xl p-6 border border-slate-100/80 shadow-sm flex flex-col justify-between hover:border-slate-200/80 hover:shadow-md transition-all duration-700 ease-out transform relative overflow-hidden h-[155px] ${
              animateCards ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
            }`}
          >
            <div className="flex justify-between items-start w-full">
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-full bg-sky-50 flex items-center justify-center font-black text-sky-500 border border-sky-100 text-sm shrink-0">
                  Rp
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Total Aset Likuid
                  </p>
                  <p className="text-xl font-black text-slate-800 mt-0.5">
                    <AnimatedNumber value={stats.assets} formatter={formatRp} />
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Total dana yang tersedia
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 bg-emerald-50 border border-emerald-100 text-emerald-600 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider shrink-0 select-none">
                <ArrowUpRight className="w-3 h-3" />
                <span>+12.5%</span>
              </div>
            </div>
            {/* Sparkline SVG */}
            <div className="absolute left-0 right-0 bottom-0 h-12 w-full overflow-hidden pointer-events-none select-none">
              <svg className="w-full h-full text-sky-500/80" viewBox="0 0 100 30" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="sparkline-gradient-assets" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgb(14, 165, 233)" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="rgb(14, 165, 233)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path
                  d="M0,25 Q15,23 30,27 T60,13 T85,6 L100,2 L100,30 L0,30 Z"
                  fill="url(#sparkline-gradient-assets)"
                />
                <path
                  d="M0,25 Q15,23 30,27 T60,13 T85,6 L100,2"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <circle cx="100" cy="2" r="2" fill="currentColor" />
                <circle cx="100" cy="2" r="4" fill="currentColor" className="animate-ping opacity-25" />
              </svg>
            </div>
          </div>

          {/* Total Debts Card */}
          <div
            className={`bg-white/80 backdrop-blur-md rounded-3xl p-6 border border-slate-100/80 shadow-sm flex flex-col justify-between hover:border-slate-200/80 hover:shadow-md transition-all duration-700 ease-out transform relative overflow-hidden h-[155px] ${
              animateCards ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
            }`}
          >
            <div className="flex justify-between items-start w-full">
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 border border-rose-100 shrink-0">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Total Hutang Kredit
                  </p>
                  <p className="text-xl font-black text-slate-800 mt-0.5">
                    <AnimatedNumber value={stats.debt} formatter={formatRp} />
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Total kewajiban
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 bg-slate-50 border border-slate-100 text-slate-400 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider shrink-0 select-none">
                <TrendingUp className="w-3 h-3 text-slate-300" />
                <span>0%</span>
              </div>
            </div>
            {/* Sparkline SVG (flat line with dots) */}
            <div className="absolute left-0 right-0 bottom-0 h-12 w-full overflow-hidden pointer-events-none select-none">
              <svg className="w-full h-full text-rose-400/80" viewBox="0 0 100 30" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="sparkline-gradient-debt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgb(244, 63, 94)" stopOpacity="0.08" />
                    <stop offset="100%" stopColor="rgb(244, 63, 94)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path
                  d="M0,25 L100,25 L100,30 L0,30 Z"
                  fill="url(#sparkline-gradient-debt)"
                />
                <path
                  d="M0,25 L100,25"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeDasharray="2,2"
                  strokeLinecap="round"
                />
                <circle cx="10" cy="25" r="1.5" fill="currentColor" />
                <circle cx="30" cy="25" r="1.5" fill="currentColor" />
                <circle cx="50" cy="25" r="1.5" fill="currentColor" />
                <circle cx="70" cy="25" r="1.5" fill="currentColor" />
                <circle cx="90" cy="25" r="1.5" fill="currentColor" />
              </svg>
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
            filteredBanks.map((b, index) => {
              const currentBalance = Number(b.currentBalance) || 0;
              const isNeg = currentBalance < 0;

              return (
                <div
                  key={b.id}
                  style={{ transitionDelay: `${index * 40}ms` }}
                  className={`rounded-3xl p-6 shadow-md bg-gradient-to-br flex flex-col justify-between min-h-[148px] relative overflow-hidden group border border-black/5 transition-all duration-700 ease-out transform hover:-translate-y-1 hover:shadow-lg ${getCardStyle(
                    b
                  )} ${
                    animateCards ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
                  }`}
                >
                  {/* Textured pattern overlay */}
                  <svg className="absolute inset-0 w-full h-full opacity-[0.08] pointer-events-none select-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <path d="M0,35 Q25,65 50,25 T100,55 L100,100 L0,100 Z" fill="rgba(255,255,255,0.8)" />
                    <path d="M0,45 Q30,75 60,35 T100,65 L100,100 L0,100 Z" fill="rgba(255,255,255,0.4)" />
                  </svg>

                  {/* Watermark Icon */}
                  {(() => {
                    const WatermarkIcon = getCardWatermark(b);
                    return (
                      <WatermarkIcon className="absolute -right-4 -bottom-6 w-32 h-32 text-white opacity-[0.08] rotate-[15deg] pointer-events-none group-hover:scale-105 group-hover:rotate-[20deg] transition-all duration-500 ease-out" />
                    );
                  })()}

                  <div className="flex justify-between items-start z-10">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black tracking-tight text-base leading-tight text-white drop-shadow-sm">
                          {b.name}
                        </span>
                        <span className="text-[8px] uppercase tracking-wider font-extrabold bg-white/20 text-white px-2 py-0.5 rounded-full border border-white/10 backdrop-blur-sm">
                          {b.account_type}
                        </span>
                      </div>
                      {b.account_number !== "-" && (
                        <p className="text-[10px] font-mono tracking-widest text-white/70 mt-1">
                          {b.account_number}
                        </p>
                      )}
                    </div>

                    {/* Actions inside hover */}
                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditClick(b);
                        }}
                        className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(b.id);
                        }}
                        className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white hover:text-rose-200 transition-colors"
                        title="Hapus"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-between items-end z-10">
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-white/60">
                        Saldo Terkini
                      </p>
                      <p className="text-xl font-black tracking-tight mt-0.5 text-white drop-shadow-sm">
                        {isNeg ? "-" : ""}
                        <AnimatedNumber value={Math.abs(currentBalance)} formatter={formatRp} />
                      </p>
                    </div>

                    {/* Chevron arrow indicator */}
                    <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center border border-white/10 shadow-inner group-hover:bg-white/20 transition-all duration-300">
                      <ChevronRight className="w-3.5 h-3.5 text-white/90" />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Promo/Info Banner */}
        <div
          className={`bg-gradient-to-r from-sky-50 to-blue-50/20 border border-sky-100/60 rounded-3xl p-6 relative overflow-hidden flex items-center justify-between shadow-sm hover:shadow transition-all duration-700 transform ${
            animateCards ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
          style={{ transitionDelay: "150ms" }}
        >
          <div className="flex gap-4 items-center max-w-full md:max-w-[70%]">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-600 flex items-center justify-center border border-sky-500/20 shrink-0 select-none">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-slate-800 leading-snug">
                Kelola keuanganmu dengan lebih mudah
              </h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Pantau seluruh aset dan kewajiban dalam satu dashboard. Tambah akun rekening untuk melihat ringkasan keuangan yang lebih akurat.
              </p>
            </div>
          </div>
          <div className="relative shrink-0 w-36 h-24 hidden md:block select-none pointer-events-none">
            <img
              src="/finance_illustration.png"
              alt="Finance Illustration"
              className="w-full h-full object-contain object-right"
            />
          </div>
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
