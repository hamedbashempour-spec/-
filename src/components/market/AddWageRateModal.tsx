import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Coins,
  Calendar,
  User,
  Briefcase,
  FileCheck,
  ClipboardList,
  AlertCircle,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { ArtisanItem, AuthUser, WagePriceType } from '../../types';
import {
  APPROVED_CONSTRUCTION_TRADES,
  getFixedUnitForTrade,
  getApprovedTradeForCategory,
  isWageRateRegistrationAllowed,
} from '../../data/wageTradesData';
import { getCurrentJalaliDate } from '../../utils/jalaliDate';
import {
  toPersianDigits,
  formatPersianNumber,
  sanitizeNumericInput,
} from '../../utils/formatters';
import { createWagePrice } from '../../services/wageRatesService';
import { playNotificationChime } from '../../services/notificationService';
import { SimpleJalaliDatePicker } from '../common/SimpleJalaliDatePicker';

interface AddWageRateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  preselectedArtisan?: ArtisanItem | null;
  preselectedService?: string;
  artisansList: ArtisanItem[];
  currentUser?: AuthUser | null;
}

export const AddWageRateModal: React.FC<AddWageRateModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  preselectedArtisan,
  preselectedService,
  artisansList,
  currentUser,
}) => {
  const [selectedArtisanId, setSelectedArtisanId] = useState<string>('');
  const [serviceTitle, setServiceTitle] = useState<string>('آرماتوربند');
  const [priceTomans, setPriceTomans] = useState<string>('');
  const [priceType, setPriceType] = useState<WagePriceType>('executed_contract');
  const [actionDate, setActionDate] = useState<string>(() => getCurrentJalaliDate().formatted);
  const [note, setNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Fixed unit is determined centrally from the service title and cannot be modified by user
  const fixedUnit = getFixedUnitForTrade(serviceTitle);

  // Eligible artisans: artisans whose trade belongs to the 12 approved trades
  const eligibleArtisans = React.useMemo(() => {
    return artisansList.filter(
      (a) => a.entityType !== 'engineering_service' && a.entityType !== 'vendor' && isWageRateRegistrationAllowed(a.trade)
    );
  }, [artisansList]);

  // Track previous open state so we ONLY reset fields when modal actually opens, NEVER while user is typing!
  const prevIsOpenRef = useRef(false);

  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      if (preselectedArtisan) {
        setSelectedArtisanId(preselectedArtisan.id);
        const matchedTrade = getApprovedTradeForCategory(preselectedArtisan.trade);
        if (matchedTrade) {
          setServiceTitle(matchedTrade.title);
        } else if (preselectedArtisan.trade) {
          setServiceTitle(preselectedArtisan.trade);
        }
      } else if (eligibleArtisans.length > 0) {
        setSelectedArtisanId(eligibleArtisans[0].id);
        const matchedTrade = getApprovedTradeForCategory(eligibleArtisans[0].trade);
        if (matchedTrade) {
          setServiceTitle(matchedTrade.title);
        }
      } else if (artisansList.length > 0) {
        setSelectedArtisanId(artisansList[0].id);
      }

      setPriceTomans('');
      setPriceType('executed_contract');
      setActionDate(getCurrentJalaliDate().formatted);
      setNote('');
      setErrorMsg('');
      setIsSubmitting(false);
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, preselectedArtisan, eligibleArtisans, artisansList]);

  // Automatically sync service title whenever selected artisan changes
  useEffect(() => {
    const current = preselectedArtisan || artisansList.find((a) => a.id === selectedArtisanId);
    if (current?.trade) {
      const matched = getApprovedTradeForCategory(current.trade);
      if (matched) {
        setServiceTitle(matched.title);
      } else {
        setServiceTitle(current.trade);
      }
    }
  }, [selectedArtisanId, preselectedArtisan, artisansList]);

  if (!isOpen) return null;

  const currentSelectedArtisan = preselectedArtisan || artisansList.find((a) => a.id === selectedArtisanId);
  const matchedTrade = currentSelectedArtisan ? getApprovedTradeForCategory(currentSelectedArtisan.trade) : undefined;
  const activeTradeTitle = matchedTrade?.title || currentSelectedArtisan?.trade || serviceTitle;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const numericAmount = Number(sanitizeNumericInput(priceTomans, false));
    if (!numericAmount || numericAmount <= 0) {
      setErrorMsg('لطفاً مبلغ نرخ دستمزد را به تومان وارد نمایید.');
      return;
    }

    if (!currentSelectedArtisan) {
      setErrorMsg('لطفاً یک استادکار را انتخاب نمایید.');
      return;
    }

    if (!actionDate.trim()) {
      setErrorMsg('لطفاً تاریخ واقعی کار یا استعلام را مشخص فرمایید.');
      return;
    }

    setIsSubmitting(true);
    try {
      const activeEngineerName =
        currentUser?.fullName ||
        currentUser?.name ||
        (currentUser?.username ? `مهندس ${currentUser.username}` : 'مهندس عضو انجمن');

      await createWagePrice({
        artisanId: currentSelectedArtisan.id,
        artisanName: currentSelectedArtisan.fullName,
        artisanPhone: currentSelectedArtisan.phone,
        serviceTitle: activeTradeTitle,
        unit: fixedUnit,
        priceAmountTomans: numericAmount,
        priceType,
        actionDate: actionDate.trim(),
        note: note.trim() || undefined,
        registeredByUserId: currentUser?.username || 'guest',
        registeredByEngineerName: activeEngineerName,
        registeredByLicense: currentUser?.licenseNo || undefined,
      });

      playNotificationChime();
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error submitting wage price:', err);
      setErrorMsg(err.message || 'خطا در ثبت اطلاعات در سامانه.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto text-right">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center">
              <Coins className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                ثبت سابقه نرخ خدمات ساختمانی
              </h3>
              <p className="text-[11px] text-slate-500">
                دستمزد واقعی خدمات مجریان و استادکاران
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* 1. Artisan Selection */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-500" />
              <span>استادکار مربوط:</span>
            </label>
            {preselectedArtisan ? (
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-bold flex items-center justify-between">
                <span>{preselectedArtisan.fullName}</span>
                <span className="text-[10px] font-normal text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {preselectedArtisan.phone}
                </span>
              </div>
            ) : (
              <select
                value={selectedArtisanId}
                onChange={(e) => setSelectedArtisanId(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              >
                {(eligibleArtisans.length > 0 ? eligibleArtisans : artisansList).map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.fullName} ({a.trade} - {a.district})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* 2. Service Title (Automatically displayed from artisan's trade, no longer asking user) */}
          {currentSelectedArtisan && (
            <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-amber-700 shrink-0" />
                <div>
                  <span className="text-[11px] text-amber-800 font-medium block">
                    تخصص و خدمت اجرایی استادکار:
                  </span>
                  <span className="font-bold text-slate-900 text-xs">
                    {activeTradeTitle}
                  </span>
                </div>
              </div>
              <div className="text-left bg-white px-2.5 py-1 rounded-lg border border-amber-200 shadow-2xs">
                <span className="text-[10px] text-slate-400 block">واحد نرخ</span>
                <span className="font-bold text-slate-800 text-xs font-mono">{fixedUnit}</span>
              </div>
            </div>
          )}

          {/* 3. Rate Amount & Fixed Unit */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-end">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="font-bold text-slate-700 flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-amber-500" />
                <span>مبلغ نرخ دستمزد (به تومان):</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  value={priceTomans ? formatPersianNumber(priceTomans) : ''}
                  onChange={(e) => setPriceTomans(sanitizeNumericInput(e.target.value, false))}
                  placeholder="مثال: ۴۵۰,۰۰۰"
                  className="w-full h-10 pr-3 pl-12 rounded-xl bg-white border border-slate-200 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-mono text-sm"
                  required
                />
                <span className="absolute left-3 top-2.5 text-[10px] font-bold text-slate-400">
                  تومان
                </span>
              </div>
            </div>

            {/* Read-only Fixed Unit Display */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-500 flex items-center gap-1">
                <Lock className="w-3 h-3 text-slate-400" />
                <span>واحد ثابت:</span>
              </label>
              <div className="h-10 px-3 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs truncate">
                {fixedUnit}
              </div>
            </div>
          </div>

          {/* 4. Record Type Toggle (کار اجراشده vs استعلام قیمت) */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 block">
              نوع سابقه نرخ:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPriceType('executed_contract')}
                className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 text-center transition-all cursor-pointer ${
                  priceType === 'executed_contract'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold ring-2 ring-emerald-500/20'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-1">
                  <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-xs">کار اجراشده</span>
                </div>
                <span className="text-[10px] text-slate-500 font-normal">
                  نرخ کار واقعاً انجام‌شده
                </span>
              </button>

              <button
                type="button"
                onClick={() => setPriceType('inquiry_quote')}
                className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 text-center transition-all cursor-pointer ${
                  priceType === 'inquiry_quote'
                    ? 'bg-blue-50 border-blue-500 text-blue-950 font-bold ring-2 ring-blue-500/20'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-1">
                  <ClipboardList className="w-3.5 h-3.5 text-blue-600" />
                  <span className="text-xs">استعلام قیمت</span>
                </div>
                <span className="text-[10px] text-slate-500 font-normal">
                  قیمت پیشنهادی و استعلامی
                </span>
              </button>
            </div>
          </div>

          {/* 5. Actual Date with Simple Visual Jalali Picker */}
          <SimpleJalaliDatePicker
            value={actionDate}
            onChange={(val) => setActionDate(val)}
            label={
              priceType === 'executed_contract'
                ? 'تاریخ واقعی اجرای کار (شمسی):'
                : 'تاریخ دریافت استعلام (شمسی):'
            }
            required
          />

          {/* 6. Optional Note */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 flex items-center gap-1">
              <span>توضیح اختیاری (محدوده، شرایط کار، متراژ و ...):</span>
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="اختیاری: مثلاً اجرای سقف طبقه سوم، پروژه مسکونی در گلشهر..."
              className="w-full p-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>

          {/* Moderation Notice */}
          <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
            <p className="font-bold flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>ملاحظه مهم:</span>
            </p>
            <p className="mt-0.5 text-amber-800">
              جهت حفظ سلامت و اعتبار اطلاعات بازار، سوابق ثبت‌شده ابتدا در صف بررسی مدیریت قرار می‌گیرند و پس از تایید در آمار ۳۰ روز اخیر و تاریخچه عمومی نمایش داده خواهند شد.
            </p>
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-98 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-amber-400" />
              <span>{isSubmitting ? 'در حال ثبت...' : 'ثبت سابقه نرخ دستمزد'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs transition-colors"
            >
              انصراف
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
