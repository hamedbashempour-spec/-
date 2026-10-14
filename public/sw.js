// Service Worker for انجمن مجریان ذیصلاح ارومیه
// Handles Push Notifications, Offline Caching & Background Events

const CACHE_NAME = 'urmia-mojrian-v1.4';
const OFFLINE_URLS = ['/', '/index.html', '/manifest.json', '/pwa-192x192.png'];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(OFFLINE_URLS).catch(() => {});
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    ).then(() => self.clients.claim())
  );
});

// Push Event: Triggered by server push or web push service
self.addEventListener('push', (event) => {
  let data = {
    title: '📢 خبر فوری انجمن مجریان ذیصلاح ارومیه',
    body: 'اطلاعیه مهم جدیدی در کانال تلگرام منتشر گردید.',
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    tag: 'telegram-news',
    data: {
      url: '/?tab=news',
      timestamp: Date.now(),
    },
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      data = { ...data, ...payload };
    } catch {
      data.body = event.data.text() || data.body;
    }
  }

  const targetUrl = data.url || data.data?.url || '/?tab=news';
  const targetPostId = data.postId || data.data?.postId;

  const options = {
    body: data.body,
    icon: data.icon || '/pwa-192x192.png',
    badge: data.badge || '/pwa-192x192.png',
    dir: 'rtl',
    lang: 'fa-IR',
    vibrate: [200, 100, 200, 100, 300],
    tag: data.tag || `urmia-breaking-${Date.now()}`,
    renotify: true,
    requireInteraction: true,
    data: {
      url: targetUrl,
      postId: targetPostId,
    },
    actions: [
      { action: 'open_news', title: 'مشاهده خبر فوری' },
      { action: 'close', title: 'بستن' },
    ],
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Notification Click Event: Focus or open window
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const targetUrl = event.notification.data?.url || '/?tab=news';
  const postId = event.notification.data?.postId;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.postMessage({
            type: 'NAVIGATE_TAB',
            tab: 'news',
            postId: postId,
            url: targetUrl,
          });
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

// Message Listener from Client App to trigger local push notification via service worker
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, body, icon, data, tag } = event.data;
    self.registration.showNotification(title || '📢 خبر فوری انجمن مجریان ارومیه', {
      body: body || 'اطلاعیه مهم جدید در کانال تلگرام منتشر شد.',
      icon: icon || '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      dir: 'rtl',
      lang: 'fa-IR',
      vibrate: [200, 100, 200],
      tag: tag || 'breaking-news',
      renotify: true,
      requireInteraction: true,
      data: data || { url: '/?tab=news' },
      actions: [
        { action: 'open_news', title: 'مشاهده خبر' },
        { action: 'close', title: 'متوجه شدم' },
      ],
    });
  }
});
