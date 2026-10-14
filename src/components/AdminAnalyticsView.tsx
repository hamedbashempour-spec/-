import React, { useState, useEffect, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  ShieldCheck,
  Users,
  Eye,
  Calculator,
  FileText,
  LogOut,
  RefreshCw,
  CheckCircle,
  Clock,
  Sparkles,
  Trash2,
  AlertTriangle,
  FileSpreadsheet,
  Upload,
  Download,
  Database,
  Key,
  Plus,
  UserCheck,
  Bell,
  Send,
  Volume2,
  AlertCircle,
  ExternalLink,
  Activity,
  Radio,
  HelpCircle,
  Shield,
  CheckCircle2,
  MessageSquare,
  Edit3,
  Phone,
  Copy,
  Check,
  EyeOff,
} from 'lucide-react';
import {
  toPersianDigits,
  formatPersianNumber,
  formatIsoToPersianDate,
  formatIsoToPersianTime,
} from '../utils/formatters';
import { EditArtisanModal } from './EditArtisanModal';
import { EditUserModal } from './EditUserModal';
import { UserTagBadge, USER_TAG_PRESETS } from './UserTagBadge';
import {
  fetchArtisans,
  approveArtisan,
  deleteArtisan,
} from '../services/artisansFirestore';
import { ArtisanItem, MojrianServerStatus } from '../types';
import {
  playNotificationChime,
  isPushEnabled,
  showPushNotification,
} from '../services/notificationService';

export interface DraftNotificationData {
  title: string;
  body: string;
  linkUrl?: string;
  postId?: string;
  urgency?: 'normal' | 'urgent';
}

interface AdminAnalyticsViewProps {
  onLogout: () => void;
  onNavigateHome: () => void;
  draftNotification?: DraftNotificationData | null;
  onClearDraftNotification?: () => void;
}

interface StoredNotification {
  id: string;
  title: string;
  body: string;
  urgency: 'normal' | 'urgent';
  createdAt: string;
  sentBy: string;
  linkUrl?: string;
  postId?: string;
}

export interface AssociationMessage {
  id: string;
  name: string;
  phone: string;
  text: string;
  createdAt: string;
  read: boolean;
}

export const AdminAnalyticsView: React.FC<AdminAnalyticsViewProps> = ({
  onLogout,
  onNavigateHome,
  draftNotification,
  onClearDraftNotification,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'notifications' | 'messages' | 'users' | 'artisans'>(
    draftNotification ? 'notifications' : 'overview'
  );
  const [storedArtisans, setStoredArtisans] = useState<ArtisanItem[]>([]);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [isProcessingId, setIsProcessingId] = useState<string | null>(null);
  const [isLoadingArtisans, setIsLoadingArtisans] = useState(false);

  // Association Messages State
  const [associationMessages, setAssociationMessages] = useState<AssociationMessage[]>([]);
  const [messagesFilter, setMessagesFilter] = useState<'all' | 'unread'>('all');
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  // Real System Data States
  const [usersList, setUsersList] = useState<
    Array<{
      username: string;
      fullName?: string;
      name?: string;
      password?: string;
      role: 'admin' | 'user';
      eDate: string;
      field?: string;
      baseGrade?: string;
      licenseNo?: string;
      phone?: string;
      nationalCode?: string;
      avatar?: string;
      userTag?: string;
      isExpired: boolean;
      isBlocked?: boolean;
      blockReason?: string;
      restrictedSections?: string[];
      notes?: string;
    }>
  >([]);
  const [syncStatus, setSyncStatus] = useState<any>(null);
  const [isSyncingUsers, setIsSyncingUsers] = useState(false);
  const [isUploadingExcel, setIsUploadingExcel] = useState(false);
  const [newsCount, setNewsCount] = useState<number>(0);
  const [newsLastUpdated, setNewsLastUpdated] = useState<string | null>(null);
  const [mojrianStatus, setMojrianStatus] = useState<MojrianServerStatus | null>(null);

  // Edit User State
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [isUserEditModalOpen, setIsUserEditModalOpen] = useState(false);
  const [isSavingUserEdit, setIsSavingUserEdit] = useState(false);

  // Single User Form State
  const [newFullName, setNewFullName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'user'>('user');
  const [newUserTag, setNewUserTag] = useState<string>('member');
  const [newEDate, setNewEDate] = useState('1406/12/29');
  const [showUserPasswords, setShowUserPasswords] = useState<Record<string, boolean>>({});
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const togglePasswordVisibility = (username: string) => {
    setShowUserPasswords((prev) => ({ ...prev, [username]: !prev[username] }));
  };

  const copyToClipboard = (text: string, fieldId: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2500);
  };

  // Notifications Broadcast State
  const [notificationsList, setNotificationsList] = useState<StoredNotification[]>([]);
  const [notifTitle, setNotifTitle] = useState(draftNotification?.title || '');
  const [notifBody, setNotifBody] = useState(draftNotification?.body || '');
  const [notifUrgency, setNotifUrgency] = useState<'normal' | 'urgent'>(
    draftNotification?.urgency || 'urgent'
  );
  const [notifLinkUrl, setNotifLinkUrl] = useState(draftNotification?.linkUrl || '');
  const [notifPostId, setNotifPostId] = useState<string | null>(draftNotification?.postId || null);
  const [isSendingNotif, setIsSendingNotif] = useState(false);
  const [pushDevicesCount, setPushDevicesCount] = useState<number>(0);
  const [isTestingPush, setIsTestingPush] = useState(false);

  // When a draft notification arrives from the news view, switch to notifications tab, populate, and scroll
  useEffect(() => {
    if (draftNotification) {
      setActiveTab('notifications');
      setNotifTitle(draftNotification.title || '');
      setNotifBody(draftNotification.body || '');
      setNotifUrgency(draftNotification.urgency || 'urgent');
      setNotifLinkUrl(draftNotification.linkUrl || '');
      setNotifPostId(draftNotification.postId || null);

      const timer = setTimeout(() => {
        const el = document.getElementById('compose-notification-form');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [draftNotification]);

  // User search filter
  const [userSearchQuery, setUserSearchQuery] = useState('');

  const [expandedReviewsArtisanId, setExpandedReviewsArtisanId] = useState<string | null>(null);
  const [adminArtisanTypeFilter, setAdminArtisanTypeFilter] = useState<'all' | 'engineering' | 'artisan' | 'vendor'>('all');

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingArtisan, setEditingArtisan] = useState<ArtisanItem | null>(null);

  const refreshData = async () => {
    setIsLoadingArtisans(true);
    // 1. Fetch real artisans from Cloud Firestore
    try {
      const items = await fetchArtisans(true);
      if (Array.isArray(items)) {
        setStoredArtisans(items);
      }
    } catch {
      // ignore
    } finally {
      setIsLoadingArtisans(false);
    }

    // 2. Fetch real users summary from users.xlsx
    try {
      const uRes = await fetch('/api/auth/users-summary');
      const uData = await uRes.json();
      if (uData.success && Array.isArray(uData.users)) {
        setUsersList(uData.users);
      }
    } catch {}

    // 3. Fetch real database sync status
    try {
      const tgRes = await fetch('/api/auth/users-sync-status');
      const tgData = await tgRes.json();
      if (tgData.success) {
        setSyncStatus(tgData);
      }
    } catch {}

    // 4. Fetch real telegram news count
    try {
      const nRes = await fetch('/api/telegram-news');
      const nData = await nRes.json();
      if (nData.items && Array.isArray(nData.items)) {
        setNewsCount(nData.items.length);
        setNewsLastUpdated(nData.lastUpdated || null);
      }
    } catch {}

    // 5. Fetch real Mojrian portal server status
    try {
      const mRes = await fetch('/api/mojrian-status');
      const mData = await mRes.json();
      setMojrianStatus(mData);
    } catch {}

    // 6. Fetch real broadcast notifications
    try {
      const notifRes = await fetch('/api/notifications');
      const notifData = await notifRes.json();
      if (notifData.success && Array.isArray(notifData.items)) {
        setNotificationsList(notifData.items);
      }
    } catch {}

    // 7. Fetch active Web Push registered devices count (Open Standard VAPID)
    try {
      const pushRes = await fetch('/api/push/vapid-public-key');
      const pushData = await pushRes.json();
      if (pushData.success && typeof pushData.totalSubscriptions === 'number') {
        setPushDevicesCount(pushData.totalSubscriptions);
      }
    } catch {}

    // 8. Fetch association messages submitted via About section
    try {
      setIsLoadingMessages(true);
      const msgRes = await fetch('/api/association-messages');
      const msgData = await msgRes.json();
      if (msgData.success && Array.isArray(msgData.items)) {
        setAssociationMessages(msgData.items);
      }
    } catch {} finally {
      setIsLoadingMessages(false);
    }
  };

  const unreadMessagesCount = useMemo(() => {
    return associationMessages.filter((m) => !m.read).length;
  }, [associationMessages]);

  const handleToggleMessageRead = async (id: string, currentRead: boolean) => {
    try {
      const res = await fetch(`/api/association-messages/${id}/read`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ read: !currentRead }),
      });
      const data = await res.json();
      if (data.success) {
        setAssociationMessages((prev) =>
          prev.map((m) => (m.id === id ? { ...m, read: !currentRead } : m))
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteMessage = async (id: string) => {
    if (!confirm('آیا از حذف این پیام از دبیرخانه انجمن اطمینان دارید؟')) return;
    try {
      const res = await fetch(`/api/association-messages/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setAssociationMessages((prev) => prev.filter((m) => m.id !== id));
        setActionMessage('پیام با موفقیت حذف گردید.');
        setTimeout(() => setActionMessage(null), 4000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleTestPushBroadcast = async () => {
    setIsTestingPush(true);
    try {
      const res = await fetch('/api/push/test', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setActionMessage(`✅ ${data.message}`);
        setTimeout(() => setActionMessage(null), 5000);
      } else {
        alert(data.error || 'خطا در ارسال اعلان تست');
      }
    } catch {
      alert('خطا در برقراری ارتباط با سرور.');
    } finally {
      setIsTestingPush(false);
    }
  };

  useEffect(() => {
    refreshData();
    const interval = setInterval(() => {
      refreshData();
    }, 12000);

    const handleFocus = () => {
      refreshData();
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const handleManualSync = async () => {
    setIsSyncingUsers(true);
    try {
      const res = await fetch('/api/auth/sync-users', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        await refreshData();
        setActionMessage('همگام‌سازی پایگاه داده کاربران با موفقیت انجام شد.');
        setTimeout(() => setActionMessage(null), 4000);
      }
    } catch (err) {
      console.error('Error syncing users:', err);
    } finally {
      setIsSyncingUsers(false);
    }
  };

  const handleExcelFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingExcel(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64 = (reader.result as string).split(',')[1];
          const res = await fetch('/api/auth/upload-excel', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              base64Data: base64,
              filename: file.name,
            }),
          });
          const data = await res.json();
          if (data.success) {
            setActionMessage(data.message || 'فایل اکسل کاربران با موفقیت جایگزین شد.');
            if (Array.isArray(data.users)) {
              setUsersList(data.users);
            }
            refreshData();
            setTimeout(() => setActionMessage(null), 5000);
          } else {
            alert(data.error || 'خطا در بارگذاری فایل اکسل');
          }
        } catch {
          alert('خطا در ارسال فایل به سرور.');
        } finally {
          setIsUploadingExcel(false);
        }
      };
      reader.readAsDataURL(file);
    } catch {
      alert('خطا در خواندن فایل');
      setIsUploadingExcel(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newPassword.trim()) {
      alert('نام کاربری و رمز عبور الزامی است.');
      return;
    }
    const cleanFullName = newFullName.trim() || `مهندس ${newUsername.trim()}`;
    try {
      const res = await fetch('/api/auth/add-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: cleanFullName,
          username: newUsername.trim(),
          password: newPassword.trim(),
          role: newRole,
          userTag: newUserTag,
          eDate: newEDate.trim() || '1406/12/29',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage(data.message || `مهندس «${cleanFullName}» با موفقیت در فایل اکسل ذخیره شد.`);
        setNewFullName('');
        setNewUsername('');
        setNewPassword('');
        setNewUserTag('member');
        refreshData();
        setTimeout(() => setActionMessage(null), 4000);
      } else {
        alert(data.error || 'خطا در افزودن کاربر');
      }
    } catch {
      alert('خطا در ارتباط با سرور.');
    }
  };

  const handleStartEditUser = (user: any) => {
    setEditingUser(user);
    setIsUserEditModalOpen(true);
  };

  const handleSaveUserEdit = async (formData: any) => {
    setIsSavingUserEdit(true);
    try {
      const res = await fetch('/api/auth/update-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage(data.message || 'اطلاعات و سطح دسترسی کاربر با موفقیت ذخیره شد.');
        setIsUserEditModalOpen(false);
        setEditingUser(null);
        await refreshData();
        setTimeout(() => setActionMessage(null), 4000);
      } else {
        alert(data.error || 'خطا در ویرایش اطلاعات کاربر');
      }
    } catch {
      alert('خطا در ارتباط با سرور.');
    } finally {
      setIsSavingUserEdit(false);
    }
  };

  const handleDeleteUser = async (username: string) => {
    const targetUser = usersList.find((u) => u.username === username);
    const displayName = targetUser?.fullName || targetUser?.name || username;
    if (
      !confirm(
        `آیا از حذف کامل مهندس «${displayName}» (نام کاربری: ${username}) از سامانه اطمینان دارید؟\nاین عملیات مشخصات و دسترسی کاربر را به طور کامل از فایل اکسل و سیستم حذف خواهد کرد.`
      )
    )
      return;
    try {
      const res = await fetch(`/api/auth/users/${encodeURIComponent(username)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage(data.message || `مهندس «${displayName}» با موفقیت از سیستم حذف گردید.`);
        await refreshData();
        setTimeout(() => setActionMessage(null), 4000);
      } else {
        alert(data.error || 'خطا در حذف کاربر');
      }
    } catch {
      alert('خطا در ارتباط با سرور هنگام حذف کاربر.');
    }
  };

  const handleApproveArtisan = async (id: string, name?: string) => {
    const displayName = name || 'استادکار';
    setIsProcessingId(id);
    try {
      console.log('[Approve] Initiating approve for artisanId:', id);
      await approveArtisan(id);
      setStoredArtisans((prev) =>
        prev.map((a) =>
          a.id === id ? { ...a, verifiedByAssociation: true, status: 'approved' } : a
        )
      );
      setActionMessage(`استادکار «${displayName}» با موفقیت تایید و برای کلیه کاربران منتشر گردید.`);
      setTimeout(() => setActionMessage(null), 5000);
      await refreshData();
    } catch (err: any) {
      console.error('[Approve] Error approving artisan:', err);
      const msg = err?.message || 'خطا در تایید در پایگاه داده ابری.';
      alert(msg);
    } finally {
      setIsProcessingId(null);
    }
  };

  const handleDeleteArtisan = async (id: string, name?: string) => {
    const displayName = name || 'استادکار';
    if (!confirm(`آیا از حذف استادکار «${displayName}» اطمینان دارید؟`)) return;
    setIsProcessingId(id);
    try {
      await deleteArtisan(id);
      setStoredArtisans((prev) => prev.filter((a) => a.id !== id));
      setActionMessage(`استادکار «${displayName}» با موفقیت حذف شد.`);
      setTimeout(() => setActionMessage(null), 4000);
    } catch {
      alert('خطا در حذف از پایگاه داده ابری.');
    } finally {
      setIsProcessingId(null);
    }
  };

  const getAdminEngineerDisplayName = (name?: string, userId?: string) => {
    const clean = String(name || '').trim();
    const cleanId = String(userId || '').trim();
    const matched = usersList.find((u) => {
      const uNorm = u.username.toLowerCase();
      return (
        (clean && uNorm === clean.toLowerCase()) ||
        (cleanId && uNorm === cleanId.toLowerCase())
      );
    });
    if (matched?.fullName) return matched.fullName;
    if (clean.startsWith('مهندس')) return clean;
    if (clean && /[\u0600-\u06FF]/.test(clean) && clean.includes(' ')) return `مهندس ${clean}`;
    if (clean && !/[\u0600-\u06FF]/.test(clean)) return `مهندس ${clean}`;
    return clean || 'مهندس عضو انجمن';
  };

  const handleDeleteReview = async (artisanId: string, reviewId: string) => {
    if (!confirm('آیا از حذف این نظر و ارزیابی اطمینان دارید؟')) return;
    try {
      const res = await fetch(`/api/artisans/${artisanId}/reviews/${reviewId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success && data.item) {
        setStoredArtisans((prev) =>
          prev.map((a) => (a.id === artisanId ? data.item : a))
        );
        setActionMessage('نظر و امتیاز با موفقیت حذف گردید.');
        setTimeout(() => setActionMessage(null), 3000);
      } else {
        alert(data.error || 'خطا در حذف نظر');
      }
    } catch {
      alert('خطا در ارتباط با سرور.');
    }
  };

  // Broadcast Notification Handler
  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle.trim() || !notifBody.trim()) {
      alert('لطفاً عنوان و متن پیام اعلان را تکمیل نمایید.');
      return;
    }

    setIsSendingNotif(true);
    try {
      const res = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: notifTitle.trim(),
          body: notifBody.trim(),
          urgency: notifUrgency,
          linkUrl: notifLinkUrl.trim(),
          postId: notifPostId || undefined,
          sentBy: 'مدیریت انجمن (مهندس حامد باشم‌پور)',
        }),
      });
      const data = await res.json();
      if (data.success) {
        // Trigger audio chime immediately
        playNotificationChime();

        const targetPostId = notifPostId || data.notification?.id || `notif-${Date.now()}`;

        // 1. Dispatch local in-app alert event
        window.dispatchEvent(
          new CustomEvent('urmia_breaking_news_alert', {
            detail: {
              id: targetPostId,
              postId: notifPostId || undefined,
              title: notifTitle.trim(),
              text: notifBody.trim(),
              timeDisplay: 'هم‌اکنون',
              telegramUrl: notifLinkUrl.trim(),
            },
          })
        );

        // 2. Dispatch OS / System native push notification if enabled
        if (isPushEnabled()) {
          showPushNotification({
            title: notifTitle.trim(),
            body:
              notifBody.trim().length > 150
                ? notifBody.trim().substring(0, 147) + '...'
                : notifBody.trim(),
            tag: `admin-broadcast-${Date.now()}`,
            data: {
              url:
                notifLinkUrl.trim() ||
                (notifPostId ? `/?tab=news&postId=${encodeURIComponent(notifPostId)}` : '/?tab=news'),
              tab: 'news',
              postId: notifPostId || undefined,
            },
          }).catch(() => {});
        }

        setActionMessage('✅ اعلان با موفقیت ثبت شد و به کاربران ارسال گردید.');
        setNotifTitle('');
        setNotifBody('');
        setNotifLinkUrl('');
        setNotifUrgency('urgent');
        setNotifPostId(null);
        onClearDraftNotification?.();

        // Refresh notifications list
        const notifRes = await fetch('/api/notifications');
        const notifData = await notifRes.json();
        if (notifData.success && Array.isArray(notifData.items)) {
          setNotificationsList(notifData.items);
        }
        setTimeout(() => setActionMessage(null), 5000);
      } else {
        alert(data.error || 'خطا در ارسال اعلان');
      }
    } catch {
      alert('خطا در ارسال اعلان به سرور.');
    } finally {
      setIsSendingNotif(false);
    }
  };

  const handleDeleteNotification = async (id: string) => {
    if (!confirm('آیا از حذف این اعلان از تاریخچه اطمینان دارید؟')) return;
    try {
      const res = await fetch(`/api/notifications/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setNotificationsList((prev) => prev.filter((n) => n.id !== id));
        setActionMessage('اعلان از تاریخچه حذف شد.');
        setTimeout(() => setActionMessage(null), 3000);
      } else {
        alert(data.error || 'خطا در حذف اعلان');
      }
    } catch {
      alert('خطا در ارتباط با سرور.');
    }
  };

  // Real statistics calculations
  const userStats = useMemo(() => {
    const total = usersList.length;
    const active = usersList.filter((u) => !u.isExpired).length;
    const expired = usersList.filter((u) => u.isExpired).length;
    const admins = usersList.filter((u) => u.role === 'admin').length;
    return { total, active, expired, admins };
  }, [usersList]);

  const artisanStats = useMemo(() => {
    const total = storedArtisans.length;
    const approved = storedArtisans.filter((a) => a.verifiedByAssociation).length;
    const pending = total - approved;
    return { total, approved, pending };
  }, [storedArtisans]);

  const tradeBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const a of storedArtisans) {
      const key = a.tradeCategory || a.trade || 'سایر';
      counts[key] = (counts[key] || 0) + 1;
    }
    const colors = ['#0284c7', '#059669', '#d97706', '#7c3aed', '#db2777', '#0d9488', '#ea580c'];
    return Object.entries(counts).map(([name, value], idx) => ({
      name,
      value,
      fill: colors[idx % colors.length],
    }));
  }, [storedArtisans]);

  const filteredUsers = useMemo(() => {
    if (!userSearchQuery.trim()) return usersList;
    const q = userSearchQuery.trim().toLowerCase();
    return usersList.filter(
      (u) =>
        u.username.toLowerCase().includes(q) ||
        (u.fullName && u.fullName.toLowerCase().includes(q)) ||
        (u.name && u.name.toLowerCase().includes(q)) ||
        (u.eDate && u.eDate.includes(q)) ||
        u.role.toLowerCase().includes(q)
    );
  }, [usersList, userSearchQuery]);

  return (
    <div className="space-y-5 pb-16 animate-fadeIn text-right">
      {/* Top Header Card */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white shadow-md flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold shadow-sm">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold">
                پنل مدیریت و پایش اطلاعات واقعی سامانه
              </h1>
              <span className="text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/40 px-2 py-0.5 rounded-full">
                سطح دسترسی: مدیر ارشد
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              مدیریت سامانه: مهندس حامد باشم‌پور | گزارش‌های واقعی و ابزارهای مدیریتی
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={refreshData}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 text-xs flex items-center gap-1 transition-colors"
            title="بروزرسانی داده‌ها"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">بروزرسانی</span>
          </button>
          <button
            onClick={onLogout}
            className="py-1.5 px-3 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>خروج از پنل</span>
          </button>
        </div>
      </div>

      {/* Action Notification Toast Banner */}
      {actionMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border-2 border-emerald-400 text-emerald-950 text-xs font-bold flex items-center justify-between gap-2 shadow-sm animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{actionMessage}</span>
          </div>
          <button
            onClick={() => setActionMessage(null)}
            className="text-emerald-700 hover:text-emerald-950 p-1 text-sm font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'overview', label: 'داشبورد آمار واقعی سامانه', icon: ShieldCheck },
          {
            id: 'notifications',
            label: (
              <span className="flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5 text-amber-500" />
                <span>ارسال و مدیریت اعلان‌ها</span>
                {notificationsList.length > 0 && (
                  <span className="font-mono text-[10px] bg-amber-500 text-slate-950 font-bold px-1.5 py-0.2 rounded-full">
                    {toPersianDigits(notificationsList.length)}
                  </span>
                )}
              </span>
            ),
          },
          {
            id: 'messages',
            label: (
              <span className="flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-sky-600" />
                <span>پیام‌های دریافتی</span>
                {associationMessages.length > 0 && (
                  <span className="font-mono text-[11px]">({toPersianDigits(associationMessages.length)})</span>
                )}
                {unreadMessagesCount > 0 && (
                  <span className="bg-sky-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold animate-pulse">
                    {toPersianDigits(unreadMessagesCount)} جدید
                  </span>
                )}
              </span>
            ),
          },
          {
            id: 'users',
            label: (
              <span className="flex items-center gap-1.5">
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>کاربران و اشتراک‌ها</span>
                <span className="font-mono text-[11px]">({toPersianDigits(usersList.length)})</span>
              </span>
            ),
          },
          {
            id: 'artisans',
            label: (
              <span className="flex items-center gap-1.5">
                <span>مدیریت بازار</span>
                <span className="font-mono text-[11px]">({toPersianDigits(storedArtisans.length)})</span>
                {storedArtisans.filter((a) => !a.verifiedByAssociation).length > 0 && (
                  <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold animate-pulse">
                    {toPersianDigits(
                      storedArtisans.filter((a) => !a.verifiedByAssociation).length
                    )}{' '}
                    جدید
                  </span>
                )}
              </span>
            ),
          },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === tab.id
                ? 'bg-slate-900 text-white font-bold shadow-2xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: REAL SYSTEM OVERVIEW & STATISTICS */}
      {activeTab === 'overview' && (
        <div className="space-y-5">
          {/* Pending Artisans Alert */}
          {artisanStats.pending > 0 && (
            <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-400 text-amber-950 flex items-center justify-between flex-wrap gap-3 shadow-sm animate-fadeIn">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold shrink-0 shadow-sm">
                  <AlertTriangle className="w-5 h-5 text-amber-950" />
                </div>
                <div>
                  <h4 className="font-bold text-xs sm:text-sm">
                    {toPersianDigits(artisanStats.pending)} درخواست ثبت استادکار جدید در انتظار بررسی شماست
                  </h4>
                  <p className="text-[11px] text-amber-800 mt-0.5">
                    استادکاران پس از تایید توسط شما، بلافاصله در سامانه و برای سایر مهندسان منتشر خواهند شد.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('artisans')}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 font-bold text-xs transition-colors shadow-2xs"
              >
                بررسی و تایید استادکاران
              </button>
            </div>
          )}

          {/* Unread Messages Alert */}
          {unreadMessagesCount > 0 && (
            <div className="p-4 rounded-2xl bg-sky-50 border-2 border-sky-400 text-sky-950 flex items-center justify-between flex-wrap gap-3 shadow-sm animate-fadeIn">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500 text-white flex items-center justify-center font-bold shrink-0 shadow-sm">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs sm:text-sm">
                    {toPersianDigits(unreadMessagesCount)} پیام جدید از طرف مهندسان در صندوق انجمن دریافت شده است
                  </h4>
                  <p className="text-[11px] text-sky-800 mt-0.5">
                    پیام‌ها و پیشنهادات ارسالی از صفحه «درباره انجمن و تماس» آماده مشاهده و پیگیری شما هستند.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('messages')}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-sky-300 font-bold text-xs transition-colors shadow-2xs"
              >
                مشاهده صندوق پیام‌ها
              </button>
            </div>
          )}

          {/* Real KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Card 1: Users */}
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-bold">کاربران اکسل</span>
                <Users className="w-4 h-4 text-sky-600" />
              </div>
              <div className="text-xl font-bold text-slate-900 font-mono">
                {toPersianDigits(userStats.total)}
              </div>
              <div className="text-[10px] text-emerald-600 font-medium">
                {toPersianDigits(userStats.active)} کاربر دارای اعتبار فعال
              </div>
            </div>

            {/* Card 2: Artisans */}
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-bold">استادکاران ثبت‌شده</span>
                <UserCheck className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-xl font-bold text-slate-900 font-mono">
                {toPersianDigits(artisanStats.total)}
              </div>
              <div className="text-[10px] text-slate-500 font-medium">
                {toPersianDigits(artisanStats.approved)} تاییدشده | {toPersianDigits(artisanStats.pending)} در انتظار
              </div>
            </div>

            {/* Card 3: News */}
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-bold">اخبار تلگرام</span>
                <FileText className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-xl font-bold text-slate-900 font-mono">
                {toPersianDigits(newsCount)}
              </div>
              <div className="text-[10px] text-slate-400 font-medium truncate">
                فید زنده انجمن ارومیه
              </div>
            </div>

            {/* Card 4: Mojrian Portal */}
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-bold">پورتال نظام مهندسی</span>
                <Radio
                  className={`w-4 h-4 ${
                    mojrianStatus?.online ? 'text-emerald-500 animate-pulse' : 'text-rose-500'
                  }`}
                />
              </div>
              <div className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    mojrianStatus?.online ? 'bg-emerald-500' : 'bg-rose-500'
                  }`}
                />
                <span>{mojrianStatus?.online ? 'متصل و فعال' : 'در حال بررسی'}</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                پینگ: {toPersianDigits(mojrianStatus?.latencyMs || 0)}ms
              </div>
            </div>

            {/* Card 5: Tariffs */}
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-bold">ردیف‌های تعرفه</span>
                <Calculator className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-xl font-bold text-slate-900 font-mono">
                {toPersianDigits(28)}
              </div>
              <div className="text-[10px] text-amber-700 font-medium">
                تعرفه رسمی سال ۱۴۰۳
              </div>
            </div>

            {/* Card 6: Broadcast Notifications */}
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-bold">اعلان‌های مدیریت</span>
                <Bell className="w-4 h-4 text-rose-600" />
              </div>
              <div className="text-xl font-bold text-slate-900 font-mono">
                {toPersianDigits(notificationsList.length)}
              </div>
              <div className="text-[10px] text-slate-500 font-medium">
                ارسال‌شده به کاربران
              </div>
            </div>
          </div>

          {/* Real Subsystems Health & Status Table */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-sky-600" />
                  <span>وضعیت سلامت و اتصال سرویس‌های واقعی سامانه</span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  وضعیت اتصالات شبکه، فایل اکسل کاربران و سرویس‌های همگام‌سازی بلادرنگ
                </p>
              </div>
              <button
                onClick={refreshData}
                className="text-xs text-sky-700 font-bold hover:underline flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>بررسی مجدد</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 pb-2">
                    <th className="pb-2 font-medium">عنوان سرویس</th>
                    <th className="pb-2 font-medium text-center">وضعیت کارکرد</th>
                    <th className="pb-2 font-medium text-center">شاخص آماری واقعی</th>
                    <th className="pb-2 font-medium text-left">اقدام سریع</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="hover:bg-slate-50/70">
                    <td className="py-3 font-bold text-slate-800 flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                      <div>
                        <span>پایگاه داده کاربران (فایل users.xlsx)</span>
                        <span className="block text-[10px] text-slate-400 font-normal">
                          محل فایل: src/data/users.xlsx
                        </span>
                      </div>
                    </td>
                    <td className="py-3 text-center">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        مستقر و در دسترس
                      </span>
                    </td>
                    <td className="py-3 text-center font-mono font-bold text-slate-700">
                      {toPersianDigits(userStats.total)} کاربر ({toPersianDigits(userStats.active)} فعال)
                    </td>
                    <td className="py-3 text-left">
                      <button
                        onClick={() => setActiveTab('users')}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold"
                      >
                        مدیریت کاربران
                      </button>
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50/70">
                    <td className="py-3 font-bold text-slate-800 flex items-center gap-2">
                      <Radio className="w-4 h-4 text-sky-600" />
                      <div>
                        <span>پورتال استعلام ظرفیت مجریان (نظام مهندسی)</span>
                        <span className="block text-[10px] text-slate-400 font-normal">
                          آدرس: mojrian.wa-nezam.org
                        </span>
                      </div>
                    </td>
                    <td className="py-3 text-center">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          mojrianStatus?.online
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {mojrianStatus?.online ? 'آنلاین (HTTP 200)' : 'پاسخ ناموفق'}
                      </span>
                    </td>
                    <td className="py-3 text-center font-mono font-bold text-slate-700">
                      پاسخ در {toPersianDigits(mojrianStatus?.latencyMs || 0)} میلی‌ثانیه
                    </td>
                    <td className="py-3 text-left">
                      <a
                        href="/?tab=mojrian"
                        className="px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-800 text-[11px] font-bold inline-block"
                      >
                        مشاهده استعلام
                      </a>
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50/70">
                    <td className="py-3 font-bold text-slate-800 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-indigo-600" />
                      <div>
                        <span>فید اخبار و اطلاعیه‌های رسمی کانال تلگرام</span>
                        <span className="block text-[10px] text-slate-400 font-normal">
                          همگام‌سازی زنده اخبار و بخشنامه‌ها
                        </span>
                      </div>
                    </td>
                    <td className="py-3 text-center">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        به‌روز و فعال
                      </span>
                    </td>
                    <td className="py-3 text-center font-mono font-bold text-slate-700">
                      {toPersianDigits(newsCount)} خبر دریافت شده
                    </td>
                    <td className="py-3 text-left">
                      <a
                        href="/?tab=news"
                        className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-[11px] font-bold inline-block"
                      >
                        مشاهده اخبار
                      </a>
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50/70">
                    <td className="py-3 font-bold text-slate-800 flex items-center gap-2">
                      <Bell className="w-4 h-4 text-amber-600" />
                      <div>
                        <span>سرویس اعلان‌های فوری مدیریت (Broadcast)</span>
                        <span className="block text-[10px] text-slate-400 font-normal">
                          ارسال دستی اعلان اختصاصی توسط مدیر به کاربران
                        </span>
                      </div>
                    </td>
                    <td className="py-3 text-center">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        آماده ارسال
                      </span>
                    </td>
                    <td className="py-3 text-center font-mono font-bold text-slate-700">
                      {toPersianDigits(notificationsList.length)} اعلان در تاریخچه
                    </td>
                    <td className="py-3 text-left">
                      <button
                        onClick={() => setActiveTab('notifications')}
                        className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 text-[11px] font-bold"
                      >
                        ارسال اعلان جدید
                      </button>
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50/70">
                    <td className="py-3 font-bold text-slate-800 flex items-center gap-2">
                      <Radio className="w-4 h-4 text-emerald-600" />
                      <div>
                        <span>پروتکل Web Push مستقیم سرور به گوشی (RFC 8292)</span>
                        <span className="block text-[10px] text-slate-400 font-normal">
                          ارسال سیستمی به گوشی مهندسان (حتی در صورت بسته بودن کامل برنامه و مرورگر)
                        </span>
                      </div>
                    </td>
                    <td className="py-3 text-center">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        مستقل و آماده مهاجرت
                      </span>
                    </td>
                    <td className="py-3 text-center font-mono font-bold text-slate-700">
                      {toPersianDigits(pushDevicesCount)} دستگاه ثبت‌شده
                    </td>
                    <td className="py-3 text-left">
                      <button
                        onClick={handleTestPushBroadcast}
                        disabled={isTestingPush}
                        className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 disabled:opacity-50 text-emerald-900 text-[11px] font-bold transition-colors"
                      >
                        {isTestingPush ? 'در حال ارسال تست...' : 'تست ارسال به گوشی‌ها'}
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Real Breakdown Charts: Artisans by Trade & User Subscriptions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Real Artisans by Trade Chart */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-600" />
                <span>توزیع واقعی تخصص استادکاران ثبت‌شده در سامانه</span>
              </h3>
              <p className="text-[11px] text-slate-500">
                بر اساس دسته‌بندی واقعی رکوردهای موجود در پایگاه داده استادکاران
              </p>

              {tradeBreakdown.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-xs text-slate-400">
                  هنوز استادکاری ثبت نشده است.
                </div>
              ) : (
                <div className="h-60 w-full" dir="ltr">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={tradeBreakdown} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#475569' }} interval={0} angle={-25} textAnchor="end" />
                      <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                      <Tooltip
                        formatter={(val: any) => [toPersianDigits(val) + ' نفر', 'تعداد']}
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          color: '#fff',
                          borderRadius: '10px',
                          fontSize: '12px',
                          direction: 'rtl',
                        }}
                      />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                        {tradeBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Real Users Subscriptions Breakdown */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-sky-600" />
                <span>وضعیت واقعی اعتبار اشتراک کاربران</span>
              </h3>
              <p className="text-[11px] text-slate-500">
                تحلیل وضعیت اعتبار کاربران سامانه بر اساس تاریخ انقضای ثبت‌شده در فایل اکسل
              </p>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-right space-y-1">
                  <span className="text-[11px] text-emerald-800 font-bold block">اشتراک‌های فعال</span>
                  <div className="text-2xl font-bold text-emerald-950 font-mono">
                    {toPersianDigits(userStats.active)}
                  </div>
                  <span className="text-[10px] text-emerald-700 block">
                    {userStats.total > 0
                      ? toPersianDigits(Math.round((userStats.active / userStats.total) * 100)) + '٪ کل کاربران'
                      : '۰٪'}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-right space-y-1">
                  <span className="text-[11px] text-rose-800 font-bold block">اشتراک‌های منقضی</span>
                  <div className="text-2xl font-bold text-rose-950 font-mono">
                    {toPersianDigits(userStats.expired)}
                  </div>
                  <span className="text-[10px] text-rose-700 block">
                    {userStats.total > 0
                      ? toPersianDigits(Math.round((userStats.expired / userStats.total) * 100)) + '٪ کل کاربران'
                      : '۰٪'}
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">تعداد مدیران سیستم:</span>
                  <strong className="font-mono text-slate-900">{toPersianDigits(userStats.admins)} مدیر</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">تعداد کاربران عادی:</span>
                  <strong className="font-mono text-slate-900">{toPersianDigits(userStats.total - userStats.admins)} کاربر</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: NOTIFICATIONS BROADCAST (DIRECT USER REQUEST) */}
      {activeTab === 'notifications' && (
        <div className="space-y-5">
          {/* Header Description */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xs sm:text-sm font-bold text-slate-900">
                  ارسال اختصاصی اعلان فوری به کاربران سامانه
                </h2>
                <p className="text-[11px] text-slate-500">
                  در این بخش می‌توانید هر زمان که لازم باشد، بخشنامه‌ها و اطلاعیه‌های مهم را به صورت اعلان فوری و بنر شناور برای کاربران ارسال کنید.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Notification Compose Form */}
            <div
              id="compose-notification-form"
              className="lg:col-span-7 p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4 scroll-mt-20"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Send className="w-4 h-4 text-sky-600" />
                  <span>تنظیم و نگارش پیام اعلان جدید</span>
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                    <Radio className="w-3 h-3 text-emerald-600" />
                    <span>{toPersianDigits(pushDevicesCount)} گوشی متصل به Web-Push</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleTestPushBroadcast}
                    disabled={isTestingPush}
                    className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-2.5 py-1 rounded-lg transition-colors"
                    title="تست ارسال نوتیفیکیشن واقعی به گوشی‌ها حتی در حالت بسته"
                  >
                    {isTestingPush ? 'در حال ارسال...' : 'تست ارسال به گوشی‌ها'}
                  </button>
                </div>
              </div>

              {/* Draft Loaded from Telegram News Notice */}
              {draftNotification && (
                <div className="p-3 rounded-xl bg-amber-50 border-2 border-amber-300 text-amber-950 text-xs flex items-center justify-between gap-2 shadow-2xs animate-fadeIn">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                    <div>
                      <span className="font-bold block text-amber-900">
                        اطلاعات خبر تلگرام بارگذاری شد
                      </span>
                      <span className="text-[11px] text-amber-800">
                        عنوان و متن اعلان متناسب با خبر پر شد. می‌توانید در صورت نیاز ویرایش کرده و ارسال نمایید.
                      </span>
                    </div>
                  </div>
                  {onClearDraftNotification && (
                    <button
                      type="button"
                      onClick={() => {
                        onClearDraftNotification();
                        setNotifTitle('');
                        setNotifBody('');
                        setNotifLinkUrl('');
                        setNotifPostId(null);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-amber-200/80 hover:bg-amber-300 text-amber-900 font-bold text-[10px] transition-colors shrink-0"
                    >
                      پاکسازی فرم
                    </button>
                  )}
                </div>
              )}

              <form onSubmit={handleSendNotification} noValidate className="space-y-4 text-xs">
                {/* Notification Title */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block">
                    عنوان اعلان <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={notifTitle}
                    onChange={(e) => setNotifTitle(e.target.value)}
                    placeholder="مثال: بخشنامه فوری تغییر تعرفه حق‌الزحمه نظارت و اجرا"
                    required
                    className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400"
                  />
                </div>

                {/* Notification Body */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block">
                    متن پیام اعلان <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    value={notifBody}
                    onChange={(e) => setNotifBody(e.target.value)}
                    placeholder="توضیحات و جزئیات اعلان را اینجا وارد کنید. این متن در اعلان تلفن همراه و بنر بالای برنامه به مهندسان نمایش داده خواهد شد..."
                    required
                    className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 leading-relaxed"
                  />
                </div>

                {/* Urgency Level */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block">سطح فوریت اعلان</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setNotifUrgency('urgent')}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                        notifUrgency === 'urgent'
                          ? 'bg-rose-50 border-rose-300 text-rose-800 shadow-2xs'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                      <span>🚨 اعلان فوری و ویژه</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setNotifUrgency('normal')}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                        notifUrgency === 'normal'
                          ? 'bg-sky-50 border-sky-300 text-sky-800 shadow-2xs'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <Bell className="w-4 h-4 text-sky-600" />
                      <span>📢 اطلاع‌رسانی عادی</span>
                    </button>
                  </div>
                </div>

                {/* Link URL (Optional) */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block">
                    پیوند یا لینک مرتبط <span className="text-slate-400 font-normal">(کاملاً اختیاری)</span>
                  </label>
                  <input
                    type="text"
                    value={notifLinkUrl}
                    onChange={(e) => setNotifLinkUrl(e.target.value)}
                    placeholder="اختیاری - مانند پیوند خبر در تلگرام یا صفحه داخلی برنامه"
                    dir="ltr"
                    className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 font-mono text-left"
                  />
                  <p className="text-[10px] text-slate-400">
                    می‌توانید خالی بگذارید یا پیوند تلگرام و لینک مستقیم به خبر را قرار دهید.
                  </p>
                </div>

                {/* Submit Button */}
                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={isSendingNotif}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95"
                  >
                    {isSendingNotif ? (
                      <span>در حال ارسال اعلان...</span>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>ارسال سراسری اعلان به کاربران</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (!notifTitle.trim()) {
                        alert('لطفاً عنوان اعلان را وارد کنید.');
                        return;
                      }
                      playNotificationChime();
                      window.dispatchEvent(
                        new CustomEvent('urmia_breaking_news_alert', {
                          detail: {
                            id: `preview-${Date.now()}`,
                            title: notifTitle.trim(),
                            text: notifBody.trim() || 'پیش‌نمایش متن اعلان شما...',
                            timeDisplay: 'هم‌اکنون',
                            telegramUrl: notifLinkUrl.trim(),
                          },
                        })
                      );
                    }}
                    className="py-2.5 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors"
                    title="تست پخش صدا و ظاهر اعلان"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-slate-600" />
                    <span>تست صدا و پیش‌نمایش</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Live Preview Box & Quick Tips */}
            <div className="lg:col-span-5 space-y-4">
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-slate-600" />
                  <span>پیش‌نمایش زنده نحوه نمایش اعلان برای کاربران</span>
                </h4>

                {/* Simulated Notification Toast */}
                <div
                  className={`p-3.5 rounded-2xl border text-right space-y-2 shadow-md transition-all ${
                    notifUrgency === 'urgent'
                      ? 'bg-slate-900 text-white border-amber-500/50'
                      : 'bg-slate-900 text-white border-sky-500/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1.5">
                      <Bell className="w-3.5 h-3.5 animate-bounce" />
                      <span>{notifUrgency === 'urgent' ? 'خبر فوری مدیریت' : 'اطلاعیه انجمن'}</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">هم‌اکنون</span>
                  </div>

                  <h5 className="text-xs font-bold text-slate-100 leading-snug">
                    {notifTitle || 'عنوان اعلان شما در اینجا نمایش داده می‌شود'}
                  </h5>

                  <p className="text-[11px] text-slate-300 leading-relaxed line-clamp-3">
                    {notifBody || 'متن و شرح کامل اعلان در این قسمت برای کاربران به نمایش درمی‌آید.'}
                  </p>

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                    <span>فرستنده: مدیریت انجمن</span>
                    <span className="text-amber-400 font-bold">همراه با صدای زنگ اختصاصی</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1">
                  <p className="font-bold text-slate-800">💡 نحوه عملکرد اعلان‌ها:</p>
                  <p>
                    • به محض فشردن دکمه ارسال، اعلان در پایگاه داده ثبت شده و برای تمام کاربرانی که برنامه را باز دارند پخش می‌شود.
                  </p>
                  <p>
                    • کاربرانی که اعلان‌های گوشی را مجاز کرده باشند، پیام را روی نوار نوتیفیکیشن موبایل خود نیز دریافت خواهند کرد.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sent Notifications History */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-600" />
                <span>آرشیو و تاریخچه اعلان‌های ارسال‌شده</span>
              </h3>
              <span className="text-xs text-slate-500 font-mono">
                {toPersianDigits(notificationsList.length)} اعلان ثبت‌شده
              </span>
            </div>

            {notificationsList.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                هنوز اعلانی از طریق پنل مدیریت ارسال نشده است.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {notificationsList.map((notif) => (
                  <div key={notif.id} className="py-3 flex items-start justify-between gap-3 text-xs">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                          notif.urgency === 'urgent'
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-sky-100 text-sky-700'
                        }`}
                      >
                        <Bell className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-slate-900">{notif.title}</h4>
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                              notif.urgency === 'urgent'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {notif.urgency === 'urgent' ? 'فوری' : 'عادی'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-relaxed">{notif.body}</p>
                        <div className="flex items-center gap-3 text-[10px] text-slate-400 font-mono pt-0.5">
                          <span>ارسال: {new Date(notif.createdAt).toLocaleDateString('fa-IR')}</span>
                          <span>ساعت: {new Date(notif.createdAt).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}</span>
                          <span>توسط: {notif.sentBy}</span>
                          {notif.linkUrl && (
                            <a
                              href={notif.linkUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sky-600 hover:underline flex items-center gap-0.5"
                            >
                              <span>مشاهده لینک</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteNotification(notif.id)}
                      className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors shrink-0"
                      title="حذف این اعلان از تاریخچه"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: RECEIVED MESSAGES FROM ENGINEERS & VISITORS */}
      {activeTab === 'messages' && (
        <div className="space-y-4">
          {/* Header Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500 text-white flex items-center justify-center font-bold shrink-0 shadow-sm">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span>صندوق پیام‌ها و نظرات دریافتی دبیرخانه انجمن</span>
                    {unreadMessagesCount > 0 && (
                      <span className="bg-sky-500 text-white text-[11px] px-2 py-0.5 rounded-full font-bold">
                        {toPersianDigits(unreadMessagesCount)} پیام جدید
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-500">
                    پیام‌ها، پیشنهادات و انتقادات ارسال شده توسط مهندسان از فرم بخش «درباره انجمن و تماس»
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={refreshData}
                  disabled={isLoadingMessages}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingMessages ? 'animate-spin' : ''}`} />
                  <span>بروزرسانی پیام‌ها</span>
                </button>
              </div>
            </div>

            {/* Sub-Filters */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 flex-wrap gap-2 text-xs">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setMessagesFilter('all')}
                  className={`px-3 py-1 rounded-lg text-xs transition-colors ${
                    messagesFilter === 'all'
                      ? 'bg-slate-900 text-white font-bold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  همه پیام‌ها ({toPersianDigits(associationMessages.length)})
                </button>
                <button
                  onClick={() => setMessagesFilter('unread')}
                  className={`px-3 py-1 rounded-lg text-xs transition-colors ${
                    messagesFilter === 'unread'
                      ? 'bg-sky-600 text-white font-bold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  فقط خوانده نشده‌ها ({toPersianDigits(unreadMessagesCount)})
                </button>
              </div>

              <span className="text-[11px] text-slate-400">
                ذخیره‌شده در پایگاه داده سرور و ابر اختصاصی انجمن
              </span>
            </div>
          </div>

          {/* Messages List */}
          {isLoadingMessages ? (
            <div className="p-8 text-center text-xs text-slate-500 bg-white rounded-2xl border border-slate-200">
              <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              در حال بارگذاری پیام‌های دریافتی...
            </div>
          ) : associationMessages.filter((m) => messagesFilter === 'all' || !m.read).length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 bg-white rounded-2xl border border-slate-200 space-y-2">
              <MessageSquare className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="font-bold text-slate-700">هیچ پیامی در این بخش وجود ندارد.</p>
              <p className="text-[11px] text-slate-400">
                پیام‌هایی که اعضا و مهندسان از فرم صفحه «درباره انجمن» ارسال کنند، بلافاصله در این بخش ثبت و نمایش داده می‌شوند.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {associationMessages
                .filter((m) => messagesFilter === 'all' || !m.read)
                .map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-4 rounded-2xl bg-white border transition-all ${
                      msg.read
                        ? 'border-slate-200 opacity-90'
                        : 'border-sky-300 ring-2 ring-sky-100 shadow-sm'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            msg.read ? 'bg-slate-300' : 'bg-sky-500 animate-pulse'
                          }`}
                        />
                        <h4 className="text-xs font-bold text-slate-900">
                          {msg.name ? msg.name : 'کاربر / مهندس بدون ذکر نام'}
                        </h4>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                            msg.read
                              ? 'bg-slate-100 text-slate-600'
                              : 'bg-sky-50 text-sky-700 border border-sky-200 font-bold'
                          }`}
                        >
                          {msg.read ? 'بررسی‌شده' : 'جدید / خوانده‌نشده'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-slate-400">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{formatIsoToPersianDate(msg.createdAt)}</span>
                        <span>-</span>
                        <span className="font-mono">{formatIsoToPersianTime(msg.createdAt)}</span>
                      </div>
                    </div>

                    {/* Message Body */}
                    <div className="my-3 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
                      {msg.text}
                    </div>

                    {/* Footer Info & Actions */}
                    <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-slate-100 text-xs">
                      {msg.phone ? (
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-slate-500">شماره تماس جهت پیگیری:</span>
                          <a
                            href={`tel:${msg.phone}`}
                            className="font-mono font-bold text-sky-700 hover:text-sky-900 flex items-center gap-1 bg-sky-50 px-2 py-1 rounded-lg border border-sky-200"
                            dir="ltr"
                          >
                            <Phone className="w-3 h-3 text-sky-600" />
                            <span>{msg.phone}</span>
                          </a>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400">شماره تماس قید نشده است</span>
                      )}

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleMessageRead(msg.id, msg.read)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors flex items-center gap-1.5 ${
                            msg.read
                              ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{msg.read ? 'علامت به عنوان خوانده نشده' : 'تایید بررسی و خوانده شده'}</span>
                        </button>

                        <button
                          onClick={() => handleDeleteMessage(msg.id)}
                          className="p-1 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
                          title="حذف پیام"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: USERS & DATABASE (REAL EXCEL DATA) */}
      {activeTab === 'users' && (
        <div className="space-y-5">
          {/* User Database Sync Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold shrink-0 shadow-sm">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                    پایگاه داده و مدیریت فایل اکسل کاربران (users.xlsx)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    ورود کاربران به برنامه و سطح دسترسی‌ها بر اساس این فایل بررسی می‌شود
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href="/api/auth/download-excel"
                  download="users.xlsx"
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors"
                  title="دانلود فایل اکسل کاربران حاوی ستون نام مهندس"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-700" />
                  <span>دانلود فایل اکسل</span>
                </a>

                <button
                  onClick={handleManualSync}
                  disabled={isSyncingUsers}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncingUsers ? 'animate-spin' : ''}`} />
                  <span>{isSyncingUsers ? 'در حال بررسی...' : 'همگام‌سازی دستی'}</span>
                </button>

                <label className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isUploadingExcel ? 'در حال بارگذاری...' : 'آپلود فایل جدید اکسل'}</span>
                  <input
                    type="file"
                    accept=".xlsx, .xls"
                    onChange={handleExcelFileUpload}
                    className="hidden"
                    disabled={isUploadingExcel}
                  />
                </label>
              </div>
            </div>

            {/* Sync Meta Status Details */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50">
                <span className="text-[10px] text-slate-400 block">تعداد کل کاربران:</span>
                <span className="font-mono font-bold text-slate-800">
                  {toPersianDigits(usersList.length)} کاربر
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50">
                <span className="text-[10px] text-slate-400 block">اشتراک‌های فعال:</span>
                <span className="font-mono font-bold text-emerald-600">
                  {toPersianDigits(userStats.active)} کاربر
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50">
                <span className="text-[10px] text-slate-400 block">اشتراک‌های منقضی:</span>
                <span className="font-mono font-bold text-rose-600">
                  {toPersianDigits(userStats.expired)} کاربر
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50">
                <span className="text-[10px] text-slate-400 block">وضعیت فایل محلی:</span>
                <span className="font-bold text-emerald-700">موجود و معتبر</span>
              </div>
            </div>
          </div>

          {/* Add / Update Single User Form */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-600" />
              <span>ثبت مهندس جدید در فایل اکسل</span>
            </h4>

            <form onSubmit={handleAddUser} className="grid grid-cols-1 sm:grid-cols-6 gap-3 text-xs">
              <div>
                <label className="text-[11px] text-slate-600 font-bold block mb-1">
                  نام مهندس
                </label>
                <input
                  type="text"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  onFocus={(e) => e.currentTarget.select()}
                  onClick={(e) => e.currentTarget.select()}
                  placeholder="نام و نام خانوادگی"
                  className="w-full h-9 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-600 font-bold block mb-1">
                  نام کاربری (لاگ‌این) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  onFocus={(e) => e.currentTarget.select()}
                  onClick={(e) => e.currentTarget.select()}
                  placeholder="نام کاربری"
                  required
                  className="w-full h-9 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-emerald-400 font-mono text-left"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-600 font-bold block mb-1">
                  رمز عبور <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  onFocus={(e) => e.currentTarget.select()}
                  onClick={(e) => e.currentTarget.select()}
                  placeholder="رمز عبور"
                  required
                  className="w-full h-9 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-emerald-400 font-mono text-left"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-600 font-bold block mb-1">سطح دسترسی</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as any)}
                  className="w-full h-9 px-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-emerald-400"
                >
                  <option value="user">کاربر عادی (user)</option>
                  <option value="admin">مدیر سیستم (admin)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-600 font-bold block mb-1">تگ و نشان سازمانی</label>
                <select
                  value={newUserTag}
                  onChange={(e) => {
                    setNewUserTag(e.target.value);
                    if (e.target.value === 'admin') setNewRole('admin');
                  }}
                  className="w-full h-9 px-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-emerald-400 font-medium"
                >
                  <option value="member">مهندس عضو انجمن (عادی)</option>
                  <option value="ceo">👑 مدیرعامل انجمن (تگ طلایی)</option>
                  <option value="board">🏛️ هیات مدیره انجمن</option>
                  <option value="inspector">🔍 بازرس انجمن</option>
                  <option value="treasurer">💼 خزانه‌دار انجمن</option>
                  <option value="secretary">📝 دبیر انجمن</option>
                  <option value="admin">🛡️ مدیر سامانه</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-600 font-bold block mb-1">
                  تاریخ انقضا (e-date)
                </label>
                <input
                  type="text"
                  value={newEDate}
                  onChange={(e) => setNewEDate(e.target.value)}
                  onFocus={(e) => e.currentTarget.select()}
                  onClick={(e) => e.currentTarget.select()}
                  placeholder="1406/12/29"
                  className="w-full h-9 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-emerald-400 font-mono text-left"
                  dir="ltr"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full h-9 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-2xs transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>ذخیره در اکسل</span>
                </button>
              </div>
            </form>
          </div>

          {/* Users List Table */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-600" />
                <span>فهرست کامل مهندسان در فایل users.xlsx</span>
              </h4>
              <input
                type="text"
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                onFocus={(e) => e.currentTarget.select()}
                onClick={(e) => e.currentTarget.select()}
                placeholder="جستجوی نام مهندس یا نام کاربری..."
                className="h-8 px-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
              />
            </div>

            {/* Quick Helper Banner */}
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-[11px] text-emerald-900">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>راهنمای ورود کاربران:</strong> ورود به سامانه فقط با <strong>«نام کاربری»</strong> و رمز عبور (بدون حساسیت به حروف بزرگ و کوچک) انجام می‌شود.
              </span>
            </div>

            {filteredUsers.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">کاربری یافت نشد.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 pb-2">
                      <th className="pb-2 font-medium">ردیف</th>
                      <th className="pb-2 font-medium">نام و نام خانوادگی</th>
                      <th className="pb-2 font-medium">نام کاربری (جهت ورود)</th>
                      <th className="pb-2 font-medium">رمز عبور</th>
                      <th className="pb-2 font-medium text-center">سطح و تگ سازمانی</th>
                      <th className="pb-2 font-medium text-center">تاریخ اعتبار (e-date)</th>
                      <th className="pb-2 font-medium text-center">وضعیت دسترسی</th>
                      <th className="pb-2 font-medium text-left">عملیات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUsers.map((user, idx) => (
                      <tr key={user.username} className="hover:bg-slate-50/70">
                        <td className="py-2.5 font-mono text-slate-400">{toPersianDigits(idx + 1)}</td>
                        <td className="py-2.5 font-bold text-slate-900">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900">{user.fullName || user.username}</span>
                            {user.notes && (
                              <span className="text-[10px] text-slate-400 font-normal">{user.notes}</span>
                            )}
                          </div>
                        </td>
                        {/* Username Column */}
                        <td className="py-2.5">
                          <div className="inline-flex items-center gap-1.5 bg-slate-100/90 border border-slate-200/90 px-2 py-1 rounded-lg">
                            <span className="font-mono text-[11px] font-bold text-slate-800" dir="ltr">
                              {user.username}
                            </span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(user.username, `user_${user.username}`)}
                              className="p-0.5 text-slate-400 hover:text-slate-700 transition-colors"
                              title="کپی نام کاربری"
                            >
                              {copiedField === `user_${user.username}` ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </td>
                        {/* Password Column */}
                        <td className="py-2.5">
                          <div className="inline-flex items-center gap-1.5 bg-slate-100/90 border border-slate-200/90 px-2 py-1 rounded-lg">
                            <span
                              className="font-mono text-[11px] font-bold text-slate-800 min-w-[55px] text-center"
                              dir="ltr"
                            >
                              {showUserPasswords[user.username] ? user.password || '—' : '••••••'}
                            </span>
                            <button
                              type="button"
                              onClick={() => togglePasswordVisibility(user.username)}
                              className="p-0.5 text-slate-400 hover:text-slate-700 transition-colors"
                              title={showUserPasswords[user.username] ? 'مخفی‌سازی رمز' : 'نمایش رمز عبور'}
                            >
                              {showUserPasswords[user.username] ? (
                                <EyeOff className="w-3.5 h-3.5 text-slate-600" />
                              ) : (
                                <Eye className="w-3.5 h-3.5" />
                              )}
                            </button>
                            {user.password && (
                              <button
                                type="button"
                                onClick={() => copyToClipboard(user.password || '', `pass_${user.username}`)}
                                className="p-0.5 text-slate-400 hover:text-slate-700 transition-colors"
                                title="کپی رمز عبور"
                              >
                                {copiedField === `pass_${user.username}` ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 text-center">
                          <UserTagBadge tag={user.userTag} role={user.role} size="sm" />
                        </td>
                        <td className="py-2.5 text-center font-mono text-slate-700">
                          {toPersianDigits(user.eDate)}
                        </td>
                        <td className="py-2.5 text-center">
                          {user.isBlocked ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-600 text-white shadow-xs">
                              ⛔ مسدود کلی
                            </span>
                          ) : user.restrictedSections && user.restrictedSections.length > 0 ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                              ⚠️ محدود ({toPersianDigits(user.restrictedSections.length)} بخش)
                            </span>
                          ) : user.isExpired ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                              منقضی شده
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              ✔ فعال و مجاز
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 text-left">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleStartEditUser(user)}
                              className="px-2 py-1 rounded-lg text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-[11px] font-bold flex items-center gap-1 transition-colors"
                              title="ویرایش مشخصات، مسدودسازی یا محدود کردن بخش‌های برنامه"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-emerald-700" />
                              <span>ویرایش و دسترسی</span>
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.username)}
                              className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors"
                              title="حذف کامل کاربر از سیستم"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: ARTISANS MANAGEMENT */}
      {activeTab === 'artisans' && (
        <div className="space-y-4">
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                  مدیریت و تایید استادکاران و فروشندگان معرفی‌شده
                </h3>
                <p className="text-[11px] text-slate-500">
                  بررسی و تایید استادکاران و تامین‌کنندگان ثبت‌شده توسط مهندسان جهت انتشار سراسری
                </p>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <div className="flex rounded-xl bg-slate-100 p-0.5 border border-slate-200 text-[11px] flex-wrap gap-0.5">
                  <button
                    onClick={() => setAdminArtisanTypeFilter('all')}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                      adminArtisanTypeFilter === 'all'
                        ? 'bg-white text-slate-900 shadow-xs font-bold'
                        : 'text-slate-600'
                    }`}
                  >
                    همه ({toPersianDigits(storedArtisans.length)})
                  </button>
                  <button
                    onClick={() => setAdminArtisanTypeFilter('engineering')}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                      adminArtisanTypeFilter === 'engineering'
                        ? 'bg-white text-indigo-900 shadow-xs font-bold'
                        : 'text-slate-600'
                    }`}
                  >
                    خدمات مهندسی ({toPersianDigits(storedArtisans.filter((a) => a.entityType === 'engineering_service').length)})
                  </button>
                  <button
                    onClick={() => setAdminArtisanTypeFilter('artisan')}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                      adminArtisanTypeFilter === 'artisan'
                        ? 'bg-white text-slate-900 shadow-xs font-bold'
                        : 'text-slate-600'
                    }`}
                  >
                    استادکاران ({toPersianDigits(storedArtisans.filter((a) => a.entityType === 'artisan' || (!a.entityType && a.entityType !== 'vendor' && a.entityType !== 'engineering_service')).length)})
                  </button>
                  <button
                    onClick={() => setAdminArtisanTypeFilter('vendor')}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                      adminArtisanTypeFilter === 'vendor'
                        ? 'bg-white text-slate-900 shadow-xs font-bold'
                        : 'text-slate-600'
                    }`}
                  >
                    فروشندگان ({toPersianDigits(storedArtisans.filter((a) => a.entityType === 'vendor').length)})
                  </button>
                </div>
              </div>
            </div>

            {storedArtisans.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                هیچ مورد یا خدماتی در سامانه ثبت نشده است.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {storedArtisans
                  .filter((item) => {
                    if (adminArtisanTypeFilter === 'engineering') return item.entityType === 'engineering_service';
                    if (adminArtisanTypeFilter === 'artisan') return item.entityType === 'artisan' || (!item.entityType && item.entityType !== 'vendor' && item.entityType !== 'engineering_service');
                    if (adminArtisanTypeFilter === 'vendor') return item.entityType === 'vendor';
                    return true;
                  })
                  .map((artisan) => {
                  const reviews = artisan.reviews || [];
                  const isReviewsOpen = expandedReviewsArtisanId === artisan.id;

                  return (
                    <div
                      key={artisan.id}
                      className="py-3.5 space-y-2 text-xs"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-900 text-sm">{artisan.fullName}</span>
                            <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] border ${
                              artisan.entityType === 'engineering_service'
                                ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                                : artisan.entityType === 'vendor'
                                ? 'bg-teal-50 text-teal-800 border-teal-200'
                                : 'bg-slate-100 text-slate-700 border-slate-300'
                            }`}>
                              {artisan.entityType === 'engineering_service'
                                ? '📐 خدمات مهندسی'
                                : artisan.entityType === 'vendor'
                                ? '🏢 فروشنده کالا'
                                : '🔨 استادکار'}
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 font-bold text-[10px] border border-sky-200">
                              {artisan.trade}
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 font-mono font-bold text-[10px] border border-amber-200 flex items-center gap-1">
                              <span>⭐</span>
                              <span>{toPersianDigits(artisan.rating ? artisan.rating.toFixed(1) : '5.0')}</span>
                              <span>({toPersianDigits(artisan.ratingCount || reviews.length)} نظر)</span>
                            </span>
                            {artisan.verifiedByAssociation ? (
                              <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>تایید شده توسط انجمن</span>
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 font-bold text-[10px] border border-amber-200 animate-pulse">
                                در انتظار تایید مدیریت
                              </span>
                            )}
                          </div>

                          <div className="text-[11px] text-slate-500 flex items-center gap-3 flex-wrap">
                            <span>سابقه: {toPersianDigits(artisan.experienceYears)} سال</span>
                            <span>تلفن: <span className="font-mono text-slate-700">{artisan.phone}</span></span>
                            <span>محدوده: {artisan.district}</span>
                            {artisan.referrerName && (
                              <span className="text-indigo-700 font-medium">
                                مهندس معرف: {artisan.referrerName}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center">
                          {reviews.length > 0 && (
                            <button
                              onClick={() =>
                                setExpandedReviewsArtisanId(
                                  isReviewsOpen ? null : artisan.id
                                )
                              }
                              className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium flex items-center gap-1 transition-colors"
                            >
                              <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                              <span>نظرات ({toPersianDigits(reviews.length)})</span>
                            </button>
                          )}

                          {!artisan.verifiedByAssociation && (
                            <button
                              onClick={() => handleApproveArtisan(artisan.id, artisan.fullName)}
                              disabled={isProcessingId === artisan.id}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1 shadow-2xs transition-colors"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>تایید و انتشار برای همه</span>
                            </button>
                          )}

                          <button
                            onClick={() => {
                              setEditingArtisan(artisan);
                              setIsEditModalOpen(true);
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold transition-colors flex items-center gap-1 active:scale-95"
                            title="ویرایش مشخصات"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-amber-700" />
                            <span>ویرایش</span>
                          </button>

                          <button
                            onClick={() => handleDeleteArtisan(artisan.id, artisan.fullName)}
                            disabled={isProcessingId === artisan.id}
                            className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-colors"
                            title="حذف استادکار"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>حذف</span>
                          </button>
                        </div>
                      </div>

                      {/* Expandable Reviews list for Admin Moderation */}
                      {isReviewsOpen && reviews.length > 0 && (
                        <div className="mt-2 p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2 animate-fadeIn">
                          <span className="text-[11px] font-bold text-slate-700 block">
                            ارزیابی‌ها و نظرات ثبت‌شده مهندسان برای {artisan.fullName}:
                          </span>
                          <div className="space-y-1.5">
                            {reviews.map((rev: any) => (
                              <div
                                key={rev.id}
                                className="p-2.5 rounded-lg bg-white border border-slate-200 flex items-start justify-between gap-2"
                              >
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2 text-[10px]">
                                    <span className="font-bold text-slate-800">
                                      {getAdminEngineerDisplayName(rev.reviewerName, rev.reviewerUserId)}
                                    </span>
                                    {rev.reviewerLicense && (
                                      <span className="text-slate-400 font-mono">
                                        (پروانه: {rev.reviewerLicense})
                                      </span>
                                    )}
                                    <span className="text-amber-600 font-mono font-bold">
                                      ⭐ {toPersianDigits(rev.score)}
                                    </span>
                                    <span className="text-slate-400 font-mono">{rev.date}</span>
                                  </div>
                                  <p className="text-[11px] text-slate-600 leading-relaxed">
                                    {rev.comment}
                                  </p>
                                </div>
                                <button
                                  onClick={() => handleDeleteReview(artisan.id, rev.id)}
                                  className="text-rose-600 hover:bg-rose-50 p-1 rounded-md text-[10px] flex items-center gap-0.5 shrink-0"
                                  title="حذف این نظر"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  <span>حذف نظر</span>
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Artisan / Vendor Modal */}
      <EditArtisanModal
        isOpen={isEditModalOpen}
        artisan={editingArtisan}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingArtisan(null);
        }}
        onSaveSuccess={(updated) => {
          setStoredArtisans((prev) =>
            prev.map((a) => (a.id === updated.id ? updated : a))
          );
          setActionMessage(`مشخصات «${updated.fullName}» با موفقیت ویرایش و ذخیره گردید.`);
          setTimeout(() => setActionMessage(null), 4000);
        }}
      />

      {/* Edit User & Permissions/Restrictions Modal */}
      <EditUserModal
        isOpen={isUserEditModalOpen}
        user={editingUser}
        onClose={() => {
          setIsUserEditModalOpen(false);
          setEditingUser(null);
        }}
        onSave={handleSaveUserEdit}
        isSaving={isSavingUserEdit}
      />
    </div>
  );
};
