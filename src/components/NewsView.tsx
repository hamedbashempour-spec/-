import React, { useState, useEffect, useMemo } from 'react';
import {
  Send,
  RefreshCw,
  ExternalLink,
  Search,
  Calendar,
  Clock,
  Image as ImageIcon,
  Share2,
  ChevronDown,
  AlertCircle,
  MessageCircle,
  Bell,
  BellRing,
  BellOff,
  Check,
  Sparkles,
  Volume2,
  HelpCircle,
  Smartphone,
  ShieldAlert,
} from 'lucide-react';
import { TelegramPost } from '../types';
import { formatIsoToPersianDate, formatIsoToPersianTime } from '../utils/formatters';
import {
  isPushEnabled,
  getNotificationPermission,
  requestPushPermission,
  disablePushNotifications,
  sendTestPushNotification,
  isNotificationSupported,
  isInAppAlertEnabled,
  setInAppAlertEnabled,
  sendTestInAppAlert,
  playNotificationChime,
  showPushNotification,
} from '../services/notificationService';
import { NotificationGuideModal } from './NotificationGuideModal';

interface NewsViewProps {
  news: TelegramPost[];
  lastUpdated: string | null;
  onRefresh: () => Promise<void>;
  isLoading: boolean;
  channelUrl: string;
  isAdmin?: boolean;
  highlightedPostId?: string | null;
  onClearHighlight?: () => void;
  onDraftNewsNotification?: (newsItem: TelegramPost) => void;
}

export const NewsView: React.FC<NewsViewProps> = ({
  news,
  lastUpdated,
  onRefresh,
  isLoading,
  channelUrl,
  isAdmin = false,
  highlightedPostId = null,
  onClearHighlight,
  onDraftNewsNotification,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [broadcastingPostId, setBroadcastingPostId] = useState<string | null>(null);
  const [adminBroadcastToast, setAdminBroadcastToast] = useState<string | null>(null);

  // Fallback to checking session if isAdmin prop wasn't passed or user refreshed
  const effectiveIsAdmin = useMemo(() => {
    if (isAdmin) return true;
    try {
      const saved = localStorage.getItem('urmia_user_session');
      if (saved) {
        const u = JSON.parse(saved);
        return u?.role === 'admin' || u?.username === 'hmdhmp' || u?.username === 'admin';
      }
    } catch {}
    return false;
  }, [isAdmin]);

  // Push notifications state
  const [pushActive, setPushActive] = useState<boolean>(() => isPushEnabled());
  const [permission, setPermission] = useState<NotificationPermission>(() =>
    getNotificationPermission()
  );
  const [isRequestingPush, setIsRequestingPush] = useState(false);
  const [testNotificationSent, setTestNotificationSent] = useState(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  const [inAppAlertActive, setInAppAlertActive] = useState<boolean>(() => isInAppAlertEnabled());

  useEffect(() => {
    setPushActive(isPushEnabled());
    setPermission(getNotificationPermission());
  }, []);

  // Mark current news items as seen/read in localStorage when viewing news
  useEffect(() => {
    if (news && news.length > 0) {
      try {
        localStorage.setItem('urmia_last_seen_news_id', news[0].id);
        if (news[0].time) {
          localStorage.setItem('urmia_last_seen_news_time', news[0].time);
        }
      } catch {}
    }
  }, [news]);

  // When navigated to with a specific breaking news post, expand it and scroll it into view
  useEffect(() => {
    if (highlightedPostId) {
      setExpandedId(highlightedPostId);
      const timer = setTimeout(() => {
        const el = document.getElementById(`news-post-${highlightedPostId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [highlightedPostId, news]);

  const handleTogglePush = async () => {
    if (pushActive) {
      disablePushNotifications();
      setPushActive(false);
    } else {
      const currentPerm = getNotificationPermission();
      if (currentPerm === 'denied') {
        setIsGuideModalOpen(true);
        return;
      }
      setIsRequestingPush(true);
      const granted = await requestPushPermission();
      setIsRequestingPush(false);
      const updatedPerm = getNotificationPermission();
      setPermission(updatedPerm);
      setPushActive(granted);
      if (!granted && updatedPerm === 'denied') {
        setIsGuideModalOpen(true);
      }
    }
  };

  const handleTestNotification = async () => {
    const success = await sendTestPushNotification();
    if (success) {
      setPushActive(true);
      setPermission(getNotificationPermission());
      setTestNotificationSent(true);
      setTimeout(() => setTestNotificationSent(false), 3500);
    }
  };

  const handleTestInApp = () => {
    sendTestInAppAlert({
      title: '🚨 تست اعلان فوری: کانال تلگرام مجریان ارومیه',
      text: 'سیستم اعلان درون‌برنامه‌ای فعال است. پیام‌ها به محض باز بودن برنامه با صدای زنگ و بنر اطلاع‌رسانی می‌شوند.',
    });
    setTestNotificationSent(true);
    setTimeout(() => setTestNotificationSent(false), 3500);
  };

  const handleBroadcastNewsAsUrgent = async (item: TelegramPost) => {
    if (!isAdmin) return;

    // Direct routing to Admin Notification Composer with pre-filled content
    if (onDraftNewsNotification) {
      onDraftNewsNotification(item);
      return;
    }

    if (
      !confirm(
        `آیا از ارسال این خبر به عنوان «خبر فوری» برای کلیه کاربران اطمینان دارید؟\n\n«${item.title}»`
      )
    ) {
      return;
    }

    setBroadcastingPostId(item.id);
    try {
      const res = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `🚨 خبر فوری: ${item.title}`,
          body: item.text.length > 220 ? item.text.substring(0, 217) + '...' : item.text,
          urgency: 'urgent',
          linkUrl: `/?tab=news&postId=${encodeURIComponent(item.id)}`,
          postId: item.id,
          sentBy: 'مدیریت انجمن',
        }),
      });

      const data = await res.json();
      if (data.success) {
        playNotificationChime();

        // 1. In-app Alert Toast
        window.dispatchEvent(
          new CustomEvent('urmia_breaking_news_alert', {
            detail: {
              id: item.id,
              postId: item.id,
              post: item.id,
              title: `🚨 خبر فوری: ${item.title}`,
              text: item.text,
              photo: item.photo,
              timeDisplay: 'هم‌اکنون',
              telegramUrl: item.telegramUrl,
            },
          })
        );

        // 2. OS / System native push notification
        if (isPushEnabled()) {
          showPushNotification({
            title: `🚨 خبر فوری: ${item.title}`,
            body: item.text.length > 150 ? item.text.substring(0, 147) + '...' : item.text,
            tag: `news-${item.id}`,
            data: {
              url: `/?tab=news&postId=${encodeURIComponent(item.id)}`,
              postId: item.id,
              tab: 'news',
            },
          }).catch(() => {});
        }

        setAdminBroadcastToast(
          `خبر «${item.title.substring(0, 45)}...» با موفقیت به عنوان خبر فوری برای کلیه کاربران ارسال شد.`
        );
        setTimeout(() => setAdminBroadcastToast(null), 5000);
      } else {
        alert(data.error || 'خطا در ارسال اعلان');
      }
    } catch {
      alert('خطا در برقراری ارتباط با سرور.');
    } finally {
      setBroadcastingPostId(null);
    }
  };

  const filteredNews = news.filter((item) => {
    if (!searchQuery.trim()) return true;
    return (
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.text.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const handleShare = async (item: TelegramPost) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: item.title,
          text: item.text.substring(0, 140) + '...',
          url: item.telegramUrl,
        });
      } catch {
        // user cancelled
      }
    } else {
      navigator.clipboard.writeText(item.telegramUrl);
      alert('پیوند تلگرام خبر کپی شد.');
    }
  };

  return (
    <div className="space-y-4 pb-12 animate-fadeIn text-right">
      {/* Top Bar & Title */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200">
              بخش ۲
            </span>
            <h1 className="text-base font-bold text-slate-900">
              اخبار و اطلاعیه‌های رسمی انجمن
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            بازتاب مستقیم و لحظه‌ای آخرین مطالب کانال تلگرام انجمن ارومیه
          </p>
        </div>

        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs disabled:opacity-50"
          title="به‌روزرسانی اخبار"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 text-slate-500 ${
              isLoading ? 'animate-spin' : ''
            }`}
          />
          <span>به‌روزرسانی</span>
        </button>
      </div>

      {/* Official Channel Card Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-600 to-sky-700 text-white shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
            <Send className="w-6 h-6 text-white" />
          </div>
          <div className="text-right">
            <h2 className="text-xs font-bold text-white">
              کانال رسمی انجمن در تلگرام
            </h2>
            <p className="text-[11px] text-sky-100 font-mono" dir="ltr">
              @Urmia_QU_Engineers_Association
            </p>
          </div>
        </div>

        <a
          href={channelUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white hover:bg-sky-50 text-sky-800 font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95"
        >
          <span>ورود به کانال انجمن</span>
          <ExternalLink className="w-4 h-4 text-sky-600" />
        </a>
      </div>

      {/* Admin Broadcast Feedback Toast */}
      {adminBroadcastToast && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border-2 border-emerald-400 text-emerald-950 text-xs font-bold flex items-center justify-between gap-2 shadow-sm animate-fadeIn">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{adminBroadcastToast}</span>
          </div>
          <button
            onClick={() => setAdminBroadcastToast(null)}
            className="text-emerald-700 hover:text-emerald-950 font-bold px-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Push Notifications Activation Bar (Only shown when notifications are NOT yet active) */}
      {!pushActive && (
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 w-full md:w-auto">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors shrink-0 bg-slate-100 text-slate-500">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-slate-900">
                  اعلان‌های فوری اخبار و بخشنامه‌ها
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  غیرفعال
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                اطلاع‌رسانی فوری آخرین بخشنامه‌ها و تغییرات تعرفه کانال تلگرام
              </p>
            </div>
          </div>

          {/* Action Buttons in the corner: Guide Modal Button, Test & Toggle */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-wrap">
            <button
              onClick={() => setIsGuideModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 text-xs font-bold transition-all active:scale-95 shadow-2xs"
              title="مشاهده راهنمای فعال‌سازی اعلان‌ها در موبایل و وب‌اپلیکیشن"
            >
              <HelpCircle className="w-3.5 h-3.5 text-sky-600" />
              <span>راهنمای دریافت اعلان‌های فوری</span>
            </button>

            <button
              onClick={handleTogglePush}
              disabled={isRequestingPush}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-2xs transition-all bg-sky-600 hover:bg-sky-700 text-white active:scale-95"
            >
              {isRequestingPush ? (
                <span>در حال فعال‌سازی...</span>
              ) : (
                <>
                  <Bell className="w-3.5 h-3.5" />
                  <span>فعال‌سازی</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Last Updated Timestamp & Status */}
      <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>منبع: کانال تلگرام انجمن سازندگان ارومیه (بدون داده ساختگی)</span>
        </div>
        {lastUpdated && (
          <span className="font-mono text-slate-400">
            به‌روزرسانی: {new Date(lastUpdated).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>

      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="جستجو در متن و عناوین اخبار..."
          className="w-full h-11 pr-10 pl-4 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/10 focus:border-sky-300 shadow-2xs"
        />
        <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute left-3 top-3 text-[11px] text-slate-400 hover:text-slate-700"
          >
            پاک کردن
          </button>
        )}
      </div>

      {/* News Posts List */}
      {filteredNews.length === 0 ? (
        <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-xs font-bold text-slate-800">
            {isLoading
              ? 'در حال دریافت آخرین اخبار از کانال تلگرام...'
              : 'خبری مطابق جستجو یافت نشد'}
          </h3>
          <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
            می‌توانید برای مشاهده مستقیم کلیه اخبار و فایل‌های پیوست، به کانال رسمی تلگرام انجمن مراجعه نمایید.
          </p>
          <a
            href={channelUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-500 text-white font-medium text-xs hover:bg-sky-600 transition-colors"
          >
            <Send className="w-4 h-4" />
            <span>مشاهده در تلگرام</span>
          </a>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNews.map((item) => {
            const isExpanded = expandedId === item.id;
            const hasLongText = item.text.length > 220;
            const isHighlighted = highlightedPostId === item.id;

            return (
              <article
                key={item.id}
                id={`news-post-${item.id}`}
                className={`p-4 rounded-2xl bg-white border transition-all duration-300 space-y-3 text-right scroll-mt-20 ${
                  isHighlighted
                    ? 'border-amber-500 ring-4 ring-amber-400/40 shadow-xl bg-amber-50/15'
                    : 'border-slate-200 shadow-2xs hover:shadow-xs'
                }`}
              >
                {/* Breaking News Notification Highlight Banner */}
                {isHighlighted && (
                  <div className="p-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold text-xs flex items-center justify-between shadow-xs">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-600 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600"></span>
                      </span>
                      <span>خبر فوری ارسالی به کاربران (باز شده از اعلان)</span>
                    </div>
                    {onClearHighlight && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onClearHighlight();
                        }}
                        className="text-[10px] bg-slate-950 text-white px-2 py-0.5 rounded-md hover:bg-slate-800 transition-colors"
                      >
                        بستن هایلایت
                      </button>
                    )}
                  </div>
                )}

                {/* Post Header: Date and Telegram badge */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded text-[10px]">
                      کانال رسمی
                    </span>
                    <span className="flex items-center gap-1 text-slate-500">
                      <Clock className="w-3 h-3" />
                      {item.time ? formatIsoToPersianTime(item.time) : item.timeDisplay}
                    </span>
                  </div>

                  <span className="text-[10px] text-slate-400 font-mono">
                    {item.time ? formatIsoToPersianDate(item.time) : ''}
                  </span>
                </div>

                {/* Optional Photo */}
                {item.photo && (
                  <div
                    className="relative w-full h-48 sm:h-64 rounded-xl overflow-hidden bg-slate-100 cursor-pointer border border-slate-200 group"
                    onClick={() => setSelectedPhoto(item.photo)}
                  >
                    <img
                      src={`/api/proxy-image?url=${encodeURIComponent(item.photo)}`}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                      loading="lazy"
                      onError={(e) => {
                        // fallback to direct link
                        (e.target as HTMLImageElement).src = item.photo!;
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                      <span className="text-[11px] text-white font-medium bg-black/60 px-2 py-1 rounded">
                        مشاهده تصویر بزرگ‌تر
                      </span>
                    </div>
                  </div>
                )}

                {/* Title */}
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                  {item.title}
                </h3>

                {/* Body Text */}
                <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-line font-normal">
                  {isExpanded || !hasLongText
                    ? item.text
                    : item.text.substring(0, 220) + '...'}
                </div>

                {hasLongText && (
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : item.id)}
                    className="text-[11px] font-bold text-sky-700 hover:text-sky-900 transition-colors"
                  >
                    {isExpanded ? 'بستن متن کامل' : 'ادامه مطلب...'}
                  </button>
                )}

                {/* Actions Bar */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs flex-wrap gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <a
                      href={item.telegramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-50 text-sky-700 font-semibold text-[11px] hover:bg-sky-100 transition-colors"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>مشاهده خبر اصلی در تلگرام</span>
                    </a>

                    {effectiveIsAdmin && (
                      <button
                        onClick={() => handleBroadcastNewsAsUrgent(item)}
                        disabled={broadcastingPostId === item.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:opacity-50 text-slate-950 font-bold text-[11px] shadow-sm transition-all active:scale-95"
                        title="تنظیم و نگارش پیام اعلان فوری در پنل مدیریت برای این خبر"
                      >
                        <Bell className="w-3.5 h-3.5 text-slate-950" />
                        <span>ارسال خبر فوری به کاربران</span>
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => handleShare(item)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                    title="اشتراک‌گذاری"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Photo Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative max-w-2xl max-h-[85vh] overflow-hidden rounded-2xl bg-black">
            <img
              src={`/api/proxy-image?url=${encodeURIComponent(selectedPhoto)}`}
              alt="عکس پیوست خبر"
              className="w-full h-full object-contain"
            />
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-3 left-3 bg-black/70 text-white px-3 py-1 rounded-lg text-xs"
            >
              بستن
            </button>
          </div>
        </div>
      )}

      {/* Web App Notification Activation Guide Modal */}
      <NotificationGuideModal
        isOpen={isGuideModalOpen}
        onClose={() => setIsGuideModalOpen(false)}
        onStatusChanged={(newPerm, active) => {
          setPermission(newPerm);
          setPushActive(active);
        }}
      />
    </div>
  );
};
