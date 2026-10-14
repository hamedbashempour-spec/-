import React, { useState, useEffect } from 'react';
import {
  FileText,
  Calculator,
  Coins,
  Building2,
  CheckCircle2,
  Layers,
  ChevronDown,
  Info,
  Calendar,
  Clock,
} from 'lucide-react';
import { officialTariffsData, matchTariff, getTariffMatchDetails } from '../data/tariffsData';
import {
  toPersianDigits,
  formatPersianNumber,
  sanitizeNumericInput,
} from '../utils/formatters';
import { PrivateContractView } from './PrivateContractView';

export const TariffsView: React.FC = () => {
  const [currencyUnit, setCurrencyUnit] = useState<'rials' | 'tomans'>('tomans');

  // Input states as strings to allow smooth backspacing/clearing of every character without locking
  const [meterageInput, setMeterageInput] = useState<string>('1200');
  const [floorsInput, setFloorsInput] = useState<string>('4');

  const calcMeterage = parseFloat(meterageInput) || 0;
  const calcFloors = parseInt(floorsInput, 10) || 1;

  const matchDetails = getTariffMatchDetails(calcMeterage, calcFloors);
  const matchedTariff = matchDetails.tariff;
  const totalFeeRials = matchedTariff.feePerM2Rials * calcMeterage;
  const totalFeeTomans = totalFeeRials / 10;

  // Formula: Minimum contract duration = (floors * 2) + 3 months
  const floorsCount = Math.max(1, Math.round(calcFloors) || 1);
  const minContractDuration = floorsCount * 2 + 3;
  const [contractDurationMonths, setContractDurationMonths] = useState<number>(minContractDuration);

  useEffect(() => {
    const newMin = Math.max(1, Math.round(calcFloors) || 1) * 2 + 3;
    setContractDurationMonths((prev) => (prev < newMin ? newMin : prev));
  }, [calcFloors]);

  return (
    <div className="space-y-4 pb-12 animate-fadeIn text-right">
      {/* Title Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-300">
              تعرفه رسمی
            </span>
            <h1 className="text-base font-bold text-slate-900">
              جدول مصوب تعرفه دستمزد مجریان ذیصلاح
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            ابلاغیه رسمی جدول دستمزد مجریان (تجمیع دستمزد ناظرین) در شهرستان ارومیه
          </p>
        </div>

        {/* Currency Switcher */}
        <div className="flex items-center gap-1 p-0.5 rounded-xl bg-slate-200/80 text-[11px]">
          <button
            onClick={() => setCurrencyUnit('tomans')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
              currencyUnit === 'tomans'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            تومان
          </button>
          <button
            onClick={() => setCurrencyUnit('rials')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
              currencyUnit === 'rials'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ریال (متن ابلاغیه)
          </button>
        </div>
      </div>

      {/* Official Table Card */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-700" />
            <h2 className="text-xs font-bold text-slate-800">
              جدول ذیل اعلام و ابلاغ می‌نماید:
            </h2>
          </div>
          <span className="text-[10px] text-slate-400">
            واحد: {currencyUnit === 'rials' ? 'ریال بر متر مربع' : 'تومان بر متر مربع'}
          </span>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-300">
          <table className="w-full text-center text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                <th className="p-2 border-l border-slate-300 w-10">ردیف</th>
                <th className="p-2 border-l border-slate-300 bg-sky-100/70 text-sky-900">
                  گروه ساختمانی
                </th>
                <th className="p-2 border-l border-slate-300 bg-amber-100/70 text-amber-900">
                  تعداد طبقات از روی شالوده
                </th>
                <th className="p-2 border-l border-slate-300 bg-yellow-100/70 text-yellow-900">
                  متراژ (مترمربع)
                </th>
                <th className="p-2 bg-emerald-100/80 text-emerald-950">
                  دستمزد مجریان (تجمیع دستمزد ناظرین)
                </th>
              </tr>
            </thead>
            <tbody>
              {officialTariffsData.map((item, idx) => {
                const isSelected = matchedTariff.row === item.row;
                const displayPrice =
                  currencyUnit === 'rials'
                    ? item.feePerM2Formatted + ' ریال'
                    : formatPersianNumber(Math.round(item.feePerM2Tomans)) + ' تومان';

                return (
                  <tr
                    key={item.row}
                    className={`border-b border-slate-200 transition-colors ${
                      isSelected ? 'bg-amber-100/40 font-bold' : idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                    }`}
                  >
                    <td className="p-2.5 border-l border-slate-200 font-mono text-slate-600">
                      {toPersianDigits(item.row)}
                    </td>
                    <td className="p-2.5 border-l border-slate-200 bg-sky-50/60 font-bold text-sky-950">
                      {item.buildingGroup}
                    </td>
                    <td className="p-2.5 border-l border-slate-200 bg-amber-50/50 text-slate-800">
                      {item.floorsDescription}
                    </td>
                    <td className="p-2.5 border-l border-slate-200 bg-yellow-50/60 font-medium text-slate-800">
                      {item.meterageDescription}
                    </td>
                    <td className="p-2.5 bg-emerald-50/70 font-mono font-bold text-emerald-900 text-xs sm:text-sm" dir="ltr">
                      {toPersianDigits(displayPrice)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive Tariff Calculator */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center gap-2">
          <Calculator className="w-4 h-4 text-amber-600" />
          <h2 className="text-xs sm:text-sm font-bold text-slate-900">
            محاسبه حداقل حق‌الزحمه پروژه بر اساس تعرفه مصوب
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] text-slate-700 font-bold block">
                مساحت زیربنای کل پروانه (متر مربع):
              </label>
              <span className="text-[10px] font-bold text-sky-800 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200">
                گروه متراژ: {matchDetails.meterageRow.buildingGroup}
              </span>
            </div>
            <input
              type="text"
              inputMode="decimal"
              value={meterageInput}
              onFocus={(e) => e.target.select()}
              onChange={(e) =>
                setMeterageInput(sanitizeNumericInput(e.target.value, true))
              }
              placeholder="مثال: ۱۲۰۰"
              className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs focus:outline-none focus:border-amber-400"
            />
            <span className="text-[11px] font-bold text-rose-600 block mt-1">
              مساحت نقشه‌های مصوب + حیاط
            </span>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] text-slate-700 font-bold block">
                تعداد طبقات از روی شالوده:
              </label>
              <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                گروه طبقات: {matchDetails.floorsRow.buildingGroup}
              </span>
            </div>
            <input
              type="text"
              inputMode="numeric"
              value={floorsInput}
              onFocus={(e) => e.target.select()}
              onChange={(e) =>
                setFloorsInput(sanitizeNumericInput(e.target.value, false))
              }
              placeholder="مثال: ۴"
              className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs focus:outline-none focus:border-amber-400"
            />
            <span className="text-[10px] text-slate-400 block mt-1">
              شامل همکف و کلیه طبقات روی پی
            </span>
          </div>
        </div>

        {/* Calculation Result Summary Card */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100 border border-emerald-300 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-emerald-800 bg-white px-2 py-0.5 rounded border border-emerald-200">
                ردیف {toPersianDigits(matchedTariff.row)} مصوب
              </span>
              <span className="text-xs font-bold text-slate-900">
                گروه ساختمانی قطعی: {matchedTariff.buildingGroup}
              </span>
            </div>

            <div className="text-[11px] text-slate-600">
              حداقل نرخ هر متر مربع: <strong className="font-mono text-emerald-900">{formatPersianNumber(Math.round(matchedTariff.feePerM2Tomans))} تومان</strong>
            </div>
          </div>

          <div className="pt-2 border-t border-emerald-200 flex items-center justify-between flex-wrap gap-2">
            <div>
              <span className="text-[11px] text-slate-600 block">
                مجموع کل حداقل حق‌الزحمه اجرای ساختمان (حداقل تعرفه مصوب قانونی):
              </span>
              <span className="text-base sm:text-lg font-bold text-emerald-950 font-mono" dir="ltr">
                {formatPersianNumber(Math.round(totalFeeTomans))} تومان
              </span>
            </div>

            <div className="text-left text-[11px] text-slate-500 font-mono">
              معادل: {toPersianDigits(formatPersianNumber(Math.round(totalFeeRials)))} ریال
            </div>
          </div>

          {/* Contract Duration Calculation & Stepper */}
          <div className="pt-2 border-t border-emerald-200 flex items-center justify-between flex-wrap gap-2 text-xs">
            <div className="space-y-0.5">
              <span className="text-[11px] text-slate-800 font-bold flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-700" />
                <span>مدت زمان اجرای قرارداد (ماه شمسی):</span>
              </span>
              <span className="text-[10px] text-slate-500 block">
                حداقل قانونی طبق فرمول (تعداد طبقات × ۲) + ۳:{' '}
                <strong className="font-mono text-slate-900 font-bold">
                  {toPersianDigits(minContractDuration)} ماه
                </strong>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center bg-white border border-emerald-300 rounded-xl p-0.5 shadow-2xs">
                <button
                  type="button"
                  disabled={contractDurationMonths <= minContractDuration}
                  onClick={() =>
                    setContractDurationMonths((prev) =>
                      Math.max(minContractDuration, prev - 1)
                    )
                  }
                  className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-slate-700 hover:bg-emerald-50 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  title="کاهش مدت زمان (تا سقف حداقل فرمول)"
                >
                  -
                </button>
                <input
                  type="text"
                  inputMode="numeric"
                  value={contractDurationMonths}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => {
                    const parsed = parseInt(e.target.value.replace(/[^0-9]/g, ''), 10);
                    if (!isNaN(parsed)) {
                      setContractDurationMonths(parsed);
                    }
                  }}
                  onBlur={() => {
                    if (contractDurationMonths < minContractDuration) {
                      setContractDurationMonths(minContractDuration);
                    }
                  }}
                  className="w-12 h-7 text-center font-mono font-bold text-xs text-emerald-950 bg-transparent focus:outline-none"
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => setContractDurationMonths((prev) => prev + 1)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-slate-700 hover:bg-emerald-50 transition-colors"
                  title="افزایش مدت زمان قرارداد"
                >
                  +
                </button>
              </div>
              <span className="text-[11px] font-bold text-emerald-900">ماه</span>
            </div>
          </div>
        </div>
      </div>

      {/* Private Conditions Contract Generator - Directly under the Price Calculator */}
      <PrivateContractView
        initialMeterage={calcMeterage}
        initialFloors={calcFloors}
        initialFeeTomans={totalFeeTomans}
        initialFeeRials={totalFeeRials}
        initialDurationMonths={contractDurationMonths}
      />

      {/* Official Guidelines & Clarifications */}
      <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200 space-y-2 text-xs text-slate-700 leading-relaxed">
        <div className="flex items-center gap-2 text-slate-900 font-bold">
          <Info className="w-4 h-4 text-amber-700" />
          <span>نکات و ضوابط اجرایی تعرفه مصوب:</span>
        </div>
        <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-600">
          <li>تعرفه فوق مبنای حق‌الزحمه خدمات مدیریت اجرای ساختمان و تجمیع دستمزد ناظرین می‌باشد.</li>
          <li><strong>مبنای محاسبه گروه ساختمانی:</strong> مطابق مقررات ملی ساختمان و تعرفه رسمی، تعداد طبقات یا متراژ زیربنا هرکدام که شامل گروه ساختمانی بزرگ‌تری باشد، ملاک تعیین گروه قطعی ساختمان و نرخ تعرفه مصوب خواهد بود (به عنوان مثال ۳۰۰ متر مربع با ۴ طبقه در گروه «ب» و همچنین ۶۵۰ متر مربع با ۱ طبقه در گروه «ب» قرار می‌گیرد).</li>
          <li>در پروژه‌های دارای بیش از ۱۶ طبقه، نرخ مصوب ردیف ۸ (گروه د C) ملاک عمل قرار می‌گیرد.</li>
          <li>کلیه مبالغ قرارداد بر اساس متراژ مندرج در پروانه ساختمانی صادره از شهرداری ارومیه محاسبه می‌گردد.</li>
          <li>هرگونه کسر یا تعدیل خارج از چارچوب مصوبات هیئت چهار نفره استان فاقد وجاهت قانونی است.</li>
        </ul>
      </div>
    </div>
  );
};
