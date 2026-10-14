import React, { useState } from 'react';
import {
  Smartphone,
  Apple,
  Monitor,
  X,
  CheckCircle2,
  Copy,
  Check,
  QrCode,
  Download,
  Share2,
  PlusSquare,
  HelpCircle,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const AndroidInstallBanner: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, isWindows, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);
  const [activeGuideTab, setActiveGuideTab] = useState<'android' | 'ios' | 'windows'>(() => {
    if (isWindows) return 'windows';
    if (isIOS) return 'ios';
    return 'android';
  });
  const [copied, setCopied] = useState(false);

  const sharedAppUrl =
    typeof window !== 'undefined'
      ? window.location.origin
      : 'https://ais-pre-ne46lbrbqyjxzseo47vd2v-777758125467.europe-west2.run.app';

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
    sharedAppUrl
  )}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(sharedAppUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInstallClick = async () => {
    if (isInstallable) {
      await install();
    } else {
      setShowGuide(true);
    }
  };

  // If already running in standalone mode (already installed on homescreen)
  if (isInstalled) {
    return null;
  }

  return (
    <>
      {/* PWA Home Banner */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white shadow-sm border border-slate-700/60 flex items-center justify-between gap-3 text-right">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
            <Smartphone className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-white">
                راهنمای نصب وب‌اپلیکیشن
              </span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.2 rounded font-medium">
                اندروید، آیفون و ویندوز (PWA)
              </span>
            </div>
            <p className="text-[11px] text-slate-300 truncate mt-0.5">
              نصب مستقیم روی گوشی و کامپیوتر بدون نیاز به اپ‌استور و نصب دستی
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {isInstallable ? (
            <button
              onClick={handleInstallClick}
              className="flex items-center gap-1 px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-xs transition-colors active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>نصب فوری برنامه</span>
            </button>
          ) : (
            <button
              onClick={() => setShowGuide(true)}
              className="flex items-center gap-1 px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-xs transition-colors active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>راهنمای نصب</span>
            </button>
          )}

          <button
            onClick={() => setShowGuide(true)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors text-xs font-medium"
            title="راهنمای کامل نصب اندروید، آیفون و ویندوز"
            aria-label="راهنمای نصب"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* PWA Installation Guide Modal for Android, iOS & Windows */}
      {showGuide && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl space-y-4 text-right max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
                  <Download className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                    راهنمای نصب وب‌اپلیکیشن (موبایل و کامپیوتر)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    بدون اشغال حافظه، بدون نیاز به نصب دستی و با سرعت بومی
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowGuide(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700"
                aria-label="بستن"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Install Button if browser supports it */}
            {isInstallable && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-2">
                <div className="text-right">
                  <span className="text-xs font-bold text-emerald-900 block">
                    قابلیت نصب مستقیم شناسایی شد!
                  </span>
                  <span className="text-[11px] text-emerald-700">
                    می‌توانید هم‌اکنون با یک کلیک برنامه را روی این دستگاه نصب کنید.
                  </span>
                </div>
                <button
                  onClick={install}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shrink-0 shadow-2xs"
                >
                  نصب روی این دستگاه
                </button>
              </div>
            )}

            {/* OS Tab Selector: Android vs iOS vs Windows */}
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveGuideTab('android')}
                className={`py-2 px-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all ${
                  activeGuideTab === 'android'
                    ? 'bg-white text-slate-950 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="truncate">اندروید</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveGuideTab('ios')}
                className={`py-2 px-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all ${
                  activeGuideTab === 'ios'
                    ? 'bg-white text-slate-950 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Apple className="w-3.5 h-3.5 text-slate-900 shrink-0" />
                <span className="truncate">آیفون (iOS)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveGuideTab('windows')}
                className={`py-2 px-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all ${
                  activeGuideTab === 'windows'
                    ? 'bg-white text-slate-950 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Monitor className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                <span className="truncate">ویندوز (PC)</span>
              </button>
            </div>

            {/* ANDROID GUIDE */}
            {activeGuideTab === 'android' && (
              <div className="space-y-3 animate-fadeIn">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[11px] flex items-center justify-center font-mono">
                      ۱
                    </span>
                    <span>مراحل نصب در اندروید (مرورگر Chrome):</span>
                  </span>

                  <ol className="space-y-2 text-xs text-slate-700 pr-1">
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                      <span>
                        آدرس این سامانه را در مرورگر <strong>Google Chrome</strong> گوشی خود باز کنید.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                      <span>
                        روی آیکون <strong>سه نقطه (⋮)</strong> در گوشه بالای مرورگر کروم بزنید.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                      <span>
                        گزینه <strong>«نصب برنامه» (Install app)</strong> یا <strong>«افزودن به صفحه اصلی» (Add to Home screen)</strong> را انتخاب کنید.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                      <span>
                        روی دکمه <strong>Install</strong> بزنید. آیکون برنامه در صفحه اصلی گوشی شما ظاهر شده و کاملاً مستقل و تمام‌صفحه اجرا خواهد شد.
                      </span>
                    </li>
                  </ol>
                </div>
              </div>
            )}

            {/* IOS / IPHONE GUIDE */}
            {activeGuideTab === 'ios' && (
              <div className="space-y-3 animate-fadeIn">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[11px] flex items-center justify-center font-mono">
                      ۱
                    </span>
                    <span>مراحل نصب در آیفون (مرورگر Safari):</span>
                  </span>

                  <ol className="space-y-2 text-xs text-slate-700 pr-1">
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-500 mt-2 shrink-0" />
                      <span>
                        آدرس برنامه را حتماً در مرورگر <strong>Safari</strong> باز کنید (در کروم آیفون امکان ساخت وب‌اپ نیست).
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-500 mt-2 shrink-0" />
                      <div className="flex items-center gap-1 flex-wrap">
                        <span>روی دکمه <strong>اشتراک‌گذاری (Share)</strong></span>
                        <Share2 className="w-3.5 h-3.5 text-sky-600 inline" />
                        <span>در نوار پایین صفحه بزنید.</span>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-500 mt-2 shrink-0" />
                      <div className="flex items-center gap-1 flex-wrap">
                        <span>منو را به پایین اسکرول کرده و گزینه <strong>Add to Home Screen</strong></span>
                        <PlusSquare className="w-3.5 h-3.5 text-slate-700 inline" />
                        <span>(افزودن به صفحه اصلی) را لمس کنید.</span>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-500 mt-2 shrink-0" />
                      <span>
                        در گوشه بالا سمت راست دکمه <strong>Add</strong> را بزنید. برنامه با آیکون اختصاصی و بدون نوار آدرس به لیست اپ‌های آیفون شما اضافه می‌شود.
                      </span>
                    </li>
                  </ol>
                </div>
              </div>
            )}

            {/* WINDOWS PC / LAPTOP GUIDE */}
            {activeGuideTab === 'windows' && (
              <div className="space-y-3 animate-fadeIn">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[11px] flex items-center justify-center font-mono">
                      ۱
                    </span>
                    <span>مراحل نصب در رایانه و لپ‌تاپ ویندوز (مرورگر Chrome یا Edge):</span>
                  </span>

                  <ol className="space-y-2 text-xs text-slate-700 pr-1">
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-500 mt-2 shrink-0" />
                      <span>
                        آدرس سامانه را در مرورگر <strong>Google Chrome</strong> یا <strong>Microsoft Edge</strong> باز کنید.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-500 mt-2 shrink-0" />
                      <span>
                        در انتهای نوار آدرس مرورگر (سمت راست یا چپ)، روی آیکون <strong>نصب برنامه (نماد مانیتور 💻 با فلش یا علامت ⊕)</strong> کلیک کنید.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-500 mt-2 shrink-0" />
                      <span>
                        یا می‌توانید از منوی <strong>سه نقطه (⋮)</strong> مرورگر کروم گزینه <strong>«Save and share» &gt; «Install app»</strong> یا در اج گزینه <strong>«Apps» &gt; «Install this site as an app»</strong> را انتخاب فرمایید.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-500 mt-2 shrink-0" />
                      <span>
                        در پنجره باز شده روی دکمه <strong>Install</strong> کلیک کنید. برنامه بلافاصله با پنجره اختصاصی باز شده و شورتکات آن روی <strong>دسکتاپ (Desktop)</strong>، <strong>منوی استارت (Start Menu)</strong> و <strong>تسک‌بار (Taskbar)</strong> ویندوز ایجاد می‌شود.
                      </span>
                    </li>
                  </ol>
                </div>

                <div className="p-3 rounded-xl bg-sky-50 border border-sky-200 text-sky-900 text-xs space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-sky-800">
                    <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                    <span>مزایای نسخه دسکتاپ ویندوز:</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-sky-800/90">
                    اجرا در پنجره مجزا و مستقل بدون نوارهای شلوغ مرورگر، سرعت بسیار بالاتر در محاسبه تعرفه و صدور گزارش، پایداری بالا برای دفاتر مهندسی و امکان Pin کردن به نوار وظیفه ویندوز (Taskbar).
                  </p>
                </div>
              </div>
            )}

            {/* QR Code and Quick Link to Open on Phone */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="w-24 h-24 shrink-0 border border-slate-200 rounded-lg overflow-hidden flex items-center justify-center bg-white p-1">
                <img
                  src={qrCodeUrl}
                  alt="کد QR لینک وب‌اپلیکیشن"
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="flex-1 space-y-2 text-right w-full">
                <span className="text-[11px] text-slate-700 font-bold block">
                  اسکن با دوربین گوشی یا اشتراک لینک:
                </span>
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    readOnly
                    value={sharedAppUrl}
                    className="flex-1 h-8 px-2 text-[10px] font-mono bg-white border border-slate-200 rounded-lg text-slate-600 select-all"
                    dir="ltr"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="h-8 px-2.5 bg-slate-900 text-white text-[10px] font-bold rounded-lg flex items-center gap-1 hover:bg-slate-800 transition-colors shrink-0"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span>کپی شد</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>کپی</span>
                      </>
                    )}
                  </button>
                </div>
                <span className="text-[10px] text-slate-400 block">
                  برای باز کردن در گوشی یا کامپیوتر دیگر، کد بالا را اسکن کنید یا لینک را ارسال نمایید.
                </span>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={() => setShowGuide(false)}
              className="w-full h-10 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors"
            >
              متوجه شدم، بستن
            </button>
          </div>
        </div>
      )}
    </>
  );
};
