import React, { useState } from 'react';
import {
  X,
  Smartphone,
  Apple,
  Globe,
  Bell,
  CheckCircle2,
  Info,
  ExternalLink,
  Volume2,
  Sparkles,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import {
  getNotificationPermission,
  sendTestInAppAlert,
  isPushEnabled,
  requestPushPermission,
} from '../services/notificationService';

interface NotificationGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStatusChanged: (newPermission: NotificationPermission, isPushActive: boolean) => void;
}

export const NotificationGuideModal: React.FC<NotificationGuideModalProps> = ({
  isOpen,
  onClose,
  onStatusChanged,
}) => {
  const [activeTab, setActiveTab] = useState<'android' | 'ios' | 'browser'>('android');
  const [recheckMessage, setRecheckMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentPermission = getNotificationPermission();

  const handleRecheckPermission = async () => {
    // If browser supports requesting again (e.g. if unblocked in settings)
    const perm = getNotificationPermission();
    if (perm === 'granted') {
      const active = isPushEnabled();
      onStatusChanged('granted', active);
      setRecheckMessage('✅ عالی شد! دسترسی اعلان‌ها با موفقیت فعال شد.');
      setTimeout(() => {
        onClose();
      }, 1500);
    } else {
      // Try calling requestPermission just in case
      try {
        const granted = await requestPushPermission();
        const updatedPerm = getNotificationPermission();
        onStatusChanged(updatedPerm, granted);
        if (granted) {
          setRecheckMessage('✅ دسترسی اعلان‌ها فعال گردید.');
          setTimeout(() => onClose(), 1500);
          return;
        }
      } catch {
        // ignore
      }
      setRecheckMessage('⚠️ دسترسی هنوز در تنظیمات گوشی مسدود است. لطفاً مراحل بالا را انجام دهید.');
    }
  };

  const handleTestInAppAlert = () => {
    sendTestInAppAlert({
      title: '🔔 تست اعلان موفقیت‌آمیز بود',
      text: 'صدای زنگ و بنر اعلان داخلی برنامه به درستی کار می‌کند.',
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="notification-guide-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] text-right"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-sky-600 via-sky-700 to-indigo-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 id="notification-guide-title" className="text-sm sm:text-base font-bold text-white">
                راهنمای فعال‌سازی اعلان‌ها در وب‌اپلیکیشن
              </h2>
              <p className="text-[11px] text-sky-100">
                چگونگی رفع مسدودی اعلان در گوشی بدون نیاز به نوار آدرس مرورگر
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="بستن پنجره"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Status Banner */}
        <div className="px-4 py-2.5 bg-amber-50 border-b border-amber-100 flex items-center justify-between text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              وضعیت کنونی:{' '}
              <strong>
                {currentPermission === 'granted'
                  ? 'مجاز و فعال'
                  : currentPermission === 'denied'
                  ? 'مسدود شده در تنظیمات دستگاه'
                  : 'در انتظار تایید'}
              </strong>
            </span>
          </div>
          <button
            onClick={handleTestInAppAlert}
            className="text-[11px] font-bold text-sky-700 hover:text-sky-900 underline flex items-center gap-1"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>تست زنگ داخل برنامه</span>
          </button>
        </div>

        {/* Platform Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 p-1.5 gap-1.5">
          <button
            onClick={() => setActiveTab('android')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'android'
                ? 'bg-white text-sky-700 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-4 h-4 text-emerald-600" />
            <span>گوشی‌های اندروید (Android)</span>
          </button>

          <button
            onClick={() => setActiveTab('ios')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'ios'
                ? 'bg-white text-sky-700 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Apple className="w-4 h-4 text-slate-800" />
            <span>آیفون (iOS / Apple)</span>
          </button>

          <button
            onClick={() => setActiveTab('browser')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'browser'
                ? 'bg-white text-sky-700 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Globe className="w-4 h-4 text-sky-600" />
            <span>مرورگر کروم / کامپیوتر</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs text-slate-700 leading-relaxed flex-1">
          {activeTab === 'android' && (
            <div className="space-y-3.5">
              <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-emerald-900">
                <p className="font-bold flex items-center gap-1.5 text-xs text-emerald-800">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  روش اول (سریع‌ترین راه در اندروید - کمتر از ۵ ثانیه):
                </p>
                <ol className="mt-2 space-y-2 list-decimal list-inside text-[11px] text-emerald-950">
                  <li>
                    برنامه را ببندید و در <strong>صفحه اصلی گوشی</strong>، انگشت خود را روی{' '}
                    <strong>آیکون این برنامه</strong> به مدت ۲ ثانیه نگه دارید (لمس طولانی).
                  </li>
                  <li>
                    در کادر کوچکی که باز می‌شود، آیکون <strong>اطلاعات برنامه (App info یا ⓘ)</strong> را لمس کنید.
                  </li>
                  <li>
                    وارد بخش <strong>اعلان‌ها (Notifications)</strong> شده و گزینه{' '}
                    <strong>اجازه دادن (Allow)</strong> را روشن کنید.
                  </li>
                </ol>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <p className="font-bold text-slate-800 text-xs">
                  روش دوم (از طریق تنظیمات اصلی گوشی):
                </p>
                <ol className="mt-2 space-y-1.5 list-decimal list-inside text-[11px] text-slate-600">
                  <li>
                    وارد <strong>تنظیمات گوشی (Settings)</strong> شوید.
                  </li>
                  <li>
                    به بخش <strong>برنامه‌ها (Apps)</strong> بروید.
                  </li>
                  <li>
                    مرورگر <strong>Chrome</strong> یا نام همین برنامه را در لیست پیدا کرده و لمس کنید.
                  </li>
                  <li>
                    وارد قسمت <strong>مجوزها (Permissions)</strong> یا <strong>اعلان‌ها (Notifications)</strong> شده و گزینه دسترسی اعلان را فعال کنید.
                  </li>
                </ol>
              </div>
            </div>
          )}

          {activeTab === 'ios' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 space-y-2.5">
                <p className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                  <Apple className="w-4 h-4 text-slate-800" />
                  مراحل فعال‌سازی در آیفون و آیپد (iOS 16.4 به بالا):
                </p>
                <ol className="space-y-2 list-decimal list-inside text-[11px] text-slate-600">
                  <li>
                    وارد <strong>تنظیمات آیفون (iPhone Settings)</strong> شوید.
                  </li>
                  <li>
                    صفحه تنظیمات را به سمت پایین اسکرول کنید تا به لیست برنامه‌ها برسید.
                  </li>
                  <li>
                    نام <strong>این وب‌اپلیکیشن</strong> را در لیست لمس کنید.
                  </li>
                  <li>
                    وارد بخش <strong>Notifications</strong> شده و کلید{' '}
                    <strong className="text-emerald-700">Allow Notifications</strong> را روشن کنید.
                  </li>
                </ol>
              </div>

              <div className="p-2.5 rounded-xl bg-sky-50 border border-sky-100 text-[11px] text-sky-800">
                💡 <strong>نکته مهم آیفون:</strong> در صورتی که برنامه را از طریق مرورگر Safari باز کرده‌اید، ابتدا از منوی Share دکمه <strong>Add to Home Screen</strong> را بزنید تا برنامه روی صفحه نصب شود، سپس اعلان‌های آیفون فعال می‌شوند.
              </div>
            </div>
          )}

          {activeTab === 'browser' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 space-y-2">
                <p className="font-bold text-xs text-slate-900">
                  تنظیمات مرورگر Chrome در موبایل یا کامپیوتر:
                </p>
                <ol className="space-y-1.5 list-decimal list-inside text-[11px] text-slate-600">
                  <li>مرورگر Chrome را باز کنید و آیکون سه نقطه ⋮ بالای صفحه را لمس کنید.</li>
                  <li>وارد <strong>تنظیمات (Settings)</strong> شوید.</li>
                  <li>به پایین اسکرول کرده و روی <strong>تنظیمات سایت (Site settings)</strong> بزنید.</li>
                  <li>گزینه <strong>اعلان‌ها (Notifications)</strong> را لمس کنید.</li>
                  <li>در بخش «مسدود شده (Blocked)»، آدرس این برنامه را پیدا کرده و روی <strong>اجازه دادن (Allow)</strong> یا <strong>پاک کردن و بازنشانی (Clear & Reset)</strong> بزنید.</li>
                </ol>
              </div>
            </div>
          )}

          {/* In-App Notification Assurance */}
          <div className="p-3 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-[11px] text-indigo-900 space-y-1">
            <p className="font-bold flex items-center gap-1.5 text-indigo-950">
              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
              سیستم اعلان درون‌برنامه‌ای همواره فعال است:
            </p>
            <p className="text-indigo-800 leading-normal">
              حتی در صورتی که نخواهید دسترسی سیستم‌عامل گوشی را باز کنید، به محض این که برنامه باز باشد هر خبر جدیدی با <strong>صدای زنگ و بنر شناور</strong> فوراً به شما نمایش داده می‌شود.
            </p>
          </div>

          {recheckMessage && (
            <div
              className={`p-3 rounded-xl text-xs font-bold text-center ${
                recheckMessage.includes('✅')
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border border-amber-200'
              }`}
            >
              {recheckMessage}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2 flex-wrap">
          <button
            onClick={handleRecheckPermission}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>بررسی مجدد وضعیت دسترسی</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200 transition-colors"
          >
            متوجه شدم، بستن
          </button>
        </div>
      </div>
    </div>
  );
};
