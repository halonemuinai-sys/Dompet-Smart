"use client";

import React, { useState, useMemo } from "react";
import { useAppState } from "@/hooks/useAppState";
import { Modal } from "./ui/Modal";
import {
  TrendingUp,
  Percent,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  Lock,
  ChevronRight,
  ShieldCheck,
  CheckCircle,
} from "lucide-react";

export function PortfolioView() {
  const {
    banks,
    deposits,
    cryptos,
    addDeposit,
    updateDepositStatus,
    deleteDeposit,
    addCrypto,
    updateCrypto,
    deleteCrypto,
  } = useAppState();

  const [activeTab, setActiveTab] = useState<"deposits" | "cryptos">("deposits");

  // Form Deposito states
  const [depoName, setDepoName] = useState("");
  const [depoBankId, setDepoBankId] = useState("");
  const [depoAmount, setDepoAmount] = useState("");
  const [depoRate, setDepoRate] = useState("");
  const [depoTenor, setDepoTenor] = useState("");
  const [depoStartDate, setDepoStartDate] = useState("");

  // Form Kripto states
  const [cryptoName, setCryptoName] = useState("");
  const [cryptoQty, setCryptoQty] = useState("");
  const [cryptoVal, setCryptoVal] = useState("");

  // Edit Kripto modal states
  const [isEditCryptoOpen, setIsEditCryptoOpen] = useState(false);
  const [editCryptoItem, setEditCryptoItem] = useState<any>(null);
  const [editCryptoQty, setEditCryptoQty] = useState("");
  const [editCryptoVal, setEditCryptoVal] = useState("");

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

  // Submit Deposito
  const handleDepoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!depoName || !depoBankId || !depoAmount || !depoRate || !depoTenor || !depoStartDate) {
      alert("Isi data deposito dengan lengkap!");
      return;
    }

    const start = new Date(depoStartDate);
    const tenorMonths = parseInt(depoTenor, 10);
    const maturity = new Date(start);
    maturity.setMonth(maturity.getMonth() + tenorMonths);

    const payload = {
      name: depoName,
      bankId: depoBankId,
      amount: cleanNumber(depoAmount),
      rate: parseFloat(depoRate),
      tenor: tenorMonths,
      startDate: depoStartDate,
      maturityDate: maturity.toISOString().split("T")[0],
    };

    const res = await addDeposit(payload);
    if (res.status === "success") {
      setDepoName("");
      setDepoAmount("");
      setDepoRate("");
      setDepoTenor("");
      setDepoStartDate("");
      alert("Deposito berhasil ditambahkan!");
    } else {
      alert(res.message || "Gagal menyimpan deposito.");
    }
  };

  // Submit Kripto
  const handleCryptoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!cryptoName || !cryptoQty || !cryptoVal) {
      alert("Isi data kripto dengan lengkap!");
      return;
    }

    const res = await addCrypto(cryptoName.toUpperCase(), parseFloat(cryptoQty), cleanNumber(cryptoVal));
    if (res.status === "success") {
      setCryptoName("");
      setCryptoQty("");
      setCryptoVal("");
      alert("Aset kripto berhasil disimpan!");
    } else {
      alert(res.message || "Gagal menyimpan kripto.");
    }
  };

  // Deposito status update (withdraw)
  const handleWithdrawClick = async (id: string) => {
    if (confirm("Apakah deposito ini sudah dicairkan / ditarik?")) {
      const res = await updateDepositStatus(id, "withdrawn");
      if (res.status !== "success") {
        alert(res.message || "Gagal memperbarui status.");
      }
    }
  };

  // Open Edit Crypto modal
  const handleEditCryptoClick = (c: any) => {
    setEditCryptoItem(c);
    setEditCryptoQty(c.quantity.toString());
    setEditCryptoVal(new Intl.NumberFormat("id-ID").format(c.value_idr));
    setIsEditCryptoOpen(true);
  };

  // Submit Edit Crypto
  const handleEditCryptoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editCryptoQty || !editCryptoVal) {
      alert("Isi data update dengan lengkap!");
      return;
    }

    const res = await updateCrypto(
      editCryptoItem.id,
      editCryptoItem.name,
      parseFloat(editCryptoQty),
      cleanNumber(editCryptoVal)
    );

    if (res.status === "success") {
      setIsEditCryptoOpen(false);
      setEditCryptoItem(null);
    } else {
      alert(res.message || "Gagal memperbarui aset kripto.");
    }
  };

  // Delete mutations
  const handleDeleteDepo = async (id: string) => {
    if (confirm("Hapus catatan deposito ini?")) {
      await deleteDeposit(id);
    }
  };

  const handleDeleteCrypto = async (id: string) => {
    if (confirm("Hapus catatan kripto ini?")) {
      await deleteCrypto(id);
    }
  };

  // Totals calculations
  const depoTotal = useMemo(() => {
    return deposits
      .filter((d) => d.status === "active")
      .reduce((sum, d) => sum + Number(d.amount), 0);
  }, [deposits]);

  const cryptoTotal = useMemo(() => {
    return cryptos.reduce((sum, c) => sum + Number(c.value_idr), 0);
  }, [cryptos]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Forms column */}
      <div className="lg:col-span-1 space-y-6">
        {/* Toggle subtab */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab("deposits")}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === "deposits"
                  ? "bg-white text-emerald-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              🔒 Deposito
            </button>
            <button
              onClick={() => setActiveTab("cryptos")}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === "cryptos"
                  ? "bg-white text-emerald-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              🪙 Kripto
            </button>
          </div>
        </div>

        {/* Dynamic add form */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          {activeTab === "deposits" ? (
            <form onSubmit={handleDepoSubmit} className="space-y-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                Tambah Deposito
              </h3>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Nama Deposito
                </label>
                <input
                  type="text"
                  required
                  value={depoName}
                  onChange={(e) => setDepoName(e.target.value)}
                  placeholder="Misal: Deposito Berjangka BCA"
                  className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Akun Sumber Dana
                </label>
                <select
                  required
                  value={depoBankId}
                  onChange={(e) => setDepoBankId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-3 text-sm bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="">Pilih Bank...</option>
                  {banks.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Nominal Penempatan
                </label>
                <input
                  type="text"
                  required
                  value={depoAmount}
                  onChange={(e) => handleAmountChange(e.target.value, setDepoAmount)}
                  placeholder="Rp 0"
                  className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Bunga (% per tahun)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={depoRate}
                    onChange={(e) => setDepoRate(e.target.value)}
                    placeholder="Misal: 5.25"
                    className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Tenor (Bulan)
                  </label>
                  <input
                    type="number"
                    required
                    value={depoTenor}
                    onChange={(e) => setDepoTenor(e.target.value)}
                    placeholder="Misal: 3, 6, 12"
                    className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Tanggal Mulai
                </label>
                <input
                  type="date"
                  required
                  value={depoStartDate}
                  onChange={(e) => setDepoStartDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-md transition-all hover:scale-[1.01]"
              >
                Simpan Deposito
              </button>
            </form>
          ) : (
            <form onSubmit={handleCryptoSubmit} className="space-y-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                Tambah Aset Kripto
              </h3>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Nama Koin
                </label>
                <input
                  type="text"
                  required
                  value={cryptoName}
                  onChange={(e) => setCryptoName(e.target.value)}
                  placeholder="Misal: BTC, ETH, USDT"
                  className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Jumlah (Quantity)
                </label>
                <input
                  type="number"
                  step="0.00000001"
                  required
                  value={cryptoQty}
                  onChange={(e) => setCryptoQty(e.target.value)}
                  placeholder="Misal: 0.025"
                  className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Nilai Rupiah Saat Ini
                </label>
                <input
                  type="text"
                  required
                  value={cryptoVal}
                  onChange={(e) => handleAmountChange(e.target.value, setCryptoVal)}
                  placeholder="Rp 0"
                  className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-md transition-all hover:scale-[1.01]"
              >
                Simpan Koin
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Main Grid display column */}
      <div className="lg:col-span-2 space-y-6">
        {/* Total Summary */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 shadow-sm flex justify-between items-center">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {activeTab === "deposits" ? "Total Deposito Aktif" : "Total Investasi Kripto"}
            </p>
            <h3 className="text-xl font-black text-slate-800 mt-1">
              {formatRp(activeTab === "deposits" ? depoTotal : cryptoTotal)}
            </h3>
          </div>
          <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl">
            {activeTab === "deposits" ? <Lock className="w-6 h-6" /> : <TrendingUp className="w-6 h-6" />}
          </div>
        </div>

        {/* Display Items List */}
        {activeTab === "deposits" ? (
          <div className="space-y-4">
            {deposits.length === 0 ? (
              <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center text-slate-400 font-semibold shadow-sm">
                Belum ada penempatan deposito tercatat.
              </div>
            ) : (
              deposits.map((d) => {
                const isActive = d.status === "active";
                return (
                  <div
                    key={d.id}
                    className={`bg-white rounded-2xl p-5 border border-slate-100 shadow-sm relative overflow-hidden group flex flex-col sm:flex-row justify-between sm:items-center gap-4 ${
                      !isActive ? "opacity-60 bg-slate-50/50" : ""
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-slate-800 text-sm leading-tight">
                          {d.name}
                        </h4>
                        <span
                          className={`text-[8px] uppercase tracking-wider font-bold px-2 py-0.5 rounded border ${
                            isActive
                              ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                              : "bg-slate-100 text-slate-500 border-slate-200"
                          }`}
                        >
                          {isActive ? "Aktif" : "Dicairkan"}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-semibold">
                        Nominal: <span className="font-bold text-slate-700">{formatRp(d.amount)}</span> &bull; Bunga:{" "}
                        <span className="font-bold text-slate-700">{d.rate}%</span>
                      </p>
                      <p className="text-[9px] text-slate-400 font-medium">
                        Jatuh Tempo: {d.maturity_date} ({d.tenor} Bulan) &bull; Dana Asal: {d.bank_name}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                      {isActive && (
                        <button
                          onClick={() => handleWithdrawClick(d.id)}
                          className="py-1.5 px-3 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-xl font-bold text-[10px] border border-emerald-100 flex items-center gap-1 transition-all"
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> Cairkan
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteDepo(d.id)}
                        className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Hapus"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {cryptos.length === 0 ? (
              <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center text-slate-400 font-semibold shadow-sm">
                Belum ada aset koin kripto tercatat.
              </div>
            ) : (
              cryptos.map((c) => (
                <div
                  key={c.id}
                  className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm relative overflow-hidden group flex flex-col sm:flex-row justify-between sm:items-center gap-4"
                >
                  <div>
                    <h4 className="font-extrabold text-slate-800 text-sm">{c.name}</h4>
                    <p className="text-[10px] text-slate-400 font-semibold mt-1">
                      Jumlah: <span className="font-bold text-slate-700">{c.quantity} koin</span>
                    </p>
                    <p className="text-xs font-black text-emerald-600 mt-2">
                      Nilai Rupiah: {formatRp(c.value_idr)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                    <button
                      onClick={() => handleEditCryptoClick(c)}
                      className="py-1.5 px-3 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-xl font-bold text-[10px] border border-emerald-100 flex items-center gap-1 transition-all"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Update Nilai
                    </button>
                    <button
                      onClick={() => handleDeleteCrypto(c.id)}
                      className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Hapus"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Edit Crypto Modal */}
      <Modal
        isOpen={isEditCryptoOpen}
        onClose={() => {
          setIsEditCryptoOpen(false);
          setEditCryptoItem(null);
        }}
        title={`Update Nilai ${editCryptoItem?.name}`}
      >
        {editCryptoItem && (
          <form onSubmit={handleEditCryptoSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Jumlah Koin (Qty)
              </label>
              <input
                type="number"
                step="0.00000001"
                required
                value={editCryptoQty}
                onChange={(e) => setEditCryptoQty(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Nilai Rupiah Terkini
              </label>
              <input
                type="text"
                required
                value={editCryptoVal}
                onChange={(e) => handleAmountChange(e.target.value, setEditCryptoVal)}
                className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsEditCryptoOpen(false);
                  setEditCryptoItem(null);
                }}
                className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 text-sm transition-all"
              >
                Batal
              </button>
              <button
                type="submit"
                className="flex-1 py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 text-sm transition-all shadow-md shadow-emerald-100"
              >
                Update Aset
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
