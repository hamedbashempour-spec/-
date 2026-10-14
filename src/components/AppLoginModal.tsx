import React, { useState } from 'react';
import {
  Building2,
  Lock,
  User,
  AlertCircle,
  Eye,
  EyeOff,
  Clock,
  ArrowRight,
  ShieldCheck,
  Phone,
  RefreshCw,
  X,
} from 'lucide-react';
import { AuthUser } from '../types';
import { toPersianDigits } from '../utils/formatters';
import { signInWithFirebaseCustomToken } from '../services/firebase';

interface AppLoginModalProps {
  isOpen: boolean;
  initialError?: string | null;
  initialErrorType?: 'invalid_credentials' | 'expired' | 'blocked' | null;
  onLoginSuccess: (user: AuthUser) => void;
}

export const AppLoginModal: React.FC<AppLoginModalProps> = ({
  isOpen,
  initialError,
  initialErrorType,
  onLoginSuccess,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(initialError || null);
  const [errorType, setErrorType] = useState<'invalid_credentials' | 'expired' | 'blocked' | null>(
    initialErrorType || null
  );
  const [expiredDate, setExpiredDate] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMessage('لطفاً نام کاربری و رمز عبور را وارد فرمایید.');
      setErrorType('invalid_credentials');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setErrorType(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok && data.success && data.user) {
        // Authenticate with Firebase Authentication via Custom Token bridge
        if (data.firebaseCustomToken) {
          try {
            await signInWithFirebaseCustomToken(data.firebaseCustomToken);
          } catch (authBridgeErr) {
            console.warn('[FirebaseAuthBridge] Non-blocking sign-in issue:', authBridgeErr);
          }
        } else {
          console.warn('[FirebaseAuthBridge] Notice: No Firebase Custom Token provided by backend (Server credentials pending). Session active via internal authentication.');
        }

        // Save session locally
        try {
          const session = {
            username: data.user.username,
            fullName: data.user.fullName || data.user.name || data.user.username,
            name: data.user.fullName || data.user.name || data.user.username,
            role: data.user.role,
            eDate: data.user.eDate,
            loggedInAt: Date.now(),
          };
          localStorage.setItem('urmia_user_session', JSON.stringify(session));
          if (data.user.role === 'admin') {
            localStorage.setItem('urmia_admin_authenticated', 'true');
          }
        } catch {}

        onLoginSuccess(data.user);
      } else {
        if (data.errorType === 'blocked') {
          setErrorType('blocked');
          setErrorMessage(
            data.message ||
              'حساب کاربری شما توسط مدیر سامانه مسدود گردیده است. جهت بررسی با مدیریت انجمن تماس حاصل فرمایید.'
          );
        } else if (data.errorType === 'expired') {
          setErrorType('expired');
          setErrorMessage(
            data.message ||
              'اعتبار اشتراک شما در انجمن منقضی گردیده است. لطفاً اشتراک خود در انجمن را تمدید نمایید.'
          );
          setExpiredDate(data.eDate || null);
        } else {
          setErrorType('invalid_credentials');
          setErrorMessage(data.message || 'نام کاربری یا رمز عبور صحیح نمی‌باشد.');
        }
      }
    } catch {
      setErrorType('invalid_credentials');
      setErrorMessage('خطا در برقراری ارتباط با سرور. لطفاً اتصال اینترنت خود را بررسی نمایید.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-sm rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        {/* Decorative Top Accent Bar */}
        <div className="h-2 bg-gradient-to-r from-amber-500 via-teal-500 to-indigo-600" />

        <div className="p-6 space-y-5">
          {/* Header & Logo */}
          <div className="text-center space-y-2">
            <img
              src="/icon.svg"
              alt="نشان رسمی انجمن مجریان ذیصلاح ارومیه"
              className="w-16 h-16 mx-auto rounded-full object-cover shadow-xl ring-4 ring-amber-400/30"
            />
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
                انجمن مجریان ذیصلاح ارومیه
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                ورود به سامانه اعضا و مهندسان
              </p>
            </div>
          </div>

          {/* Error / Alert Boxes */}
          {errorMessage && (
            <div
              className={`p-3.5 rounded-2xl text-xs space-y-2 animate-fadeIn border ${
                errorType === 'expired'
                  ? 'bg-amber-50 border-amber-300 text-amber-950'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              <div className="flex items-start gap-2">
                {errorType === 'expired' ? (
                  <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1">
                  <p className="font-bold leading-relaxed">{errorMessage}</p>
                  {errorType === 'expired' && expiredDate && (
                    <p className="text-[11px] text-amber-800 font-mono">
                      تاریخ پایان اعتبار قبلی: {toPersianDigits(expiredDate)}
                    </p>
                  )}
                </div>
              </div>

              {/* Action for renewal when expired */}
              {errorType === 'expired' && (
                <div className="pt-2 border-t border-amber-200/80 flex items-center justify-center text-[11px]">
                  <a
                    href="tel:09009838663"
                    className="flex items-center gap-1 font-bold text-amber-900 hover:text-amber-950 underline"
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    <span>تماس با دبیرخانه جهت تمدید اشتراک</span>
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Username Input */}
            <div className="space-y-1 text-right">
              <label className="block text-xs font-semibold text-slate-700">
                نام کاربری:
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  autoFocus
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onFocus={(e) => e.currentTarget.select()}
                  onClick={(e) => e.currentTarget.select()}
                  placeholder="نام کاربری"
                  className="w-full px-3.5 py-2.5 pr-10 pl-8 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all text-left dir-ltr"
                  dir="ltr"
                />
                <User className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
                {username && (
                  <button
                    type="button"
                    onClick={() => setUsername('')}
                    className="absolute left-2.5 top-2.5 p-1 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-200 transition-colors"
                    title="پاک کردن متن"
                    tabIndex={-1}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1 text-right">
              <label className="block text-xs font-semibold text-slate-700">
                رمز عبور:
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={(e) => e.currentTarget.select()}
                  onClick={(e) => e.currentTarget.select()}
                  placeholder="رمز عبور"
                  className="w-full pr-10 pl-16 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all text-left dir-ltr font-mono"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
                <div className="absolute left-2.5 top-2.5 flex items-center gap-1">
                  {password && (
                    <button
                      type="button"
                      onClick={() => setPassword('')}
                      className="p-1 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-200 transition-colors"
                      title="پاک کردن رمز"
                      tabIndex={-1}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 transition-colors"
                    tabIndex={-1}
                    title={showPassword ? 'مخفی کردن رمز' : 'نمایش رمز'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98] disabled:opacity-60 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                  <span>در حال بررسی اعتبار...</span>
                </>
              ) : (
                <>
                  <span>ورود به سامانه</span>
                  <ArrowRight className="w-4 h-4 text-amber-400" />
                </>
              )}
            </button>
          </form>

          {/* Footer note */}
          <div className="pt-2 border-t border-slate-100 text-center">
            <p className="text-[10px] text-slate-400 leading-relaxed flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>اعتبارسنجی خودکار وضعیت عضویت و حساب کاربری مجریان و مهندسان</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
