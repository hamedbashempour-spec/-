import React, { useState, useRef, useEffect } from 'react';
import {
  User,
  KeyRound,
  Calendar,
  Phone,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Camera,
  ArrowRight,
  LogOut,
  Building2,
  Check,
  MapPin,
} from 'lucide-react';
import { AuthUser } from '../types';
import { toPersianDigits } from '../utils/formatters';
import { UserTagBadge } from './UserTagBadge';

interface ProfileViewProps {
  currentUser: AuthUser;
  onUpdateUser: (updatedUser: AuthUser) => void;
  onLogout: () => void;
  onNavigateBack: () => void;
}

const PRESET_AVATARS = [
  { id: 'eng-1', label: 'مهندس کلاه‌به‌سر', bg: 'bg-amber-600', text: '👷' },
  { id: 'eng-2', label: 'مهندس ناظر', bg: 'bg-emerald-600', text: '📐' },
  { id: 'eng-3', label: 'مجری ساختمان', bg: 'bg-sky-600', text: '🏢' },
  { id: 'eng-4', label: 'طراح سازه', bg: 'bg-indigo-600', text: '🏗️' },
  { id: 'eng-5', label: 'مدیر پروژه', bg: 'bg-slate-800', text: '📋' },
];

export const ProfileView: React.FC<ProfileViewProps> = ({
  currentUser,
  onUpdateUser,
  onLogout,
  onNavigateBack,
}) => {
  // Credentials
  const [username, setUsername] = useState(currentUser.username || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordMismatch, setPasswordMismatch] = useState(false);

  // Avatar / Picture
  const [avatar, setAvatar] = useState(currentUser.avatar || '');

  // Status & Feedback
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state if currentUser changes
  useEffect(() => {
    setUsername(currentUser.username || '');
    setAvatar(currentUser.avatar || '');
    setPassword('');
    setConfirmPassword('');
    setPasswordMismatch(false);
  }, [currentUser]);

  // Handle image upload
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setFeedback({
        type: 'error',
        message: 'حجم تصویر نباید بیشتر از ۲ مگابایت باشد.',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatar(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSelectInput = (
    e: React.FocusEvent<HTMLInputElement> | React.MouseEvent<HTMLInputElement>
  ) => {
    e.currentTarget.select();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setPasswordMismatch(false);

    const cleanUsername = username.trim();
    if (!cleanUsername) {
      setFeedback({
        type: 'error',
        message: 'نام کاربری نمی‌تواند خالی باشد.',
      });
      return;
    }

    // Password validation: must match if user entered any new password
    const cleanPassword = password.trim();
    const cleanConfirm = confirmPassword.trim();

    if (cleanPassword || cleanConfirm) {
      if (cleanPassword !== cleanConfirm) {
        setPasswordMismatch(true);
        setFeedback({
          type: 'error',
          message: 'رمز عبور جدید و تکرار آن با یکدیگر یکسان نمی‌باشند.',
        });
        return;
      }
    }

    setIsSaving(true);
    try {
      const payload: Record<string, any> = {
        currentUsername: currentUser.username,
        newUsername: cleanUsername,
        avatar,
      };

      if (cleanPassword) {
        payload.newPassword = cleanPassword;
      }

      const res = await fetch('/api/auth/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'خطا در ثبت تغییرات');
      }

      // Update session in local storage
      const updatedUser: AuthUser = data.user;
      try {
        const saved = localStorage.getItem('urmia_user_session');
        if (saved) {
          const parsed = JSON.parse(saved);
          const newSession = {
            ...parsed,
            ...updatedUser,
          };
          localStorage.setItem('urmia_user_session', JSON.stringify(newSession));
        }
      } catch {}

      onUpdateUser(updatedUser);
      setPassword('');
      setConfirmPassword('');
      setPasswordMismatch(false);
      setFeedback({
        type: 'success',
        message: data.message || 'مشخصات حساب کاربری با موفقیت ذخیره شد.',
      });

      // Clear toast after 4 seconds
      setTimeout(() => {
        setFeedback(null);
      }, 4000);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'ارتباط با سرور برقرار نشد.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const isExpired = Boolean(currentUser.isExpired);

  return (
    <div className="space-y-5 animate-fadeIn pb-12 max-w-2xl mx-auto">
      {/* Top Navigation & Return */}
      <div className="flex items-center justify-between">
        <button
          onClick={onNavigateBack}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl transition-all shadow-2xs"
        >
          <ArrowRight className="w-4 h-4 text-slate-500" />
          <span>بازگشت به برنامه</span>
        </button>

        <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
          سامانه اعضای انجمن مجریان ارومیه
        </span>
      </div>

      {/* Profile Header Card */}
      <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-5 sm:p-6 shadow-xl relative overflow-hidden">
        {/* Background decorative pattern */}
        <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />

        <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5 text-center sm:text-right">
          {/* Avatar / Picture with upload trigger */}
          <div className="relative group shrink-0">
            <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-2xl bg-amber-500/20 border-2 border-amber-400/40 p-1 flex items-center justify-center overflow-hidden shadow-lg">
              {avatar ? (
                avatar.startsWith('data:') || avatar.startsWith('http') ? (
                  <img
                    src={avatar}
                    alt={currentUser.fullName || currentUser.username}
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  <span className="text-3xl">{avatar}</span>
                )
              ) : (
                <div className="w-full h-full rounded-xl bg-slate-800 flex items-center justify-center text-amber-400">
                  <User className="w-10 h-10" />
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -left-1 w-7 h-7 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-900 flex items-center justify-center shadow-md border-2 border-slate-900 transition-transform active:scale-95"
              title="تغییر یا انتخاب تصویر پروفایل"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageFileChange}
            />
          </div>

          {/* User Overview Info */}
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                  <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                    {currentUser.fullName || currentUser.username}
                  </h1>
                  <UserTagBadge tag={currentUser.userTag} role={currentUser.role} size="md" />
                </div>
                <p className="text-xs text-slate-300 font-mono mt-0.5" dir="ltr">
                  @{currentUser.username}
                </p>
              </div>

              {/* Expiry Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/15 text-xs">
                <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="text-slate-300 text-[11px]">اعتبار عضویت:</span>
                <span className="font-bold text-amber-300 font-mono">
                  {toPersianDigits(currentUser.eDate)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Avatar Presets Drawer */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2 overflow-x-auto text-[11px]">
          <span className="text-slate-400 text-[10px] shrink-0">آواتارهای آماده:</span>
          <div className="flex items-center gap-1.5 shrink-0">
            {PRESET_AVATARS.map((av) => (
              <button
                key={av.id}
                type="button"
                onClick={() => setAvatar(av.text)}
                className={`w-7 h-7 rounded-lg ${av.bg} flex items-center justify-center text-sm hover:scale-110 transition-transform ${
                  avatar === av.text ? 'ring-2 ring-amber-400' : ''
                }`}
                title={av.label}
              >
                {av.text}
              </button>
            ))}
            {avatar && (
              <button
                type="button"
                onClick={() => setAvatar('')}
                className="text-[10px] text-slate-400 hover:text-rose-400 px-1.5 py-0.5 rounded bg-slate-800"
              >
                حذف تصویر
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2.5 animate-fadeIn ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Main Profile Form */}
      <form onSubmit={handleSubmit} className="space-y-5 text-right">
        {/* Section 1: Security & Credentials */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-xs sm:text-sm">
              <KeyRound className="w-4 h-4 text-amber-500" />
              <span>مشخصات ورود و امنیت حساب کاربری</span>
            </div>
            <span className="text-[10px] text-slate-400">نام کاربری و رمز اختصاصی شما</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Engineer Full Name - Clean Read-Only (no admin edit badge as requested) */}
            <div className="sm:col-span-2">
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                نام و نام خانوادگی مهندس
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={currentUser.fullName || currentUser.username}
                  readOnly
                  disabled
                  className="w-full h-11 px-3.5 pl-10 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 cursor-default select-all"
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
              </div>
            </div>

            {/* Editable Username */}
            <div className="sm:col-span-2">
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                نام کاربری (Username) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onFocus={handleSelectInput}
                  onClick={handleSelectInput}
                  required
                  placeholder="نام کاربری جدید"
                  className="w-full h-11 px-3.5 pl-9 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white transition-all text-left"
                  dir="ltr"
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
              </div>
              <span className="text-[10px] text-slate-400 block mt-1">
                جهت لاگ‌این در سامانه (بدون حساسیت به حروف کوچک و بزرگ)
              </span>
            </div>

            {/* 1st Password Box: رمز عبور جدید */}
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                رمز عبور جدید
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passwordMismatch) setPasswordMismatch(false);
                  }}
                  onFocus={handleSelectInput}
                  onClick={handleSelectInput}
                  placeholder="رمز عبور جدید"
                  className={`w-full h-11 px-3.5 pl-9 rounded-xl bg-slate-50 border ${
                    passwordMismatch ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
                  } text-xs font-mono text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white transition-all text-left`}
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-2.5 top-3 text-slate-400 hover:text-slate-700 p-0.5"
                  title={showPassword ? 'پنهان‌سازی رمز' : 'نمایش رمز'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <span className="text-[10px] text-slate-400 block mt-1">
                در صورت تمایل به تغییر رمز عبور، رمز جدید را وارد نمایید.
              </span>
            </div>

            {/* 2nd Password Box: تکرار رمز عبور جدید */}
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                تکرار رمز عبور جدید
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (passwordMismatch) setPasswordMismatch(false);
                  }}
                  onFocus={handleSelectInput}
                  onClick={handleSelectInput}
                  placeholder="تکرار رمز عبور جدید"
                  className={`w-full h-11 px-3.5 pl-9 rounded-xl bg-slate-50 border ${
                    passwordMismatch ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
                  } text-xs font-mono text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white transition-all text-left`}
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute left-2.5 top-3 text-slate-400 hover:text-slate-700 p-0.5"
                  title={showConfirmPassword ? 'پنهان‌سازی رمز' : 'نمایش رمز'}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              <span className="text-[10px] text-slate-400 block mt-1">
                جهت اطمینان از صحت تایپ، رمز عبور جدید را مجدداً وارد فرمایید.
              </span>
            </div>

            {/* Realtime Password Match Status Indicator */}
            {password && confirmPassword && (
              <div className="sm:col-span-2">
                {password === confirmPassword ? (
                  <div className="text-[11px] font-bold text-emerald-700 flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-xl">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>رمز عبور جدید و تکرار آن یکسان هستند.</span>
                  </div>
                ) : (
                  <div className="text-[11px] font-bold text-rose-700 flex items-center gap-1.5 bg-rose-50 border border-rose-200 px-3 py-2 rounded-xl">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    <span>رمز عبور جدید و تکرار آن با یکدیگر یکسان نمی‌باشند.</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Section 2: Subscription & Membership Notice (No payment gateway per instructions) */}
        <div className="bg-gradient-to-br from-amber-50/70 via-white to-amber-50/40 rounded-3xl p-5 sm:p-6 border border-amber-200/80 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-amber-100 pb-3">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-xs sm:text-sm">
              <Calendar className="w-4 h-4 text-amber-600" />
              <span>وضعیت عضویت و تمدید اشتراک سالانه</span>
            </div>
            <span
              className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                isExpired
                  ? 'bg-rose-100 text-rose-800 border border-rose-300'
                  : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
              }`}
            >
              {isExpired ? 'منقضی شده' : 'اشتراک فعال'}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-amber-200/60 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">تاریخ پایان اعتبار اشتراک در سامانه:</span>
              <strong className="text-slate-900 font-mono text-sm text-amber-700">
                {toPersianDigits(currentUser.eDate)}
              </strong>
            </div>

            {/* Official advisory note to visit office or call secretary */}
            <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200/70 text-xs text-slate-700 leading-relaxed space-y-2">
              <div className="flex items-start gap-2">
                <Building2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <strong className="text-slate-900 block text-xs">
                    راهنمای تمدید عضویت و اشتراک سالانه انجمن:
                  </strong>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    با توجه به اینکه تمدید اشتراک و تسویه حق عضویت سالانه به صورت رسمی و با صدور رسید دبیرخانه انجام می‌پذیرد، لطفاً جهت تمدید اشتراک به صورت حضوری به دفتر انجمن مراجعه فرمایید یا با دبیرخانه انجمن تماس حاصل فرمایید.
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-amber-200/60 flex items-center justify-between flex-wrap gap-2 text-[11px]">
                <a
                  href="tel:09009838663"
                  className="flex items-center gap-1.5 font-bold text-amber-900 bg-amber-200/60 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-colors font-mono"
                >
                  <Phone className="w-3.5 h-3.5 text-amber-700" />
                  <span>تماس با مسئول دفتر انجمن: ۰۹۰۰۹۸۳۸۶۶۳</span>
                </a>

                <span className="text-slate-500 text-[10px] flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  ارومیه، خیابان امینی، روبروی فروشگاه رفاه، دفتر انجمن مجریان ذیصلاح
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="submit"
            disabled={isSaving}
            className="w-full sm:w-auto px-7 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all active:scale-98 flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>در حال ذخیره اطلاعات...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>ذخیره تغییرات پروفایل</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onLogout}
            className="w-full sm:w-auto px-5 py-2.5 rounded-2xl text-rose-600 hover:bg-rose-50 border border-rose-200 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
          >
            <LogOut className="w-4 h-4" />
            <span>خروج از حساب کاربری</span>
          </button>
        </div>
      </form>
    </div>
  );
};
