"use client";

import React, { useState, useMemo } from "react";
import { useAppState } from "@/hooks/useAppState";
import {
  Settings,
  Plus,
  Trash2,
  Lock,
  Layers,
  ShoppingBag,
  User,
  Zap,
} from "lucide-react";

export function ConfigView() {
  const {
    categories,
    fixedCosts,
    ecomPlatforms,
    user,
    addCategory,
    deleteCategory,
    addFixedCost,
    deleteFixedCost,
    addEcomPlatform,
    deleteEcomPlatform,
    updateProfile,
  } = useAppState();

  // Category Form states
  const [catName, setCatName] = useState("");
  const [catType, setCatType] = useState("expense");
  const [catParentId, setCatParentId] = useState("");

  // Fixed Cost Form states
  const [fcName, setFcName] = useState("");
  const [fcAmount, setFcAmount] = useState("");
  const [fcCategory, setFcCategory] = useState("");

  // Ecom Platform Form states
  const [platName, setPlatName] = useState("");
  const [platStore, setPlatStore] = useState("");

  // Profile Form states
  const [profUsername, setProfUsername] = useState("");
  const [profPin, setProfPin] = useState("");

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

  // Build category tree select options (only root categories of specified type)
  const rootCategoryOptions = useMemo(() => {
    return categories.filter((c) => c.type === catType && !c.parentId);
  }, [categories, catType]);

  // Build expense categories list for fixed costs
  const expenseCategoryOptions = useMemo(() => {
    // Return parent expense categories
    return categories.filter((c) => c.type === "expense" && !c.parentId);
  }, [categories]);

  // Submit Category
  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!catName || !catType) {
      alert("Nama Kategori dan Tipe Arus Kas wajib diisi!");
      return;
    }

    const res = await addCategory(catName, catType, catParentId || undefined);
    if (res.status === "success") {
      setCatName("");
      setCatParentId("");
      alert("Kategori berhasil ditambahkan!");
    } else {
      alert(res.message || "Gagal menyimpan kategori.");
    }
  };

  // Submit Fixed Cost Template
  const handleFcSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fcName || !fcAmount || !fcCategory) {
      alert("Isi data template dengan lengkap!");
      return;
    }

    const cleanAmt = cleanNumber(fcAmount);
    if (cleanAmt <= 0) {
      alert("Nominal template harus valid!");
      return;
    }

    const res = await addFixedCost(fcName, cleanAmt, fcCategory);
    if (res.status === "success") {
      setFcName("");
      setFcAmount("");
      alert("Template pengeluaran rutin berhasil disimpan!");
    } else {
      alert(res.message || "Gagal menyimpan template.");
    }
  };

  // Submit Ecom Platform
  const handlePlatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!platName) {
      alert("Nama Platform wajib diisi!");
      return;
    }

    const res = await addEcomPlatform(platName, platStore || undefined);
    if (res.status === "success") {
      setPlatName("");
      setPlatStore("");
      alert("Platform e-commerce berhasil ditambahkan!");
    } else {
      alert(res.message || "Gagal menyimpan platform.");
    }
  };

  // Submit Profile update
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!profUsername && !profPin) {
      alert("Masukkan username baru atau PIN baru!");
      return;
    }

    if (profPin && profPin.length !== 6) {
      alert("PIN harus berupa 6 digit angka!");
      return;
    }

    const res = await updateProfile(
      profUsername || undefined,
      profPin || undefined
    );

    if (res.status === "success") {
      setProfUsername("");
      setProfPin("");
      alert("Profil berhasil diperbarui!");
    } else {
      alert(res.message || "Gagal memperbarui profil.");
    }
  };

  // Delete methods
  const handleDeleteCategory = async (id: string) => {
    if (confirm("Hapus kategori ini? Jika ini kategori utama, seluruh subkategori di bawahnya akan ikut terhapus!")) {
      const res = await deleteCategory(id);
      if (res.status !== "success") {
        alert(res.message || "Gagal menghapus kategori.");
      }
    }
  };

  const handleDeleteFixedCost = async (id: string) => {
    if (confirm("Hapus template pengeluaran ini?")) {
      const res = await deleteFixedCost(id);
      if (res.status !== "success") {
        alert(res.message || "Gagal menghapus template.");
      }
    }
  };

  const handleDeletePlatform = async (id: string) => {
    if (confirm("Hapus platform e-commerce ini?")) {
      const res = await deleteEcomPlatform(id);
      if (res.status !== "success") {
        alert(res.message || "Gagal menghapus platform.");
      }
    }
  };

  // Render recursive category items
  const renderCategoriesList = (type: string) => {
    const list = categories.filter((c) => c.type === type);
    const parents = list.filter((c) => !c.parentId);

    const typeColor =
      type === "income" ? "emerald" : type === "expense" ? "rose" : "teal";

    if (parents.length === 0) {
      return (
        <p className="text-[11px] text-slate-400 text-center py-4 italic">
          Belum ada kategori
        </p>
      );
    }

    return parents.map((p) => {
      const children = list.filter((c) => c.parentId === p.id);

      return (
        <div key={p.id} className="space-y-1">
          {/* Parent item */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full bg-${typeColor}-500`} />
              <span className="text-xs font-bold text-slate-700">{p.name}</span>
            </div>
            <button
              onClick={() => handleDeleteCategory(p.id)}
              className="p-1 hover:bg-slate-100 rounded text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
              title="Hapus"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Children items */}
          {children.map((ch) => (
            <div
              key={ch.id}
              className={`flex items-center justify-between p-2.5 rounded-xl bg-white border-y border-r border-slate-100 shadow-sm hover:shadow-md transition-all group ml-5 border-l-2 ${
                type === "income"
                  ? "border-l-emerald-400"
                  : type === "expense"
                  ? "border-l-rose-400"
                  : "border-l-teal-400"
              }`}
            >
              <span className="text-xs font-semibold text-slate-600">{ch.name}</span>
              <button
                onClick={() => handleDeleteCategory(ch.id)}
                className="p-1 hover:bg-slate-100 rounded text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Hapus"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      );
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Category Manager (Left/Right modular layout) */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col h-[650px]">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Manajemen Kategori
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Kelola struktur anggaran & arus kas</p>
          </div>
        </div>

        {/* Add category form */}
        <form onSubmit={handleCategorySubmit} className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-3 mb-6">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Tambah Kategori Baru
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Nama Kategori
              </label>
              <input
                type="text"
                required
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                placeholder="Misal: Pakaian"
                className="w-full rounded-xl border border-slate-200 p-2 text-xs focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
              />
            </div>
            <div>
              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Tipe Arus Kas
              </label>
              <select
                value={catType}
                onChange={(e) => {
                  setCatType(e.target.value);
                  setCatParentId(""); // reset parent
                }}
                className="w-full rounded-xl border border-slate-200 p-2 text-xs bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                <option value="income">Pemasukan (Income)</option>
                <option value="expense">Pengeluaran (Expense)</option>
                <option value="inventory">Inventory Aset (Inventory)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Jadikan Subkategori dari <span className="text-slate-300">(Opsional)</span>
            </label>
            <select
              value={catParentId}
              onChange={(e) => setCatParentId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2 text-xs bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              <option value="">-- Kategori Utama --</option>
              {rootCategoryOptions.map((rc) => (
                <option key={rc.id} value={rc.id}>
                  {rc.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md shadow-emerald-100 transition-all"
          >
            Simpan Kategori
          </button>
        </form>

        {/* Categories Tree List */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-6 custom-scrollbar">
          {/* Income */}
          <div>
            <h4 className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Pemasukan
            </h4>
            <div className="space-y-2">{renderCategoriesList("income")}</div>
          </div>

          {/* Expense */}
          <div>
            <h4 className="text-[10px] font-bold text-rose-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Pengeluaran
            </h4>
            <div className="space-y-2">{renderCategoriesList("expense")}</div>
          </div>

          {/* Inventory */}
          <div>
            <h4 className="text-[10px] font-bold text-teal-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500" /> Inventory Aset
            </h4>
            <div className="space-y-2">{renderCategoriesList("inventory")}</div>
          </div>
        </div>
      </div>

      {/* Templates, Platforms & Profile Settings (Right side column) */}
      <div className="space-y-6">
        {/* Templates Fixed Cost */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-50 text-amber-500 rounded-xl">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                Template Pengeluaran Rutin
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Konfigurasi tombol log cepat di formulir pengeluaran
              </p>
            </div>
          </div>

          <form onSubmit={handleFcSubmit} className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Nama Template
                </label>
                <input
                  type="text"
                  required
                  value={fcName}
                  onChange={(e) => setFcName(e.target.value)}
                  placeholder="Misal: MRT Pulang"
                  className="w-full rounded-xl border border-slate-200 p-2 text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Nominal
                </label>
                <input
                  type="text"
                  required
                  value={fcAmount}
                  onChange={(e) => handleAmountChange(e.target.value, setFcAmount)}
                  placeholder="Rp 0"
                  className="w-full rounded-xl border border-slate-200 p-2 text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Kategori
                </label>
                <select
                  required
                  value={fcCategory}
                  onChange={(e) => setFcCategory(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2 text-xs bg-white focus:ring-2 focus:ring-amber-500 outline-none"
                >
                  <option value="">Pilih Kategori...</option>
                  {expenseCategoryOptions.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="py-2 px-6 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-xs shadow-md shadow-amber-200/50 transition-all"
                >
                  Simpan
                </button>
              </div>
            </div>
          </form>

          {/* Fixed cost list */}
          <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
            {fixedCosts.map((fc) => (
              <div
                key={fc.id}
                className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-100 rounded-xl group"
              >
                <div>
                  <p className="text-xs font-bold text-slate-700">{fc.name}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Kategori: {fc.category_id} &bull; Harga: {formatRp(fc.amount)}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteFixedCost(fc.id)}
                  className="p-1 hover:bg-slate-200 rounded text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Hapus"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* E-Commerce Platform configuration */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-50 text-orange-500 rounded-xl">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                Platform E-Commerce
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Atur platform toko & online belanja</p>
            </div>
          </div>

          <form onSubmit={handlePlatSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Platform
                </label>
                <input
                  type="text"
                  required
                  value={platName}
                  onChange={(e) => setPlatName(e.target.value)}
                  placeholder="Shopee, Tokopedia, dll"
                  className="w-full rounded-xl border border-slate-200 p-2 text-xs focus:ring-2 focus:ring-orange-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Nama Toko <span className="text-slate-300">(Opsional)</span>
                </label>
                <input
                  type="text"
                  value={platStore}
                  onChange={(e) => setPlatStore(e.target.value)}
                  placeholder="Misal: TokoSayaID"
                  className="w-full rounded-xl border border-slate-200 p-2 text-xs focus:ring-2 focus:ring-orange-500 outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-xs shadow-md shadow-orange-200/50 transition-all"
            >
              Tambah Platform
            </button>
          </form>

          {/* Platform list */}
          <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
            {ecomPlatforms.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-100 rounded-xl group"
              >
                <div>
                  <p className="text-xs font-bold text-slate-700">{p.platform}</p>
                  {p.store_name && (
                    <p className="text-[9px] text-slate-400 mt-0.5">Toko: {p.store_name}</p>
                  )}
                </div>
                <button
                  onClick={() => handleDeletePlatform(p.id)}
                  className="p-1 hover:bg-slate-200 rounded text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Hapus"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Profile update form */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 text-slate-600 rounded-xl">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                Profil & Keamanan
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Ubah username dan PIN login</p>
            </div>
          </div>

          <form onSubmit={handleProfileSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Username Baru
                </label>
                <input
                  type="text"
                  value={profUsername}
                  onChange={(e) => setProfUsername(e.target.value)}
                  placeholder={user?.username || "admin"}
                  className="w-full rounded-xl border border-slate-200 p-2 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  PIN Baru (6 Digit)
                </label>
                <input
                  type="password"
                  maxLength={6}
                  value={profPin}
                  onChange={(e) => setProfPin(e.target.value.replace(/\D/g, ""))}
                  placeholder="••••••"
                  className="w-full rounded-xl border border-slate-200 p-2 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-xs shadow-md transition-all"
            >
              Simpan Perubahan Profil
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
