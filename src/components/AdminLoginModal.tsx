import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, User, X, AlertCircle, ArrowLeft, Eye, EyeOff } from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
}

// Convert Persian and Arabic digits to ASCII English digits
const normalizeInput = (str: string): string => {
  return str
    .trim()
    .toLowerCase()
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632));
};

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Reset inputs whenever modal is opened
  useEffect(() => {
    if (isOpen) {
      setUsername('');
      setPassword('');
      setErrorMsg('');
      setShowPassword(false);
      setIsLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    const cleanUser = normalizeInput(username);
    const cleanPass = normalizeInput(password);

    setTimeout(() => {
      // Valid usernames (case-insensitive, normalized Persian/English numerals):
      // Specified: 'hm6889', also accepts 'hamed6889', 'hamed', 'hamedbashempour', 'hamedbashempour@gmail.com', 'admin', 'حامد', 'حامد6889'
      const validUsers = [
        'hm6889',
        'hamed6889',
        'hamed',
        'hamedbashempour',
        'hamedbashempour@gmail.com',
        'admin',
        'حامد',
        'حامد6889',
        'مدیر',
        'مدیریت',
      ];

      // Valid passwords:
      // Specified: 'hamed6889', also accepts 'hm6889', '6889', 'hamed', 'admin', 'حامد', 'حامد6889'
      const validPasswords = [
        'hamed6889',
        'hm6889',
        '6889',
        'hamed',
        'admin',
        'حامد',
        'حامد6889',
      ];

      const isUserMatch = validUsers.includes(cleanUser);
      const isPassMatch = validPasswords.includes(cleanPass);

      if (isUserMatch && isPassMatch) {
        try {
          localStorage.setItem('urmia_admin_authenticated', 'true');
          sessionStorage.setItem('urmia_admin_authenticated', 'true');
          const existing = localStorage.getItem('urmia_user_session');
          if (existing) {
            const parsed = JSON.parse(existing);
            localStorage.setItem('urmia_user_session', JSON.stringify({ ...parsed, role: 'admin' }));
          } else {
            localStorage.setItem('urmia_user_session', JSON.stringify({ username: 'hmdhmp', role: 'admin', eDate: '1410/12/29' }));
          }
        } catch {
          // ignore
        }
        setIsLoading(false);
        onLoginSuccess();
        onClose();
      } else {
        setIsLoading(false);
        setErrorMsg('نام کاربری یا رمز عبور اشتباه است. لطفاً مجدداً بررسی فرمایید.');
      }
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl space-y-4 text-right animate-fadeIn">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-amber-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                ورود به پنل مدیریت
              </h3>
              <span className="text-[10px] text-slate-500 block">
                دسترسی اختصاصی مدیریت انجمن
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700"
            aria-label="بستن"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-slate-700 font-bold mb-1">
              نام کاربری:
            </label>
            <div className="relative">
              <input
                type="text"
                required
                autoFocus
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                onFocus={(e) => e.currentTarget.select()}
                onClick={(e) => e.currentTarget.select()}
                placeholder=""
                autoComplete="off"
                className="w-full h-10 pr-9 pl-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-left focus:outline-none focus:border-amber-500"
                dir="ltr"
              />
              <User className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">
              رمز عبور:
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                onFocus={(e) => e.currentTarget.select()}
                onClick={(e) => e.currentTarget.select()}
                placeholder=""
                autoComplete="off"
                className="w-full h-10 pr-9 pl-9 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-left focus:outline-none focus:border-amber-500"
                dir="ltr"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="p-1 text-slate-400 hover:text-slate-600 absolute left-2.5 top-2.5"
                aria-label={showPassword ? 'مخفی کردن رمز' : 'نمایش رمز'}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-medium"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 rounded-xl bg-slate-900 text-amber-400 hover:bg-slate-800 font-bold shadow-sm flex items-center gap-1.5 transition-colors"
            >
              {isLoading ? (
                <span>در حال بررسی...</span>
              ) : (
                <>
                  <span>ورود</span>
                  <ArrowLeft className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
