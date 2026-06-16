"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { ChevronDown, Search, Check, Tag } from "lucide-react";

interface CategoryOption {
  id: string;
  name: string;
  isParent: boolean;
  parentName?: string;
}

interface CategorySelectProps {
  value: string; // contains e.g. "Makan & Minum - Makan Siang" or just "Kategori"
  onChange: (val: string) => void;
  options: CategoryOption[];
  placeholder?: string;
  className?: string;
}

export function CategorySelect({
  value,
  onChange,
  options,
  placeholder = "Pilih Kategori",
  className = "",
}: CategorySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Reset search when opening/closing
  useEffect(() => {
    if (!isOpen) {
      setSearch("");
    }
  }, [isOpen]);

  // Format value display: "Parent - Child" => "Child (Parent)"
  const displayLabel = useMemo(() => {
    if (!value) return placeholder;
    const parts = value.split(" - ");
    if (parts.length > 1) {
      return (
        <span className="flex items-center gap-1.5 truncate text-slate-800">
          <span className="font-extrabold">{parts[1]}</span>
          <span className="text-[10px] text-slate-400 font-bold bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
            {parts[0]}
          </span>
        </span>
      );
    }
    return <span className="font-extrabold text-slate-800">{value}</span>;
  }, [value, placeholder]);

  // Group and filter options based on search query
  const filteredOptions = useMemo(() => {
    const query = search.toLowerCase().trim();
    if (!query) return options;

    // Filter subcategories that match OR parent category that matches
    return options.filter((opt) => {
      const optName = opt.name.toLowerCase();
      const parentName = opt.parentName?.toLowerCase() || "";
      return optName.includes(query) || parentName.includes(query);
    });
  }, [options, search]);

  // Determine actual items to display
  // We want to group items by parent category, including their matching children.
  // If parent itself has children that are filtered, let's keep the parent header.
  const displayOptions = useMemo(() => {
    const query = search.toLowerCase().trim();
    if (!query) return filteredOptions;

    // To prevent empty parent headers with no matching children showing up,
    // we filter out parent category headers that don't have any matching child items in filteredOptions
    // (unless the parent itself doesn't have children at all).
    const list: CategoryOption[] = [];
    const childOfParentExists = (parentId: string) => {
      return filteredOptions.some((ch) => !ch.isParent && ch.parentName === options.find((p) => p.id === parentId)?.name);
    };

    filteredOptions.forEach((opt) => {
      if (opt.isParent) {
        if (childOfParentExists(opt.id)) {
          list.push(opt);
        }
      } else {
        // If child matches, ensure its parent is added before it if not already in the list
        const parentOpt = options.find((p) => p.isParent && p.name === opt.parentName);
        if (parentOpt && !list.some((item) => item.id === parentOpt.id)) {
          list.push(parentOpt);
        }
        list.push(opt);
      }
    });

    return list;
  }, [filteredOptions, options, search]);

  const handleSelect = (opt: CategoryOption) => {
    if (opt.isParent) return; // parent headers are not selectable
    const val = opt.parentName ? `${opt.parentName} - ${opt.name}` : opt.name;
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full rounded-xl border border-slate-200 p-3 text-xs bg-white text-slate-500 hover:bg-slate-50 transition-all flex items-center justify-between outline-none cursor-pointer focus:ring-2 focus:ring-cyan-500 shadow-sm"
      >
        <span className="truncate flex-1 text-left">{displayLabel}</span>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 shrink-0 ml-2 transition-transform duration-300 ${
            isOpen ? "rotate-180 text-cyan-600" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 mt-2 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-100 shadow-xl p-3 z-50 animate-fade-in origin-top transition-all">
          {/* Search Input */}
          <div className="relative mb-2.5">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari kategori..."
              className="w-full rounded-xl border border-slate-150 pl-9 pr-4 py-2 text-xs focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all bg-slate-50/50"
              autoFocus
            />
          </div>

          {/* List Options */}
          <div className="max-h-56 overflow-y-auto space-y-1 pr-0.5">
            {displayOptions.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400 font-semibold">
                Kategori tidak ditemukan
              </div>
            ) : (
              displayOptions.map((opt, idx) => {
                const optVal = opt.parentName ? `${opt.parentName} - ${opt.name}` : opt.name;
                const isSelected = value === optVal;

                if (opt.isParent) {
                  return (
                    <div
                      key={idx}
                      className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 pt-2 pb-1 px-2.5 select-none bg-slate-50/50 rounded-lg flex items-center gap-1.5"
                    >
                      <Tag className="w-2.5 h-2.5 text-slate-400" />
                      <span>{opt.name}</span>
                    </div>
                  );
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelect(opt)}
                    className={`w-full text-left py-2 px-3 pl-6 text-xs font-bold rounded-xl transition-all flex items-center justify-between ${
                      isSelected
                        ? "bg-cyan-50 text-cyan-700 font-extrabold border border-cyan-150/40"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent"
                    }`}
                  >
                    <span className="truncate">{opt.name}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-cyan-600 shrink-0 ml-2" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
