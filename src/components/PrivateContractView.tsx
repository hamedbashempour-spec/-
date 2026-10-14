import React, { useState, useEffect } from 'react';
import {
  FileText,
  Printer,
  Copy,
  Check,
  Building,
  User,
  Calendar,
  Clock,
  Coins,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Download,
  AlertCircle,
  AlertTriangle,
  TrendingUp,
  Lock,
  Edit3,
} from 'lucide-react';
import {
  toPersianDigits,
  formatPersianNumber,
  sanitizeNumericInput,
} from '../utils/formatters';
import { trackEvent } from '../utils/analytics';

interface PrivateContractViewProps {
  initialMeterage: number;
  initialFloors: number;
  initialFeeTomans: number;
  initialFeeRials: number;
  initialDurationMonths?: number;
}

export const PrivateContractView: React.FC<PrivateContractViewProps> = ({
  initialMeterage,
  initialFloors,
  initialFeeTomans,
  initialFeeRials,
  initialDurationMonths,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Employer Info
  const [employerName, setEmployerName] = useState('');
  const [employerNationalId, setEmployerNationalId] = useState('');
  const [employerPhone, setEmployerPhone] = useState('');
  const [employerAddress, setEmployerAddress] = useState('ارومیه، ');

  // Contractor / Qualified Executor (مدیر پیمان) Info
  const [contractorName, setContractorName] = useState('');
  const [contractorLicense, setContractorLicense] = useState('');
  const [contractorNationalId, setContractorNationalId] = useState('');
  const [contractorPhone, setContractorPhone] = useState('');

  // Project Info
  const [permitNumber, setPermitNumber] = useState('');
  const [parcelNumber, setParcelNumber] = useState('');
  const [projectAddress, setProjectAddress] = useState('ارومیه، ');

  // Fee state - syncs automatically whenever initialFeeTomans changes from the calculator!
  const minTariffTomans = Math.round(initialFeeTomans);
  const [customFeeTomans, setCustomFeeTomans] = useState<string>(
    String(minTariffTomans)
  );

  useEffect(() => {
    setCustomFeeTomans(String(Math.round(initialFeeTomans)));
  }, [initialFeeTomans]);

  // Exact User Formula: minDurationMonths = (floors * 2) + 3
  const floorsCount = Math.max(initialFloors || 1, 1);
  const minDurationMonths = floorsCount * 2 + 3;
  const [customDurationMonths, setCustomDurationMonths] = useState<string>(
    String(initialDurationMonths ? Math.max(initialDurationMonths, minDurationMonths) : minDurationMonths)
  );

  useEffect(() => {
    const calculatedMin = Math.max(initialFloors || 1, 1) * 2 + 3;
    setCustomDurationMonths((prev) => {
      const prevNum = parseInt(prev, 10);
      if (isNaN(prevNum) || prevNum < calculatedMin) {
        return String(calculatedMin);
      }
      return prev;
    });
  }, [initialFloors]);

  useEffect(() => {
    if (initialDurationMonths) {
      setCustomDurationMonths(String(Math.max(initialDurationMonths, minDurationMonths)));
    }
  }, [initialDurationMonths, minDurationMonths]);

  const handleDurationBlur = () => {
    const parsed = parseInt(customDurationMonths, 10);
    if (isNaN(parsed) || parsed < minDurationMonths) {
      setCustomDurationMonths(String(minDurationMonths));
    }
  };

  const handleStepDuration = (delta: number) => {
    const current = parseInt(customDurationMonths, 10) || minDurationMonths;
    const nextVal = Math.max(minDurationMonths, current + delta);
    setCustomDurationMonths(String(nextVal));
  };

  // Current values & validation
  const currentFeeTomans = customFeeTomans ? parseFloat(customFeeTomans) || 0 : minTariffTomans;
  const currentFeeRials = currentFeeTomans * 10;
  const isBelowMinimum = currentFeeTomans < minTariffTomans;

  const currentDurationMonths = customDurationMonths
    ? parseInt(customDurationMonths, 10) || 0
    : minDurationMonths;
  const isDurationBelowMinimum = currentDurationMonths < minDurationMonths;

  const handleCopyContract = () => {
    if (isBelowMinimum) {
      alert('مبلغ قرارداد کمتر از حداقل تعرفه مصوب است و امکان دریافت قرارداد وجود ندارد.');
      return;
    }
    if (isDurationBelowMinimum) {
      alert(`مدت زمان قرارداد کمتر از حداقل فرمول مصوب (${toPersianDigits(minDurationMonths)} ماه) است و امکان دریافت قرارداد وجود ندارد.`);
      return;
    }
    const contractText = generateContractPlainText();
    navigator.clipboard.writeText(contractText);
    setCopied(true);
    trackEvent('generate_contract', 'قرارداد مدیریت پیمان', `کپی قرارداد - مبلغ: ${formatPersianNumber(currentFeeTomans)} تومان - مدت: ${toPersianDigits(currentDurationMonths)} ماه`);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    if (isBelowMinimum) {
      alert('مبلغ قرارداد کمتر از حداقل تعرفه مصوب است و امکان دریافت قرارداد وجود ندارد.');
      return;
    }
    if (isDurationBelowMinimum) {
      alert(`مدت زمان قرارداد کمتر از حداقل فرمول مصوب (${toPersianDigits(minDurationMonths)} ماه) است و امکان دریافت قرارداد وجود ندارد.`);
      return;
    }
    trackEvent('generate_contract', 'قرارداد مدیریت پیمان', `چاپ قرارداد - مبلغ: ${formatPersianNumber(currentFeeTomans)} تومان - مدت: ${toPersianDigits(currentDurationMonths)} ماه`);
    window.print();
  };

  const generateContractPlainText = () => {
    return `قرارداد مدیریت پیمان اجرای ساختمان (شرایط خصوصی)
نوع قرارداد: مدیریت پیمان (مدیریت اجرای ساختمان)
شماره پروانه شهرداری: ${permitNumber || '................'} | پلاک ثبتی: ${parcelNumber || '................'}

این قرارداد در تاریخ ${new Intl.DateTimeFormat('fa-IR').format(new Date())} فی‌مابین طرفین ذیل بر مبنای ماهیت مدیریت پیمان و رعایت مقررات ملی ساختمان منعقد گردید:

ماده ۱ - طرفین قرارداد:
۱-۱) کارفرما: ${employerName || '................................'}، فرزند: ........، شماره ملی: ${employerNationalId || '................'}، تلفن همراه: ${employerPhone || '................'}، نشانی: ${employerAddress || 'ارومیه، ................................'}.
۱-۲) مجری ذیصلاح (مدیر پیمان): ${contractorName || '................................'}، شماره پروانه اشتغال به کار مهندسی: ${contractorLicense || '................'}، شماره ملی/شناسه: ${contractorNationalId || '................'}، تلفن: ${contractorPhone || '................'}.

ماده ۲ - موضوع پیمان و ماهیت قرارداد (مدیریت پیمان):
۲-۱) نوع این قرارداد صراحتاً «مدیریت پیمان» می‌باشد. موضوع پیمان عبارت است از مدیریت فنی، اجرایی، هماهنگی و نظارتی کلیه عملیات ساختمانی پروژه واقع در ارومیه، ${projectAddress || '................................'} به مساحت زیربنای کل ${formatPersianNumber(initialMeterage)} متر مربع (مساحت نقشه‌های مصوب به انضمام حیاط و مشاعات) در ${toPersianDigits(floorsCount)} طبقه از روی شالوده.
۲-۲) مدیر پیمان (مجری) نماینده فنی و امین کارفرما در کارگاه بوده و وظیفه سازماندهی اکیپ‌های اجرایی، کنترل کیفیت مصالح، انطباق با نقشه‌ها و هدایت پروژه را عهده‌دار است. تأمین کامل نقدینگی، پرداخت فاکتورهای خرید مصالح، دستمزد کارگران و کرایه ماشین‌آلات کلاً بر عهده و به هزینه کارفرماست.

ماده ۳ - مدت زمان اجرای قرارداد:
مدت زمان کل اجرای موضوع پیمان برابر با ${toPersianDigits(currentDurationMonths)} (${numberToPersianWords(currentDurationMonths)}) ماه شمسی از تاریخ تحویل رسمی کارگاه به مدیر پیمان می‌باشد${
      currentDurationMonths > minDurationMonths
        ? ` (توافق‌شده با رعایت حداقل ضابطه مصوب فرمول: ${toPersianDigits(minDurationMonths)} ماه)`
        : ' (محاسبه‌شده دقیقاً بر اساس ضابطه مصوب: تعداد طبقات ضرب در دو به‌علاوه سه ماه)'
    }.

ماده ۴ - مبلغ حق‌الزحمه مدیریت پیمان:
مبلغ کل حق‌الزحمه مدیریت اجرای پیمان بر اساس تعرفه مصوب برابر با ${formatPersianNumber(Math.round(currentFeeTomans))} تومان (معادل ${formatPersianNumber(Math.round(currentFeeRials))} ریال) تعیین می‌گردد.

ماده ۵ - الزام پرداخت افزایش متراژ به قیمت تعرفه روز (شرط صریح و قطعی):
در صورت هرگونه افزایش متراژ نسبت به نقشه‌های اولیه (اعم از اضافه اشکوب، توسعه در بالکن‌ها و پیش‌آمدگی‌ها، تغییرات مساحت زیرزمین، حیاط و محوطه‌سازی، راه‌پله، بهاربند، روف‌گاردن یا هرگونه مغایرت وضع موجود با پروانه)، کارفرما مکلف و متعهد است به قیمت تعرفه روز رسمی زمان تسویه، مبلغ اضافه متراژ را به طور کامل به مجری (مدیر پیمان) پرداخت نماید. عدم پرداخت مابه‌التفاوت اضافه متراژ به قیمت روز، حق توقف مراحل صدور پایان‌کار و تأیید سهمیه را برای مجری محفوظ می‌دارد.

ماده ۶ - تعهدات مالی کارفرما در مدیریت پیمان و تنخواه‌گردان:
کارفرما مکلف است تنخواه‌گردان لازم را متناسب با برنامه زمان‌بندی در حساب ویژه پروژه واریز نماید تا خرید به موقع مصالح و تسویه دستمزد اکیپ‌ها متوقف نگردد. هرگونه وقفه ناشی از کمبود نقدینگی متوجه کارفرماست.

ماده ۷ - تأخیرات مجاز مدیر پیمان:
۷-۱) روزهای تأخیر کارفرما در شارژ تنخواه‌گردان یا پرداخت اقساط حق‌الزحمه، عیناً به اضافه ۳ روز کاری (جهت تجهیز و هماهنگی مجدد اکیپ‌ها) به مدت پیمان اضافه می‌گردد.
۷-۲) برودت و یخبندان زمستانه شهر ارومیه (دمای کمتر از منفی ۵ درجه) که به تشخیص ناظر مانع عملیات بتنی و تر است، تأخیر مجاز محسوب می‌شود.
۷-۳) هرگونه تأخیر در اخذ استعلامات اداری، معارضین ملکی و تغییر نقشه‌ها تأخیر مجاز پیمان است.

ماده ۸ - تعلیق کارگاه و خسارت خواب پروژه:
در صورتی که کارگاه به دلایل عدم تأمین نقدینگی کارفرما یا توقف توسط مراجع بیش از ۱۵ روز متوقف شود، هزینه بالاسری و حراست کارگاه روزانه به عهده کارفرما خواهد بود.

ماده ۹ - بیمه و مسئولیت مدنی (HSE):
کارفرما ملزم به اخذ بیمه‌نامه کامل مسئولیت مدنی کارفرما در قبال کارکنان و اشخاص ثالث با پوشش بی‌نام، بدون فرانشیز و کلوزهای کامل حوادث کارگاهی است.

ماده ۱۰ - تحویل موقت و آزادسازی سهمیه مهندسی مجری:
کارفرما متعهد است حداکثر ظرف ۱۵ روز پس از تحویل موقت ساختمان، نسبت به تسویه حساب کامل حق‌الزحمه (شامل متراژ پایه و هرگونه اضافه متراژ به نرخ روز) و تأیید آزادسازی سهمیه مجری در سازمان نظام مهندسی اقدام نماید.

ماده ۱۱ - حل اختلاف و داوری:
در صورت بروز هرگونه اختلاف، موضوع به «کمیته حل اختلاف و داوری انجمن صنفی مهندسان مجری ذیصلاح شهرستان ارومیه» ارجاع و رأی آن برای طرفین قطعی و لازم‌الاجراست.

این قرارداد در دو نسخه متحدالمتن تنظیم و امضا گردید.
امضای کارفرما                                   امضای مجری ذیصلاح (مدیر پیمان)`;
  };

  return (
    <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4 text-right">
      {/* Header and Toggle */}
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-800 flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                سامانه تنظیم قرارداد مدیریت پیمان (شرایط خصوصی)
              </h3>
              <span className="text-[10px] bg-sky-100 text-sky-800 font-bold px-2 py-0.5 rounded border border-sky-300">
                نوع قرارداد: مدیریت پیمان
              </span>
            </div>
            <span className="text-[11px] text-slate-500 block mt-0.5">
              محاسبه هوشمند مدت: (طبقات × ۲) + ۳ ماه · بند صریح پرداخت اضافه متراژ به تعرفه روز
            </span>
          </div>
        </div>

        <button className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
          {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
      </div>

      {/* Main Content Area */}
      {isOpen && (
        <div className="space-y-4 pt-3 border-t border-slate-100 animate-fadeIn">
          {/* Quick Metrics Bar - Synchronized with live calculation */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-500 block mb-0.5">مبلغ قرارداد (همگام با متراژ):</span>
              <span className="font-bold text-slate-900 font-mono text-xs">
                {formatPersianNumber(Math.round(currentFeeTomans))} تومان
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-500 block mb-0.5">
                مدت پیمان (حداقل {toPersianDigits(minDurationMonths)} ماه):
              </span>
              <span className="font-bold text-slate-900 font-mono text-xs">
                {toPersianDigits(currentDurationMonths)} ماه شمسی
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 col-span-2 sm:col-span-1">
              <span className="text-[10px] text-slate-500 block mb-0.5">زیربنای محاسبه‌شده:</span>
              <span className="text-[11px] text-slate-700 font-medium">
                {formatPersianNumber(initialMeterage)} مترمربع در {toPersianDigits(floorsCount)} طبقه
              </span>
            </div>
          </div>

          {/* Section: Contract Duration Determination & Minimum Formula Protection */}
          <div
            className={`p-4 rounded-xl border text-xs space-y-3 transition-colors ${
              isDurationBelowMinimum
                ? 'bg-rose-50/90 border-rose-300'
                : 'bg-amber-50/70 border-amber-300'
            }`}
          >
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Clock
                  className={`w-4 h-4 ${
                    isDurationBelowMinimum ? 'text-rose-600' : 'text-amber-700'
                  }`}
                />
                <h4 className="font-bold text-slate-900 text-xs">
                  تعیین مدت زمان قرارداد (حق ویرایش با رعایت حداقل فرمول):
                </h4>
              </div>
              <span className="text-[11px] text-slate-600 font-medium">
                فرمول حداقل مدت:{' '}
                <strong className="font-mono text-slate-900">
                  (طبقات × ۲) + ۳ = {toPersianDigits(minDurationMonths)} ماه
                </strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-[11px] text-slate-700 font-bold block mb-1">
                  مدت زمان قرارداد نهایی (ماه شمسی) - قابل ویرایش و افزایش:
                </label>
                <div className="flex items-center gap-1.5">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={customDurationMonths}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) =>
                        setCustomDurationMonths(
                          sanitizeNumericInput(e.target.value, false)
                        )
                      }
                      onBlur={handleDurationBlur}
                      placeholder={`حداقل ${toPersianDigits(minDurationMonths)}`}
                      className={`w-full h-10 px-3 pr-9 rounded-xl font-mono text-xs text-left bg-white border transition-colors ${
                        isDurationBelowMinimum
                          ? 'border-rose-500 text-rose-900 focus:ring-2 focus:ring-rose-200'
                          : 'border-amber-400 text-slate-900 focus:ring-2 focus:ring-amber-200'
                      }`}
                      dir="ltr"
                    />
                    <Clock className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                  </div>

                  {/* Stepper buttons */}
                  <div className="flex items-center bg-white border border-amber-300 rounded-xl p-0.5 shadow-2xs h-10">
                    <button
                      type="button"
                      disabled={currentDurationMonths <= minDurationMonths}
                      onClick={() => handleStepDuration(-1)}
                      className="w-8 h-full rounded-lg flex items-center justify-center font-bold text-slate-700 hover:bg-amber-100 disabled:opacity-30 disabled:pointer-events-none transition-colors text-sm"
                      title="کاهش مدت (تا سقف حداقل فرمول)"
                    >
                      -
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStepDuration(1)}
                      className="w-8 h-full rounded-lg flex items-center justify-center font-bold text-slate-700 hover:bg-amber-100 transition-colors text-sm"
                      title="افزایش مدت قرارداد"
                    >
                      +
                    </button>
                  </div>
                </div>
                <span className="text-[10px] text-slate-500 block mt-1">
                  کاربر می‌تواند مدت را افزایش دهد، ولی کمتر از حداقل مجاز فرمول ({toPersianDigits(minDurationMonths)} ماه) مجاز نیست.
                </span>
              </div>

              <div className="flex flex-col justify-center">
                {isDurationBelowMinimum ? (
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-rose-700 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>مدت کمتر از حداقل فرمول مصوب است!</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setCustomDurationMonths(String(minDurationMonths))}
                      className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] transition-colors shadow-2xs text-center"
                    >
                      تنظیم خودکار روی حداقل فرمول ({toPersianDigits(minDurationMonths)} ماه)
                    </button>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-lg bg-white/80 border border-amber-200 text-[11px] text-amber-900 space-y-0.5">
                    <span className="font-bold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 text-amber-600" />
                      <span>مدت زمان قرارداد مورد تایید است</span>
                    </span>
                    <span className="text-[10px] text-amber-800 block">
                      {currentDurationMonths > minDurationMonths
                        ? `(افزایش‌یافته به میزان ${toPersianDigits(
                            currentDurationMonths - minDurationMonths
                          )} ماه بیش از حداقل فرمول)`
                        : `(منطبق بر حداقل فرمول مصوب: ${toPersianDigits(minDurationMonths)} ماه)`}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Warning if duration lower */}
            {isDurationBelowMinimum && (
              <div className="p-3 rounded-lg bg-rose-100 border border-rose-300 text-rose-900 text-xs flex items-start gap-2 animate-pulse">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold block">
                    هشدار: مدت زمان قرارداد کمتر از حداقل فرمول مصوب است!
                  </span>
                  <p className="text-[11px] leading-relaxed">
                    عقد قرارداد با مدت زمان کمتر از فرمول مصوب انجمن مقدور نمی‌باشد. (حداقل مدت مجاز برای {toPersianDigits(floorsCount)} طبقه: {toPersianDigits(minDurationMonths)} ماه)
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Section: Contract Fee Determination & Minimum Tariff Protection */}
          <div
            className={`p-4 rounded-xl border text-xs space-y-3 transition-colors ${
              isBelowMinimum
                ? 'bg-rose-50/90 border-rose-300'
                : 'bg-emerald-50/70 border-emerald-300'
            }`}
          >
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Coins
                  className={`w-4 h-4 ${
                    isBelowMinimum ? 'text-rose-600' : 'text-emerald-700'
                  }`}
                />
                <h4 className="font-bold text-slate-900 text-xs">
                  تعیین مبلغ حق‌الزحمه قرارداد (حق ویرایش با رعایت حداقل تعرفه):
                </h4>
              </div>
              <span className="text-[11px] text-slate-600 font-medium">
                حداقل تعرفه مصوب بر اساس متراژ:{' '}
                <strong className="font-mono text-slate-900">
                  {formatPersianNumber(minTariffTomans)} تومان
                </strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-[11px] text-slate-700 font-bold block mb-1">
                  مبلغ قرارداد نهایی (تومان) - قابل ویرایش و افزایش:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={customFeeTomans}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) =>
                      setCustomFeeTomans(
                        sanitizeNumericInput(e.target.value, false)
                      )
                    }
                    placeholder={`حداقل ${formatPersianNumber(minTariffTomans)}`}
                    className={`w-full h-10 px-3 pr-9 rounded-xl font-mono text-xs text-left bg-white border transition-colors ${
                      isBelowMinimum
                        ? 'border-rose-500 text-rose-900 focus:ring-2 focus:ring-rose-200'
                        : 'border-emerald-400 text-slate-900 focus:ring-2 focus:ring-emerald-200'
                    }`}
                    dir="ltr"
                  />
                  <Edit3 className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                </div>
                <span className="text-[10px] text-slate-500 block mt-1">
                  کاربر می‌تواند مبلغ را افزایش دهد، اما کمتر از حداقل تعرفه مجاز نیست.
                </span>
              </div>

              <div className="flex flex-col justify-center">
                {isBelowMinimum ? (
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-rose-700 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>مبلغ کمتر از حداقل تعرفه قانونی است!</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setCustomFeeTomans(String(minTariffTomans))}
                      className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] transition-colors shadow-2xs text-center"
                    >
                      تنظیم خودکار روی حداقل تعرفه ({formatPersianNumber(minTariffTomans)} تومان)
                    </button>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-lg bg-white/80 border border-emerald-200 text-[11px] text-emerald-800 space-y-0.5">
                    <span className="font-bold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>مبلغ قرارداد مورد تایید است</span>
                    </span>
                    <span className="text-[10px] text-emerald-700 block">
                      {currentFeeTomans > minTariffTomans
                        ? `(افزایش‌یافته به میزان ${formatPersianNumber(
                            currentFeeTomans - minTariffTomans
                          )} تومان بیش از حداقل تعرفه)`
                        : '(منطبق بر حداقل تعرفه قانونی مصوب)'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Warning if lower */}
            {isBelowMinimum && (
              <div className="p-3 rounded-lg bg-rose-100 border border-rose-300 text-rose-900 text-xs flex items-start gap-2 animate-pulse">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold block">
                    هشدار: مبلغ وارد شده کمتر از حداقل تعرفه مصوب است!
                  </span>
                  <p className="text-[11px] leading-relaxed">
                    عقد قرارداد با مبلغ کمتر از تعرفه انجمن مقدور نمی‌باشد. (حداقل تعرفه: {formatPersianNumber(minTariffTomans)} تومان)
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Form Inputs for Contract Parties */}
          <div className="space-y-3 p-3.5 rounded-xl bg-slate-50/80 border border-slate-200 text-xs">
            <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <User className="w-4 h-4 text-slate-600" />
              <span>تکمیل مشخصات طرفین و ملک:</span>
            </span>

            {/* Employer Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className="text-[11px] text-slate-600 block mb-1">
                  نام و نام خانوادگی کارفرما:
                </label>
                <input
                  type="text"
                  value={employerName}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setEmployerName(e.target.value)}
                  placeholder="مثال: رحیم محمدی"
                  className="w-full h-9 px-2.5 rounded-lg bg-white border border-slate-200 text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-600 block mb-1">کد ملی کارفرما:</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={employerNationalId}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) =>
                    setEmployerNationalId(
                      sanitizeNumericInput(e.target.value, false)
                    )
                  }
                  placeholder="۲۷۵xxxxxxx"
                  className="w-full h-9 px-2.5 rounded-lg bg-white border border-slate-200 text-xs font-mono"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-600 block mb-1">شماره تماس کارفرما:</label>
                <input
                  type="text"
                  inputMode="tel"
                  value={employerPhone}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) =>
                    setEmployerPhone(
                      sanitizeNumericInput(e.target.value, false)
                    )
                  }
                  placeholder="۰۹۱۴xxxxxxx"
                  className="w-full h-9 px-2.5 rounded-lg bg-white border border-slate-200 text-xs font-mono"
                  dir="ltr"
                />
              </div>
            </div>

            {/* Contractor / Qualified Executor (مدیر پیمان) Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-200/60">
              <div>
                <label className="text-[11px] text-slate-600 block mb-1">
                  نام مهندس مجری / مدیر پیمان:
                </label>
                <input
                  type="text"
                  value={contractorName}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setContractorName(e.target.value)}
                  placeholder="مهندس ..."
                  className="w-full h-9 px-2.5 rounded-lg bg-white border border-slate-200 text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-600 block mb-1">
                  شماره پروانه اشتغال مهندسی:
                </label>
                <input
                  type="text"
                  value={contractorLicense}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setContractorLicense(e.target.value)}
                  placeholder="پروانه نظام مهندسی"
                  className="w-full h-9 px-2.5 rounded-lg bg-white border border-slate-200 text-xs font-mono"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-600 block mb-1">
                  شماره تماس همراه مجری:
                </label>
                <input
                  type="text"
                  inputMode="tel"
                  value={contractorPhone}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) =>
                    setContractorPhone(
                      sanitizeNumericInput(e.target.value, false)
                    )
                  }
                  placeholder="۰۹۱۴xxxxxxx"
                  className="w-full h-9 px-2.5 rounded-lg bg-white border border-slate-200 text-xs font-mono"
                  dir="ltr"
                />
              </div>
            </div>

            {/* Project Permit & Address Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-200/60">
              <div>
                <label className="text-[11px] text-slate-600 block mb-1">
                  شماره پروانه ساختمانی شهرداری:
                </label>
                <input
                  type="text"
                  value={permitNumber}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setPermitNumber(e.target.value)}
                  placeholder="شماره پروانه شهرداری ارومیه"
                  className="w-full h-9 px-2.5 rounded-lg bg-white border border-slate-200 text-xs font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-600 block mb-1">پلاک ثبتی ملک:</label>
                <input
                  type="text"
                  value={parcelNumber}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setParcelNumber(e.target.value)}
                  placeholder="مثال: ۱۲۳۴ فرعی از ۵۶ اصلی"
                  className="w-full h-9 px-2.5 rounded-lg bg-white border border-slate-200 text-xs font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-600 block mb-1">آدرس پروژه در ارومیه:</label>
                <input
                  type="text"
                  value={projectAddress}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setProjectAddress(e.target.value)}
                  placeholder="خیابان، کوچه، پلاک"
                  className="w-full h-9 px-2.5 rounded-lg bg-white border border-slate-200 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Contract Guard: Withhold sample contract if below minimum */}
          {isBelowMinimum ? (
            <div className="p-8 rounded-2xl bg-rose-50 border-2 border-dashed border-rose-300 text-center space-y-4 animate-fadeIn">
              <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 mx-auto flex items-center justify-center shadow-sm">
                <Lock className="w-7 h-7" />
              </div>
              <div className="space-y-1.5 max-w-lg mx-auto">
                <h4 className="text-sm sm:text-base font-bold text-rose-950">
                  عقد قرارداد با مبلغ کمتر از تعرفه انجمن مقدور نمی‌باشد
                </h4>
                <p className="text-xs text-rose-700 leading-relaxed">
                  حداقل تعرفه مصوب انجمن برای این پروژه مبلغ {formatPersianNumber(minTariffTomans)} تومان می‌باشد. صدور و چاپ نمونه قرارداد تنها با مبالغ برابر یا بیشتر از تعرفه انجمن امکان‌پذیر است.
                </p>
                <p className="text-[11px] text-slate-500">
                  برای فعال‌سازی و دریافت نمونه قرارداد، لطفاً مبلغ قرارداد را برابر یا بالاتر از حداقل تعرفه تنظیم فرمایید یا از دکمه زیر استفاده نمایید.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setCustomFeeTomans(String(minTariffTomans))}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition-all active:scale-95 inline-flex items-center gap-2"
                >
                  <Coins className="w-4 h-4" />
                  <span>تنظیم خودکار بر روی حداقل تعرفه مصوب ({formatPersianNumber(minTariffTomans)} تومان)</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Action Buttons: Copy, Print */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyContract}
              className="flex-1 py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-colors active:scale-95"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>متن کامل قرارداد کپی شد</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-amber-400" />
                  <span>کپی متن کامل قرارداد مدیریت پیمان</span>
                </>
              )}
            </button>

            <button
              onClick={handlePrint}
              className="py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-colors active:scale-95 shrink-0"
              title="چاپ و پرینت استاندارد قرارداد"
            >
              <Printer className="w-4 h-4" />
              <span>چاپ / ذخیره PDF</span>
            </button>
          </div>

          {/* Live Preview Paper Container */}
          <div
            id="private-contract-document"
            className="p-5 sm:p-7 rounded-xl bg-slate-50 border border-slate-300 text-slate-800 text-xs leading-relaxed space-y-4 font-sans select-text shadow-inner"
          >
            {/* Header Document */}
            <div className="text-center border-b border-slate-300 pb-3 space-y-1">
              <span className="text-[10px] text-slate-500 block">بسمه تعالی</span>
              <h4 className="text-sm sm:text-base font-bold text-slate-950">
                قرارداد مدیریت پیمان اجرای ساختمان (شرایط خصوصی)
              </h4>
              <span className="text-[11px] font-bold text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-200 inline-block">
                نوع قرارداد: مدیریت پیمان (مدیریت اجرای ساختمان)
              </span>
              <div className="flex items-center justify-center gap-4 text-[10px] text-slate-500 pt-1">
                <span>شماره پروانه شهرداری: {permitNumber || '...............'}</span>
                <span>·</span>
                <span>پلاک ثبتی: {parcelNumber || '...............'}</span>
                <span>·</span>
                <span>شهرستان ارومیه</span>
              </div>
            </div>

            {/* Parties */}
            <div className="space-y-1.5 text-xs">
              <p>
                <strong>ماده ۱ - طرفین قرارداد:</strong> این قرارداد در تاریخ{' '}
                <span className="font-mono font-bold">
                  {new Intl.DateTimeFormat('fa-IR').format(new Date())}
                </span>{' '}
                بین طرفین ذیل بر مبنای ماهیت مدیریت پیمان منعقد گردید:
              </p>
              <p className="pr-3">
                <strong>۱-۱) کارفرما:</strong> آقا/خانم{' '}
                <span className="font-bold underline decoration-dotted">
                  {employerName || '................................'}
                </span>
                ، شماره ملی: <span className="font-mono">{employerNationalId || '................'}</span>،
                شماره همراه: <span className="font-mono">{employerPhone || '................'}</span>، به
                نشانی: {employerAddress || 'ارومیه، ....................................'}.
              </p>
              <p className="pr-3">
                <strong>۱-۲) مجری ذی‌صلاح (مدیر پیمان):</strong> آقا/خانم/شرکت{' '}
                <span className="font-bold underline decoration-dotted">
                  {contractorName || '................................'}
                </span>
                ، دارنده پروانه اشتغال به کار مهندسی شماره:{' '}
                <span className="font-mono">{contractorLicense || '................'}</span>، شماره
                ملی/شناسه: <span className="font-mono">{contractorNationalId || '................'}</span>
                ، شماره تلفن همراه: <span className="font-mono">{contractorPhone || '................'}</span>
                .
              </p>
            </div>

            {/* Subject and Management Nature */}
            <div className="space-y-1.5 text-xs">
              <p>
                <strong>ماده ۲ - موضوع و ماهیت قرارداد (مدیریت پیمان):</strong>
              </p>
              <p className="pr-3 text-slate-700 leading-relaxed">
                ۲-۱) نوع این قرارداد صراحتاً <strong>«مدیریت پیمان»</strong> است. موضوع پیمان عبارت است از مدیریت فنی، اجرایی، هماهنگی اکیپ‌ها و نظارت بر کلیه عملیات ساختمانی پروژه واقع در ارومیه،{' '}
                <span className="font-bold underline decoration-dotted">
                  {projectAddress || '................................'}
                </span>{' '}
                به مساحت زیربنای کل <strong>{formatPersianNumber(initialMeterage)}</strong> متر مربع (مساحت مندرج در نقشه‌های مصوب به انضمام حیاط و مشاعات) در{' '}
                <strong>{toPersianDigits(floorsCount)}</strong> طبقه از روی شالوده.
              </p>
              <p className="pr-3 text-slate-700 leading-relaxed">
                ۲-۲) مدیر پیمان نماینده فنی و امین کارفرما در کارگاه بوده و کلیه هزینه‌های خرید مصالح، دستمزد عوامل اجرایی، کرایه ماشین‌آلات، عوارض و آزمایش‌ها مستقیماً بر عهده و به هزینه کارفرما می‌باشد.
              </p>
            </div>

            {/* Duration */}
            <div className="space-y-1 text-xs">
              <p className="text-slate-700 leading-relaxed">
                <strong>ماده ۳ - مدت زمان اجرای قرارداد:</strong> مدت زمان کل اجرای موضوع پیمان برابر با{' '}
                <strong className="font-mono text-slate-800">
                  {toPersianDigits(currentDurationMonths)} ({numberToPersianWords(currentDurationMonths)}) ماه شمسی
                </strong>{' '}
                از تاریخ تحویل رسمی کارگاه به مدیر پیمان می‌باشد
                {currentDurationMonths > minDurationMonths
                  ? ` (توافق‌شده با رعایت حداقل ضابطه مصوب فرمول: ${toPersianDigits(minDurationMonths)} ماه).`
                  : ' (محاسبه‌شده دقیقاً طبق ضابطه مصوب فرمول: تعداد طبقات ضرب در ۲ به‌علاوه ۳ ماه).'}
              </p>
            </div>

            {/* Contract Fee */}
            <div className="space-y-1 text-xs">
              <p className="text-slate-700 leading-relaxed">
                <strong>ماده ۴ - مبلغ حق‌الزحمه مدیریت پیمان:</strong> مبلغ کل دستمزد مدیریت اجرای پیمان بر اساس تعرفه مصوب برابر با{' '}
                <strong className="font-mono text-slate-800">
                  {formatPersianNumber(Math.round(currentFeeTomans))} تومان
                </strong>{' '}
                (معادل{' '}
                <span className="font-mono text-slate-800">
                  {toPersianDigits(formatPersianNumber(Math.round(currentFeeRials)))} ریال
                </span>
                ) می‌باشد که بر اساس پیشرفت کار و مفاد این شرایط خصوصی پرداخت می‌گردد.
              </p>
            </div>

            {/* AREA INCREASE CLAUSE */}
            <div className="space-y-1 text-xs">
              <p className="text-slate-700 leading-relaxed">
                <strong>ماده ۵ - الزام پرداخت اضافه متراژ به قیمت تعرفه روز:</strong>{' '}
                در صورت هرگونه افزایش متراژ نسبت به متراژ اولیه مندرج در قرارداد (اعم از اضافه اشکوب، توسعه بالکن‌ها و پیش‌آمدگی‌ها، پیشروی طولی و عرضی بنا، افزایش مساحت زیرزمین‌ها، حیاط‌سازی، بهاربند، روف‌گاردن یا هرگونه تغییر در نقشه‌های مصوب به درخواست کارفرما یا تایید مراجع ذی‌صلاح)، کارفرما مکلف و متعهد است به قیمت تعرفه روز رسمی زمان تسویه، مبلغ اضافه متراژ را به طور کامل به مجری (مدیر پیمان) پرداخت نماید. مجری حق دارد تا زمان تسویه کامل مبلغ اضافه متراژ به نرخ روز، از تأیید پایان‌کار و آزادسازی سهمیه خودداری نماید.
              </p>
            </div>

            {/* Contractor-Friendly Specific Management Clauses */}
            <div className="space-y-2 text-xs">
              <p>
                <strong>ماده ۶ - تأمین نقدینگی و تنخواه‌گردان کارفرما:</strong> در قرارداد مدیریت پیمان، کارفرما مکلف است تنخواه‌گردان مالی متناسب با مراحل ساخت را به موقع در اختیار مدیر پیمان قرار داده یا مبالغ خرید مصالح و فاکتورهای تأییدشده را نقداً تسویه نماید. توقف کارگاه ناشی از عدم تأمین وجه مصالح تماماً به عهده کارفرماست.
              </p>

              <p>
                <strong>ماده ۷ - تأخیرات مجاز مدیر پیمان:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 pr-3 text-[11px] text-slate-700">
                <li>
                  هرگونه تأخیر کارفرما در شارژ تنخواه‌گردان یا پرداخت حق‌الزحمه، عیناً به اضافه ۳ روز کاری (جهت تجهیز و هماهنگی مجدد اکیپ‌ها) به مدت پیمان الحاق می‌شود و مشمول جریمه نخواهد بود.
                </li>
                <li>
                  روزهای برودت و یخبندان زمستانه شهر ارومیه (دمای کمتر از منفی ۵ درجه سانتی‌گراد) که طبق مقررات ملی مانع کارهای بتنی و تر است، تأخیر مجاز تلقی می‌گردد.
                </li>
                <li>
                  تأخیرات ناشی از اخذ استعلامات آب، برق، گاز، نظام مهندسی، شهرداری و تغییرات نقشه‌ها تماماً تأخیر مجاز است.
                </li>
              </ul>

              <p>
                <strong>ماده ۸ - تعلیق کارگاه:</strong> در صورت توقف کار بیش از ۱۵ روز به علت عدم تأمین نقدینگی توسط کارفرما، هزینه بالاسری و حراست روزانه کارگاه به عهده کارفرما خواهد بود.
              </p>

              <p>
                <strong>ماده ۹ - ایمنی و بیمه‌نامه (HSE):</strong> کارفرما متعهد به اخذ بیمه‌نامه جامع مسئولیت مدنی کارفرما در قبال کارکنان و اشخاص ثالث با پوشش کامل حوادث بدون فرانشیز می‌باشد.
              </p>

              <p>
                <strong>ماده ۱۰ - تسویه حساب و آزادسازی سهمیه مجری:</strong> کارفرما متعهد است حداکثر ظرف ۱۵ روز پس از پایان عملیات ساختمانی، نسبت به تسویه حساب قطعی مالی (شامل متراژ پایه و هرگونه اضافه متراژ به نرخ روز) و تأیید آزادسازی سهمیه مجری در سازمان نظام مهندسی اقدام نماید.
              </p>

              <p>
                <strong>ماده ۱۱ - حل اختلاف و داوری:</strong> در صورت بروز هرگونه اختلاف، موضوع به <em>کمیته داوری و حل اختلاف انجمن صنفی مهندسان مجری ذیصلاح شهرستان ارومیه</em> ارجاع و رأی آن برای طرفین قطعی و لازم‌الاجراست.
              </p>
            </div>

            {/* Signatures */}
            <div className="pt-6 border-t border-slate-300 grid grid-cols-2 text-center text-xs">
              <div className="space-y-10">
                <span className="font-bold text-slate-900 block">محل امضا و اثر انگشت کارفرما:</span>
                <span className="text-[10px] text-slate-400">امضا و تاریخ</span>
              </div>

              <div className="space-y-10">
                <span className="font-bold text-slate-900 block">محل امضا و مهر مجری ذیصلاح (مدیر پیمان):</span>
                <span className="text-[10px] text-slate-400">امضا و مهر مهندسی</span>
              </div>
            </div>
          </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

// Helper: Convert number to Persian words
function numberToPersianWords(num: number): string {
  const ones = ['', 'یک', 'دو', 'سه', 'چهار', 'پنج', 'شش', 'هفت', 'هشت', 'نه'];
  const teens = ['ده', 'یازده', 'دوازده', 'سیزده', 'چهارده', 'پانزده', 'شانزده', 'هفده', 'هجده', 'نوزده'];
  const tens = ['', '', 'بیست', 'سی', 'چهل', 'پنجاه', 'شصت', 'هفتاد', 'هشتاد', 'نود'];

  if (num <= 0) return 'صفر';
  if (num < 10) return ones[num];
  if (num < 20) return teens[num - 10];
  if (num < 100) {
    const t = Math.floor(num / 10);
    const o = num % 10;
    return o > 0 ? `${tens[t]} و ${ones[o]}` : tens[t];
  }
  if (num < 1000) {
    const h = Math.floor(num / 100);
    const rem = num % 100;
    const hundreds = ['', 'یکصد', 'دویست', 'سیصد', 'چهارصد', 'پانصد', 'ششصد', 'هفتصد', 'هشتصد', 'نهصد'];
    return rem > 0 ? `${hundreds[h]} و ${numberToPersianWords(rem)}` : hundreds[h];
  }
  return String(num);
}
