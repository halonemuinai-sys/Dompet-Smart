"use client";

import React, { useState, useMemo } from "react";
import { useAppState } from "@/hooks/useAppState";
import { Modal } from "./ui/Modal";
import {
  Package,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  Layers,
  Activity,
  Heart,
  ChevronRight,
  TrendingDown,
} from "lucide-react";

export function InventoryView() {
  const {
    categories,
    inventory,
    addInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
  } = useAppState();

  // Filter states
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterCondition, setFilterCondition] = useState("all");

  // Form states
  const [itemName, setItemName] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [lifespanMonths, setLifespanMonths] = useState("24");
  const [condition, setCondition] = useState("Baik");

  // Edit states
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [editItemName, setEditItemName] = useState("");
  const [editCategoryName, setEditCategoryName] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editLifespan, setEditLifespan] = useState("");
  const [editCondition, setEditCondition] = useState("Baik");

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

  // Build category hierarchy options (only inventory type)
  const categoryOptions = useMemo(() => {
    return categories.filter((c) => c.type === "inventory");
  }, [categories]);

  // Submit asset
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!itemName || !categoryName || !purchasePrice || !purchaseDate || !lifespanMonths) {
      alert("Isi data aset dengan lengkap!");
      return;
    }

    const cleanPrice = cleanNumber(purchasePrice);
    if (cleanPrice <= 0) {
      alert("Harga beli harus valid!");
      return;
    }

    const payload = {
      itemName,
      categoryName,
      purchasePrice: cleanPrice,
      purchaseDate,
      lifespanMonths: parseInt(lifespanMonths, 10),
      condition,
      source: "manual",
    };

    const res = await addInventoryItem(payload);
    if (res.status === "success") {
      setItemName("");
      setPurchasePrice("");
      setLifespanMonths("24");
      setCondition("Baik");
      alert("Aset berhasil dicatat di inventaris!");
    } else {
      alert(res.message || "Gagal menyimpan data.");
    }
  };

  // Filter items
  const filteredInventory = useMemo(() => {
    return inventory.filter((item) => {
      const matchCat = filterCategory === "all" || item.category === filterCategory;
      const matchCond = filterCondition === "all" || item.condition === filterCondition;
      return matchCat && matchCond;
    });
  }, [inventory, filterCategory, filterCondition]);

  // Open Edit modal
  const handleEditClick = (item: any) => {
    setEditItem(item);
    setEditItemName(item.item_name);
    setEditCategoryName(item.category);
    setEditPrice(new Intl.NumberFormat("id-ID").format(item.purchase_price));
    setEditDate(item.purchase_date);
    setEditLifespan(item.lifespan_months.toString());
    setEditCondition(item.condition);
    setIsEditOpen(true);
  };

  // Submit Edit changes
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editItemName || !editCategoryName || !editPrice || !editDate || !editLifespan) {
      alert("Isi data dengan lengkap!");
      return;
    }

    const payload = {
      id: editItem.id,
      itemName: editItemName,
      categoryName: editCategoryName,
      purchasePrice: cleanNumber(editPrice),
      purchaseDate: editDate,
      lifespanMonths: parseInt(editLifespan, 10),
      condition: editCondition,
    };

    const res = await updateInventoryItem(payload);
    if (res.status === "success") {
      setIsEditOpen(false);
      setEditItem(null);
    } else {
      alert(res.message || "Gagal memperbarui data.");
    }
  };

  // Delete item
  const handleDeleteClick = async (id: string) => {
    if (confirm("Hapus barang ini dari inventaris?")) {
      const res = await deleteInventoryItem(id);
      if (res.status !== "success") {
        alert(res.message || "Gagal menghapus data.");
      }
    }
  };

  // Calculate remaining lifespan months and percentage
  const calculateLifespan = (purchaseDateStr: string, lifespanMonthsVal: number) => {
    const start = new Date(purchaseDateStr);
    const today = new Date();

    const diffMs = today.getTime() - start.getTime();
    const diffMonths = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30.4)));

    const remaining = Math.max(0, lifespanMonthsVal - diffMonths);
    const pct = lifespanMonthsVal > 0 ? Math.round((remaining / lifespanMonthsVal) * 100) : 0;

    return {
      elapsed: diffMonths,
      remaining,
      pct,
    };
  };

  // Total assets value calculation
  const totalAssetsValue = useMemo(() => {
    return inventory.reduce((sum, item) => sum + Number(item.purchase_price), 0);
  }, [inventory]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Sidebar Filter and Form */}
      <div className="lg:col-span-1 space-y-6">
        {/* Filters */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            Filter Aset
          </h3>
          <div>
            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Kategori
            </label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2 text-xs bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="all">Semua Kategori</option>
              {categoryOptions.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Kondisi Barang
            </label>
            <select
              value={filterCondition}
              onChange={(e) => setFilterCondition(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2 text-xs bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="all">Semua Kondisi</option>
              <option value="Baik">Baik</option>
              <option value="Cukup">Cukup</option>
              <option value="Rusak">Rusak</option>
            </select>
          </div>
        </div>

        {/* Add asset form */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4">
            Catat Aset Baru
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Nama Barang
              </label>
              <input
                type="text"
                required
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="Misal: iPhone 16 Pro Max, Sofa Ruang Tamu"
                className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Kategori Aset
              </label>
              <select
                required
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-3 text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="">Pilih Kategori...</option>
                {categoryOptions.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Price */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Harga Pembelian
              </label>
              <input
                type="text"
                required
                value={purchasePrice}
                onChange={(e) => handleAmountChange(e.target.value, setPurchasePrice)}
                placeholder="Rp 0"
                className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Date */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Tanggal Beli
                </label>
                <input
                  type="date"
                  required
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              {/* Lifespan */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Masa Pakai (Bulan)
                </label>
                <input
                  type="number"
                  required
                  value={lifespanMonths}
                  onChange={(e) => setLifespanMonths(e.target.value)}
                  placeholder="24"
                  className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>

            {/* Condition */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Kondisi Fisik
              </label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-3 text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="Baik">Baik</option>
                <option value="Cukup">Cukup</option>
                <option value="Rusak">Rusak</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-sm shadow-md shadow-teal-200/50 transition-transform hover:scale-[1.01]"
            >
              Simpan Aset
            </button>
          </form>
        </div>
      </div>

      {/* Main Grid display column */}
      <div className="lg:col-span-2 space-y-6">
        {/* Total Assets Value */}
        <div className="bg-teal-50 border border-teal-100 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Total Investasi Aset Fisik
            </p>
            <h3 className="text-xl font-black text-teal-700 mt-1">{formatRp(totalAssetsValue)}</h3>
          </div>
          <div className="p-3 bg-teal-600 text-white rounded-2xl">
            <Package className="w-6 h-6" />
          </div>
        </div>

        {/* Display Items List */}
        <div className="space-y-4">
          {filteredInventory.length === 0 ? (
            <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center text-slate-400 font-semibold shadow-sm">
              Belum ada aset terdaftar.
            </div>
          ) : (
            filteredInventory.map((item) => {
              const life = calculateLifespan(item.purchase_date, item.lifespan_months);
              const isDepreciated = life.remaining === 0;

              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-2xl p-5 border border-slate-100 shadow-sm relative overflow-hidden group flex flex-col justify-between gap-4`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-slate-800 text-sm leading-none">
                          {item.item_name}
                        </h4>
                        <span
                          className={`text-[8px] uppercase tracking-wider font-bold px-2 py-0.5 rounded border ${
                            item.condition === "Baik"
                              ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                              : item.condition === "Cukup"
                              ? "bg-amber-50 text-amber-600 border-amber-100"
                              : "bg-rose-50 text-rose-600 border-rose-100"
                          }`}
                        >
                          {item.condition}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-semibold mt-1">
                        Kategori: <span className="font-bold text-slate-700">{item.category}</span> &bull; Harga:{" "}
                        <span className="font-bold text-slate-700">{formatRp(item.purchase_price)}</span>
                      </p>
                      <p className="text-[9px] text-slate-400 font-medium mt-0.5">
                        Dibeli: {item.purchase_date} &bull; Sumber: {item.source}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button
                        onClick={() => handleEditClick(item)}
                        className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-indigo-600"
                        title="Edit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(item.id)}
                        className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-rose-600"
                        title="Hapus"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Lifespan Progress */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[9px] font-bold">
                      <span className="text-slate-400 uppercase tracking-wider">
                        Sisa Masa Depresiasi
                      </span>
                      <span className={isDepreciated ? "text-rose-500" : "text-indigo-600"}>
                        {isDepreciated ? "Aset Habis Nilai" : `${life.remaining} Bulan Tersisa`}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          isDepreciated
                            ? "bg-rose-500"
                            : life.pct <= 25
                            ? "bg-amber-500"
                            : "bg-teal-500"
                        }`}
                        style={{ width: `${life.pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Edit Inventory Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setEditItem(null);
        }}
        title={`Edit Detail ${editItem?.item_name}`}
      >
        {editItem && (
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Nama Barang
              </label>
              <input
                type="text"
                required
                value={editItemName}
                onChange={(e) => setEditItemName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Kategori Aset
              </label>
              <select
                required
                value={editCategoryName}
                onChange={(e) => setEditCategoryName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-3 text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                {categoryOptions.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Harga Pembelian
              </label>
              <input
                type="text"
                required
                value={editPrice}
                onChange={(e) => handleAmountChange(e.target.value, setEditPrice)}
                className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Tanggal Beli
                </label>
                <input
                  type="date"
                  required
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Masa Pakai (Bulan)
                </label>
                <input
                  type="number"
                  required
                  value={editLifespan}
                  onChange={(e) => setEditLifespan(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Kondisi Fisik
              </label>
              <select
                value={editCondition}
                onChange={(e) => setEditCondition(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-3 text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="Baik">Baik</option>
                <option value="Cukup">Cukup</option>
                <option value="Rusak">Rusak</option>
              </select>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsEditOpen(false);
                  setEditItem(null);
                }}
                className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 text-sm transition-all"
              >
                Batal
              </button>
              <button
                type="submit"
                className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 text-sm transition-all shadow-md shadow-indigo-100"
              >
                Simpan Perubahan
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
