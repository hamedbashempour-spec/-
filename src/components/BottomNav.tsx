import React from 'react';
import {
  Building2,
  Coins,
  Briefcase,
  Store,
  Newspaper,
} from 'lucide-react';
import { ActiveTab } from '../types';

interface BottomNavProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  unreadNewsCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  setActiveTab,
  unreadNewsCount = 0,
}) => {
  // Ordered from Right to Left in RTL:
  // ۱. خانه (Rightmost)
  // ۲. تعرفه رسمی
  // ۳. پروژه های من
  // ۴. بازار (خدمات مهندسی، استادکاران، فروشندگان)
  // ۵. اخبار (Leftmost)
  const tabs = [
    {
      id: 'home' as ActiveTab,
      label: 'خانه',
      icon: Building2,
    },
    {
      id: 'tariffs' as ActiveTab,
      label: 'تعرفه رسمی',
      icon: Coins,
    },
    {
      id: 'checklists' as ActiveTab,
      label: 'پروژه های من',
      icon: Briefcase,
    },
    {
      id: 'artisans' as ActiveTab,
      label: 'بازار',
      icon: Store,
    },
    {
      id: 'news' as ActiveTab,
      label: 'اخبار',
      icon: Newspaper,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200">
      <div className="max-w-md mx-auto grid grid-cols-5 items-center h-16 px-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const isNews = tab.id === 'news';

          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`min-h-[48px] flex flex-col items-center justify-center relative transition-colors ${
                isActive
                  ? 'text-slate-900 font-semibold'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              aria-label={tab.label}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    isActive ? 'scale-110 text-amber-600' : 'text-slate-400'
                  }`}
                />
                {isNews && unreadNewsCount > 0 && (
                  <span className="absolute -top-1 -right-1.5 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                )}
              </div>
              <span
                className={`text-[10px] tracking-tight mt-1 whitespace-nowrap ${
                  isActive ? 'text-slate-900 font-bold' : 'text-slate-500'
                }`}
              >
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute bottom-1 w-6 h-0.5 rounded-full bg-slate-900" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
