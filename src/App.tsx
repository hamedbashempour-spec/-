import React, { useState, useEffect, useMemo } from 'react';
import { Lock, ShieldAlert } from 'lucide-react';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { HomeView } from './components/HomeView';
import { TariffsView } from './components/TariffsView';
import { MojrianView } from './components/MojrianView';
import { MoUsView } from './components/MoUsView';
import { NewsView } from './components/NewsView';
import { RegulationsView } from './components/RegulationsView';
import { ProjectsView } from './components/ProjectsView';
import { CalculatorsView } from './components/CalculatorsView';
import { ArtisansView } from './components/ArtisansView';
import { AnnouncementsView } from './components/AnnouncementsView';
import { AboutView } from './components/AboutView';
import { ProfileView } from './components/ProfileView';
import { AdminAnalyticsView, DraftNotificationData } from './components/AdminAnalyticsView';
import { BreakingNewsToast } from './components/BreakingNewsToast';
import { AppLoginModal } from './components/AppLoginModal';
import { ActiveTab, MojrianServerStatus, TelegramPost, AuthUser } from './types';
import { announcementsData } from './data/announcementsData';
import { trackEvent } from './utils/analytics';
import {
  registerServiceWorker,
  checkAndNotifyAdminBroadcast,
  isPushEnabled,
} from './services/notificationService';
import {
  auth,
  signInWithFirebaseCustomToken,
  signOutFromFirebase,
} from './services/firebase';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem('urmia_user_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.username && parsed?.role) {
          return parsed;
        }
      }
      return null;
    } catch {
      return null;
    }
  });

  const [sessionCheckError, setSessionCheckError] = useState<string | null>(null);
  const [sessionErrorType, setSessionErrorType] = useState<
    'invalid_credentials' | 'expired' | 'blocked' | null
  >(null);

  const [mojrianStatus, setMojrianStatus] = useState<MojrianServerStatus | null>(null);
  const [isLoadingMojrian, setIsLoadingMojrian] = useState(false);

  // Check saved session on startup to ensure validity & not expired
  useEffect(() => {
    if (currentUser) {
      fetch('/api/auth/verify-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: currentUser.username,
          eDate: currentUser.eDate,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (!data.valid) {
            try {
              localStorage.removeItem('urmia_user_session');
              localStorage.removeItem('urmia_admin_authenticated');
            } catch {}
            setCurrentUser(null);
            if (data.reason === 'blocked') {
              setSessionErrorType('blocked');
              setSessionCheckError(
                data.message ||
                  'حساب کاربری شما توسط مدیر سامانه مسدود گردیده است. جهت بررسی با انجمن تماس بگیرید.'
              );
            } else if (data.reason === 'expired') {
              setSessionErrorType('expired');
              setSessionCheckError(
                data.message ||
                  'اعتبار اشتراک شما در انجمن منقضی گردیده است. لطفاً اشتراک خود در انجمن را تمدید نمایید.'
              );
            } else {
              setSessionErrorType('invalid_credentials');
              setSessionCheckError('نشست کاربری شما پایان یافته است. لطفاً مجدداً وارد شوید.');
            }
          } else if (data.user) {
            setCurrentUser(data.user);
            if (data.firebaseCustomToken && !auth.currentUser) {
              signInWithFirebaseCustomToken(data.firebaseCustomToken).catch(() => {});
            }
          }
        })
        .catch(() => {});
    }
  }, []);

  // Security guard: Regular users can never access admin panel unless authenticated as admin
  useEffect(() => {
    const isAdminAuth =
      currentUser?.role === 'admin' ||
      localStorage.getItem('urmia_admin_authenticated') === 'true' ||
      sessionStorage.getItem('urmia_admin_authenticated') === 'true';

    if (!isAdminAuth && activeTab === 'admin') {
      setActiveTab('home');
    }
  }, [currentUser, activeTab]);

  const handleLogout = () => {
    try {
      localStorage.removeItem('urmia_user_session');
      localStorage.removeItem('urmia_admin_authenticated');
      sessionStorage.removeItem('urmia_admin_authenticated');
    } catch {}
    signOutFromFirebase().catch(() => {});
    setCurrentUser(null);
    setSessionCheckError(null);
    setSessionErrorType(null);
    setActiveTab('home');
  };

  const [news, setNews] = useState<TelegramPost[]>([]);
  const [newsLastUpdated, setNewsLastUpdated] = useState<string | null>(null);
  const [isLoadingNews, setIsLoadingNews] = useState(false);
  const [highlightedPostId, setHighlightedPostId] = useState<string | null>(null);
  const [draftNotification, setDraftNotification] = useState<DraftNotificationData | null>(null);

  const handleOpenNewsPost = (postId?: string) => {
    if (postId) {
      setHighlightedPostId(postId);
    }
    setActiveTab('news');
  };

  const handleDraftNewsNotification = (item: TelegramPost) => {
    setDraftNotification({
      title: `🚨 خبر فوری: ${item.title}`,
      body: item.text.trim(),
      linkUrl: `/?tab=news&postId=${encodeURIComponent(item.id)}`,
      postId: item.id,
      urgency: 'urgent',
    });
    setActiveTab('admin');
  };

  // Fetch server status for mojrian
  const fetchMojrianStatus = async () => {
    setIsLoadingMojrian(true);
    try {
      const res = await fetch('/api/mojrian-status');
      if (res.ok) {
        const data = await res.json();
        setMojrianStatus(data);
      }
    } catch {
      setMojrianStatus({
        success: false,
        online: false,
        statusCode: 0,
        latencyMs: 0,
        httpUrl: 'http://85.185.6.4:2480/mande_mojrian.aspx',
        httpsUrl: 'https://85.185.6.4:2480/mande_mojrian.aspx',
        provider: 'سازمان نظام مهندسی ساختمان استان آذربایجان غربی',
        checkedAt: new Date().toISOString(),
        note: 'خطا در برقراری ارتباط با پورت ۲۴۸۰',
      });
    } finally {
      setIsLoadingMojrian(false);
    }
  };

  // Fetch real telegram news & check for breaking push notifications
  const fetchNews = async () => {
    setIsLoadingNews(true);
    try {
      const res = await fetch('/api/telegram-news');
      if (res.ok) {
        const data = await res.json();
        if (data.items && Array.isArray(data.items)) {
          setNews(data.items);
          setNewsLastUpdated(data.lastUpdated || new Date().toISOString());
        }
      }
    } catch {
      // Keep previous news or empty gracefully
    } finally {
      setIsLoadingNews(false);
    }
  };

  // Sync users database on application open
  const syncUsersDatabase = async () => {
    try {
      await fetch('/api/auth/sync-users', { method: 'POST' });
    } catch {
      // Background silent sync
    }
  };

  useEffect(() => {
    // 1. Initial fetches and user sync
    syncUsersDatabase();
    fetchMojrianStatus();
    fetchNews();
    checkAndNotifyAdminBroadcast();

    // 2. Register Service Worker for Push Notifications & Background Sync if enabled
    if (isPushEnabled()) {
      registerServiceWorker();
    }

    // Check initial URL parameters for direct deep-linking to news post
    try {
      const params = new URLSearchParams(window.location.search);
      const urlPostId = params.get('postId');
      if (urlPostId) {
        setHighlightedPostId(urlPostId);
        setActiveTab('news');
      }
    } catch {}

    // 3. Listen for Service Worker click navigation
    const handleServiceWorkerMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'NAVIGATE_TAB') {
        if (event.data.postId) {
          setHighlightedPostId(event.data.postId);
        }
        setActiveTab(event.data.tab || 'news');
      }
    };
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
    }

    // 4. Custom in-app tab navigation event
    const handleCustomNavigate = (e: any) => {
      if (e.detail?.postId) {
        setHighlightedPostId(e.detail.postId);
      }
      if (e.detail?.tab) {
        setActiveTab(e.detail.tab);
      }
    };
    window.addEventListener('urmia_navigate_tab', handleCustomNavigate);

    // 5. Periodic polling for telegram news every 90 seconds
    const pollInterval = setInterval(() => {
      fetchNews();
    }, 90000);

    // 6. Check for admin broadcast notifications every 15 seconds
    const broadcastInterval = setInterval(() => {
      checkAndNotifyAdminBroadcast();
    }, 15000);

    // 7. Check for fresh data whenever user refocuses the app/tab
    const handleWindowFocus = () => {
      fetchNews();
      syncUsersDatabase();
      checkAndNotifyAdminBroadcast();
    };
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      clearInterval(pollInterval);
      clearInterval(broadcastInterval);
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
      }
      window.removeEventListener('urmia_navigate_tab', handleCustomNavigate);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, []);

  // Track page visits for admin analytics
  useEffect(() => {
    if (activeTab !== 'admin') {
      trackEvent('page_view', activeTab);
    }
  }, [activeTab]);

  // Dynamic unread news tracking (cleared when user visits news tab)
  const [unreadNewsCount, setUnreadNewsCount] = useState<number>(0);

  // Compute unread news count whenever news items or activeTab updates
  useEffect(() => {
    if (!news || news.length === 0) {
      setUnreadNewsCount(0);
      return;
    }

    // If user is currently on the news tab, mark all news as read immediately
    if (activeTab === 'news') {
      try {
        localStorage.setItem('urmia_last_seen_news_id', news[0].id);
        if (news[0].time) {
          localStorage.setItem('urmia_last_seen_news_time', news[0].time);
        }
      } catch {}
      setUnreadNewsCount(0);
      return;
    }

    try {
      const lastSeenId = localStorage.getItem('urmia_last_seen_news_id');
      const lastSeenTime = localStorage.getItem('urmia_last_seen_news_time');

      if (!lastSeenId && !lastSeenTime) {
        // First visit before opening news: show 1 unread indicator
        setUnreadNewsCount(1);
        return;
      }

      if (lastSeenId) {
        const idx = news.findIndex((item) => item.id === lastSeenId);
        if (idx > 0) {
          // Items before lastSeenId are newly published
          setUnreadNewsCount(idx);
        } else if (idx === 0) {
          // Already seen the latest post
          setUnreadNewsCount(0);
        } else if (lastSeenTime) {
          // Fallback by timestamp comparison
          const newer = news.filter(
            (item) => item.time && new Date(item.time).getTime() > new Date(lastSeenTime).getTime()
          );
          setUnreadNewsCount(newer.length);
        } else {
          setUnreadNewsCount(0);
        }
      }
    } catch {
      setUnreadNewsCount(0);
    }
  }, [news, activeTab]);

  const urgentAnnouncementsCount = announcementsData.filter((a) => a.urgent).length;

  const SECTION_NAMES: Record<string, string> = {
    tariffs: 'تعرفه رسمی',
    mojrian: 'ظرفیت اشتغال',
    mous: 'تفاهم نامه ها',
    artisans: 'بازار',
    news: 'اخبار',
    regulations: 'کتابخانه مهندسی',
    projects: 'پروژه های من',
    checklists: 'پروژه های من',
    calculators: 'متره و برآورد هوشمند',
    announcements: 'اطلاعیه های انجمن',
    about: 'درباره انجمن و تماس',
    profile: 'پروفایل کاربری',
  };

  const isCurrentTabRestricted = useMemo(() => {
    if (!currentUser || currentUser.role === 'admin') return false;
    const restricted = currentUser.restrictedSections || [];
    if (restricted.includes(activeTab)) return true;
    if (activeTab === 'checklists' && (restricted.includes('checklists') || restricted.includes('projects'))) {
      return true;
    }
    return false;
  }, [currentUser, activeTab]);

  return (
    <div className="min-h-screen text-slate-900 flex flex-col font-sans relative">
      {/* Mandatory Login Modal with Blurred Backdrop on Launch */}
      <AppLoginModal
        isOpen={!currentUser}
        initialError={sessionCheckError}
        initialErrorType={sessionErrorType}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setSessionCheckError(null);
          setSessionErrorType(null);
        }}
      />

      {/* Main App Content - Blurred if not authenticated */}
      <div
        className={`flex flex-col min-h-screen transition-all duration-300 ${
          !currentUser ? 'filter blur-md pointer-events-none select-none' : ''
        }`}
        aria-hidden={!currentUser}
      >
        {/* Real-time Breaking News Floating Alert Toast */}
        <BreakingNewsToast onOpenNews={handleOpenNewsPost} />

        {/* Top Bar Header */}
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          urgentAnnouncementsCount={urgentAnnouncementsCount}
          unreadNewsCount={unreadNewsCount}
          currentUser={currentUser}
          onLogout={handleLogout}
        />

        {/* Main Content Area */}
        <main className="flex-1 max-w-2xl w-full mx-auto px-3.5 pt-4 pb-20">
          {isCurrentTabRestricted ? (
            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-rose-200 shadow-sm text-center space-y-4 animate-fadeIn my-6 text-right">
              <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto shadow-2xs">
                <Lock className="w-8 h-8" />
              </div>
              <div className="space-y-2 max-w-md mx-auto text-center">
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  دسترسی به بخش «{SECTION_NAMES[activeTab] || activeTab}» محدود گردیده است
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  بر اساس تنظیمات اعمال‌شده توسط مدیر سامانه، امکان استفاده از این بخش برای حساب کاربری شما غیرفعال می‌باشد.
                </p>
                <p className="text-[11px] text-slate-400">
                  جهت کسب اطلاعات بیشتر یا فعال‌سازی مجدد، با مدیریت انجمن تماس حاصل فرمایید.
                </p>
              </div>
              <div className="pt-2 flex items-center justify-center">
                <button
                  onClick={() => setActiveTab('home')}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-2xs transition-colors"
                >
                  بازگشت به صفحه اصلی
                </button>
              </div>
            </div>
          ) : (
            <>
              {activeTab === 'home' && (
                <HomeView
                  setActiveTab={setActiveTab}
                  mojrianStatus={mojrianStatus}
                  latestNews={news}
                  urgentCount={urgentAnnouncementsCount}
                />
              )}

              {activeTab === 'tariffs' && <TariffsView />}

              {activeTab === 'mojrian' && (
                <MojrianView
                  serverStatus={mojrianStatus}
                  onRefreshStatus={fetchMojrianStatus}
                  isLoading={isLoadingMojrian}
                  isAdmin={currentUser?.role === 'admin'}
                  onOpenReferralMonitoring={() => setActiveTab('admin')}
                />
              )}

              {activeTab === 'mous' && <MoUsView />}

              {activeTab === 'news' && (
                <NewsView
                  news={news}
                  lastUpdated={newsLastUpdated}
                  onRefresh={fetchNews}
                  isLoading={isLoadingNews}
                  channelUrl="https://t.me/Urmia_QU_Engineers_Association"
                  isAdmin={currentUser?.role === 'admin'}
                  highlightedPostId={highlightedPostId}
                  onClearHighlight={() => setHighlightedPostId(null)}
                  onDraftNewsNotification={handleDraftNewsNotification}
                />
              )}

              {activeTab === 'regulations' && <RegulationsView />}

              {activeTab === 'checklists' && (
                <ProjectsView currentUser={currentUser} />
              )}

              {activeTab === 'calculators' && <CalculatorsView />}

              {activeTab === 'artisans' && (
                <ArtisansView isAdmin={currentUser?.role === 'admin'} currentUser={currentUser} />
              )}

              {activeTab === 'announcements' && <AnnouncementsView />}

              {activeTab === 'about' && <AboutView currentUser={currentUser} />}

              {activeTab === 'profile' && currentUser && (
                <ProfileView
                  currentUser={currentUser}
                  onUpdateUser={(updatedUser) => setCurrentUser(updatedUser)}
                  onLogout={handleLogout}
                  onNavigateBack={() => setActiveTab('home')}
                />
              )}

              {activeTab === 'admin' && currentUser?.role === 'admin' && (
                <AdminAnalyticsView
                  onLogout={handleLogout}
                  onNavigateHome={() => setActiveTab('home')}
                  draftNotification={draftNotification}
                  onClearDraftNotification={() => setDraftNotification(null)}
                />
              )}
            </>
          )}
        </main>

        {/* Mobile Fixed Bottom Navigation Bar */}
        <BottomNav
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          unreadNewsCount={unreadNewsCount}
        />
      </div>
    </div>
  );
}
