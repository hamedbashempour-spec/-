import React from 'react';
import { Shield, Sparkles } from 'lucide-react';

export interface UserTagInfo {
  id: string;
  label: string;
  isGolden: boolean;
  badgeClass: string;
  iconText?: string;
  sublabel?: string;
}

export const USER_TAG_PRESETS: { id: string; label: string; icon: string; isGolden?: boolean }[] = [
  { id: 'ceo', label: 'مدیرعامل انجمن', icon: '👑', isGolden: true },
  { id: 'board', label: 'هیات مدیره انجمن', icon: '🏛️' },
  { id: 'inspector', label: 'بازرس انجمن', icon: '🔍' },
  { id: 'treasurer', label: 'خزانه‌دار انجمن', icon: '💼' },
  { id: 'secretary', label: 'دبیر انجمن', icon: '📝' },
  { id: 'admin', label: 'مدیر سامانه', icon: '🛡️' },
  { id: 'member', label: 'مهندس عضو انجمن', icon: '👷' },
];

export function getUserTagDetails(tag?: string, role?: 'admin' | 'user'): UserTagInfo {
  const cleanTag = (tag || '').trim();
  const lowerTag = cleanTag.toLowerCase();

  // 1. CEO / مدیرعامل -> Golden Tag (تگ طلایی)
  if (
    lowerTag === 'ceo' ||
    lowerTag === 'مدیرعامل' ||
    lowerTag === 'مدیرعامل انجمن' ||
    cleanTag.includes('مدیرعامل')
  ) {
    return {
      id: 'ceo',
      label: cleanTag.includes('مدیرعامل') && cleanTag.length > 8 ? cleanTag : 'مدیرعامل انجمن',
      isGolden: true,
      badgeClass:
        'bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-amber-950 border border-amber-300 shadow-xs font-black ring-1 ring-amber-400/50',
      iconText: '👑',
      sublabel: 'تگ طلایی مدیرعامل',
    };
  }

  // 2. Board of Directors / هیات مدیره
  if (
    lowerTag === 'board' ||
    lowerTag === 'هیات مدیره' ||
    lowerTag === 'هیات مدیره انجمن' ||
    cleanTag.includes('هیات مدیره') ||
    cleanTag.includes('هیئت مدیره')
  ) {
    return {
      id: 'board',
      label: cleanTag.includes('مدیره') ? cleanTag : 'هیات مدیره انجمن',
      isGolden: false,
      badgeClass:
        'bg-gradient-to-r from-indigo-50 to-indigo-100 text-indigo-900 border border-indigo-300 shadow-2xs font-extrabold ring-1 ring-indigo-200/60',
      iconText: '🏛️',
      sublabel: 'عضو هیات مدیره',
    };
  }

  // 3. Inspector / بازرس
  if (lowerTag === 'inspector' || cleanTag.includes('بازرس')) {
    return {
      id: 'inspector',
      label: cleanTag.includes('بازرس') ? cleanTag : 'بازرس انجمن',
      isGolden: false,
      badgeClass: 'bg-teal-50 text-teal-900 border border-teal-300 font-bold',
      iconText: '🔍',
    };
  }

  // 4. Treasurer / خزانه‌دار
  if (lowerTag === 'treasurer' || cleanTag.includes('خزانه')) {
    return {
      id: 'treasurer',
      label: cleanTag.includes('خزانه') ? cleanTag : 'خزانه‌دار انجمن',
      isGolden: false,
      badgeClass: 'bg-emerald-50 text-emerald-900 border border-emerald-300 font-bold',
      iconText: '💼',
    };
  }

  // 5. Secretary / دبیر
  if (lowerTag === 'secretary' || cleanTag.includes('دبیر')) {
    return {
      id: 'secretary',
      label: cleanTag.includes('دبیر') ? cleanTag : 'دبیر انجمن',
      isGolden: false,
      badgeClass: 'bg-sky-50 text-sky-900 border border-sky-300 font-bold',
      iconText: '📝',
    };
  }

  // 6. Admin / مدیر سیستم
  if (lowerTag === 'admin' || (role === 'admin' && (!cleanTag || lowerTag === 'member'))) {
    return {
      id: 'admin',
      label: cleanTag.includes('مدیر') ? cleanTag : 'مدیر سامانه',
      isGolden: false,
      badgeClass: 'bg-amber-100 text-amber-900 border border-amber-300 font-bold',
      iconText: '🛡️',
    };
  }

  // 7. Custom tag provided by admin
  if (cleanTag && cleanTag !== 'member' && cleanTag !== 'user' && cleanTag !== 'کاربر عادی') {
    return {
      id: 'custom',
      label: cleanTag,
      isGolden: false,
      badgeClass: 'bg-purple-50 text-purple-900 border border-purple-300 font-bold',
      iconText: '🏷️',
    };
  }

  // 8. Normal Member / مهندس عضو
  return {
    id: 'member',
    label: 'مهندس عضو انجمن',
    isGolden: false,
    badgeClass: 'bg-slate-100 text-slate-700 border border-slate-200 font-bold',
    iconText: '👷',
  };
}

interface UserTagBadgeProps {
  tag?: string;
  role?: 'admin' | 'user';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export const UserTagBadge: React.FC<UserTagBadgeProps> = ({
  tag,
  role,
  size = 'sm',
  showIcon = true,
  className = '',
}) => {
  const details = getUserTagDetails(tag, role);

  const sizeClasses = {
    xs: 'text-[9px] px-1.5 py-0.2 rounded-md gap-1 leading-normal',
    sm: 'text-[10px] px-2 py-0.5 rounded-lg gap-1.2 leading-normal',
    md: 'text-xs px-2.5 py-1 rounded-xl gap-1.5 leading-normal',
    lg: 'text-sm px-3.5 py-1.5 rounded-2xl gap-2 leading-relaxed',
  };

  return (
    <span
      className={`inline-flex items-center select-none transition-all ${
        sizeClasses[size]
      } ${details.badgeClass} ${className}`}
      title={details.label}
    >
      {showIcon && details.iconText && (
        <span className="shrink-0 text-xs sm:text-sm leading-none" role="img" aria-hidden="true">
          {details.iconText}
        </span>
      )}
      <span className="truncate">{details.label}</span>
      {details.isGolden && (
        <Sparkles className="w-3 h-3 text-amber-800 shrink-0 animate-pulse ml-0.5" />
      )}
    </span>
  );
};
