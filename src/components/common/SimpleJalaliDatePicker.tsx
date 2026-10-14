import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronRight, ChevronLeft, Check, Clock } from 'lucide-react';
import {
  getCurrentJalaliDate,
  parseJalaliDate,
  JALALI_MONTH_NAMES,
  getDaysInJalaliMonth,
} from '../../utils/jalaliDate';
import { toPersianDigits } from '../../utils/formatters';

interface SimpleJalaliDatePickerProps {
  value: string; // e.g. "1405/07/20"
  onChange: (val: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
}

export const SimpleJalaliDatePicker: React.FC<SimpleJalaliDatePickerProps> = ({
  value,
  onChange,
  label,
  placeholder = '۱۴۰۵/۰۷/۲۰',
  required = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse current value or fallback to today
  const today = getCurrentJalaliDate();
  const parsed = parseJalaliDate(value) || today;

  const [viewYear, setViewYear] = useState<number>(parsed.year);
  const [viewMonth, setViewMonth] = useState<number>(parsed.month);

  // Sync view when opened
  useEffect(() => {
    if (isOpen) {
      const p = parseJalaliDate(value) || getCurrentJalaliDate();
      setViewYear(p.year);
      setViewMonth(p.month);
    }
  }, [isOpen, value]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const daysInMonth = getDaysInJalaliMonth(viewYear, viewMonth);

  const handleSelectDay = (day: number) => {
    const formatted = `${viewYear}/${String(viewMonth).padStart(2, '0')}/${String(day).padStart(2, '0')}`;
    onChange(formatted);
    setIsOpen(false);
  };

  const handlePrevMonth = () => {
    if (viewMonth === 1) {
      setViewYear((y) => y - 1);
      setViewMonth(12);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 12) {
      setViewYear((y) => y + 1);
      setViewMonth(1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  // Quick preset buttons
  const setQuickPreset = (offsetDays: number) => {
    // If offsetDays is 0, today
    if (offsetDays === 0) {
      onChange(today.formatted);
      setIsOpen(false);
      return;
    }
    // Calculate simple offset in current month or previous
    let d = today.day - offsetDays;
    let m = today.month;
    let y = today.year;
    while (d <= 0) {
      m -= 1;
      if (m < 1) {
        m = 12;
        y -= 1;
      }
      d += getDaysInJalaliMonth(y, m);
    }
    const formatted = `${y}/${String(m).padStart(2, '0')}/${String(d).padStart(2, '0')}`;
    onChange(formatted);
    setIsOpen(false);
  };

  const availableYears = [today.year - 2, today.year - 1, today.year, today.year + 1];

  return (
    <div className="relative space-y-1.5" ref={containerRef}>
      {label && (
        <label className="font-bold text-slate-700 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>{label}</span>
          </span>
          <span className="text-[10px] font-normal text-slate-400 font-mono">
            امروز: {toPersianDigits(today.formatted)}
          </span>
        </label>
      )}

      {/* Input box with click to open picker */}
      <div className="relative flex items-center">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          className="w-full h-10 pr-3 pl-20 rounded-xl bg-white border border-slate-200 font-mono text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-right"
        />

        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="absolute left-1.5 top-1.5 bottom-1.5 px-2.5 rounded-lg bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-800 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
          title="باز کردن تقویم برای انتخاب آسان تاریخ"
        >
          <Calendar className="w-3.5 h-3.5 text-teal-600" />
          <span>تقویم</span>
        </button>
      </div>

      {/* Dropdown Calendar Popover */}
      {isOpen && (
        <div className="absolute z-50 top-full mt-1.5 right-0 w-72 sm:w-80 rounded-2xl bg-white border border-slate-200 shadow-2xl p-3.5 space-y-3 animate-fadeIn text-slate-800">
          {/* Quick Presets */}
          <div className="flex items-center justify-between gap-1 pb-2 border-b border-slate-100 text-[10px] font-bold">
            <span className="text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>انتخاب سریع:</span>
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setQuickPreset(0)}
                className="px-2 py-1 rounded-md bg-teal-50 hover:bg-teal-100 text-teal-800 transition-colors"
              >
                امروز
              </button>
              <button
                type="button"
                onClick={() => setQuickPreset(1)}
                className="px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              >
                دیروز
              </button>
              <button
                type="button"
                onClick={() => setQuickPreset(7)}
                className="px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              >
                ۱ هفته پیش
              </button>
              <button
                type="button"
                onClick={() => setQuickPreset(30)}
                className="px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              >
                ۱ ماه پیش
              </button>
            </div>
          </div>

          {/* Month & Year Controls */}
          <div className="flex items-center justify-between gap-2 px-1">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
              title="ماه قبل"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2">
              <select
                value={viewMonth}
                onChange={(e) => setViewMonth(Number(e.target.value))}
                className="h-8 px-2 rounded-lg bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:border-teal-400"
              >
                {JALALI_MONTH_NAMES.map((name, idx) => (
                  <option key={name} value={idx + 1}>
                    {name}
                  </option>
                ))}
              </select>

              <select
                value={viewYear}
                onChange={(e) => setViewYear(Number(e.target.value))}
                className="h-8 px-2 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-teal-400"
              >
                {availableYears.map((y) => (
                  <option key={y} value={y}>
                    {toPersianDigits(y)}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
              title="ماه بعد"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-center pt-1">
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
              const formattedDay = `${viewYear}/${String(viewMonth).padStart(2, '0')}/${String(day).padStart(2, '0')}`;
              const isSelected = value === formattedDay;
              const isCurrentToday =
                today.year === viewYear && today.month === viewMonth && today.day === day;

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleSelectDay(day)}
                  className={`h-8 rounded-lg text-xs font-mono font-bold flex items-center justify-center transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 shadow-sm font-black'
                      : isCurrentToday
                      ? 'bg-teal-50 border border-teal-300 text-teal-800 hover:bg-teal-100'
                      : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  {toPersianDigits(day)}
                </button>
              );
            })}
          </div>

          {/* Footer note */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
            <span>تاریخ انتخابی: <strong className="font-mono text-slate-700">{value ? toPersianDigits(value) : '---'}</strong></span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-teal-700 font-bold hover:underline"
            >
              بستن
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
