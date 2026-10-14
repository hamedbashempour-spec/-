import React, { useState, useEffect, useMemo } from 'react';
import {
  FileCheck,
  CheckSquare,
  Square,
  RotateCcw,
  Copy,
  Check,
  ChevronDown,
  Info,
  Building,
  Share2,
  CheckCircle2,
  Search,
  Filter,
  ArrowRight,
  ArrowLeft,
  ClipboardList,
} from 'lucide-react';
import { checklistsData } from '../data/checklistsData';
import { toPersianDigits, formatPersianNumber } from '../utils/formatters';

export const ChecklistsView: React.FC = () => {
  const [selectedChecklistId, setSelectedChecklistId] = useState<string>(
    checklistsData[0].id
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Checked state map: { [itemId: string]: boolean }
  const [checkedMap, setCheckedMap] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('urmia_checklists_checked');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Project meta
  const [projectName, setProjectName] = useState(() => {
    return localStorage.getItem('urmia_checklists_proj_name') || '';
  });
  const [siteLocation, setSiteLocation] = useState(() => {
    return localStorage.getItem('urmia_checklists_site_loc') || '';
  });
  const [copied, setCopied] = useState(false);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('urmia_checklists_checked', JSON.stringify(checkedMap));
    } catch {
      // ignore quota
    }
  }, [checkedMap]);

  useEffect(() => {
    localStorage.setItem('urmia_checklists_proj_name', projectName);
  }, [projectName]);

  useEffect(() => {
    localStorage.setItem('urmia_checklists_site_loc', siteLocation);
  }, [siteLocation]);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set(checklistsData.map((c) => c.category));
    return ['all', ...Array.from(set)];
  }, []);

  // Filtered checklists
  const filteredChecklists = useMemo(() => {
    return checklistsData.filter((chk) => {
      const matchCat = categoryFilter === 'all' || chk.category === categoryFilter;
      const q = searchQuery.trim().toLowerCase();
      const matchSearch =
        !q ||
        chk.title.toLowerCase().includes(q) ||
        chk.stage.toLowerCase().includes(q) ||
        chk.category.toLowerCase().includes(q) ||
        chk.items.some((i) => i.text.toLowerCase().includes(q));
      return matchCat && matchSearch;
    });
  }, [categoryFilter, searchQuery]);

  const currentIndex = checklistsData.findIndex((c) => c.id === selectedChecklistId);
  const currentChecklist =
    checklistsData.find((c) => c.id === selectedChecklistId) ||
    checklistsData[0];

  const toggleItem = (itemId: string) => {
    setCheckedMap((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  const handleSelectAll = () => {
    const next = { ...checkedMap };
    currentChecklist.items.forEach((item) => {
      next[item.id] = true;
    });
    setCheckedMap(next);
  };

  const handleClearCurrent = () => {
    if (confirm('آیا از بازنشانی و پاک‌سازی تیک‌های این چک‌لیست اطمینان دارید؟')) {
      const next = { ...checkedMap };
      currentChecklist.items.forEach((item) => {
        delete next[item.id];
      });
      setCheckedMap(next);
    }
  };

  // Next and Previous stage navigation
  const handlePrevStage = () => {
    if (currentIndex > 0) {
      setSelectedChecklistId(checklistsData[currentIndex - 1].id);
      window.scrollTo({ top: 120, behavior: 'smooth' });
    }
  };

  const handleNextStage = () => {
    if (currentIndex < checklistsData.length - 1) {
      setSelectedChecklistId(checklistsData[currentIndex + 1].id);
      window.scrollTo({ top: 120, behavior: 'smooth' });
    }
  };

  // Calculate progress for current checklist
  const totalItems = currentChecklist.items.length;
  const completedCount = currentChecklist.items.filter(
    (item) => checkedMap[item.id]
  ).length;
  const progressPercent = Math.round((completedCount / totalItems) * 100);

  // Overall project progress across all 30 stages
  const totalProjectItems = checklistsData.reduce((acc, c) => acc + c.items.length, 0);
  const totalProjectCompleted = Object.values(checkedMap).filter(Boolean).length;
  const totalProjectPercent = Math.round((totalProjectCompleted / totalProjectItems) * 100);

  // Copy full summary to clipboard
  const handleCopyReport = () => {
    const today = new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date());

    let report = `📋 صورت‌جلسه کنترل چک‌لیست کارگاهی - انجمن مجریان ذیصلاح ارومیه\n`;
    report += `عنوان چک‌لیست: ${currentChecklist.title}\n`;
    report += `مرحله پروژه: ${currentChecklist.stage}\n`;
    if (projectName) report += `پروژه / کارفرما: ${projectName}\n`;
    if (siteLocation) report += `آدرس کارگاه: ${siteLocation}\n`;
    report += `تاریخ ثبت کنترل: ${today}\n`;
    report += `پیشرفت کنترل این مرحله: ${completedCount} از ${totalItems} بند (${progressPercent}٪)\n\n`;
    report += `--- وضعیت کنترل بندهای نظارتی و کارگاهی ---\n`;

    currentChecklist.items.forEach((item, idx) => {
      const isDone = !!checkedMap[item.id];
      report += `${idx + 1}. [${isDone ? '✔ انجام و تایید شد' : '✖ دارای نقص یا در دست اقدام'}] ${item.text}\n`;
    });

    report += `\nسامانه انجمن مجریان ذیصلاح ارومیه`;

    navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-4 pb-12 animate-fadeIn text-right">
      {/* Title & Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-indigo-800 bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-200">
              {formatPersianNumber(checklistsData.length)} مرحله کامل
            </span>
            <h1 className="text-base font-bold text-slate-900">
              چک‌لیست‌های کارگاهی
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            کنترل دقیق کلیه مراحل ساخت‌وساز از تجهیز کارگاه و گودبرداری تا سفت‌کاری، وال‌پست و پایان‌کار
          </p>
        </div>

        {/* Global Project Progress Capsule */}
        <div className="text-left bg-slate-900 text-white px-3 py-1.5 rounded-xl shadow-2xs">
          <span className="text-[10px] text-slate-400 block leading-tight">کل پروژه</span>
          <span className="text-xs font-bold text-amber-400 font-mono">
            {toPersianDigits(totalProjectPercent)}٪
          </span>
        </div>
      </div>

      {/* Stage Selection & Search Container */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
          <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
            <ClipboardList className="w-4 h-4 text-indigo-600" />
            <span>انتخاب مرحله ساختمانی (از شروع تا تحویل نهایی):</span>
          </label>

          <span className="text-[11px] text-slate-500 font-medium">
            مرحله {toPersianDigits(currentIndex + 1)} از {toPersianDigits(checklistsData.length)}
          </span>
        </div>

        {/* Dropdown Selector */}
        <div className="relative">
          <select
            value={selectedChecklistId}
            onChange={(e) => setSelectedChecklistId(e.target.value)}
            className="w-full h-11 px-3.5 pr-4 pl-10 rounded-xl bg-slate-50 border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer"
          >
            {checklistsData.map((chk, index) => {
              const chkCompleted = chk.items.filter((i) => checkedMap[i.id]).length;
              const chkTotal = chk.items.length;
              const isAllDone = chkCompleted === chkTotal && chkTotal > 0;
              return (
                <option key={chk.id} value={chk.id}>
                  {chk.title} {isAllDone ? '✔ (کامل)' : chkCompleted > 0 ? `(${chkCompleted}/${chkTotal})` : ''}
                </option>
              );
            })}
          </select>
          <ChevronDown className="w-4 h-4 text-slate-500 absolute left-3 top-3.5 pointer-events-none" />
        </div>

        {/* Quick Previous / Next Stage Stepper */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <button
            onClick={handlePrevStage}
            disabled={currentIndex === 0}
            className="flex-1 flex items-center justify-center gap-1.5 h-8 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-30 disabled:pointer-events-none text-slate-800 text-[11px] font-medium transition-colors"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            <span>مرحله قبل</span>
          </button>

          <button
            onClick={handleNextStage}
            disabled={currentIndex === checklistsData.length - 1}
            className="flex-1 flex items-center justify-center gap-1.5 h-8 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-30 disabled:pointer-events-none text-slate-800 text-[11px] font-medium transition-colors"
          >
            <span>مرحله بعد</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Project Meta Inputs (Optional) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-100">
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="نام پروژه یا کارفرما (اختیاری)"
            className="h-9 px-3 rounded-lg bg-slate-50 border border-slate-200 text-xs placeholder-slate-400 focus:outline-none focus:border-indigo-400"
          />
          <input
            type="text"
            value={siteLocation}
            onChange={(e) => setSiteLocation(e.target.value)}
            placeholder="آدرس کارگاه در ارومیه (اختیاری)"
            className="h-9 px-3 rounded-lg bg-slate-50 border border-slate-200 text-xs placeholder-slate-400 focus:outline-none focus:border-indigo-400"
          />
        </div>
      </div>

      {/* Progress & Summary Card for Selected Stage */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
        <div className="flex items-center justify-between text-xs flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 text-sm">
              {currentChecklist.title}
            </span>
            <span className="text-[10px] text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded font-medium border border-indigo-100">
              {currentChecklist.category}
            </span>
          </div>

          <span className="font-bold text-slate-800 font-mono text-xs">
            {toPersianDigits(completedCount)} از {toPersianDigits(totalItems)} بند ({toPersianDigits(progressPercent)}٪)
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 rounded-full ${
              progressPercent === 100
                ? 'bg-emerald-500'
                : progressPercent > 50
                ? 'bg-indigo-600'
                : 'bg-amber-500'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <p className="text-[11px] text-slate-600 leading-relaxed">
          {currentChecklist.description}
        </p>

        {/* Quick Batch Actions */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 text-xs flex-wrap">
          <div className="flex items-center gap-2">
            <button
              onClick={handleSelectAll}
              className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-[11px] transition-colors"
            >
              علامت‌گذاری همه
            </button>
            <button
              onClick={handleClearCurrent}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium text-[11px] transition-colors"
            >
              <RotateCcw className="w-3 h-3 text-slate-400" />
              <span>پاک‌سازی</span>
            </button>
          </div>

          <button
            onClick={handleCopyReport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-[11px] shadow-2xs transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>کپی شد!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>کپی صورتجلسه این مرحله</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Checklist Items List */}
      <div className="space-y-2.5">
        {currentChecklist.items.map((item, index) => {
          const isChecked = !!checkedMap[item.id];

          return (
            <div
              key={item.id}
              onClick={() => toggleItem(item.id)}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer select-none text-right flex items-start gap-3 ${
                isChecked
                  ? 'bg-emerald-50/70 border-emerald-300 shadow-2xs'
                  : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
              }`}
            >
              <button
                type="button"
                className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-colors ${
                  isChecked
                    ? 'bg-emerald-600 text-white'
                    : 'border-2 border-slate-300 bg-white hover:border-slate-400'
                }`}
                aria-label={isChecked ? 'تیک خورده' : 'تیک نخورده'}
              >
                {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </button>

              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                      isChecked
                        ? 'bg-emerald-200/80 text-emerald-900'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    بند {toPersianDigits(index + 1)}
                  </span>
                  <p
                    className={`text-xs font-semibold leading-snug transition-colors ${
                      isChecked ? 'text-emerald-950 line-through' : 'text-slate-800'
                    }`}
                  >
                    {item.text}
                  </p>
                </div>

                {item.tip && (
                  <p
                    className={`text-[11px] leading-relaxed flex items-center gap-1 ${
                      isChecked ? 'text-emerald-700/80' : 'text-slate-500'
                    }`}
                  >
                    <span className="font-bold text-amber-700">نکته نظارتی:</span>
                    <span>{item.tip}</span>
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
