import React, { useState, useEffect } from 'react';
import {
  Building2,
  Phone,
  Send,
  ExternalLink,
  MapPin,
  Clock,
  Mail,
  ShieldCheck,
  CheckCircle2,
  MessageSquare,
  Instagram,
  HeartHandshake,
  UserCheck,
} from 'lucide-react';
import { AuthUser } from '../types';

interface AboutViewProps {
  currentUser?: AuthUser | null;
}

const KNOWN_ENGINEERS: Record<string, string> = {
  'hmdhmp': 'مهندس حامد هاشم پور',
  'admin': 'مدیریت انجمن مجریان ذیصلاح ارومیه',
  'engineer1': 'مهندس محمد رضایی',
  'test1': 'مهندس علی اکبری',
  'test2': 'مهندس مهدی مرادی',
  'test3': 'مهندس رضوی',
  'engineer_expired': 'مهندس سهراب مرادی',
};

export const AboutView: React.FC<AboutViewProps> = ({ currentUser }) => {
  // Helper to resolve engineer name from currentUser
  const resolvedEngineerName = React.useMemo(() => {
    if (!currentUser) return '';
    if (currentUser.fullName && currentUser.fullName.trim()) return currentUser.fullName.trim();
    if (currentUser.name && currentUser.name.trim()) return currentUser.name.trim();
    const uname = (currentUser.username || '').toLowerCase();
    if (KNOWN_ENGINEERS[uname]) return KNOWN_ENGINEERS[uname];
    if (currentUser.username) {
      return currentUser.username.startsWith('مهندس')
        ? currentUser.username
        : `مهندس ${currentUser.username}`;
    }
    return '';
  }, [currentUser]);

  const [feedbackName, setFeedbackName] = useState(resolvedEngineerName);
  const [feedbackPhone, setFeedbackPhone] = useState('');
  const [feedbackText, setFeedbackText] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Sync auto-filled name if currentUser changes
  useEffect(() => {
    if (resolvedEngineerName) {
      setFeedbackName(resolvedEngineerName);
    }
  }, [resolvedEngineerName]);

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const phoneTrimmed = feedbackPhone.trim();
    if (!phoneTrimmed) {
      setErrorMessage('لطفاً شماره همراه جهت پیگیری و پاسخ دبیرخانه را وارد نمایید.');
      return;
    }

    // Phone validation for Iranian mobile numbers (e.g. 0914... or 09...)
    const cleanPhone = phoneTrimmed.replace(/\s+/g, '');
    if (cleanPhone.length < 10) {
      setErrorMessage('شماره همراه وارد شده نامعتبر است (مثال: ۰۹۱۴xxxxxxx).');
      return;
    }

    if (!feedbackText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const authorName = feedbackName.trim() || resolvedEngineerName || 'مهندس عضو انجمن';
    const payload = {
      name: authorName,
      phone: phoneTrimmed,
      text: feedbackText.trim(),
    };

    // 1. Post to Server API & Database
    try {
      await fetch('/api/association-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.warn('Could not post feedback to server:', err);
    }

    // 2. Save locally as offline client backup
    try {
      const existing = JSON.parse(
        localStorage.getItem('urmia_association_messages') || '[]'
      );
      existing.unshift({
        id: Date.now(),
        ...payload,
        date: new Date().toISOString(),
      });
      localStorage.setItem(
        'urmia_association_messages',
        JSON.stringify(existing)
      );
    } catch {
      // ignore
    }

    setIsSubmitting(false);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFeedbackName(resolvedEngineerName);
      setFeedbackPhone('');
      setFeedbackText('');
      setErrorMessage('');
    }, 3500);
  };

  return (
    <div className="space-y-4 pb-12 animate-fadeIn text-right">
      {/* Title */}
      <div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
            بخش ۸
          </span>
          <h1 className="text-base font-bold text-slate-900">
            درباره انجمن مجریان ذیصلاح ارومیه
          </h1>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          نهاد صنفی و تخصصی مهندسان و شرکت‌های مجری ذی‌صلاح شهرستان ارومیه
        </p>
      </div>

      {/* Overview Card */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
        <div className="flex items-center gap-3">
          <img
            src="/icon.svg"
            alt="نشان رسمی انجمن مجریان ذیصلاح ارومیه"
            className="w-14 h-14 rounded-full object-cover shrink-0 shadow-md ring-2 ring-amber-400/40"
          />
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              انجمن سازندگان و مجریان ذیصلاح ارومیه
            </h2>
            <p className="text-xs text-slate-500">
              تاسیس با هدف ارتقای کیفیت ساخت و ساز و حمایت صنفی از مهندسان مجری
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-700 leading-relaxed pt-2 border-t border-slate-100">
          «انجمن مجریان ذیصلاح ارومیه» به عنوان تشکل رسمی و تخصصی، متشکل از مهندسان حقیقی و شرکت‌های حقوقی دارای صلاحیت اجرای ساختمان از وزارت راه و شهرسازی و عضو سازمان نظام مهندسی ساختمان استان آذربایجان غربی فعالیت می‌نماید.
        </p>

        <div className="space-y-2 pt-2">
          <span className="text-xs font-bold text-slate-800 block">
            اهداف و مأموریت‌های بنیادین انجمن:
          </span>
          <ul className="space-y-1.5 text-xs text-slate-600">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>ارتقای استانداردهای فنی، ایمنی کارگاهی و کیفیت ساخت‌وساز در شهرستان ارومیه</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>پیگیری مطالبات صنفی، تعرفه خدمات مهندسی، بیمه و قراردادهای همسان مجریان</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>ایجاد وحدت رویه و رفع اختلافات کارگاهی بین ناظران، کارفرمایان و مجریان</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>ساماندهی اکیپ‌های فنی و کارگران ماهر در رشته‌های مختلف ساختمانی</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Official Communication & Office Contacts */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
        <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
          <Phone className="w-4 h-4 text-emerald-600" />
          <span>راه‌های ارتباطی و نشانی رسمی انجمن</span>
        </h3>

        <div className="space-y-2 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              <div>
                <span className="font-bold text-slate-800 block">ساعات کاری دفتر:</span>
                <span className="text-[11px] text-slate-500">
                  شنبه تا چهارشنبه از ساعت ۸:۳۰ تا ۱۳:۳۰ جهت ارائه خدمات به همکاران
                </span>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-800 block">شماره تخصصی ارتباط با مسئول دفتر:</span>
              <span className="text-[11px] text-slate-500">پاسخگویی در ساعات اداری</span>
            </div>
            <a
              href="tel:09009838663"
              className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-mono font-bold text-xs flex items-center gap-1.5 hover:bg-emerald-700 transition-colors"
            >
              <Phone className="w-3 h-3" />
              <span>۰۹۰۰۹۸۳۸۶۶۳</span>
            </a>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-800 block">شماره همراه دوم دفتر انجمن:</span>
              <span className="text-[11px] text-slate-500">پشتیبانی و پیام‌ها</span>
            </div>
            <a
              href="tel:+9890008663"
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-800 font-mono font-bold text-xs hover:bg-slate-100 transition-colors"
            >
              <span>+۹۸۹۰۰۰۸۶۶۳</span>
            </a>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2">
            <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-800 block">موقعیت و نشانی دفتر انجمن:</span>
              <span className="text-[11px] text-slate-700 font-medium">
                ارومیه، خیابان امینی، روبروی فروشگاه رفاه، دفتر انجمن مجریان ذیصلاح
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Official Online Channels */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
        <h3 className="text-xs font-bold text-slate-900">
          کانال‌ها و شبکه‌های اجتماعی رسمی انجمن
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
          <a
            href="https://t.me/Urmia_QU_Engineers_Association"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 rounded-xl bg-sky-50 border border-sky-100 text-sky-900 flex items-center justify-between hover:bg-sky-100 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Send className="w-4 h-4 text-sky-600" />
              <div className="text-right">
                <span className="font-bold block text-xs">کانال تلگرام</span>
                <span className="text-[10px] text-sky-700 font-mono" dir="ltr">@Urmia_QU_Engineers_Association</span>
              </div>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-sky-600" />
          </a>

          <a
            href="https://rubika.ir/Urmia_QU_Engineers_Association"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 rounded-xl bg-purple-50 border border-purple-100 text-purple-900 flex items-center justify-between hover:bg-purple-100 transition-colors"
          >
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-purple-600" />
              <div className="text-right">
                <span className="font-bold block text-xs">کانال روبیکا</span>
                <span className="text-[10px] text-purple-700 font-mono" dir="ltr">rubika.ir/Urmia_...</span>
              </div>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-purple-600" />
          </a>

          <a
            href="https://www.instagram.com/sazandeghan_urmia"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 rounded-xl bg-pink-50 border border-pink-100 text-pink-900 flex items-center justify-between hover:bg-pink-100 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Instagram className="w-4 h-4 text-pink-600" />
              <div className="text-right">
                <span className="font-bold block text-xs">اینستاگرام</span>
                <span className="text-[10px] text-pink-700 font-mono" dir="ltr">@sazandeghan_urmia</span>
              </div>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-pink-600" />
          </a>
        </div>
      </div>

      {/* Direct Feedback Form */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
        <h3 className="text-xs font-bold text-slate-900">
          ارسال پیام، نظر یا پیشنهاد به دبیرخانه انجمن
        </h3>

        {submitted ? (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center space-y-1 text-xs text-emerald-800">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <span className="font-bold block">پیام شما با موفقیت ثبت شد</span>
            <span className="text-[11px] text-emerald-700">از همراهی شما با انجمن صمیمانه سپاسگزاریم.</span>
          </div>
        ) : (
          <form onSubmit={handleSubmitFeedback} className="space-y-3 text-xs">
            {errorMessage && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-medium flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-amber-500" />
                    <span>نام مهندس (تکمیل خودکار):</span>
                  </label>
                  {resolvedEngineerName && (
                    <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                      احراز هویت شده
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={feedbackName}
                  onChange={(e) => setFeedbackName(e.target.value)}
                  placeholder="مهندس ..."
                  className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:border-slate-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  شماره همراه (اجباری - جهت پیگیری دبیرخانه): <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={feedbackPhone}
                  onChange={(e) => {
                    setFeedbackPhone(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  placeholder="۰۹۱۴xxxxxxx"
                  className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono focus:outline-none focus:border-slate-400"
                  dir="ltr"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                متن پیام، پیشنهاد یا مطالبه صنفی: <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                value={feedbackText}
                onChange={(e) => {
                  setFeedbackText(e.target.value);
                  if (errorMessage) setErrorMessage('');
                }}
                placeholder="متن پیام خود را بنویسید..."
                className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:border-slate-400 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white font-bold text-xs shadow-2xs transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>در حال ارسال پیام...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>ثبت و ارسال پیام به دبیرخانه انجمن</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
