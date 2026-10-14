import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Lock,
  Calendar,
  Shield,
  ShieldAlert,
  Ban,
  CheckCircle2,
  AlertTriangle,
  FolderKanban,
  Calculator,
  HardHat,
  BookOpen,
  ClipboardCheck,
  Binary,
  Compass,
  FileCheck,
  Newspaper,
  Layers,
  Save,
} from 'lucide-react';
import { AuthUser, AppRestrictedSection } from '../types';
import { toPersianDigits } from '../utils/formatters';
import { UserTagBadge, USER_TAG_PRESETS, getUserTagDetails } from './UserTagBadge';

interface EditUserModalProps {
  isOpen: boolean;
  user: AuthUser | null;
  onClose: () => void;
  onSave: (updatedData: {
    oldUsername: string;
    username: string;
    fullName?: string;
    password?: string;
    role: 'admin' | 'user';
    eDate: string;
    userTag?: string;
    field?: string;
    baseGrade?: string;
    licenseNo?: string;
    phone?: string;
    isBlocked: boolean;
    blockReason: string;
    restrictedSections: string[];
    notes: string;
  }) => Promise<void>;
  isSaving: boolean;
}

interface SectionOption {
  id: AppRestrictedSection;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
}

const SECTION_OPTIONS: SectionOption[] = [
  {
    id: 'tariffs',
    title: 'تعرفه رسمی',
    subtitle: 'محاسبه حق‌الزحمه و تنظیم قرارداد مدیریت پیمان و شرایط خصوصی',
    icon: Calculator,
  },
  {
    id: 'mojrian',
    title: 'ظرفیت اشتغال',
    subtitle: 'استعلام برخط ماند ظرفیت و سهمیه مجریان سازمان نظام مهندسی',
    icon: Compass,
  },
  {
    id: 'mous',
    title: 'تفاهم نامه ها',
    subtitle: 'تفاهم‌نامه‌های رسمی بانک‌ها، بیمه، مصالح و آزمایشگاه‌ها',
    icon: FileCheck,
  },
  {
    id: 'artisans',
    title: 'بازار',
    subtitle: 'خدمات مهندسی اعضا، استادکاران ساختمانی، فروشندگان و ثبت خدمات',
    icon: HardHat,
  },
  {
    id: 'news',
    title: 'اخبار',
    subtitle: 'آخرین اخبار کانال رسمی انجمن مهندسان مجری ذیصلاح ارومیه',
    icon: Newspaper,
  },
  {
    id: 'regulations',
    title: 'کتابخانه مهندسی',
    subtitle: 'متن ۲۳ مبحث مقررات ملی، استاندارد ۲۸۰۰، نشریه ۵۵ و دستیار هوشمند',
    icon: BookOpen,
  },
  {
    id: 'checklists',
    title: 'پروژه های من',
    subtitle: 'چک‌لیست‌های فنی، کنترل مراحل و نظارت کارگاهی',
    icon: ClipboardCheck,
  },
  {
    id: 'projects',
    title: 'پروژه های من (کارپوشه)',
    subtitle: 'مدیریت و پرونده‌های کارگاهی پروژه‌ها',
    icon: FolderKanban,
  },
  {
    id: 'calculators',
    title: 'متره و برآورد هوشمند',
    subtitle: 'طول مهاری، مقاومت فشاری بتن، درز انقطاع و وزن میلگرد',
    icon: Binary,
  },
];

export const EditUserModal: React.FC<EditUserModalProps> = ({
  isOpen,
  user,
  onClose,
  onSave,
  isSaving,
}) => {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'user'>('user');
  const [eDate, setEDate] = useState('1406/12/29');
  const [selectedTagPreset, setSelectedTagPreset] = useState<string>('member');
  const [customTagText, setCustomTagText] = useState<string>('');
  const [field, setField] = useState('');
  const [baseGrade, setBaseGrade] = useState('');
  const [licenseNo, setLicenseNo] = useState('');
  const [phone, setPhone] = useState('');
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockReason, setBlockReason] = useState('');
  const [restrictedSections, setRestrictedSections] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || user.name || '');
      setUsername(user.username || '');
      setPassword(user.password || '');
      setRole(user.role === 'admin' ? 'admin' : 'user');
      setEDate(user.eDate || '1406/12/29');
      setField(user.field || '');
      setBaseGrade(user.baseGrade || '');
      setLicenseNo(user.licenseNo || '');
      setPhone(user.phone || '');
      setIsBlocked(Boolean(user.isBlocked));
      setBlockReason(user.blockReason || '');
      setRestrictedSections(Array.isArray(user.restrictedSections) ? [...user.restrictedSections] : []);
      setNotes(user.notes || '');

      // Initialize tag preset & custom text
      const rawTag = (user.userTag || '').trim();
      const lower = rawTag.toLowerCase();
      if (lower === 'ceo' || rawTag.includes('مدیرعامل')) {
        setSelectedTagPreset('ceo');
        setCustomTagText('');
      } else if (lower === 'board' || rawTag.includes('هیات مدیره') || rawTag.includes('هیئت مدیره')) {
        setSelectedTagPreset('board');
        setCustomTagText('');
      } else if (lower === 'inspector' || rawTag.includes('بازرس')) {
        setSelectedTagPreset('inspector');
        setCustomTagText('');
      } else if (lower === 'treasurer' || rawTag.includes('خزانه')) {
        setSelectedTagPreset('treasurer');
        setCustomTagText('');
      } else if (lower === 'secretary' || rawTag.includes('دبیر')) {
        setSelectedTagPreset('secretary');
        setCustomTagText('');
      } else if (lower === 'admin' || (user.role === 'admin' && !rawTag)) {
        setSelectedTagPreset('admin');
        setCustomTagText('');
      } else if (lower === 'member' || !rawTag) {
        setSelectedTagPreset('member');
        setCustomTagText('');
      } else {
        setSelectedTagPreset('custom');
        setCustomTagText(rawTag);
      }
    }
  }, [user, isOpen]);

  if (!isOpen || !user) return null;

  const currentEffectiveTag =
    selectedTagPreset === 'custom'
      ? customTagText.trim() || 'عضو انجمن'
      : selectedTagPreset;

  const toggleSectionRestriction = (sectionId: string) => {
    setRestrictedSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((s) => s !== sectionId)
        : [...prev, sectionId]
    );
  };

  const handleSelectAllSections = () => {
    setRestrictedSections(SECTION_OPTIONS.map((s) => s.id));
  };

  const handleClearAllRestrictions = () => {
    setRestrictedSections([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      alert('نام کاربری نمی‌تواند خالی باشد.');
      return;
    }

    const finalTag =
      selectedTagPreset === 'custom'
        ? customTagText.trim() || 'member'
        : selectedTagPreset;

    await onSave({
      oldUsername: user.username,
      username: username.trim(),
      fullName: fullName.trim() || username.trim(),
      password: password.trim() ? password.trim() : undefined,
      role,
      eDate: eDate.trim() || '1406/12/29',
      userTag: finalTag,
      field: field.trim(),
      baseGrade: baseGrade.trim(),
      licenseNo: licenseNo.trim(),
      phone: phone.trim(),
      isBlocked,
      blockReason: blockReason.trim(),
      restrictedSections,
      notes: notes.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[90vh] flex flex-col text-right">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-l from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-bold text-white">
                  ویرایش اطلاعات و دسترسی مهندس
                </h3>
                <span className="font-bold text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {user.fullName || user.username}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                تعیین مشخصات مهندس، مسدودسازی کلی یا محدودسازی بخش‌های کلیدی برنامه بدون حذف کاربر
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isSaving}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-6 text-xs flex-1">
          {/* Section 1: Basic Credentials */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2 text-slate-800 font-bold">
              <User className="w-4 h-4 text-emerald-600" />
              <span>مشخصات حساب کاربری و نام مهندس در سامانه</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="text-[11px] text-slate-700 font-bold block mb-1">
                  نام و نام خانوادگی مهندس (نمایش در تمام بخش‌های سامانه) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    onFocus={(e) => e.currentTarget.select()}
                    onClick={(e) => e.currentTarget.select()}
                    required
                    placeholder="نام و نام خانوادگی مهندس"
                    className="w-full h-10 px-3 pl-8 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all text-right"
                  />
                  <User className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3.5 pointer-events-none" />
                </div>
                <span className="text-[10px] text-slate-500 block mt-1">
                  این نام در سربرگ، پرونده پروژه‌ها، فرم‌های گزارش و دیدگاه‌ها نمایش داده خواهد شد.
                </span>
              </div>

              <div>
                <label className="text-[11px] text-slate-600 font-bold block mb-1">
                  نام کاربری (جهت لاگ‌این) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onFocus={(e) => e.currentTarget.select()}
                    onClick={(e) => e.currentTarget.select()}
                    required
                    placeholder="نام کاربری"
                    className="w-full h-10 px-3 pl-8 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all text-left"
                    dir="ltr"
                  />
                  <User className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3.5 pointer-events-none" />
                </div>
                <span className="text-[10px] text-slate-400 block mt-1">
                  نام کاربری تنها در صفحه ورود کاربرد دارد.
                </span>
              </div>

              <div>
                <label className="text-[11px] text-slate-600 font-bold block mb-1">
                  رمز عبور (Password)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={(e) => e.currentTarget.select()}
                    onClick={(e) => e.currentTarget.select()}
                    placeholder="رمز عبور"
                    className="w-full h-10 px-3 pl-8 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all text-left"
                    dir="ltr"
                  />
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3.5 pointer-events-none" />
                </div>
                <span className="text-[10px] text-slate-400 block mt-1">
                  می‌توانید رمز فعلی را مشاهده کرده یا رمز عبور جدید تعیین نمایید.
                </span>
              </div>

              <div>
                <label className="text-[11px] text-slate-600 font-bold block mb-1">
                  سطح دسترسی سامانه
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white font-medium"
                >
                  <option value="user">کاربر عادی / مهندس ناظر و مجری</option>
                  <option value="admin">مدیر سیستم و ادمین ارشد (Admin)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-600 font-bold block mb-1">
                  تاریخ انقضای اعتبار (e-date)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={eDate}
                    onChange={(e) => setEDate(e.target.value)}
                    onFocus={(e) => e.currentTarget.select()}
                    onClick={(e) => e.currentTarget.select()}
                    placeholder="1406/12/29"
                    className="w-full h-10 px-3 pl-8 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all text-left"
                    dir="ltr"
                  />
                  <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3.5 pointer-events-none" />
                </div>
                <span className="text-[10px] text-slate-400 block mt-1">
                  تاریخ پایان اعتبار اشتراک مهندس در انجمن
                </span>
              </div>

              {/* Organizational Tag & Title Selector */}
              <div className="sm:col-span-2 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] text-slate-800 font-bold flex items-center gap-1.5">
                    <span>نشان و تگ سازمانی مهندس در انجمن</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      (تگ طلایی مدیرعامل، هیات مدیره و...)
                    </span>
                  </label>

                  {/* Live preview */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-400">پیش‌نمایش نشان:</span>
                    <UserTagBadge tag={currentEffectiveTag} role={role} size="sm" />
                  </div>
                </div>

                {/* Quick Tag Presets Chips */}
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {USER_TAG_PRESETS.map((preset) => {
                    const isSelected = selectedTagPreset === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          setSelectedTagPreset(preset.id);
                          if (preset.id === 'admin') setRole('admin');
                        }}
                        className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                          isSelected
                            ? preset.isGolden
                              ? 'bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-amber-950 border-amber-400 shadow-sm ring-2 ring-amber-400/50 scale-[1.02]'
                              : preset.id === 'board'
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs ring-2 ring-indigo-400/40'
                              : 'bg-slate-900 text-white border-slate-900 shadow-xs'
                            : preset.isGolden
                            ? 'bg-amber-50/80 text-amber-900 border-amber-200 hover:bg-amber-100'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <span>{preset.icon}</span>
                        <span>{preset.label}</span>
                        {preset.isGolden && (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-amber-950/20 text-amber-950 font-black">
                            طلایی
                          </span>
                        )}
                      </button>
                    );
                  })}

                  {/* Custom Tag Button */}
                  <button
                    type="button"
                    onClick={() => setSelectedTagPreset('custom')}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                      selectedTagPreset === 'custom'
                        ? 'bg-purple-700 text-white border-purple-700 shadow-xs ring-2 ring-purple-400/40'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>🏷️</span>
                    <span>سایر / تگ دلخواه...</span>
                  </button>
                </div>

                {/* Custom Tag Input if selected */}
                {selectedTagPreset === 'custom' && (
                  <div className="mt-2 p-2.5 rounded-xl bg-purple-50/70 border border-purple-200 space-y-1 animate-fadeIn">
                    <label className="text-[10px] font-bold text-purple-900 block">
                      عنوان یا سمت سازمانی دلخواه را وارد فرمایید:
                    </label>
                    <input
                      type="text"
                      value={customTagText}
                      onChange={(e) => setCustomTagText(e.target.value)}
                      placeholder="مثال: مشاور عالی انجمن، دبیر اجرایی، ..."
                      className="w-full h-9 px-3 rounded-lg bg-white border border-purple-300 text-xs font-bold text-purple-950 focus:outline-none focus:border-purple-600 text-right"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="text-[11px] text-slate-600 font-bold block mb-1">
                  رشته تخصصی مهندسی
                </label>
                <input
                  type="text"
                  value={field}
                  onChange={(e) => setField(e.target.value)}
                  onFocus={(e) => e.currentTarget.select()}
                  onClick={(e) => e.currentTarget.select()}
                  placeholder="مثال: مهندسی عمران / معماری"
                  className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all text-right"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-600 font-bold block mb-1">
                  پایه پروانه اشتغال
                </label>
                <input
                  type="text"
                  value={baseGrade}
                  onChange={(e) => setBaseGrade(e.target.value)}
                  onFocus={(e) => e.currentTarget.select()}
                  onClick={(e) => e.currentTarget.select()}
                  placeholder="مثال: پایه ۱ / پایه ۲ / پایه ۳ / ارشد"
                  className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all text-right"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-600 font-bold block mb-1">
                  شماره پروانه اشتغال
                </label>
                <input
                  type="text"
                  value={licenseNo}
                  onChange={(e) => setLicenseNo(e.target.value)}
                  onFocus={(e) => e.currentTarget.select()}
                  onClick={(e) => e.currentTarget.select()}
                  placeholder="شماره پروانه نظام مهندسی"
                  className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all text-left"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-600 font-bold block mb-1">
                  تلفن همراه مهندس
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  onFocus={(e) => e.currentTarget.select()}
                  onClick={(e) => e.currentTarget.select()}
                  placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                  className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all text-left"
                  dir="ltr"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Total Account Suspension (محدودیت کلی بدون پاک کردن) */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2 text-slate-800 font-bold">
              <Ban className="w-4 h-4 text-rose-600" />
              <span>۱. محدودیت کلی حساب کاربری (مسدودسازی کامل بدون حذف رکورد)</span>
            </div>

            <div
              className={`p-3.5 rounded-2xl border transition-all ${
                isBlocked
                  ? 'bg-rose-50/90 border-rose-300 shadow-2xs'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100/70'
              }`}
            >
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isBlocked}
                  onChange={(e) => setIsBlocked(e.target.checked)}
                  className="w-4 h-4 mt-0.5 text-rose-600 rounded focus:ring-rose-500 border-slate-300"
                />
                <div className="space-y-0.5">
                  <span
                    className={`font-bold block text-xs ${
                      isBlocked ? 'text-rose-900' : 'text-slate-800'
                    }`}
                  >
                    مسدودسازی کامل دسترسی این کاربر به سامانه (Total Suspension)
                  </span>
                  <span className="text-[11px] text-slate-500 block leading-relaxed">
                    با فعال‌سازی این گزینه، کاربر امکان ورود نخواهد داشت و در صورت حضور در برنامه نشست وی فوراً پایان خواهد یافت، بدون اینکه رکوردهای پروژه‌ها یا اطلاعات وی حذف گردد.
                  </span>
                </div>
              </label>

              {isBlocked && (
                <div className="mt-3 pt-3 border-t border-rose-200 space-y-1.5 animate-fadeIn">
                  <label className="text-[11px] font-bold text-rose-900 block">
                    علت مسدودسازی (جهت نمایش به کاربر):
                  </label>
                  <input
                    type="text"
                    value={blockReason}
                    onChange={(e) => setBlockReason(e.target.value)}
                    placeholder="مثال: تعلیق موقت به دلیل عدم تسویه حق اشتراک سالانه یا دستور هیئت مدیره"
                    className="w-full h-9 px-3 rounded-xl bg-white border border-rose-300 text-xs text-rose-950 placeholder-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-400/20"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Selective Section Restrictions (محدودیت استفاده از قسمت‌های مهم برنامه) */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 text-slate-800 font-bold">
                <Layers className="w-4 h-4 text-amber-600" />
                <span>۲. محدودیت استفاده از قسمت‌های مهم برنامه (Selective Restrictions)</span>
              </div>

              <div className="flex items-center gap-1.5 text-[11px]">
                <button
                  type="button"
                  onClick={handleSelectAllSections}
                  className="px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold transition-colors"
                >
                  محدود کردن همه بخش‌ها
                </button>
                <button
                  type="button"
                  onClick={handleClearAllRestrictions}
                  className="px-2.5 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold transition-colors"
                >
                  دسترسی کامل (رفع همه محدودیت‌ها)
                </button>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              بخش‌هایی که تیک می‌خورند برای این کاربر قفل شده و به جای محتوا، پیام «دسترسی محدود شده است» نمایش داده می‌شود:
            </p>

            {/* Sections Checkbox Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {SECTION_OPTIONS.map((sec) => {
                const IconComponent = sec.icon;
                const isRestricted = restrictedSections.includes(sec.id);

                return (
                  <div
                    key={sec.id}
                    onClick={() => toggleSectionRestriction(sec.id)}
                    className={`p-3 rounded-2xl border cursor-pointer select-none transition-all flex items-start gap-2.5 ${
                      isRestricted
                        ? 'bg-rose-50/80 border-rose-300 shadow-2xs'
                        : 'bg-slate-50/80 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        isRestricted
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-white text-slate-600 border border-slate-200'
                      }`}
                    >
                      <IconComponent className="w-4 h-4" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span
                          className={`font-bold text-xs ${
                            isRestricted ? 'text-rose-950' : 'text-slate-900'
                          }`}
                        >
                          {sec.title}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                            isRestricted
                              ? 'bg-rose-600 text-white'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {isRestricted ? '⛔ مسدود' : '✔ مجاز'}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 block mt-0.5 line-clamp-1">
                        {sec.subtitle}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {restrictedSections.length > 0 && (
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  تعداد <strong>{toPersianDigits(restrictedSections.length)}</strong> بخش مهم برنامه برای این کاربر غیرفعال و مسدود گردیده است.
                </span>
              </div>
            )}
          </div>

          {/* Section 4: Admin Internal Notes */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <label className="text-[11px] text-slate-600 font-bold block">
              یادداشت داخلی مدیر (اختیاری):
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="مثال: مهندس ناظر پایه دو، متقاضی فعال‌سازی بخش پروژه‌ها..."
              className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white resize-none"
            />
          </div>

          {/* Form Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
            >
              انصراف
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'در حال ذخیره‌سازی...' : 'ذخیره تغییرات و اعمال محدودیت‌ها'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
