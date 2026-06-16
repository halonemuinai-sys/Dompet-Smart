"use client";

import React, { useState, useRef, useEffect } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";

const MONTH_NAMES = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const DAY_LABELS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

interface DatePickerProps {
  value: string; // YYYY-MM-DD format
  onChange: (date: string) => void;
  className?: string;
}

export function DatePicker({ value, onChange, className = "" }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => {
    return value ? new Date(value + "T00:00:00") : new Date();
  });

  const containerRef = useRef<HTMLDivElement>(null);

  // Sync viewDate with value when it opens
  useEffect(() => {
    if (isOpen && value) {
      setViewDate(new Date(value + "T00:00:00"));
    }
  }, [isOpen, value]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatDateIndo = (dateStr: string) => {
    if (!dateStr) return "Pilih Tanggal";
    const parts = dateStr.split("-");
    if (parts.length !== 3) return dateStr;
    const year = parts[0];
    const monthIdx = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    return `${day} ${MONTH_NAMES[monthIdx]} ${year}`;
  };

  const handleSelectDay = (dateStr: string) => {
    onChange(dateStr);
    setIsOpen(false);
  };

  const handleSelectToday = () => {
    const todayStr = new Date().toISOString().split("T")[0];
    onChange(todayStr);
    setIsOpen(false);
  };

  const prevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const nextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  // Generate calendar grid cells
  const getCells = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    const prevMonthTotalDays = new Date(year, month, 0).getDate();

    const cells = [];

    // 1. Prev month offset cells
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayVal = prevMonthTotalDays - i;
      const prevMonthIdx = month === 0 ? 11 : month - 1;
      const prevYearVal = month === 0 ? year - 1 : year;
      const dateStr = `${prevYearVal}-${String(prevMonthIdx + 1).padStart(2, "0")}-${String(dayVal).padStart(2, "0")}`;
      cells.push({
        day: dayVal,
        isCurrentMonth: false,
        dateStr,
      });
    }

    // 2. Current month cells
    for (let i = 1; i <= totalDays; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
      cells.push({
        day: i,
        isCurrentMonth: true,
        dateStr,
      });
    }

    // 3. Next month offset cells (up to 42 grid items)
    const totalCells = cells.length;
    const remaining = totalCells <= 35 ? 35 - totalCells : 42 - totalCells;
    for (let i = 1; i <= remaining; i++) {
      const nextMonthIdx = month === 11 ? 0 : month + 1;
      const nextYearVal = month === 11 ? year + 1 : year;
      const dateStr = `${nextYearVal}-${String(nextMonthIdx + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
      cells.push({
        day: i,
        isCurrentMonth: false,
        dateStr,
      });
    }

    return cells;
  };

  const cells = getCells();

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full rounded-xl border border-slate-200 p-3 text-xs bg-white text-slate-700 hover:bg-slate-50 transition-all flex items-center justify-between outline-none cursor-pointer focus:ring-2 focus:ring-cyan-500 shadow-sm"
      >
        <span className="truncate">{formatDateIndo(value)}</span>
        <Calendar className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
      </button>

      {/* Popover Calendar */}
      {isOpen && (
        <div className="absolute left-0 mt-2 w-72 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-100 shadow-xl p-4 z-50 animate-fade-in origin-top-left transition-all">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-black text-slate-700 select-none">
              {MONTH_NAMES[viewDate.getMonth()]} {viewDate.getFullYear()}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Day Labels */}
          <div className="grid grid-cols-7 gap-1 mb-2 select-none">
            {DAY_LABELS.map((lbl, idx) => (
              <span
                key={idx}
                className={`text-[9px] font-extrabold uppercase tracking-wider text-center ${
                  idx === 0 ? "text-rose-500" : "text-slate-400"
                }`}
              >
                {lbl}
              </span>
            ))}
          </div>

          {/* Grid of Days */}
          <div className="grid grid-cols-7 gap-1">
            {cells.map((cell, idx) => {
              const isSelected = cell.dateStr === value;
              const isToday = cell.dateStr === new Date().toISOString().split("T")[0];

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectDay(cell.dateStr)}
                  className={`py-1.5 text-[11px] font-bold rounded-lg transition-all text-center select-none ${
                    !cell.isCurrentMonth
                      ? "text-slate-300 hover:bg-slate-50 hover:text-slate-500"
                      : isSelected
                      ? "bg-cyan-600 text-white shadow-md shadow-cyan-100 font-extrabold scale-105"
                      : isToday
                      ? "bg-cyan-50 border border-cyan-200 text-cyan-700 font-extrabold"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {cell.day}
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="border-t border-slate-100 mt-4 pt-3 flex justify-between items-center">
            <button
              type="button"
              onClick={handleSelectToday}
              className="text-[10px] font-extrabold text-cyan-600 hover:text-cyan-700 transition-colors uppercase tracking-wider"
            >
              Hari Ini
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-[10px] font-extrabold text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-wider"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
