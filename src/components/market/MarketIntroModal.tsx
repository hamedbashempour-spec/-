import React from 'react';
import { Info, Sparkles, CheckCircle2 } from 'lucide-react';

interface MarketIntroModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MarketIntroModal: React.FC<MarketIntroModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-2xl bg-white/95 backdrop-blur-xl border border-teal-200/80 p-6 shadow-2xl space-y-5 text-right animate-scaleIn">
        {/* Header Icon & Title */}
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 flex items-center justify-center shrink-0 shadow-2xs">
            <Sparkles className="w-6 h-6 text-teal-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-teal-800 bg-teal-100 px-2 py-0.5 rounded-md border border-teal-300">
                درباره بازار
              </span>
              <h3 className="text-base font-bold text-slate-900">
                بانک اطلاعات نرخ خدمات ساختمانی
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              سامانه مجریان ذیصلاح ارومیه
            </p>
          </div>
        </div>

        {/* Verbatim Intro Message as required by project specification */}
        <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-4 text-xs text-slate-700 leading-relaxed space-y-3 max-h-[60vh] overflow-y-auto">
          <p className="font-medium text-slate-800">
            مهندسان گرامی، این بخش با هدف ایجاد بانک اطلاعاتی کاربردی از استادکاران و نرخ خدمات ساختمانی راه‌اندازی شده است. اطلاعات ثبت‌شده به انتخاب آگاهانه‌تر عوامل اجرایی و شناخت بهتر هزینه‌های اجرای ساختمان کمک می‌کند. همچنین، گردآوری و مستندسازی نرخ واقعی خدمات ساختمانی می‌تواند به‌عنوان یکی از مستندات پشتیبان در بررسی و پیگیری پیشنهادهای افزایش تعرفه خدمات مجریان ذیصلاح مورد استفاده قرار گیرد.
          </p>
          <p className="text-slate-600 border-t border-slate-200/60 pt-2.5">
            از شما دعوت می‌کنیم با ثبت اطلاعات استادکاران و نرخ‌های واقعی خدمات، در تکمیل این بانک اطلاعاتی و تقویت پشتوانه کارشناسی انجمن مشارکت کنید. مشارکت شما، ارزش این سامانه را برای همه اعضا افزایش می‌دهد.
          </p>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-end pt-1">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-98 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4 text-amber-400" />
            <span>متوجه شدم</span>
          </button>
        </div>
      </div>
    </div>
  );
};
