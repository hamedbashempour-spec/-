import React, { useState, useEffect } from 'react';
import {
  X,
  Edit3,
  Save,
  Hammer,
  Store,
  Briefcase,
  Phone,
  MapPin,
  Clock,
  User,
  AlertCircle,
  Building,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
import { ArtisanItem } from '../types';
import { engineeringCategories, artisanCategories, vendorCategories } from '../data/artisansData';
import { updateArtisan } from '../services/artisansFirestore';
import { sanitizeNumericInput } from '../utils/formatters';
import { playNotificationChime } from '../services/notificationService';

interface EditArtisanModalProps {
  isOpen: boolean;
  artisan: ArtisanItem | null;
  onClose: () => void;
  onSaveSuccess: (updated: ArtisanItem) => void;
}

export const EditArtisanModal: React.FC<EditArtisanModalProps> = ({
  isOpen,
  artisan,
  onClose,
  onSaveSuccess,
}) => {
  const [entityType, setEntityType] = useState<'engineering_service' | 'artisan' | 'vendor'>('engineering_service');
  const [fullName, setFullName] = useState('');
  const [storeName, setStoreName] = useState('');
  const [managerName, setManagerName] = useState('');
  const [trade, setTrade] = useState('');
  const [phone, setPhone] = useState('');
  const [district, setDistrict] = useState('');
  const [experienceYears, setExperienceYears] = useState('10');
  const [description, setDescription] = useState('');
  const [referrerName, setReferrerName] = useState('');
  const [referrerLicense, setReferrerLicense] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Sync inputs with selected artisan when modal opens
  useEffect(() => {
    if (artisan && isOpen) {
      setEntityType(artisan.entityType || 'artisan');
      setFullName(artisan.fullName || '');
      setStoreName(artisan.storeName || artisan.fullName || '');
      setManagerName(artisan.managerName || '');
      const defaultTrade =
        artisan.trade ||
        (artisan.entityType === 'engineering_service'
          ? 'طراحی سازه'
          : artisan.entityType === 'vendor'
          ? 'مصالح ساختمانی (سیمان، گچ، آجر، بلوک)'
          : 'آرماتوربند');
      setTrade(defaultTrade);
      setPhone(artisan.phone || '');
      setDistrict(artisan.district || '');
      setExperienceYears(String(artisan.experienceYears ?? 10));
      setDescription(artisan.description || '');
      setReferrerName(artisan.referrerName || '');
      setReferrerLicense(artisan.referrerLicense || '');
      setErrorMsg('');
      setIsSaving(false);
    }
  }, [artisan, isOpen]);

  if (!isOpen || !artisan) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanPhone = sanitizeNumericInput(phone);
    if (!cleanPhone) {
      setErrorMsg('لطفاً شماره تماس را وارد فرمایید.');
      return;
    }

    const effectiveName =
      entityType === 'vendor'
        ? storeName.trim() || fullName.trim()
        : fullName.trim();

    if (!effectiveName) {
      setErrorMsg(
        entityType === 'engineering_service'
          ? 'لطفاً نام مهندس یا عنوان دفتر مهندسی را وارد فرمایید.'
          : entityType === 'vendor'
          ? 'لطفاً نام فروشگاه یا شرکت را وارد فرمایید.'
          : 'لطفاً نام و نام خانوادگی استادکار را وارد فرمایید.'
      );
      return;
    }

    if (!trade.trim()) {
      setErrorMsg('لطفاً تخصص یا زمینه فعالیت را مشخص فرمایید.');
      return;
    }

    const effectiveReferrer =
      referrerName.trim() ||
      (entityType === 'engineering_service' ? effectiveName : '');

    if (!effectiveReferrer) {
      setErrorMsg('ذکر نام مهندس معرف الزامی است.');
      return;
    }

    setIsSaving(true);
    try {
      const updates: Partial<ArtisanItem> = {
        entityType,
        fullName: effectiveName,
        storeName: entityType === 'vendor' ? storeName.trim() || effectiveName : undefined,
        managerName: managerName.trim() || undefined,
        trade: trade.trim(),
        tradeCategory: trade.trim(),
        phone: cleanPhone,
        district: district.trim() || 'ارومیه',
        experienceYears: Number(experienceYears) || 0,
        description: description.trim(),
        referrerName: effectiveReferrer,
        referrerLicense: referrerLicense.trim() || undefined,
      };

      const updated = await updateArtisan(artisan.id, updates);
      playNotificationChime();
      onSaveSuccess(updated);
      onClose();
    } catch (err: any) {
      console.error('Error saving artisan changes:', err);
      setErrorMsg(err.message || 'خطا در ثبت اطلاعات در سرور.');
    } finally {
      setIsSaving(false);
    }
  };

  const getModalTitle = () => {
    if (entityType === 'engineering_service') return 'ویرایش خدمات مهندسی عضو';
    if (entityType === 'vendor') return 'ویرایش مشخصات فروشنده / تامین‌کننده';
    return 'ویرایش مشخصات استادکار';
  };

  const currentCategories =
    entityType === 'engineering_service'
      ? engineeringCategories
      : entityType === 'vendor'
      ? vendorCategories
      : artisanCategories;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden text-right dir-rtl">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-teal-50 via-slate-50 to-amber-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-sm">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                {getModalTitle()}
              </h3>
              <p className="text-[11px] text-slate-500">
                شناسه: <span className="font-mono text-[10px]">{artisan.id}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-white/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Entity Type 3-Way Toggle */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">بخش و نوع فعالیت:</label>
            <div className="grid grid-cols-3 gap-1.5 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setEntityType('engineering_service');
                  if (!trade || trade === 'آرماتوربند' || trade.includes('مصالح')) {
                    setTrade('طراحی سازه');
                  }
                }}
                className={`py-2 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                  entityType === 'engineering_service'
                    ? 'bg-white text-teal-800 shadow-sm border border-teal-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5 text-teal-600" />
                <span>خدمات مهندسی</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setEntityType('artisan');
                  if (!trade || trade.includes('طراحی') || trade.includes('مصالح')) {
                    setTrade('آرماتوربند');
                  }
                }}
                className={`py-2 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                  entityType === 'artisan'
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Hammer className="w-3.5 h-3.5 text-amber-500" />
                <span>استادکاران</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setEntityType('vendor');
                  if (!trade || trade.includes('طراحی') || trade === 'آرماتوربند') {
                    setTrade('مصالح ساختمانی (سیمان، گچ، آجر، بلوک)');
                  }
                }}
                className={`py-2 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                  entityType === 'vendor'
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Store className="w-3.5 h-3.5 text-teal-600" />
                <span>فروشندگان</span>
              </button>
            </div>
          </div>

          {/* Conditional Name Inputs */}
          {entityType === 'engineering_service' ? (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  نام و نام خانوادگی مهندس یا عنوان دفتر مهندسی: <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="مثال: مهندس محمد رضایی یا دفتر مهندسی سازه ارومیه"
                    className="w-full pr-9 pl-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent font-semibold"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  شماره پروانه اشتغال یا کد نظام مهندسی:
                </label>
                <div className="relative">
                  <ShieldCheck className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                  <input
                    type="text"
                    value={referrerLicense}
                    onChange={(e) => setReferrerLicense(e.target.value)}
                    placeholder="مثال: پروانه نظارت/محاسبات پایه ۱"
                    className="w-full pr-9 pl-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent font-mono"
                  />
                </div>
              </div>
            </div>
          ) : entityType === 'vendor' ? (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  نام فروشگاه، شرکت یا دفتر فروش: <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Store className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                  <input
                    type="text"
                    required
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    placeholder="مثلاً آهن‌آلات حیدری یا بازرگانی بتن ارومیه"
                    className="w-full pr-9 pl-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  نام مسئول یا مدیر فروش:
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                  <input
                    type="text"
                    value={managerName}
                    onChange={(e) => setManagerName(e.target.value)}
                    placeholder="نام مسئول فروشگاه"
                    className="w-full pr-9 pl-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
              </div>
            </>
          ) : (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                نام و نام خانوادگی استادکار: <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="مثال: علی احمدی"
                  className="w-full pr-9 pl-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {/* Trade / Category */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {entityType === 'engineering_service'
                ? 'دسته خدمت تخصصی مهندسی:'
                : entityType === 'vendor'
                ? 'دسته کالا / تجهیزات:'
                : 'تخصص یا رسته فعالیت:'}{' '}
              <span className="text-rose-500">*</span>
            </label>
            <div className="space-y-1.5">
              <select
                value={trade}
                onChange={(e) => setTrade(e.target.value)}
                className="w-full p-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent font-medium"
              >
                {currentCategories
                  .filter((cat) => cat !== 'همه دسته‌ها')
                  .map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
              </select>
              <input
                type="text"
                value={trade}
                onChange={(e) => setTrade(e.target.value)}
                placeholder="یا عنوان تخصص را دستی وارد فرمایید"
                className="w-full p-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Phone & District */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                شماره تماس همراه: <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                <input
                  type="tel"
                  dir="ltr"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0914..."
                  className="w-full pr-9 pl-3 py-2 text-xs rounded-xl border border-slate-200 font-mono text-left focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                محله یا محدوده فعالیت در ارومیه:
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                <input
                  type="text"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  placeholder="مثال: خیابان درستکار، برق، بهداری"
                  className="w-full pr-9 pl-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Experience & Referrer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                سابقه فعالیت (سال):
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(e.target.value)}
                  className="w-full pr-9 pl-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                نام مهندس معرف * (الزامی):
              </label>
              <div className="relative">
                <Building className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                <input
                  type="text"
                  required
                  value={referrerName}
                  onChange={(e) => setReferrerName(e.target.value)}
                  placeholder="مهندس ..."
                  className="w-full pr-9 pl-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent font-medium"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              توضیحات تکمیلی یا مهارت‌ها:
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="توضیحات در مورد سوابق کاری، امکانات کارگاهی، آدرس دقیق، ساعات کاری و..."
              className="w-full p-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-1.5"
            >
              {isSaving ? (
                <span>در حال ذخیره تغییرات...</span>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>ذخیره تغییرات</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
