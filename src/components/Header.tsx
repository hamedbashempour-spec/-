import React, { useState } from 'react';
import {
  Building2,
  Bell,
  Menu,
  X,
  Phone,
  Send,
  FolderKanban,
  Calculator,
  Store,
  Users,
  BookOpen,
  Library,
  Info,
  ShieldCheck,
  ExternalLink,
  Coins,
  Handshake,
  Lock,
  LogOut,
  User,
  Clock,
  MapPin,
} from 'lucide-react';
import { ActiveTab, AuthUser } from '../types';
import { AdminLoginModal } from './AdminLoginModal';
import { toPersianDigits } from '../utils/formatters';
import { UserTagBadge } from './UserTagBadge';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  urgentAnnouncementsCount: number;
  unreadNewsCount?: number;
  currentUser?: AuthUser | null;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  urgentAnnouncementsCount,
  unreadNewsCount = 0,
  currentUser,
  onLogout,
}) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const isAdminUser = currentUser?.role === 'admin';
  const isRegularUser = currentUser?.role === 'user';

  const handleNavClick = (tab: ActiveTab) => {
    setActiveTab(tab);
    setDrawerOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAdminClick = () => {
    if (isAdminUser) {
      handleNavClick('admin');
    } else if (!isRegularUser) {
      setAdminModalOpen(true);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* Brand Zone (Single element text wordmark) */}
          <button
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-2 text-right focus:outline-none"
            aria-label="صفحه اصلی انجمن مجریان ذیصلاح ارومیه"
          >
            <img
              src="/icon.svg"
              alt="لوگوی رسمی انجمن مجریان ذیصلاح ارومیه"
              className="w-9 h-9 rounded-full object-cover shrink-0 shadow-sm ring-1 ring-amber-500/30"
            />
            <div className="flex flex-col">
              <span className="text-sm font-bold text-slate-900 leading-tight">
                انجمن مجریان ذیصلاح ارومیه
              </span>
              <span className="text-[10px] text-slate-500 font-medium">
                سامانه تخصصی مهندسی و نظارت بر اجرا
              </span>
            </div>
          </button>

          {/* Action Zone: Notifications + Menu Drawer */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handleNavClick('news')}
              className="relative p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              aria-label="اخبار و اعلان‌های رسمی انجمن"
              title="اخبار و اعلان‌های رسمی انجمن"
            >
              <Bell className="w-5 h-5" />
              {unreadNewsCount > 0 && (
                <span className="absolute top-1.5 left-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white animate-pulse" />
              )}
            </button>

            <button
              onClick={() => setDrawerOpen(true)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              aria-label="منوی دسترسی سریع"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Admin Login Modal */}
      <AdminLoginModal
        isOpen={adminModalOpen}
        onClose={() => setAdminModalOpen(false)}
        onLoginSuccess={() => {
          handleNavClick('admin');
        }}
      />

      {/* Drawer Overlay */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => setDrawerOpen(false)}
          />

          {/* Drawer Panel (RTL, right-aligned) */}
          <div className="relative mr-auto w-full max-w-xs bg-white h-full shadow-2xl flex flex-col z-10 overflow-y-auto">
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <img
                  src="/icon.svg"
                  alt="لوگوی انجمن"
                  className="w-7 h-7 rounded-full object-cover shrink-0 shadow-xs ring-1 ring-amber-500/20"
                />
                <span className="text-xs font-bold text-slate-900">
                  منوی دسترسی سریع
                </span>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-1.5 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors"
                aria-label="بستن منو"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* User Profile Card */}
            {currentUser && (
              <div className="p-3 mx-3 mt-3 rounded-2xl bg-slate-100/90 border border-slate-200 text-xs flex items-center justify-between gap-2 shadow-2xs">
                <button
                  type="button"
                  onClick={() => handleNavClick('profile')}
                  className="flex items-center gap-2 overflow-hidden text-right flex-1 hover:opacity-85 transition-opacity"
                  title="مشاهده پروفایل کاربری"
                >
                  <div className="w-8 h-8 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center shrink-0 shadow-xs overflow-hidden">
                    {currentUser.avatar ? (
                      currentUser.avatar.startsWith('data:') || currentUser.avatar.startsWith('http') ? (
                        <img src={currentUser.avatar} alt="پروفایل" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-base">{currentUser.avatar}</span>
                      )
                    ) : (
                      <User className="w-4 h-4" />
                    )}
                  </div>
                  <div className="overflow-hidden">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <strong className="text-slate-900 truncate font-bold text-xs" title={currentUser.fullName || currentUser.username}>
                        {currentUser.fullName || currentUser.username}
                      </strong>
                      <UserTagBadge tag={currentUser.userTag} role={currentUser.role} size="xs" />
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                      اعتبار: {toPersianDigits(currentUser.eDate)}
                    </span>
                  </div>
                </button>

                {onLogout && (
                  <button
                    onClick={() => {
                      setDrawerOpen(false);
                      onLogout();
                    }}
                    className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors shrink-0"
                    title="خروج از حساب کاربری"
                    aria-label="خروج از حساب"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}

            {/* Navigation Links */}
            <div className="py-2 px-3 flex-1 space-y-1 text-right">
              <button
                onClick={() => handleNavClick('home')}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-medium transition-colors ${
                  activeTab === 'home'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Building2 className="w-4 h-4" />
                  صفحه اصلی
                </span>
              </button>

              {/* CRITICAL: Tariff right after Home */}
              <button
                onClick={() => handleNavClick('tariffs')}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-medium transition-colors ${
                  activeTab === 'tariffs'
                    ? 'bg-amber-600 text-white font-bold'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Coins className="w-4 h-4 text-amber-500" />
                  تعرفه رسمی
                </span>
              </button>

              <button
                onClick={() => handleNavClick('mojrian')}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-medium transition-colors ${
                  activeTab === 'mojrian'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  ظرفیت اشتغال
                </span>
              </button>

              <button
                onClick={() => handleNavClick('mous')}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-medium transition-colors ${
                  activeTab === 'mous'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Handshake className="w-4 h-4 text-sky-600" />
                  تفاهم نامه ها
                </span>
              </button>

              <button
                onClick={() => handleNavClick('artisans')}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-medium transition-colors ${
                  activeTab === 'artisans'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Store className="w-4 h-4 text-teal-600" />
                  بازار
                </span>
              </button>

              <button
                onClick={() => handleNavClick('news')}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-medium transition-colors ${
                  activeTab === 'news'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Send className="w-4 h-4 text-sky-500" />
                  اخبار
                </span>
                {unreadNewsCount > 0 ? (
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                    <span className="text-[10px] text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded font-bold border border-rose-200">
                      جدید
                    </span>
                  </span>
                ) : (
                  <span className="text-[10px] text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded font-bold border border-sky-100">
                    Push
                  </span>
                )}
              </button>

              <button
                onClick={() => handleNavClick('regulations')}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-medium transition-colors ${
                  activeTab === 'regulations'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Library className="w-4 h-4 text-amber-500" />
                  کتابخانه مهندسی
                </span>
              </button>

              <button
                onClick={() => handleNavClick('checklists')}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-medium transition-colors ${
                  activeTab === 'checklists'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <FolderKanban className="w-4 h-4 text-indigo-600" />
                  پروژه های من
                </span>
              </button>

              <button
                onClick={() => handleNavClick('calculators')}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-medium transition-colors ${
                  activeTab === 'calculators'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Calculator className="w-4 h-4 text-violet-600" />
                  متره و برآورد هوشمند
                </span>
              </button>

              <button
                onClick={() => handleNavClick('announcements')}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-medium transition-colors ${
                  activeTab === 'announcements'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Bell className="w-4 h-4 text-rose-500" />
                  اطلاعیه های انجمن
                </span>
              </button>

              <button
                onClick={() => handleNavClick('about')}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-medium transition-colors ${
                  activeTab === 'about'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Info className="w-4 h-4 text-slate-600" />
                  درباره انجمن و تماس
                </span>
              </button>

              {/* Profile as the last option in sidebar per user requirement */}
              <button
                onClick={() => handleNavClick('profile')}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-medium transition-colors ${
                  activeTab === 'profile'
                    ? 'bg-amber-600 text-white font-bold'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <User className="w-4 h-4 text-amber-500" />
                  پروفایل کاربری
                </span>
                {currentUser && (
                  <span className="text-[10px] text-slate-400 font-mono" dir="ltr">
                    @{currentUser.username}
                  </span>
                )}
              </button>
            </div>

            {/* Quick Support Phone */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 text-xs text-slate-600 space-y-2">
              <div className="font-semibold text-slate-800">
                پاسخگویی دبیرخانه انجمن ارومیه:
              </div>
              <a
                href="tel:09009838663"
                className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 text-slate-800 font-mono"
              >
                <span className="font-sans text-xs">مسئول دفتر:</span>
                <span className="flex items-center gap-1.5 font-bold">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  ۰۹۰۰۹۸۳۸۶۶۳
                </span>
              </a>
              <a
                href="https://t.me/Urmia_QU_Engineers_Association"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-2 rounded-lg bg-sky-50 border border-sky-100 text-sky-800 font-sans"
              >
                <span>کانال تلگرام انجمن</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              {/* Office Address */}
              <div className="p-2 rounded-lg bg-white border border-slate-200 text-slate-700 text-[11px] flex items-start gap-1.5 leading-snug">
                <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>نشانی دفتر:</strong> ارومیه، خیابان امینی، روبروی فروشگاه رفاه
                </span>
              </div>

              {/* Discreet small admin link in bottom corner - only for admin */}
              <div className="pt-2.5 mt-2 border-t border-slate-200/70 flex items-center justify-between text-[11px] text-slate-400 gap-1">
                <span className="text-[10px] text-slate-400">نسخه ۱.۴.۰</span>
                <span className="text-[10px] text-slate-500 font-medium">
                  سازنده: مهندس حامد هاشم پور
                </span>
                {isAdminUser && (
                  <button
                    type="button"
                    onClick={() => {
                      setDrawerOpen(false);
                      handleAdminClick();
                    }}
                    className="text-[11px] text-slate-500 hover:text-slate-800 hover:underline transition-colors flex items-center gap-1 px-1 py-0.5 font-bold"
                    title="ورود به پنل مدیریت"
                  >
                    <Lock className="w-3 h-3 text-slate-500" />
                    <span>پنل مدیریت</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
