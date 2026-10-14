// Push Notifications & Breaking News Service for انجمن مجریان ذیصلاح ارومیه

import { TelegramPost } from '../types';

const STORAGE_KEY_ENABLED = 'urmia_push_notifications_enabled';
const STORAGE_KEY_INAPP_ENABLED = 'urmia_inapp_notifications_enabled';
const STORAGE_KEY_LAST_ID = 'urmia_last_notified_post_id';
const STORAGE_KEY_LAST_BROADCAST_ID = 'urmia_last_seen_broadcast_id';
const STORAGE_KEY_NOTIFIED_LIST = 'urmia_notified_posts_history';

export interface AdminBroadcastNotification {
  id: string;
  title: string;
  body: string;
  urgency: 'normal' | 'urgent';
  createdAt: string;
  sentBy: string;
  linkUrl?: string;
  postId?: string;
}

// In-app alert enabled state (defaults to true)
export const isInAppAlertEnabled = (): boolean => {
  if (typeof window === 'undefined') return true;
  const val = localStorage.getItem(STORAGE_KEY_INAPP_ENABLED);
  return val === null ? true : val === 'true';
};

export const setInAppAlertEnabled = (enabled: boolean) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_INAPP_ENABLED, enabled ? 'true' : 'false');
};

// Play clean native notification audio chime via Web Audio API (Zero external assets needed)
export const playNotificationChime = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    const now = ctx.currentTime;
    // Pleasant two-tone chime (E5 -> G#5 -> B5)
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(659.25, now); // E5
    osc.frequency.setValueAtTime(830.61, now + 0.12); // G#5
    osc.frequency.setValueAtTime(987.77, now + 0.24); // B5

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.exponentialRampToValueAtTime(0.3, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.65);
  } catch {
    // Audio context may be restricted by browser policy before user interaction
  }
};

export const isNotificationSupported = (): boolean => {
  return typeof window !== 'undefined' && 'Notification' in window;
};

export const getNotificationPermission = (): NotificationPermission => {
  if (!isNotificationSupported()) return 'denied';
  return Notification.permission;
};

export const isPushEnabled = (): boolean => {
  if (!isNotificationSupported()) return false;
  if (Notification.permission === 'granted') {
    if (localStorage.getItem(STORAGE_KEY_ENABLED) !== 'true') {
      try {
        localStorage.setItem(STORAGE_KEY_ENABLED, 'true');
      } catch {}
    }
    return true;
  }
  return false;
};

// Helper to convert base64 VAPID public key to Uint8Array for browser PushManager
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Sync device push token with self-hosted / vendor-neutral server
export const syncPushSubscriptionWithServer = async (
  reg?: ServiceWorkerRegistration | null
): Promise<boolean> => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return false;
  if (!('PushManager' in window)) return false;
  if (Notification.permission !== 'granted') return false;

  try {
    const swReg = reg || (await navigator.serviceWorker.ready);
    if (!swReg || !swReg.pushManager) return false;

    // 1. Get VAPID public key from backend
    const keyRes = await fetch('/api/push/vapid-public-key');
    if (!keyRes.ok) return false;
    const { publicKey } = await keyRes.json();
    if (!publicKey) return false;

    const applicationServerKey = urlBase64ToUint8Array(publicKey);

    // 2. Check existing subscription or subscribe
    let subscription = await swReg.pushManager.getSubscription();
    if (!subscription) {
      subscription = await swReg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });
    }

    // 3. Send subscription to our server
    await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscription: subscription.toJSON ? subscription.toJSON() : subscription,
        userAgent: navigator.userAgent,
      }),
    });

    console.log('[WebPush] Device subscription successfully registered with backend.');
    return true;
  } catch (err) {
    console.warn('[WebPush] Failed to sync push subscription with server:', err);
    return false;
  }
};

// Register Service Worker and return registration
export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const reg = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    // Auto sync push subscription if permission granted
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      syncPushSubscriptionWithServer(reg).catch(() => {});
    }

    return reg;
  } catch (err) {
    console.warn('Service Worker registration skipped or failed:', err);
    return null;
  }
};

// Request push notification permission
export const requestPushPermission = async (): Promise<boolean> => {
  if (!isNotificationSupported()) {
    alert('مرورگر شما از اعلان‌های سیستمی (Push Notifications) پشتیبانی نمی‌کند.');
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      localStorage.setItem(STORAGE_KEY_ENABLED, 'true');
      const swReg = await registerServiceWorker();
      await syncPushSubscriptionWithServer(swReg);

      // Send a confirmation welcome notification
      await showPushNotification({
        title: '🔔 اعلان‌های فوری فعال شد',
        body: 'از این پس مهم‌ترین اخبار، بخشنامه‌ها و اطلاعیه‌های رسمی کانال تلگرام انجمن مجریان ارومیه به صورت اعلان فوری برای شما ارسال خواهد شد.',
        tag: 'welcome-notification',
      });

      return true;
    } else {
      localStorage.setItem(STORAGE_KEY_ENABLED, 'false');
      return false;
    }
  } catch (err) {
    console.error('Error requesting notification permission:', err);
    return false;
  }
};

// Disable push notifications
export const disablePushNotifications = async () => {
  localStorage.setItem(STORAGE_KEY_ENABLED, 'false');
  try {
    if ('serviceWorker' in navigator) {
      const swReg = await navigator.serviceWorker.ready;
      const sub = await swReg.pushManager.getSubscription();
      if (sub) {
        await fetch('/api/push/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
    }
  } catch (err) {
    console.warn('Error unsubscribing push:', err);
  }
};

// Options interface for notifications
export interface PushNotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  vibrate?: number[];
}

// Show native push notification through Service Worker or Notification API fallback
export const showPushNotification = async (options: PushNotificationOptions) => {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return;
  }

  playNotificationChime();

  const title = options.title;
  const notificationOptions = {
    body: options.body,
    icon: options.icon || '/pwa-192x192.png',
    badge: options.badge || '/pwa-192x192.png',
    tag: options.tag || `urmia-news-${Date.now()}`,
    dir: 'rtl' as NotificationDirection,
    lang: 'fa-IR',
    renotify: true,
    requireInteraction: true,
    data: options.data || { url: '/?tab=news' },
  };

  // Try service worker first for background capability
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready;
      if (reg && 'showNotification' in reg) {
        await reg.showNotification(title, notificationOptions as any);
        return;
      }
    } catch {
      // Fall through to standard Notification
    }
  }

  // Fallback to standard window Notification
  try {
    const n = new Notification(title, notificationOptions);
    n.onclick = () => {
      window.focus();
      n.close();
      window.dispatchEvent(
        new CustomEvent('urmia_navigate_tab', {
          detail: { tab: 'news', postId: options.data?.postId },
        })
      );
    };
  } catch (e) {
    console.warn('Fallback notification error:', e);
  }
};

// Check for newly published Telegram news (Disabled automatic push per user request - only manual admin broadcasts are pushed)
export const checkAndNotifyNewTelegramPost = async (_posts: TelegramPost[]) => {
  // Intentionally disabled: user explicitly requested "نمیخوام هر خبری اعلانش بره میخوام تو پنل مدیریت قسمتی برای ارسال اعلان ایجاد بشه"
  return;
};

// Check for newly broadcasted notifications from Admin Panel
export const checkAndNotifyAdminBroadcast = async () => {
  if (typeof window === 'undefined') return;
  try {
    const res = await fetch('/api/notifications');
    if (!res.ok) return;
    const data = await res.json();
    if (!data.success || !Array.isArray(data.items) || data.items.length === 0) return;

    const newest = data.items[0] as AdminBroadcastNotification;
    if (!newest || !newest.id) return;

    const lastSeenId = localStorage.getItem(STORAGE_KEY_LAST_BROADCAST_ID);

    if (!lastSeenId) {
      // First time running, record current latest broadcast
      localStorage.setItem(STORAGE_KEY_LAST_BROADCAST_ID, newest.id);
      return;
    }

    if (newest.id !== lastSeenId) {
      localStorage.setItem(STORAGE_KEY_LAST_BROADCAST_ID, newest.id);

      const title = newest.urgency === 'urgent'
        ? `🚨 ${newest.title}`
        : `🔔 ${newest.title}`;

      const targetPostId = newest.postId || newest.id;

      // 1. Native push if permitted
      if (isPushEnabled()) {
        await showPushNotification({
          title,
          body: newest.body,
          tag: newest.id,
          data: {
            url: newest.linkUrl || `/?tab=news&postId=${targetPostId}`,
            tab: 'news',
            postId: targetPostId,
          },
        });
      }

      // 2. In-app alert if enabled
      if (isInAppAlertEnabled()) {
        playNotificationChime();
        window.dispatchEvent(
          new CustomEvent('urmia_breaking_news_alert', {
            detail: {
              id: targetPostId,
              postId: targetPostId,
              post: targetPostId,
              title: newest.title,
              text: newest.body,
              photo: null,
              time: newest.createdAt,
              timeDisplay: 'هم‌اکنون',
              telegramUrl: newest.linkUrl || '',
            },
          })
        );
      }
    }
  } catch (err) {
    // silent catch
  }
};

// Send a test in-app alert (works in all environments, even when OS push is denied)
export const sendTestInAppAlert = (customPost?: Partial<TelegramPost>) => {
  playNotificationChime();
  const testPost: TelegramPost = {
    id: `test-${Date.now()}`,
    post: 'test',
    title: customPost?.title || 'اعلان تستی درون‌برنامه‌ای: سیستم اطلاع‌رسانی فعال است',
    text: customPost?.text || 'اطلاعیه‌ها، بخشنامه‌ها و تغییرات به محض باز بودن برنامه با صدای زنگ و بنر نمایش داده می‌شوند.',
    photo: null,
    time: new Date().toISOString(),
    timeDisplay: 'هم‌اکنون',
    telegramUrl: 'https://t.me/Urmia_QU_Engineers_Association',
    ...customPost,
  };

  window.dispatchEvent(
    new CustomEvent('urmia_breaking_news_alert', {
      detail: testPost,
    })
  );
  return true;
};

// Send a test breaking news push notification
export const sendTestPushNotification = async (): Promise<boolean> => {
  if (!isNotificationSupported()) {
    // Fallback to in-app alert
    sendTestInAppAlert();
    return true;
  }

  if (Notification.permission !== 'granted') {
    const granted = await requestPushPermission();
    if (!granted) {
      // Fallback to in-app test
      sendTestInAppAlert({
        title: 'اعلان تستی درون‌برنامه‌ای (مجوز سیستم مسدود است)',
      });
      return false;
    }
  }

  await showPushNotification({
    title: '🚨 تست اعلان فوری: کانال تلگرام مجریان ارومیه',
    body: 'سیستم اعلان‌های فشاری فعال است. آخرین مصوبات، تعرفه‌ها و اطلاعیه‌های فوری در کمترین زمان به اطلاع شما خواهد رسید.',
    tag: 'test-push-notification',
    data: { url: '/?tab=news' },
  });

  return true;
};
