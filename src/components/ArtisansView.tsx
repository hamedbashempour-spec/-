import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Search,
  Phone,
  MapPin,
  CheckCircle,
  CheckCircle2,
  PlusCircle,
  X,
  Star,
  ShieldCheck,
  Building,
  Award,
  MessageSquare,
  ThumbsUp,
  ChevronDown,
  ChevronUp,
  Filter,
  Clock,
  RefreshCw,
  AlertCircle,
  AlertTriangle,
  Trash2,
  Store,
  ShoppingBag,
  Edit3,
  Hammer,
  Briefcase,
  Coins,
  TrendingUp,
  BarChart3,
  FileSpreadsheet,
  Info,
  History,
  ArrowRight,
} from 'lucide-react';
import {
  ArtisanItem,
  ArtisanReview,
  AuthUser,
  WagePriceRecord,
  ArtisanLatestWage,
  WagePriceType,
} from '../types';
import { getCurrentJalaliDate } from '../utils/jalaliDate';
import {
  engineeringCategories,
  artisanCategories,
  vendorCategories,
  initialArtisansData,
} from '../data/artisansData';
import {
  APPROVED_CONSTRUCTION_TRADES,
  getFixedUnitForTrade,
  getApprovedTradeForCategory,
  isWageRateRegistrationAllowed,
} from '../data/wageTradesData';
import { SimpleJalaliDatePicker } from './common/SimpleJalaliDatePicker';
import { EditArtisanModal } from './EditArtisanModal';
import { AdminLoginModal } from './AdminLoginModal';
import { MarketIntroModal } from './market/MarketIntroModal';
import { AddWageRateModal } from './market/AddWageRateModal';
import { WageHistoryModal } from './market/WageHistoryModal';
import { ServiceStatsModal } from './market/ServiceStatsModal';
import { AdminWageModerationModal } from './market/AdminWageModerationModal';
import {
  fetchWagePrices,
  extractArtisansLatestWages,
  calculate30DayStats,
  approveWagePrice,
  rejectWagePrice,
  createWagePrice,
} from '../services/wageRatesService';
import {
  fetchArtisans,
  createArtisan,
  approveArtisan,
  deleteArtisan,
  saveArtisanReview,
  deleteArtisanReview,
} from '../services/artisansFirestore';
import { auth } from '../services/firebase';
import {
  toPersianDigits,
  formatPersianNumber,
  sanitizeNumericInput,
} from '../utils/formatters';
import {
  validateSafeContent,
  containsInappropriateContent,
} from '../utils/contentFilter';
import { trackEvent } from '../utils/analytics';
import { playNotificationChime } from '../services/notificationService';

interface ArtisansViewProps {
  isAdmin?: boolean;
  currentUser?: AuthUser | null;
}

// Built-in mapping of standard users to engineer full names
const KNOWN_ENGINEERS: Record<string, string> = {
  'hmdhmp': 'مهندس حامد هاشم پور',
  'admin': 'مدیریت انجمن مجریان ذیصلاح ارومیه',
  'engineer1': 'مهندس محمد رضایی',
  'test1': 'مهندس علی اکبری',
  'test2': 'مهندس مهدی مرادی',
  'test3': 'مهندس رضوی',
  'engineer_expired': 'مهندس سهراب مرادی',
};

export const ArtisansView: React.FC<ArtisansViewProps> = ({
  isAdmin = false,
  currentUser: propCurrentUser,
}) => {
  // Current session user for auto-filling and 1-review-per-artisan verification
  const currentUser = useMemo(() => {
    if (propCurrentUser) return propCurrentUser;
    try {
      const saved = localStorage.getItem('urmia_user_session');
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  }, [propCurrentUser]);

  // Dynamic user dictionary mapping usernames to engineer full names
  const [usersMap, setUsersMap] = useState<Record<string, string>>(KNOWN_ENGINEERS);

  // Fetch users summary to dynamically build username -> fullName map
  useEffect(() => {
    fetch('/api/auth/users-summary')
      .then((r) => r.json())
      .then((d) => {
        if (d.success && Array.isArray(d.users)) {
          const map: Record<string, string> = { ...KNOWN_ENGINEERS };
          for (const u of d.users) {
            if (u.username) {
              map[u.username.toLowerCase()] = u.fullName || u.name || `مهندس ${u.username}`;
            }
          }
          setUsersMap(map);
        }
      })
      .catch(() => {});
  }, []);

  // Helper to resolve any raw username or ID to the full Persian engineer name
  const getEngineerDisplayName = (name?: string | null, userId?: string | null): string => {
    const raw = (name || '').trim();
    if (!raw && !userId) return 'مهندس عضو انجمن';

    if (raw.includes('ناشناس')) return 'مهندس عضو انجمن (ناشناس)';

    const rawLower = raw.toLowerCase();
    const userLower = (userId || '').trim().toLowerCase();
    const stripped = rawLower.replace(/^مهندس\s*/i, '').trim();

    // 1. Direct or stripped match in usersMap
    if (rawLower && usersMap[rawLower]) return usersMap[rawLower];
    if (stripped && usersMap[stripped]) return usersMap[stripped];
    if (userLower && usersMap[userLower]) return usersMap[userLower];

    // 2. Direct or stripped match in KNOWN_ENGINEERS
    if (rawLower && KNOWN_ENGINEERS[rawLower]) return KNOWN_ENGINEERS[rawLower];
    if (stripped && KNOWN_ENGINEERS[stripped]) return KNOWN_ENGINEERS[stripped];
    if (userLower && KNOWN_ENGINEERS[userLower]) return KNOWN_ENGINEERS[userLower];

    // 3. Current session user
    if (currentUser) {
      const currLower = (currentUser.username || '').toLowerCase();
      if (rawLower === currLower || stripped === currLower || userLower === currLower) {
        return (
          currentUser.fullName ||
          currentUser.name ||
          usersMap[currLower] ||
          KNOWN_ENGINEERS[currLower] ||
          `مهندس ${currentUser.username}`
        );
      }
    }

    // 4. If raw contains Persian characters
    if (/[\u0600-\u06FF]/.test(raw)) {
      if (raw.startsWith('مهندس')) return raw;
      return `مهندس ${raw}`;
    }

    // 5. Fallback: NEVER return raw English username!
    return 'مهندس عضو انجمن';
  };

  // Track admin login state dynamically
  const [localAdminAuthenticated, setLocalAdminAuthenticated] = useState<boolean>(() => {
    try {
      return (
        localStorage.getItem('urmia_admin_authenticated') === 'true' ||
        sessionStorage.getItem('urmia_admin_authenticated') === 'true'
      );
    } catch {
      return false;
    }
  });
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);

  // Determine if current user is admin (via prop, admin login session, or user session)
  const effectiveIsAdmin = useMemo(() => {
    if (isAdmin || localAdminAuthenticated) return true;
    try {
      if (
        localStorage.getItem('urmia_admin_authenticated') === 'true' ||
        sessionStorage.getItem('urmia_admin_authenticated') === 'true'
      ) {
        return true;
      }
      const saved = localStorage.getItem('urmia_user_session');
      if (saved) {
        const u = JSON.parse(saved);
        return (
          u?.role === 'admin' ||
          u?.username === 'hmdhmp' ||
          u?.username === 'admin' ||
          u?.username === 'hamed' ||
          u?.username === 'hm6889'
        );
      }
    } catch {}
    return false;
  }, [isAdmin, localAdminAuthenticated]);

  // Sub-menu: 'artisans' (استادکاران و نرخ دستمزد), 'stats' (تحلیل و آمار نرخ خدمات), 'engineering' (خدمات مهندسی), 'vendors' (فروشندگان کالا)
  const [activeSubTab, setActiveSubTab] = useState<'artisans' | 'stats' | 'engineering' | 'vendors'>('artisans');

  // Construction Wage Rates State
  const [wagePrices, setWagePrices] = useState<WagePriceRecord[]>([]);
  const pendingWagePrices = useMemo(
    () => wagePrices.filter((w) => w.status === 'pending'),
    [wagePrices]
  );
  const pendingWagePricesCount = pendingWagePrices.length;

  const [isIntroModalOpen, setIsIntroModalOpen] = useState<boolean>(() => {
    try {
      return localStorage.getItem('urmia_market_intro_seen') !== 'true';
    } catch {
      return false;
    }
  });

  // Wage Modals State
  const [addWageModalOpen, setAddWageModalOpen] = useState(false);
  const [addWagePreselectedArtisan, setAddWagePreselectedArtisan] = useState<ArtisanItem | null>(null);
  const [addWagePreselectedService, setAddWagePreselectedService] = useState<string | undefined>(undefined);

  const [wageHistoryModalOpen, setWageHistoryModalOpen] = useState(false);
  const [historyModalArtisan, setHistoryModalArtisan] = useState<ArtisanItem | null>(null);
  const [historyModalService, setHistoryModalService] = useState<string>('آرماتوربند');
  const [historyModalUnit, setHistoryModalUnit] = useState<string>('مترمربع');

  const [serviceStatsModalOpen, setServiceStatsModalOpen] = useState(false);
  const [statsModalService, setStatsModalService] = useState<string>('آرماتوربند');

  const [adminWageModalOpen, setAdminWageModalOpen] = useState(false);
  const [serviceSearchQuery, setServiceSearchQuery] = useState('');

  const [selectedCategory, setSelectedCategory] = useState<string>('همه دسته‌ها');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'rating_desc' | 'exp_desc' | 'name'>('rating_desc');
  // Random seed for engineering services tab to display ads in random order
  const [engineeringRandomSeed, setEngineeringRandomSeed] = useState<number>(() => Date.now());
  const [expandedReviewsId, setExpandedReviewsId] = useState<string | null>(null);

  const [isProcessingId, setIsProcessingId] = useState<string | null>(null);
  const [adminActionMessage, setAdminActionMessage] = useState<string | null>(null);

  // Map of reviews submitted by this device/user: { [artisanId]: reviewId }
  const [userReviewsMap, setUserReviewsMap] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('urmia_user_reviews');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Approved artisans fetched from server and cached locally
  const [approvedArtisans, setApprovedArtisans] = useState<ArtisanItem[]>(() => {
    try {
      const saved = localStorage.getItem('urmia_artisans_data');
      if (saved) {
        const parsed: ArtisanItem[] = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
      return initialArtisansData;
    } catch {
      return initialArtisansData;
    }
  });

  // Locally submitted pending artisans waiting for admin approval
  const [pendingArtisans, setPendingArtisans] = useState<ArtisanItem[]>(() => {
    try {
      const savedPending = localStorage.getItem('urmia_pending_artisans');
      if (savedPending) {
        return JSON.parse(savedPending);
      }
      return [];
    } catch {
      return [];
    }
  });

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Modal 1: Add Engineering Service / Artisan / Vendor
  const [modalOpen, setModalOpen] = useState(false);
  const [newEntityType, setNewEntityType] = useState<'engineering_service' | 'artisan' | 'vendor'>('engineering_service');
  const [newFullName, setNewFullName] = useState('');
  const [newStoreName, setNewStoreName] = useState('');
  const [newManagerName, setNewManagerName] = useState('');
  const [newTrade, setNewTrade] = useState('طراحی سازه');
  const [newPhone, setNewPhone] = useState('');
  const [newDistrict, setNewDistrict] = useState('');
  const [newYears, setNewYears] = useState('10');
  const [newDesc, setNewDesc] = useState('');
  const [newEngineerName, setNewEngineerName] = useState(() => {
    try {
      const saved = localStorage.getItem('urmia_user_session');
      if (saved) {
        const u = JSON.parse(saved);
        if (u?.name) return u.name;
        if (u?.username) return u.username;
      }
    } catch {}
    return '';
  });
  const [newEngineerLicense, setNewEngineerLicense] = useState(() => {
    try {
      const saved = localStorage.getItem('urmia_user_session');
      if (saved) {
        const u = JSON.parse(saved);
        if (u?.licenseNumber) return u.licenseNumber;
      }
    } catch {}
    return '';
  });
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [newWageAmount, setNewWageAmount] = useState('');
  const [newWageType, setNewWageType] = useState<WagePriceType>('executed_contract');
  const [newWageDate, setNewWageDate] = useState(() => getCurrentJalaliDate().formatted);
  const [newWageNote, setNewWageNote] = useState('');

  // Sync newEngineerName with active engineer real name
  useEffect(() => {
    if (currentUser) {
      const activeName =
        currentUser.fullName ||
        currentUser.name ||
        usersMap[currentUser.username.toLowerCase()] ||
        (currentUser.username.startsWith('مهندس') ? currentUser.username : `مهندس ${currentUser.username}`);
      setNewEngineerName(activeName);
    }
  }, [currentUser, usersMap]);

  // Modal 2: Rate & Review (Strictly 1 review per user, editable)
  const [rateModalOpen, setRateModalOpen] = useState(false);
  const [selectedArtisanForRating, setSelectedArtisanForRating] = useState<ArtisanItem | null>(null);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [isAnonymousReview, setIsAnonymousReview] = useState(false);
  const [reviewScore, setReviewScore] = useState<number>(5);
  const [reviewQuality, setReviewQuality] = useState<number>(5);
  const [reviewSpeed, setReviewSpeed] = useState<number>(5);
  const [reviewSafety, setReviewSafety] = useState<number>(5);
  const [reviewerName, setReviewerName] = useState('');
  const [reviewerLicense, setReviewerLicense] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [rateSuccess, setRateSuccess] = useState(false);

  // Modal 3: Edit Artisan or Vendor (Admin action)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingArtisan, setEditingArtisan] = useState<ArtisanItem | null>(null);

  // Fetch all artisans and wage rates with local caching
  const fetchLiveArtisans = async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    try {
      const [artisanItems, wageItems] = await Promise.all([
        fetchArtisans(true),
        fetchWagePrices({ status: effectiveIsAdmin ? 'all' : 'approved' }),
      ]);

      if (Array.isArray(artisanItems)) {
        setApprovedArtisans(artisanItems);
        setPendingArtisans([]);
        try {
          localStorage.removeItem('urmia_pending_artisans');
        } catch {}
      }

      if (Array.isArray(wageItems)) {
        setWagePrices(wageItems);
      }
    } catch (err) {
      console.warn('Network issue fetching live artisans and wages:', err);
    } finally {
      if (isManual) {
        setTimeout(() => setIsRefreshing(false), 400);
      }
    }
  };

  // Dynamic map of latest approved wages per artisan: Map<artisanId, ArtisanLatestWage[]>
  const latestWagesMap = useMemo(() => {
    return extractArtisansLatestWages(wagePrices);
  }, [wagePrices]);

  // Pre-indexed map of pending wages per artisan for instant O(1) card lookups
  const pendingWagesByArtisanId = useMemo(() => {
    const map = new Map<string, WagePriceRecord[]>();
    for (const w of wagePrices) {
      if (w.status === 'pending') {
        const list = map.get(w.artisanId) || [];
        list.push(w);
        map.set(w.artisanId, list);
      }
    }
    return map;
  }, [wagePrices]);

  // Pre-computed 30-day stats map for the 12 trades to avoid redundant recalculations
  const tradesStatsMap = useMemo(() => {
    const map = new Map<string, ReturnType<typeof calculate30DayStats>>();
    for (const trade of APPROVED_CONSTRUCTION_TRADES) {
      map.set(trade.title, calculate30DayStats(wagePrices, trade.title, 'all'));
    }
    return map;
  }, [wagePrices]);

  useEffect(() => {
    fetchLiveArtisans(false);

    // Auto-sync every 30s to keep all clients updated smoothly without CPU load
    const pollInterval = setInterval(() => {
      fetchLiveArtisans(false);
    }, 30000);

    const handleWindowFocus = () => {
      fetchLiveArtisans(false);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchLiveArtisans(false);
      }
    };

    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(pollInterval);
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [effectiveIsAdmin]);

  // Combined list for display (all artisans are active and approved)
  const artisans = useMemo(() => {
    return approvedArtisans;
  }, [approvedArtisans]);

  // Admin Approval: approve pending artisan and publish globally
  const handleApproveArtisan = async (id: string, name?: string) => {
    const displayName = name || 'استادکار';
    setIsProcessingId(id);
    try {
      await approveArtisan(id);
      playNotificationChime();
      setApprovedArtisans((prev) =>
        prev.map((a) => (a.id === id ? { ...a, verifiedByAssociation: true, status: 'approved' } : a))
      );
      setPendingArtisans((prev) => prev.filter((a) => a.id !== id));
      setAdminActionMessage(`استادکار «${displayName}» با موفقیت فعال و برای کلیه کاربران منتشر گردید.`);
      setTimeout(() => setAdminActionMessage(null), 5000);
    } catch (err) {
      console.warn('Notice approving artisan:', err);
    } finally {
      setIsProcessingId(null);
    }
  };

  // Admin Deletion: remove an artisan
  const handleDeleteArtisan = async (id: string, name?: string) => {
    const displayName = name || 'استادکار';
    if (!confirm(`آیا از حذف استادکار «${displayName}» اطمینان دارید؟`)) return;
    setIsProcessingId(id);
    try {
      await deleteArtisan(id);
      setAdminActionMessage(`استادکار «${displayName}» با موفقیت حذف گردید.`);
      setTimeout(() => setAdminActionMessage(null), 4000);
      await fetchLiveArtisans(false);
    } catch {
      alert('خطا در حذف استادکار از پایگاه داده ابری.');
    } finally {
      setIsProcessingId(null);
    }
  };

  // Admin Quick Approval for Wage Prices
  const handleQuickApproveWage = async (wageId: string, serviceTitle: string) => {
    if (!effectiveIsAdmin) {
      setIsAdminLoginOpen(true);
      return;
    }
    setIsProcessingId(wageId);
    try {
      const updated = await approveWagePrice(wageId);
      setWagePrices((prev) =>
        prev.map((w) => (w.id === wageId ? { ...w, status: 'approved', approvedAt: updated?.approvedAt || 'هم‌اکنون' } : w))
      );
      playNotificationChime();
      setAdminActionMessage(`سابقه نرخ «${serviceTitle}» با موفقیت تأیید شد و در بازار منتشر گردید.`);
      setTimeout(() => setAdminActionMessage(null), 5000);
      await fetchLiveArtisans(false);
    } catch (err: any) {
      console.error('Error approving wage:', err);
      setAdminActionMessage(`خطا در تأیید نرخ: ${err?.message || 'مشکل در برقراری ارتباط با سرور'}`);
      setTimeout(() => setAdminActionMessage(null), 5000);
    } finally {
      setIsProcessingId(null);
    }
  };

  // Admin Quick Rejection for Wage Prices
  const handleQuickRejectWage = async (wageId: string, serviceTitle: string) => {
    if (!effectiveIsAdmin) {
      setIsAdminLoginOpen(true);
      return;
    }
    let reason = 'عدم انطباق با نرخ متعارف روز';
    try {
      const userReason = window.prompt('لطفاً دلیل رد سابقه نرخ را بنویسید (یا خالی بگذارید):', reason);
      if (userReason === null) {
        return; // user clicked cancel
      }
      if (userReason.trim()) {
        reason = userReason.trim();
      }
    } catch {
      // safe fallback if prompt is suppressed
    }

    setIsProcessingId(wageId);
    try {
      const updated = await rejectWagePrice(wageId, reason);
      setWagePrices((prev) =>
        prev.map((w) => (w.id === wageId ? { ...w, status: 'rejected', rejectionReason: reason } : w))
      );
      setAdminActionMessage(`سابقه نرخ «${serviceTitle}» رد گردید.`);
      setTimeout(() => setAdminActionMessage(null), 5000);
      await fetchLiveArtisans(false);
    } catch (err: any) {
      console.error('Error rejecting wage:', err);
      setAdminActionMessage(`خطا در رد نرخ: ${err?.message || 'مشکل در برقراری ارتباط با سرور'}`);
      setTimeout(() => setAdminActionMessage(null), 5000);
    } finally {
      setIsProcessingId(null);
    }
  };

  // Helper to determine if current logged-in user can edit this item
  // Admin can edit everything. In engineering services, the author can edit their own listing.
  const canUserEditItem = (item: ArtisanItem): boolean => {
    if (effectiveIsAdmin) return true;
    if (item.entityType !== 'engineering_service') return false;
    if (!currentUser) return false;

    const uId = String(currentUser.id || '').trim().toLowerCase();
    const uName = String(currentUser.username || '').trim().toLowerCase();
    const uPhone = String(currentUser.phone || '').trim().replace(/\D/g, '');
    const uFull = String(currentUser.fullName || currentUser.name || '').trim().toLowerCase();

    // Check by createdByUserId or referrerUserId
    const itemCreatorId = String(item.createdByUserId || item.referrerUserId || '').trim().toLowerCase();
    if (itemCreatorId && (itemCreatorId === uId || itemCreatorId === uName)) return true;

    // Check by createdByUsername
    const itemCreatorUsername = String(item.createdByUsername || '').trim().toLowerCase();
    if (itemCreatorUsername && itemCreatorUsername === uName) return true;

    // Check by phone number
    const itemPhone = String(item.phone || '').trim().replace(/\D/g, '');
    if (uPhone && itemPhone && (itemPhone === uPhone || itemPhone.endsWith(uPhone) || uPhone.endsWith(itemPhone))) return true;

    // Check by full name or manager name
    const itemFull = String(item.fullName || item.managerName || '').trim().toLowerCase();
    if (uFull && itemFull && (itemFull.includes(uFull) || uFull.includes(itemFull))) return true;

    return false;
  };

  // Helper to check if current user has already reviewed this artisan/vendor
  const getUserReview = (artisan: ArtisanItem): ArtisanReview | null => {
    if (!artisan.reviews || artisan.reviews.length === 0) return null;
    const currentFbUid = auth.currentUser?.uid;
    const currentUserId = currentUser?.id || currentUser?.username;
    const currentPhone = currentUser?.phone;
    const currentLicense = currentUser?.licenseNumber || currentUser?.license;
    const savedReviewId = userReviewsMap[artisan.id];

    return (
      artisan.reviews.find((r) => {
        if (currentFbUid && (r.reviewerUserId === currentFbUid || r.id === `rev_${artisan.id}_${currentFbUid}`)) return true;
        if (savedReviewId && r.id === savedReviewId) return true;
        if (currentUserId && r.reviewerUserId && r.reviewerUserId === currentUserId) return true;
        if (currentPhone && r.reviewerPhone && r.reviewerPhone === currentPhone) return true;
        if (currentLicense && r.reviewerLicense && r.reviewerLicense === currentLicense) return true;
        return false;
      }) || null
    );
  };

  // Open review modal: if user already reviewed, prefill their previous data for editing!
  const handleOpenRateModal = (artisan: ArtisanItem) => {
    setSelectedArtisanForRating(artisan);
    const existing = getUserReview(artisan);
    const activeName =
      currentUser?.fullName ||
      currentUser?.name ||
      (currentUser?.username
        ? usersMap[currentUser.username.toLowerCase()] || KNOWN_ENGINEERS[currentUser.username.toLowerCase()] || `مهندس ${currentUser.username}`
        : '') ||
      'مهندس عضو انجمن';

    if (existing) {
      setEditingReviewId(existing.id);
      setIsAnonymousReview(Boolean(existing.isAnonymous || existing.reviewerName?.includes('ناشناس')));
      setReviewScore(existing.score || 5);
      setReviewQuality(existing.criteria?.quality || existing.score || 5);
      setReviewSpeed(existing.criteria?.speed || existing.score || 5);
      setReviewSafety(existing.criteria?.safety || existing.score || 5);
      setReviewComment(existing.comment || '');
      const resolvedExisting = getEngineerDisplayName(existing.reviewerName, existing.reviewerUserId);
      setReviewerName(existing.isAnonymous ? '' : (resolvedExisting || activeName));
      setReviewerLicense(existing.reviewerLicense || currentUser?.licenseNumber || '');
    } else {
      setEditingReviewId(null);
      setIsAnonymousReview(false);
      setReviewScore(5);
      setReviewQuality(5);
      setReviewSpeed(5);
      setReviewSafety(5);
      setReviewComment('');
      setReviewerName(activeName);
      setReviewerLicense(currentUser?.licenseNumber || '');
    }
    setRateModalOpen(true);
  };

  // Handle Add Engineering Service, Artisan or Vendor: sends to server, sets to approved
  const handleAddArtisan = async (e: React.FormEvent) => {
    e.preventDefault();
    const isEngineering = newEntityType === 'engineering_service';
    const isVendor = newEntityType === 'vendor';
    const mainTitle = isVendor ? (newStoreName.trim() || newFullName.trim()) : newFullName.trim();

    if (!mainTitle || !newPhone.trim()) {
      alert(
        isEngineering
          ? 'لطفاً نام مهندس یا عنوان دفتر مهندسی و شماره تماس را وارد فرمایید.'
          : isVendor
          ? 'لطفاً نام فروشگاه و شماره تماس را وارد فرمایید.'
          : 'لطفاً نام استادکار و شماره تماس را وارد فرمایید.'
      );
      return;
    }

    const effectiveEngineer = newEngineerName.trim() || (isEngineering ? mainTitle : '');
    if (!effectiveEngineer) {
      alert(
        'وارد کردن «نام مهندس معرف یا ثبت‌کننده» الزامی است. جهت حفظ اصالت سامانه، معرفی کلیه خدمات باید توسط یک عضو یا مهندس انجام گیرد.'
      );
      return;
    }

    // CONTENT PROFANITY AND INSULT FILTER
    const validation = validateSafeContent([
      { label: isEngineering ? 'نام مهندس/دفتر' : isVendor ? 'نام فروشگاه' : 'نام استادکار', value: mainTitle },
      { label: 'نام معرف', value: effectiveEngineer },
      { label: 'محدوده فعالیت', value: newDistrict },
      { label: 'توضیحات و سوابق', value: newDesc },
    ]);

    if (!validation.isValid) {
      alert(validation.errorMessage);
      return;
    }

    setIsSubmitting(true);

    const payload = {
      entityType: newEntityType,
      fullName: mainTitle,
      storeName: isVendor ? (newStoreName.trim() || mainTitle) : isEngineering ? (newStoreName.trim() || undefined) : undefined,
      managerName: isVendor && newManagerName.trim() ? newManagerName.trim() : undefined,
      trade: newTrade,
      tradeCategory: newTrade,
      experienceYears: Number(newYears) || (isEngineering ? 10 : 5),
      phone: newPhone.trim(),
      district: newDistrict.trim() || 'ارومیه',
      description: newDesc.trim() || (isEngineering ? `خدمات مهندسی ${newTrade} توسط ${mainTitle}` : `معرفی‌شده توسط مهندس ${effectiveEngineer}`),
      referrerName: effectiveEngineer,
      referrerLicense: newEngineerLicense.trim() || undefined,
      referrerUserId: currentUser?.id || currentUser?.username || undefined,
      createdByUserId: currentUser?.id || currentUser?.username || undefined,
      createdByUsername: currentUser?.username || undefined,
    };

    try {
      // 1. Primary: Save directly to Server and Cloud Firestore!
      const createdItem: ArtisanItem = await createArtisan(payload);

      // Immediately add to approved list in state
      setApprovedArtisans((prev) => [createdItem, ...prev.filter((p) => p.id !== createdItem.id)]);

      trackEvent(
        'add_artisan',
        isEngineering ? 'بازار خدمات مهندسی' : isVendor ? 'بازار فروشندگان' : 'سامانه استادکاران',
        `ثبت ${createdItem.fullName} (${createdItem.trade})`
      );

      // 2. If initial wage rate was entered for one of the 12 approved trades, register it too!
      const numericWage = Number(sanitizeNumericInput(newWageAmount, false));
      if (newEntityType === 'artisan' && isWageRateRegistrationAllowed(newTrade) && numericWage > 0) {
        const matchedTrade = getApprovedTradeForCategory(newTrade);
        const tradeTitle = matchedTrade ? matchedTrade.title : newTrade;
        const tradeUnit = matchedTrade ? matchedTrade.unit : getFixedUnitForTrade(newTrade);
        try {
          await createWagePrice({
            artisanId: createdItem.id,
            artisanName: createdItem.fullName,
            artisanPhone: createdItem.phone,
            serviceTitle: tradeTitle,
            unit: tradeUnit,
            priceAmountTomans: numericWage,
            priceType: newWageType,
            actionDate: newWageDate.trim() || getCurrentJalaliDate().formatted,
            note: newWageNote.trim() || undefined,
            registeredByUserId: currentUser?.username || 'guest',
            registeredByEngineerName: effectiveEngineer,
            registeredByLicense: newEngineerLicense.trim() || undefined,
          });
        } catch (wageErr) {
          console.warn('Could not register initial wage price:', wageErr);
        }
      }

      setSubmitSuccess(true);
      setTimeout(() => {
        setSubmitSuccess(false);
        setModalOpen(false);
        setNewFullName('');
        setNewStoreName('');
        setNewManagerName('');
        setNewPhone('');
        setNewDistrict('');
        setNewDesc('');
        setNewWageAmount('');
        setNewWageType('executed_contract');
        setNewWageDate(getCurrentJalaliDate().formatted);
        setNewWageNote('');
        setIsSubmitting(false);
      }, 2000);

      fetchLiveArtisans(false);
    } catch (err) {
      console.error('Error submitting:', err);
      alert('خطا در ثبت اطلاعات در پایگاه داده. لطفاً مجدداً تلاش فرمایید.');
      setIsSubmitting(false);
    }
  };

  // Handle Submit Rating (Strictly 1 review per user, with in-place edit)
  const handleSubmitRating = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedArtisanForRating) return;

    if (!isAnonymousReview && !reviewerName.trim()) {
      alert('لطفاً نام مهندس نظردهنده را وارد فرمایید یا گزینه «ثبت نظر به صورت ناشناس» را انتخاب فرمایید.');
      return;
    }

    // Comment text is OPTIONAL (مهندس می‌تواند بدون نوشتن نظر، فقط امتیاز بدهد)
    const cleanComment = reviewComment.trim();
    if (cleanComment) {
      // PROFANITY & INSULT FILTER FOR COMMENTS
      const commentCheck = validateSafeContent([
        { label: 'متن ارزیابی و نظر', value: cleanComment },
      ]);
      if (!commentCheck.isValid) {
        alert(commentCheck.errorMessage);
        return;
      }
    }

    setIsSubmittingReview(true);

    const activeFallback =
      currentUser?.fullName ||
      currentUser?.name ||
      (currentUser?.username
        ? usersMap[currentUser.username.toLowerCase()] || KNOWN_ENGINEERS[currentUser.username.toLowerCase()]
        : '') ||
      'مهندس عضو انجمن';

    const finalReviewerName = isAnonymousReview
      ? 'مهندس عضو انجمن (ناشناس)'
      : (reviewerName.trim() || activeFallback);

    const reviewPayload = {
      reviewId: editingReviewId || undefined,
      reviewerUserId: currentUser?.id || currentUser?.username || undefined,
      reviewerPhone: isAnonymousReview ? undefined : (currentUser?.phone || undefined),
      reviewerName: finalReviewerName,
      reviewerLicense: isAnonymousReview ? undefined : (reviewerLicense.trim() || undefined),
      isAnonymous: isAnonymousReview,
      score: reviewScore,
      comment: cleanComment,
      criteria: {
        quality: reviewQuality,
        speed: reviewSpeed,
        safety: reviewSafety,
        commitment: reviewScore,
      },
    };

    try {
      // 1. Primary: Save review to server persistent storage and Cloud Firestore
      const result = await saveArtisanReview(selectedArtisanForRating.id, reviewPayload);

      // Update state
      setApprovedArtisans((prev) =>
        prev.map((a) =>
          a.id === selectedArtisanForRating.id
            ? {
                ...a,
                rating: result.newRating,
                ratingCount: result.newRatingCount,
                reviews: [
                  result.review,
                  ...(a.reviews || []).filter((r) => r.id !== result.review.id),
                ],
              }
            : a
        )
      );

      // Save user review mapping locally so this device recognizes the review
      const updatedMap = { ...userReviewsMap, [selectedArtisanForRating.id]: result.review.id };
      setUserReviewsMap(updatedMap);
      try {
        localStorage.setItem('urmia_user_reviews', JSON.stringify(updatedMap));
      } catch {}

      trackEvent(
        'add_review',
        'سامانه استادکاران و فروشندگان',
        `ثبت ارزیابی برای ${selectedArtisanForRating.fullName}`
      );
      setRateSuccess(true);
      setTimeout(() => {
        setRateSuccess(false);
        setRateModalOpen(false);
        setSelectedArtisanForRating(null);
        setEditingReviewId(null);
        setReviewComment('');
        setIsSubmittingReview(false);
      }, 1500);

      // Re-fetch fresh data from server for all devices
      await fetchLiveArtisans(false);
    } catch (err: any) {
      console.error('Error submitting review:', err);
      alert('خطا در ثبت ارزیابی و امتیاز: ' + (err?.message || 'لطفاً اتصال اینترنت خود را بررسی فرمایید.'));
      setIsSubmittingReview(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!selectedArtisanForRating || !editingReviewId) return;
    if (!confirm('آیا از حذف ارزیابی و امتیاز خود برای این مورد اطمینان دارید؟')) return;

    setIsSubmittingReview(true);
    try {
      const { newRating, newRatingCount } = await deleteArtisanReview(
        selectedArtisanForRating.id,
        editingReviewId
      );

      setApprovedArtisans((prev) =>
        prev.map((a) =>
          a.id === selectedArtisanForRating.id
            ? {
                ...a,
                rating: newRating,
                ratingCount: newRatingCount,
                reviews: (a.reviews || []).filter((r) => r.id !== editingReviewId),
              }
            : a
        )
      );

      const updatedMap = { ...userReviewsMap };
      delete updatedMap[selectedArtisanForRating.id];
      setUserReviewsMap(updatedMap);
      try {
        localStorage.setItem('urmia_user_reviews', JSON.stringify(updatedMap));
      } catch {}

      setRateModalOpen(false);
      setSelectedArtisanForRating(null);
      setEditingReviewId(null);
      setReviewComment('');
      await fetchLiveArtisans(false);
    } catch (err) {
      console.error('Error deleting review:', err);
      alert('خطا در حذف نظر. شما فقط مجاز به حذف نظر ثبت‌شده توسط خود هستید.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Filtered and Sorted Artisans / Vendors (filtering out any inappropriate content)
  const filteredArtisans = useMemo(() => {
    let result = artisans.filter((item) => {
      // Automatic Profanity/Insult Filter for entries
      if (
        containsInappropriateContent(item.fullName) ||
        containsInappropriateContent(item.description) ||
        containsInappropriateContent(item.referrerName)
      ) {
        return false;
      }

      // Filter by sub-tab: engineering vs artisans vs vendors
      if (activeSubTab === 'engineering') {
        if (item.entityType !== 'engineering_service') return false;
      } else if (activeSubTab === 'artisans') {
        if (item.entityType === 'vendor' || item.entityType === 'engineering_service') return false;
      } else if (activeSubTab === 'vendors') {
        if (item.entityType !== 'vendor') return false;
      }

      if (selectedCategory === 'در انتظار تایید مدیریت') {
        return !item.verifiedByAssociation || item.status === 'pending';
      }

      const matchesCat =
        selectedCategory === 'همه دسته‌ها' ||
        item.tradeCategory === selectedCategory ||
        item.trade === selectedCategory;

      const matchesSearch =
        !searchQuery.trim() ||
        item.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.storeName && item.storeName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        item.trade.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesCat && matchesSearch;
    });

    // In engineering services: Display ads in random order as requested by user
    // In artisans and vendors: Display by rating (highest first) as standard
    if (activeSubTab === 'engineering') {
      // Deterministic hash based on item id and engineeringRandomSeed so order is stable within render session
      const getHash = (str: string, seed: number) => {
        let h = seed;
        for (let i = 0; i < str.length; i++) {
          h = Math.imul(31, h) + str.charCodeAt(i) | 0;
        }
        return h;
      };
      result.sort((a, b) => getHash(a.id, engineeringRandomSeed) - getHash(b.id, engineeringRandomSeed));
    } else {
      result.sort((a, b) => {
        if (sortBy === 'rating_desc') return (b.rating || 0) - (a.rating || 0);
        if (sortBy === 'exp_desc') return b.experienceYears - a.experienceYears;
        if (sortBy === 'name') return a.fullName.localeCompare(b.fullName, 'fa');
        return 0;
      });
    }

    return result;
  }, [artisans, activeSubTab, selectedCategory, searchQuery, sortBy, engineeringRandomSeed]);

  const currentCategories =
    activeSubTab === 'engineering'
      ? engineeringCategories
      : activeSubTab === 'vendors'
      ? vendorCategories
      : artisanCategories;

  const pendingForCurrentTab = pendingArtisans.filter((p) =>
    activeSubTab === 'engineering'
      ? p.entityType === 'engineering_service'
      : activeSubTab === 'vendors'
      ? p.entityType === 'vendor'
      : p.entityType !== 'vendor' && p.entityType !== 'engineering_service'
  );

  return (
    <div className="space-y-4 pb-12 animate-fadeIn text-right">
      {/* Title Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-teal-800 bg-teal-100 px-2 py-0.5 rounded-md border border-teal-300">
              بازار
            </span>
            <h1 className="text-base font-bold text-slate-900">
              بانک اطلاعات نرخ خدمات ساختمانی و استادکاران ارومیه
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            سوابق واقعی دستمزد خدمات ساختمانی، تحلیل و آمار ۳۰ روز اخیر، و فهرست اکیپ‌های اجرایی
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Wage Rate Bank Button - بالای صفحه سمت چپ */}
          <button
            type="button"
            onClick={() => {
              setActiveSubTab(activeSubTab === 'stats' ? 'artisans' : 'stats');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs active:scale-95 ${
              activeSubTab === 'stats'
                ? 'bg-teal-700 text-white ring-2 ring-teal-400 shadow-sm border border-teal-600'
                : 'bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-300'
            }`}
            title="مشاهده بانک اطلاعات و تحلیل ۳۰ روزه نرخ دستمزد ۱۲ خدمت ساختمانی"
          >
            <TrendingUp className={`w-3.5 h-3.5 ${activeSubTab === 'stats' ? 'text-teal-200' : 'text-teal-700'}`} />
            <span>بانک نرخ دستمزد</span>
            <span
              className={`font-mono text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                activeSubTab === 'stats'
                  ? 'bg-white text-teal-900 shadow-2xs'
                  : 'bg-teal-200/90 text-teal-950'
              }`}
            >
              ۱۲ خدمت
            </span>
          </button>

          {/* Market Intro Guide Button */}
          <button
            onClick={() => setIsIntroModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 hover:bg-teal-100 text-xs font-bold transition-colors shadow-2xs cursor-pointer"
            title="آشنایی با اهداف و کارکرد بانک اطلاعات نرخ خدمات"
          >
            <Info className="w-3.5 h-3.5 text-teal-600" />
            <span>درباره بازار</span>
          </button>

          {/* Admin Moderation Button: ONLY visible for system admin */}
          {effectiveIsAdmin && (
            <button
              onClick={() => setAdminWageModalOpen(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs shadow-2xs transition-all cursor-pointer ${
                pendingWagePricesCount > 0
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 ring-2 ring-amber-400/50 animate-pulse'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200'
              }`}
              title="بررسی، تأیید یا رد سوابق نرخ دستمزد و خروجی اکسل (ویژه مدیریت)"
            >
              <ShieldCheck className={`w-3.5 h-3.5 ${pendingWagePricesCount > 0 ? 'text-slate-950' : 'text-amber-600'}`} />
              <span>
                مدیریت و تایید نرخ‌ها
                {pendingWagePricesCount > 0 && ` (${toPersianDigits(pendingWagePricesCount)} در انتظار)`}
              </span>
            </button>
          )}

          <button
            onClick={() => fetchLiveArtisans(true)}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs disabled:opacity-50"
            title="به‌روزرسانی و دریافت آخرین سوابق"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>به‌روزرسانی</span>
          </button>

          <button
            onClick={() => {
              const targetEntity =
                activeSubTab === 'engineering'
                  ? 'engineering_service'
                  : activeSubTab === 'vendors'
                  ? 'vendor'
                  : 'artisan';
              setNewEntityType(targetEntity);
              setNewTrade(
                targetEntity === 'engineering_service'
                  ? 'طراحی سازه'
                  : targetEntity === 'vendor'
                  ? 'مصالح ساختمانی (سیمان، گچ، آجر، بلوک)'
                  : 'آرماتوربند'
              );
              setModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs shadow-2xs transition-colors shrink-0"
          >
            <PlusCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>
              {activeSubTab === 'engineering'
                ? 'معرفی خدمات مهندسی'
                : activeSubTab === 'vendors'
                ? 'ثبت فروشنده جدید'
                : 'ثبت استادکار جدید'}
            </span>
          </button>
        </div>
      </div>

      {/* Prominent Attention Banner for Pending Wage Rates (Only for Admin) */}
      {effectiveIsAdmin && pendingWagePricesCount > 0 && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-orange-400 text-slate-950 border-2 border-amber-600 shadow-md flex flex-col sm:flex-row items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-950 text-amber-400 flex items-center justify-center font-bold shrink-0 shadow-sm">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h4 className="font-bold text-xs sm:text-sm">
                توجه مدیریت: {toPersianDigits(pendingWagePricesCount)} سابقه نرخ خدمات ساختمانی جدید در انتظار بررسی و تایید شماست
              </h4>
              <p className="text-[11px] text-slate-900 mt-0.5">
                سوابق ثبت‌شده پس از بررسی و تایید توسط شما، در آمار ۳۰ روزه بازار و کارت استادکاران منتشر خواهند شد.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              if (effectiveIsAdmin) {
                setAdminWageModalOpen(true);
              } else {
                setIsAdminLoginOpen(true);
              }
            }}
            className="px-4 py-2 rounded-xl bg-slate-950 hover:bg-slate-900 text-amber-300 font-bold text-xs transition-colors shrink-0 shadow-md flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>بررسی و تایید سوابق نرخ ({toPersianDigits(pendingWagePricesCount)})</span>
          </button>
        </div>
      )}

      {/* Main Market Sections Navigation (3 Compact Stacked Items) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-2 sm:p-2.5 shadow-2xs space-y-1.5">
        <div className="flex items-center justify-between px-1 mb-0.5">
          <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-500 inline-block" />
            <span>انتخاب بخش بازار:</span>
          </span>
          <span className="text-[11px] text-slate-400">
            {activeSubTab === 'artisans'
              ? 'نمایش فهرست استادکاران'
              : activeSubTab === 'engineering'
              ? 'نمایش فهرست خدمات مهندسی'
              : activeSubTab === 'vendors'
              ? 'نمایش فهرست فروشندگان کالا'
              : 'مشاهده بانک اطلاعات نرخ دستمزد'}
          </span>
        </div>

        <div className="flex flex-col gap-1.5">
          {/* 1. استادکاران */}
          <button
            type="button"
            onClick={() => {
              setActiveSubTab('artisans');
              setSelectedCategory('همه دسته‌ها');
            }}
            className={`w-full flex items-center justify-between gap-2.5 px-3 py-2 sm:py-2.5 rounded-xl border text-right transition-all cursor-pointer active:scale-[0.99] ${
              activeSubTab === 'artisans'
                ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-xs ring-2 ring-amber-400/40'
                : 'bg-slate-50/70 hover:bg-slate-100/90 text-slate-700 border-slate-200/80'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                  activeSubTab === 'artisans'
                    ? 'bg-black/15 text-slate-950'
                    : 'bg-amber-100/80 text-amber-800 border border-amber-200/60'
                }`}
              >
                <Hammer className="w-4 h-4" />
              </div>
              <div className="text-right leading-snug">
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  <span className="text-xs sm:text-sm font-bold">
                    استادکاران ساختمانی
                  </span>
                  <span
                    className={`text-[10px] sm:text-[11px] font-normal ${
                      activeSubTab === 'artisans' ? 'text-amber-950 font-medium' : 'text-slate-500'
                    }`}
                  >
                    (اکیپ‌های اجرایی، آرماتوربند، بنا، برقکار، گچکار، کاشیکار، لوله‌کش، جوشکار و...)
                  </span>
                </div>
              </div>
            </div>
            <span
              className={`font-mono text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${
                activeSubTab === 'artisans'
                  ? 'bg-slate-950 text-amber-300 shadow-2xs'
                  : 'bg-white text-slate-700 border border-slate-200'
              }`}
            >
              {toPersianDigits(
                artisans.filter(
                  (a) =>
                    a.entityType === 'artisan' ||
                    (!a.entityType && a.entityType !== 'vendor' && a.entityType !== 'engineering_service')
                ).length
              )}{' '}
              نفر
            </span>
          </button>

          {/* 2. خدمات مهندسی */}
          <button
            type="button"
            onClick={() => {
              setActiveSubTab('engineering');
              setSelectedCategory('همه دسته‌ها');
            }}
            className={`w-full flex items-center justify-between gap-2.5 px-3 py-2 sm:py-2.5 rounded-xl border text-right transition-all cursor-pointer active:scale-[0.99] ${
              activeSubTab === 'engineering'
                ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs ring-2 ring-indigo-400/40'
                : 'bg-slate-50/70 hover:bg-slate-100/90 text-slate-700 border-slate-200/80'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                  activeSubTab === 'engineering'
                    ? 'bg-white/20 text-white'
                    : 'bg-indigo-100/80 text-indigo-800 border border-indigo-200/60'
                }`}
              >
                <Briefcase className="w-4 h-4" />
              </div>
              <div className="text-right leading-snug">
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  <span className="text-xs sm:text-sm font-bold">
                    خدمات مهندسی اعضا
                  </span>
                  <span
                    className={`text-[10px] sm:text-[11px] font-normal ${
                      activeSubTab === 'engineering' ? 'text-indigo-100' : 'text-slate-500'
                    }`}
                  >
                    (طراحی سازه، معماری، تأسیسات مکانیکی و برقی، نقشه‌برداری، نظارت و بازرسی)
                  </span>
                </div>
              </div>
            </div>
            <span
              className={`font-mono text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${
                activeSubTab === 'engineering'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'bg-white text-slate-700 border border-slate-200'
              }`}
            >
              {toPersianDigits(artisans.filter((a) => a.entityType === 'engineering_service').length)}{' '}
              عضو
            </span>
          </button>

          {/* 3. فروشندگان */}
          <button
            type="button"
            onClick={() => {
              setActiveSubTab('vendors');
              setSelectedCategory('همه دسته‌ها');
            }}
            className={`w-full flex items-center justify-between gap-2.5 px-3 py-2 sm:py-2.5 rounded-xl border text-right transition-all cursor-pointer active:scale-[0.99] ${
              activeSubTab === 'vendors'
                ? 'bg-slate-800 text-white border-slate-900 shadow-xs ring-2 ring-slate-600/40'
                : 'bg-slate-50/70 hover:bg-slate-100/90 text-slate-700 border-slate-200/80'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                  activeSubTab === 'vendors'
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-200 text-slate-800 border border-slate-300/60'
                }`}
              >
                <Store className="w-4 h-4" />
              </div>
              <div className="text-right leading-snug">
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  <span className="text-xs sm:text-sm font-bold">
                    فروشندگان و تأمین‌کنندگان کالا
                  </span>
                  <span
                    className={`text-[10px] sm:text-[11px] font-normal ${
                      activeSubTab === 'vendors' ? 'text-slate-300' : 'text-slate-500'
                    }`}
                  >
                    (مصالح ساختمانی، سیمان، آهن‌آلات، تجهیزات تأسیساتی، رنگ، ابزارآلات و یراق)
                  </span>
                </div>
              </div>
            </div>
            <span
              className={`font-mono text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${
                activeSubTab === 'vendors'
                  ? 'bg-white text-slate-800 shadow-2xs'
                  : 'bg-white text-slate-700 border border-slate-200'
              }`}
            >
              {toPersianDigits(artisans.filter((a) => a.entityType === 'vendor').length)}{' '}
              فروشگاه
            </span>
          </button>
        </div>
      </div>

      {/* If activeSubTab === 'stats', render 12 trades stats view, otherwise render artisans/vendors/engineering */}
      {activeSubTab === 'stats' ? (
        <div className="space-y-4 animate-fadeIn">
          {/* Header / Intro Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-teal-900 via-slate-900 to-slate-950 text-white shadow-md border border-teal-800/40 space-y-3 relative overflow-hidden">
            <div className="absolute -top-12 -left-12 w-44 h-44 rounded-full bg-teal-500/10 blur-2xl pointer-events-none" />
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 text-[11px] font-bold border border-teal-500/30">
                  <TrendingUp className="w-3.5 h-3.5 text-teal-400" />
                  <span>بانک اطلاعات و تحلیل نرخ خدمات ساختمانی</span>
                </div>
                <h2 className="text-base sm:text-lg font-bold text-white">
                  میانگین و دامنه نرخ دستمزد ۱۲ خدمت ساختمانی در ۳۰ روز گذشته
                </h2>
                <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                  نرخ‌های ارائه‌شده، میانگین حسابی سوابق مستند ثبت‌شده توسط مهندسان عضو (شامل قراردادهای اجراشده و استعلام‌های معتبر) است که پس از بررسی و تایید مدیریت در این جدول محاسبه می‌شوند.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveSubTab('artisans')}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-teal-800/80 hover:bg-teal-700 text-teal-100 hover:text-white font-bold text-xs border border-teal-600/50 transition-all cursor-pointer active:scale-95"
                  title="بازگشت به فهرست اعضای بازار"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>بازگشت به بخش‌ها</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAddWagePreselectedArtisan(null);
                    setAddWagePreselectedService(undefined);
                    setAddWageModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4 text-slate-950" />
                  <span>ثبت نرخ جدید</span>
                </button>
                {effectiveIsAdmin && (
                  <button
                    type="button"
                    onClick={() => setAdminWageModalOpen(true)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-all cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    <span>مدیریت و اکسل</span>
                  </button>
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-300">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                  <span>کل سوابق ثبت‌شده در سیستم: {toPersianDigits(wagePrices.length)} مورد</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-teal-400 inline-block" />
                  <span>سوابق تاییدشده: {toPersianDigits(wagePrices.filter((w) => w.status === 'approved').length)} مورد</span>
                </span>
              </div>
              <span className="text-slate-400">
                دوره‌ی تحلیل: ۳۰ روز اخیر منتهی به امروز
              </span>
            </div>
          </div>

          {/* Search Filter for 12 trades */}
          <div className="relative">
            <input
              type="text"
              value={serviceSearchQuery}
              onChange={(e) => setServiceSearchQuery(e.target.value)}
              placeholder="جستجوی تخصص (آرماتوربند، کارگر، بنا، گچکار، کاشیکار، لوله‌کش، برقکار، جوشکار...)"
              className="w-full h-11 pr-10 pl-4 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/10 focus:border-teal-400 shadow-2xs"
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
            {serviceSearchQuery && (
              <button
                type="button"
                onClick={() => setServiceSearchQuery('')}
                className="absolute left-3 top-3 text-[11px] text-slate-400 hover:text-slate-700"
              >
                پاک کردن
              </button>
            )}
          </div>

          {/* Grid of 12 Trades */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {APPROVED_CONSTRUCTION_TRADES
              .filter((trade) => !serviceSearchQuery || trade.title.includes(serviceSearchQuery) || trade.description.includes(serviceSearchQuery) || trade.category.includes(serviceSearchQuery))
              .map((trade) => {
                const stats = tradesStatsMap.get(trade.title) || calculate30DayStats(wagePrices, trade.title, 'all');
                const hasData = stats.sampleCount > 0;

                return (
                  <div
                    key={trade.id}
                    className={`p-4 rounded-2xl bg-white border shadow-2xs transition-all flex flex-col justify-between space-y-3 ${
                      hasData ? 'border-slate-200 hover:border-teal-400 hover:shadow-xs' : 'border-slate-200/80 bg-slate-50/30'
                    }`}
                  >
                    <div className="space-y-2.5">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-bold text-slate-900">
                              {trade.title}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
                              واحد: {trade.unit}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-1 leading-relaxed line-clamp-1">
                            {trade.description}
                          </p>
                        </div>
                      </div>

                      {/* Stat Box */}
                      {hasData ? (
                        <div className="p-3 rounded-xl bg-gradient-to-br from-amber-50/70 to-orange-50/40 border border-amber-200/80 space-y-2">
                          <div className="flex items-baseline justify-between">
                            <span className="text-[11px] font-medium text-amber-900">
                              میانگین حسابی ۳۰ روز اخیر:
                            </span>
                            <div className="flex items-baseline gap-1">
                              <span className="font-mono text-base font-bold text-slate-950">
                                {formatPersianNumber(stats.averagePrice)}
                              </span>
                              <span className="text-[10px] text-slate-500 font-medium">
                                تومان
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-amber-200/60 text-[10.5px]">
                            <div>
                              <span className="text-slate-400 block">کمترین نرخ:</span>
                              <span className="font-mono font-bold text-emerald-700">
                                {formatPersianNumber(stats.minPrice)} تومان
                              </span>
                            </div>
                            <div className="text-left">
                              <span className="text-slate-400 block">بیشترین نرخ:</span>
                              <span className="font-mono font-bold text-rose-700">
                                {formatPersianNumber(stats.maxPrice)} تومان
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-1.5 border-t border-amber-200/40 text-[10px] text-slate-500">
                            <span>
                              تعداد نمونه‌ها: <strong className="font-mono text-slate-800">{toPersianDigits(stats.sampleCount)}</strong> مورد
                            </span>
                            <div className="flex items-center gap-1.5 font-mono text-[9.5px]">
                              <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                اجرا: {toPersianDigits(stats.executedCount)}
                              </span>
                              <span className="text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                                استعلام: {toPersianDigits(stats.inquiryCount)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center space-y-1">
                          <p className="text-[11px] font-medium text-slate-500">
                            هنوز سابقه تاییدشده‌ای در ۳۰ روز اخیر برای این خدمت ثبت نشده است.
                          </p>
                          <p className="text-[10px] text-slate-400">
                            شما می‌توانید با ثبت اولین استعلام یا کار اجراشده، این بانک را غنی‌تر کنید.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setStatsModalService(trade.title);
                          setServiceStatsModalOpen(true);
                        }}
                        className="w-full py-2 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <BarChart3 className="w-3.5 h-3.5 text-teal-600" />
                        <span>نمودار و تاریخچه</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAddWagePreselectedArtisan(null);
                          setAddWagePreselectedService(trade.title);
                          setAddWageModalOpen(true);
                        }}
                        className="w-full py-2 px-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-2xs"
                      >
                        <PlusCircle className="w-3.5 h-3.5 text-slate-950" />
                        <span>ثبت نرخ</span>
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      ) : (
        <>
          {/* Search Input */}
          <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={
            activeSubTab === 'engineering'
              ? 'جستجو در خدمات مهندسی (طراحی سازه، متره، نظارت، سوله، نقشه‌برداری، نام مهندس، نرم‌افزار)...'
              : activeSubTab === 'vendors'
              ? 'جستجو در فروشگاه‌ها بر اساس نام، نوع کالا یا خدمات، محله در ارومیه...'
              : 'جستجو در استادکاران بر اساس نام، تخصص، محله در ارومیه (شیخ‌تپه، رودکی، دانشکده)...'
          }
          className="w-full h-11 pr-10 pl-4 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/10 focus:border-teal-400 shadow-2xs"
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

      {/* Categories Horizontal Tabs */}
      <div className="overflow-x-auto pb-1 -mx-2 px-2 flex gap-1.5 scrollbar-none">
        {/* If pending items exist or user is admin, show pending tab at the beginning */}
        {(effectiveIsAdmin || pendingForCurrentTab.length > 0) && (
          <button
            onClick={() => setSelectedCategory('در انتظار تایید مدیریت')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors shrink-0 flex items-center gap-1.5 ${
              selectedCategory === 'در انتظار تایید مدیریت'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-2xs'
                : 'bg-amber-50 border border-amber-300 text-amber-900 hover:bg-amber-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>در انتظار تایید</span>
            <span className="bg-amber-200 text-amber-900 font-bold text-[10px] px-1.5 py-0.2 rounded-full">
              {toPersianDigits(pendingForCurrentTab.length)}
            </span>
          </button>
        )}

        {currentCategories.map((cat) => {
          const isActive = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors shrink-0 ${
                isActive
                  ? 'bg-slate-900 text-white shadow-2xs font-bold'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Sorting & Filter Header */}
      <div className="flex items-center justify-between text-xs px-1">
        <span className="text-[11px] text-slate-500 font-medium">
          نمایش {toPersianDigits(filteredArtisans.length)}{' '}
          {activeSubTab === 'engineering'
            ? 'خدمت و تخصص مهندسی'
            : activeSubTab === 'vendors'
            ? 'فروشگاه و تامین‌کننده کالا'
            : 'اکیپ و متخصص اجرایی'}
        </span>

        {activeSubTab === 'engineering' ? (
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-1 rounded-lg font-medium flex items-center gap-1">
              <span>ترتیب نمایش: رندوم (عادلانه)</span>
            </span>
            <button
              onClick={() => setEngineeringRandomSeed(Date.now())}
              className="p-1 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-2xs"
              title="تغییر تصادفی ترتیب نمایش"
            >
              <RefreshCw className="w-3.5 h-3.5 text-indigo-600" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400">مرتب‌سازی:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="h-8 px-2 rounded-lg bg-white border border-slate-200 text-[11px] font-medium text-slate-700 focus:outline-none focus:border-teal-400"
            >
              <option value="rating_desc">بیشترین امتیاز (کیفیت)</option>
              <option value="exp_desc">بیشترین سابقه کاری</option>
              <option value="name">نام الفبایی</option>
            </select>
          </div>
        )}
      </div>

      {/* Admin Action Feedback Toast */}
      {adminActionMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border-2 border-emerald-400 text-emerald-950 text-xs font-bold flex items-center justify-between gap-2 shadow-sm animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{adminActionMessage}</span>
          </div>
          <button
            onClick={() => setAdminActionMessage(null)}
            className="text-emerald-700 hover:text-emerald-950 font-bold px-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Banner for Admin if pending items exist */}
      {effectiveIsAdmin && pendingArtisans.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-400 text-amber-950 text-xs flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold shrink-0 shadow-sm">
              <AlertTriangle className="w-5 h-5 text-amber-950" />
            </div>
            <div>
              <h4 className="font-bold text-xs sm:text-sm">
                مدیریت گرامی: {toPersianDigits(pendingArtisans.length)} درخواست ثبت استادکار در انتظار بررسی و تایید شماست
              </h4>
              <p className="text-[11px] text-amber-800 mt-0.5">
                استادکاران ثبت‌شده پس از تایید توسط شما، بلافاصله برای کلیه کاربران برنامه منتشر خواهند شد.
              </p>
            </div>
          </div>
          <button
            onClick={() => setSelectedCategory('در انتظار تایید مدیریت')}
            className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 font-bold text-xs transition-colors shrink-0 shadow-2xs"
          >
            مشاهده و تایید موارد ({toPersianDigits(pendingArtisans.length)})
          </button>
        </div>
      )}

      {/* Banner for regular users if their submitted items are pending */}
      {!effectiveIsAdmin && pendingArtisans.length > 0 && (
        <div className="p-3.5 rounded-2xl bg-amber-50/90 border border-amber-300 text-amber-950 text-xs flex items-center justify-between gap-3 shadow-2xs animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <Clock className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="font-bold text-[12px]">
                {toPersianDigits(pendingArtisans.length)} استادکار ثبت‌شده شما در صف بررسی و تایید مدیریت است
              </p>
              <p className="text-[11px] text-amber-800 mt-0.5">
                اطلاعات به سرور ارسال شده و پس از بررسی و تایید توسط مدیریت، به صورت خودکار برای تمام کاربران منتشر خواهد شد.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* If "در انتظار تایید مدیریت" tab is selected, show pending wage rates right at the top */}
      {selectedCategory === 'در انتظار تایید مدیریت' && (
        <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 space-y-3 shadow-2xs animate-fadeIn">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-bold">
                <Coins className="w-4 h-4 text-slate-950" />
              </div>
              <div>
                <h3 className="font-bold text-xs sm:text-sm text-slate-900">
                  سوابق نرخ خدمات ساختمانی در انتظار بررسی مدیریت ({toPersianDigits(pendingWagePrices.length)} مورد)
                </h3>
                <p className="text-[11px] text-amber-900">
                  این نرخ‌ها توسط مهندسان ثبت شده و پس از تأیید در آمار ۳۰ روزه و کارت استادکاران منتشر خواهند شد.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                if (effectiveIsAdmin) {
                  setAdminWageModalOpen(true);
                } else {
                  setIsAdminLoginOpen(true);
                }
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 text-xs font-bold transition-colors cursor-pointer"
            >
              مدیریت و خروجی اکسل
            </button>
          </div>

          {pendingWagePrices.length === 0 ? (
            <div className="p-3 bg-white/80 rounded-xl border border-amber-200 text-center text-xs text-amber-900">
              هیچ سابقه نرخی در صف انتظار وجود ندارد. کلیه نرخ‌ها تعیین تکلیف شده‌اند.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {pendingWagePrices.map((pw) => (
                <div
                  key={pw.id}
                  className="p-3 rounded-xl bg-white border border-amber-200/90 shadow-2xs space-y-2.5 text-right flex flex-col justify-between"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-xs text-slate-900">{pw.artisanName}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
                            {pw.serviceTitle}
                          </span>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                              pw.priceType === 'executed_contract'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : 'bg-blue-50 text-blue-800 border-blue-300'
                            }`}
                          >
                            {pw.priceType === 'executed_contract' ? 'کار اجراشده' : 'استعلام قیمت'}
                          </span>
                        </div>
                        {pw.artisanPhone && (
                          <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                            تلفن: {pw.artisanPhone}
                          </span>
                        )}
                      </div>

                      <div className="text-left shrink-0">
                        <div className="font-mono text-sm font-black text-amber-600">
                          {formatPersianNumber(pw.priceAmountTomans)}
                        </div>
                        <span className="text-[9.5px] text-slate-500 font-medium">
                          تومان / {pw.unit}
                        </span>
                      </div>
                    </div>

                    <div className="text-[10px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
                      <span>
                        مهندس ثبت‌کننده: <strong>{pw.registeredByEngineerName || 'عضو انجمن'}</strong>
                      </span>
                      <span className="font-mono">
                        تاریخ کار: {toPersianDigits(pw.actionDate)}
                      </span>
                    </div>

                    {pw.note && (
                      <p className="text-[10px] text-slate-600 bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                        {pw.note}
                      </p>
                    )}
                  </div>

                  {/* Direct Action Buttons for Admin */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => handleQuickApproveWage(pw.id, pw.serviceTitle)}
                      disabled={isProcessingId === pw.id}
                      className="flex-1 py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-95 disabled:opacity-50 cursor-pointer"
                    >
                      {isProcessingId === pw.id ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      )}
                      <span>{isProcessingId === pw.id ? 'در حال ثبت...' : 'تأیید و انتشار عمومی'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickRejectWage(pw.id, pw.serviceTitle)}
                      disabled={isProcessingId === pw.id}
                      className="py-1.5 px-3 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center gap-1 transition-all border border-rose-200 active:scale-95 disabled:opacity-50 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>رد سابقه</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Artisans Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filteredArtisans.length === 0 ? (
          <div className="col-span-full p-8 rounded-2xl bg-white border-2 border-dashed border-slate-200 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center mx-auto shadow-2xs">
              {activeSubTab === 'engineering' ? (
                <Briefcase className="w-6 h-6 text-indigo-600" />
              ) : activeSubTab === 'vendors' ? (
                <Store className="w-6 h-6 text-teal-600" />
              ) : (
                <Users className="w-6 h-6 text-amber-600" />
              )}
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900">
                {activeSubTab === 'engineering'
                  ? 'هنوز خدمتی در بخش خدمات تخصصی مهندسی ثبت نشده است'
                  : activeSubTab === 'vendors'
                  ? 'هنوز فروشنده یا تامین‌کننده‌ای در این بخش ثبت نشده است'
                  : 'هنوز استادکاری در این بخش ثبت نشده است'}
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                {activeSubTab === 'engineering'
                  ? 'این بخش ویژه معرفی خدمات حرفه‌ای اعضای انجمن مجریان ذیصلاح ارومیه (طراحی سازه، متره و برآورد، مشاوره فنی، نظارت و کنترل کیفیت، خدمات نقشه‌برداری، آزمایش‌های مصالح، طراحی و اجرای سوله، تهیه نقشه‌های اجرایی و...) است. هر عضو می‌تواند خدمات خود را معرفی نموده تا متقاضیان مستقیماً با او ارتباط برقرار کنند.'
                  : activeSubTab === 'vendors'
                  ? 'سامانه برای ثبت تامین‌کنندگان مصالح، تجهیزات، تاسیسات و خدمات ساختمانی توسط مهندسان گرامی آماده‌سازی شده است. شما می‌توانید با کلیک بر روی دکمه زیر، فروشگاه یا تامین‌کننده معتمد خود را ثبت فرمایید.'
                  : 'سامانه برای ثبت تدریجی اکیپ‌های مجرب توسط مهندسان گرامی آماده‌سازی شده است. شما می‌توانید با کلیک بر روی دکمه زیر، اولین استادکار تاییدشده خود را با ذکر نام معرف ثبت فرمایید.'}
              </p>
            </div>
            <button
              onClick={() => {
                const targetEntity =
                  activeSubTab === 'engineering'
                    ? 'engineering_service'
                    : activeSubTab === 'vendors'
                    ? 'vendor'
                    : 'artisan';
                setNewEntityType(targetEntity);
                setNewTrade(
                  targetEntity === 'engineering_service'
                    ? 'طراحی سازه'
                    : targetEntity === 'vendor'
                    ? 'مصالح ساختمانی (سیمان، گچ، آجر، بلوک)'
                    : 'آرماتوربند'
                );
                setModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs inline-flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>
                {activeSubTab === 'engineering'
                  ? 'معرفی خدمات مهندسی شما'
                  : activeSubTab === 'vendors'
                  ? 'ثبت اولین فروشنده کالا/خدمات'
                  : 'ثبت اولین استادکار'}
              </span>
            </button>
          </div>
        ) : (
          filteredArtisans.map((artisan) => {
            const rawReviews = artisan.reviews || [];
            // Filter out any reviews that contain inappropriate content or profanity
            const reviews = rawReviews.filter(
              (r) =>
                (!r.comment || !containsInappropriateContent(r.comment)) &&
                (!r.reviewerName || !containsInappropriateContent(r.reviewerName))
            );
          const isReviewsOpen = expandedReviewsId === artisan.id;
          const ratingCount = typeof artisan.ratingCount === 'number' ? artisan.ratingCount : reviews.length;
          const hasReviews = ratingCount > 0;
          const ratingValue = hasReviews ? (artisan.rating || 0) : 0;
          const isTopRated = hasReviews && ratingValue >= 4.7;

            const isPending = !artisan.verifiedByAssociation;

            return (
              <div
                key={artisan.id}
                className={`p-4 rounded-2xl bg-white border shadow-2xs transition-all flex flex-col justify-between space-y-3 ${
                  isPending
                    ? 'border-amber-300 bg-amber-50/15 ring-1 ring-amber-400/30'
                    : artisan.entityType === 'engineering_service'
                    ? 'border-indigo-100 hover:border-indigo-300 hover:shadow-xs'
                    : 'border-slate-200 hover:border-slate-350'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border flex items-center gap-1 ${
                          artisan.entityType === 'engineering_service'
                            ? 'text-indigo-900 bg-indigo-50 border-indigo-200'
                            : artisan.entityType === 'vendor'
                            ? 'text-teal-900 bg-teal-50 border-teal-200'
                            : 'text-amber-900 bg-amber-50 border-amber-200'
                        }`}>
                          {artisan.entityType === 'engineering_service' && <Briefcase className="w-3 h-3 text-indigo-600" />}
                          {artisan.trade}
                        </span>
                        {artisan.entityType === 'engineering_service' && (
                          <span className="text-[10px] font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            عضو انجمن
                          </span>
                        )}
                        {isTopRated && (
                          <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 flex items-center gap-0.5">
                            <Award className="w-3 h-3 text-amber-500" />
                            ممتاز
                          </span>
                        )}
                        {isPending && (
                          <span className="text-[10px] font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded border border-amber-300 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-600" />
                            در انتظار تایید مدیریت
                          </span>
                        )}
                      </div>
                      <h3 className="text-xs sm:text-sm font-bold text-slate-900 mt-1">
                        {artisan.fullName}
                      </h3>
                    </div>

                    {/* Rating Badge (Hidden for engineering services as per specifications) */}
                    {artisan.entityType !== 'engineering_service' && (
                      <div className="flex flex-col items-end shrink-0">
                        {hasReviews ? (
                          <>
                            <div className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                              <span className="font-mono">{toPersianDigits(ratingValue.toFixed(1))}</span>
                            </div>
                            <span className="text-[9px] text-slate-400 mt-0.5 font-mono">
                              ({toPersianDigits(ratingCount)} نظر)
                            </span>
                          </>
                        ) : (
                          <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded-lg border border-slate-200">
                            <Star className="w-3 h-3 text-slate-400" />
                            <span>بدون امتیاز</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1 text-[11px] text-slate-500 flex-wrap">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>{artisan.district}</span>
                    <span>·</span>
                    <span>سابقه: {toPersianDigits(artisan.experienceYears)} سال</span>
                    {artisan.referrerLicense && (
                      <>
                        <span>·</span>
                        <span className="font-mono text-[10px] text-slate-600 bg-slate-50 px-1.5 py-0.2 rounded border border-slate-200">
                          {artisan.referrerLicense}
                        </span>
                      </>
                    )}
                  </div>

                  {artisan.entityType !== 'engineering_service' && (artisan.registeredByEngineer || artisan.referrerName) && (
                    <p className="text-[10.5px] text-slate-600 bg-slate-50 px-2 py-1 rounded-md border border-slate-200/80 flex items-center gap-1">
                      <span className="text-slate-500 font-medium">مهندس معرف:</span>
                      <strong className="text-slate-800">
                        {getEngineerDisplayName(artisan.registeredByEngineer || artisan.referrerName, artisan.referrerUserId)}
                      </strong>
                    </p>
                  )}

                  {isPending && (
                    <div className="text-[10px] text-amber-900 bg-amber-100/70 p-2 rounded-lg border border-amber-200 flex items-start gap-1.5 leading-relaxed">
                      <Clock className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                      <span>
                        این مورد ثبت شده و در نوبت تایید مدیریت انجمن است. به محض تایید، برای کلیه کاربران برنامه به صورت همگانی نمایش داده خواهد شد.
                      </span>
                    </div>
                  )}

                  {/* Admin Direct Approval / Rejection Controls */}
                  {effectiveIsAdmin && isPending && (
                    <div className="p-3 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 flex items-center justify-between gap-2 flex-wrap shadow-2xs animate-fadeIn">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-950">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>درخواست تایید مدیر:</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleApproveArtisan(artisan.id, artisan.fullName)}
                          disabled={isProcessingId === artisan.id}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1 shadow-sm transition-all active:scale-95"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>تایید و انتشار برای همه</span>
                        </button>
                        <button
                          onClick={() => handleDeleteArtisan(artisan.id, artisan.fullName)}
                          disabled={isProcessingId === artisan.id}
                          className="px-2.5 py-1.5 rounded-lg bg-rose-100 hover:bg-rose-200 disabled:opacity-50 text-rose-700 font-bold text-xs flex items-center gap-1 transition-all active:scale-95"
                          title="حذف یا رد درخواست"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>رد / حذف</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Manage Bar:
                      - Admin can edit and delete any item
                      - Regular user can edit THEIR OWN engineering service listing */}
                  {(effectiveIsAdmin || canUserEditItem(artisan)) && (
                    <div className="flex justify-between items-center gap-1.5 pt-1">
                      {artisan.entityType === 'engineering_service' && !effectiveIsAdmin && (
                        <span className="text-[10px] text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md font-medium">
                          آگهی ثبت‌شده توسط شما
                        </span>
                      )}
                      <div className="flex items-center gap-1.5 mr-auto">
                        <button
                          onClick={() => {
                            setEditingArtisan(artisan);
                            setIsEditModalOpen(true);
                          }}
                          className="text-[10px] font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200/90 flex items-center gap-1 py-1 px-2.5 rounded-lg transition-colors active:scale-95 shadow-2xs"
                          title="ویرایش مشخصات خدمت یا آگهی"
                        >
                          <Edit3 className="w-3 h-3 text-amber-700" />
                          <span>ویرایش آگهی</span>
                        </button>
                        {effectiveIsAdmin && (
                          <button
                            onClick={() => handleDeleteArtisan(artisan.id, artisan.fullName)}
                            disabled={isProcessingId === artisan.id}
                            className="text-[10px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/90 flex items-center gap-1 py-1 px-2.5 rounded-lg transition-colors active:scale-95 shadow-2xs"
                            title="حذف از پایگاه داده (ویژه مدیر)"
                          >
                            <Trash2 className="w-3 h-3 text-rose-600" />
                            <span>حذف</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                    {artisan.description}
                  </p>

                  {/* Latest Verified Wage Rates (For Artisans) */}
                  {artisan.entityType !== 'engineering_service' && artisan.entityType !== 'vendor' && (() => {
                    const latestRates = latestWagesMap.get(artisan.id) || [];
                    return (
                      <div className="p-2.5 rounded-xl bg-amber-50/40 border border-amber-200/70 space-y-2 mt-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-amber-950 flex items-center gap-1.5">
                            <Coins className="w-3.5 h-3.5 text-amber-600" />
                            <span>آخرین نرخ خدمات ثبت‌شده:</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setAddWagePreselectedArtisan(artisan);
                              setAddWagePreselectedService(artisan.trade);
                              setAddWageModalOpen(true);
                            }}
                            className="text-[10px] font-bold text-teal-800 hover:text-teal-950 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-2 py-0.5 rounded-md flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <PlusCircle className="w-3 h-3 text-teal-600" />
                            <span>ثبت نرخ خدمات</span>
                          </button>
                        </div>

                        {latestRates.length > 0 ? (
                          <div className="space-y-1.5">
                            {latestRates.map((lr) => {
                              const isExecuted = lr.priceType === 'executed_contract';
                              return (
                                <button
                                  key={lr.serviceTitle}
                                  type="button"
                                  onClick={() => {
                                    setHistoryModalArtisan(artisan);
                                    setHistoryModalService(lr.serviceTitle);
                                    setHistoryModalUnit(lr.unit);
                                    setWageHistoryModalOpen(true);
                                  }}
                                  className="w-full p-2 rounded-lg bg-white border border-slate-200/90 hover:border-amber-300 flex items-center justify-between text-right transition-colors group cursor-pointer shadow-2xs"
                                  title="کلیک جهت مشاهده تاریخچه نرخ‌های این خدمت"
                                >
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <span className="text-xs font-bold text-slate-800 truncate">
                                      {lr.serviceTitle}
                                    </span>
                                    <span
                                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded border shrink-0 ${
                                        isExecuted
                                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                          : 'bg-blue-50 text-blue-800 border-blue-300'
                                      }`}
                                    >
                                      {isExecuted ? 'کار اجراشده' : 'استعلام'}
                                    </span>
                                    <span className="text-[9px] text-slate-400 font-mono shrink-0">
                                      ({toPersianDigits(lr.actionDate)})
                                    </span>
                                  </div>

                                  <div className="flex items-baseline gap-1 shrink-0">
                                    <span className="font-mono text-xs font-bold text-slate-950 group-hover:text-amber-600">
                                      {formatPersianNumber(lr.priceAmountTomans)}
                                    </span>
                                    <span className="text-[9.5px] text-slate-500 font-medium">
                                      تومان / {lr.unit}
                                    </span>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="p-2 rounded-lg bg-white/80 border border-slate-200/60 flex items-center justify-between text-[11px]">
                            <span className="text-slate-400 italic">بدون نرخ ثبت‌شده در این خدمت</span>
                            <button
                              type="button"
                              onClick={() => {
                                setAddWagePreselectedArtisan(artisan);
                                setAddWagePreselectedService(artisan.trade);
                                setAddWageModalOpen(true);
                              }}
                              className="text-[10px] font-bold text-teal-700 hover:underline"
                            >
                              ثبت نخستین نرخ
                            </button>
                          </div>
                        )}

                        {/* Pending rates for this artisan waiting for admin review */}
                        {(() => {
                          const artisanPending = pendingWagesByArtisanId.get(artisan.id) || [];
                          if (artisanPending.length === 0) return null;
                          return (
                            <div className="pt-2 border-t border-amber-200/80 space-y-1.5 animate-fadeIn">
                              <span className="text-[10px] font-bold text-amber-900 flex items-center gap-1">
                                <Clock className="w-3 h-3 text-amber-600" />
                                <span>سوابق نرخ در نوبت تأیید مدیریت ({toPersianDigits(artisanPending.length)} مورد):</span>
                              </span>
                              {artisanPending.map((pw) => (
                                <div
                                  key={pw.id}
                                  className="p-2 rounded-lg bg-amber-100/70 border border-amber-300 text-[10.5px] flex items-center justify-between gap-1.5"
                                >
                                  <div className="min-w-0">
                                    <span className="font-bold text-slate-900">{pw.serviceTitle}: </span>
                                    <span className="font-mono font-bold text-amber-950">{formatPersianNumber(pw.priceAmountTomans)} ت</span>
                                    <span className="text-[9px] text-slate-500 mr-1">({toPersianDigits(pw.actionDate)})</span>
                                  </div>
                                  <div className="flex items-center gap-1 shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => handleQuickApproveWage(pw.id, pw.serviceTitle)}
                                      disabled={isProcessingId === pw.id}
                                      className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-[9.5px] flex items-center gap-0.5 cursor-pointer shadow-2xs"
                                    >
                                      {isProcessingId === pw.id ? (
                                        <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                                      ) : (
                                        <CheckCircle2 className="w-3 h-3" />
                                      )}
                                      <span>{isProcessingId === pw.id ? '...' : 'تأیید'}</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleQuickRejectWage(pw.id, pw.serviceTitle)}
                                      className="px-1.5 py-0.5 rounded bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold text-[9.5px] cursor-pointer"
                                    >
                                      رد
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          );
                        })()}
                      </div>
                    );
                  })()}
                </div>

              {/* Action Buttons: Rate, Call, and WhatsApp */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                {/* User's own review badge (artisan and vendor only) */}
                {artisan.entityType !== 'engineering_service' && (() => {
                  const myRev = getUserReview(artisan);
                  if (!myRev) return null;
                  return (
                    <div className="text-[10px] text-teal-800 bg-teal-50 border border-teal-200 px-2 py-1 rounded-lg flex items-center justify-between font-medium">
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                        <span>ارزیابی شما ثبت شده است:</span>
                      </div>
                      <span className="font-mono font-bold text-amber-600">
                        ⭐ {toPersianDigits(myRev.score)}
                      </span>
                    </div>
                  );
                })()}

                {/* Rating & Reviews controls: Only for artisans and vendors (strictly disabled for engineering services) */}
                {artisan.entityType !== 'engineering_service' && (
                  <div className="flex items-center gap-2">
                    {(() => {
                      const myRev = getUserReview(artisan);
                      return (
                        <button
                          onClick={() => handleOpenRateModal(artisan)}
                          className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-colors ${
                            myRev
                              ? 'bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-300'
                              : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200'
                          }`}
                        >
                          {myRev ? (
                            <>
                              <Edit3 className="w-3.5 h-3.5 text-teal-600" />
                              <span>ویرایش نظر و امتیاز</span>
                            </>
                          ) : (
                            <>
                              <Star className="w-3.5 h-3.5 text-amber-500" />
                              <span>ثبت امتیاز و نظر</span>
                            </>
                          )}
                        </button>
                      );
                    })()}

                    {reviews.length > 0 && (
                      <button
                        onClick={() =>
                          setExpandedReviewsId(isReviewsOpen ? null : artisan.id)
                        }
                        className="py-1.5 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium flex items-center gap-1 transition-colors"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                        <span>نظرات ({toPersianDigits(reviews.length)})</span>
                        {isReviewsOpen ? (
                          <ChevronUp className="w-3 h-3" />
                        ) : (
                          <ChevronDown className="w-3 h-3" />
                        )}
                      </button>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-1.5">
                  <a
                    href={`tel:${artisan.phone}`}
                    className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-2xs transition-colors active:scale-95"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>
                      {artisan.entityType === 'engineering_service'
                        ? 'تماس با مهندس'
                        : artisan.entityType === 'vendor'
                        ? 'تماس با فروشگاه'
                        : 'تماس با استادکار'}
                      : {artisan.phone}
                    </span>
                  </a>

                  {/* Direct WhatsApp link if valid Iranian mobile */}
                  {(() => {
                    const digits = artisan.phone.replace(/\D/g, '');
                    const cleanMobile = digits.startsWith('09')
                      ? digits.substring(1)
                      : digits.startsWith('989')
                      ? digits.substring(2)
                      : digits.startsWith('9') && digits.length === 10
                      ? digits
                      : null;

                    if (!cleanMobile) return null;

                    return (
                      <a
                        href={`https://wa.me/98${cleanMobile}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-bold flex items-center justify-center gap-1 transition-colors shrink-0"
                        title="پیام در واتساپ"
                      >
                        <MessageSquare className="w-4 h-4 text-teal-600" />
                        <span className="hidden sm:inline">واتساپ</span>
                      </a>
                    );
                  })()}
                </div>
              </div>

              {/* Reviews Accordion (Only for artisans and vendors) */}
              {artisan.entityType !== 'engineering_service' && isReviewsOpen && reviews.length > 0 && (
                <div className="pt-2 border-t border-slate-100 space-y-2 text-xs animate-fadeIn">
                  <span className="text-[11px] font-bold text-slate-700 block">
                    ارزیابی‌های ثبت‌شده توسط مهندسان:
                  </span>
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {reviews.map((rev) => {
                      const isAnon = Boolean(rev.isAnonymous || rev.reviewerName?.includes('ناشناس'));
                      const displayName = isAnon
                        ? 'مهندس عضو انجمن (ناشناس)'
                        : getEngineerDisplayName(rev.reviewerName, rev.reviewerUserId);
                      const hasComment = Boolean(rev.comment && rev.comment.trim());

                      return (
                        <div
                          key={rev.id}
                          className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5"
                        >
                          <div className="flex items-center justify-between text-[11px]">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-slate-800">
                                {displayName}
                              </span>
                              {isAnon && (
                                <span className="text-[9px] text-slate-500 bg-slate-200/80 px-1.5 py-0.5 rounded font-medium">
                                  ناشناس
                                </span>
                              )}
                              {rev.date && (
                                <span className="text-[9px] text-slate-400 font-mono">
                                  ({toPersianDigits(rev.date)})
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-0.5 text-amber-500 font-bold font-mono text-xs">
                              <span>{toPersianDigits(rev.score)}</span>
                              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            </div>
                          </div>

                          {hasComment ? (
                            <p className="text-[11px] text-slate-600 leading-relaxed">
                              {rev.comment}
                            </p>
                          ) : (
                            <p className="text-[10px] text-slate-400 italic">
                              ⭐ امتیاز کیفی ثبت شده بدون نظر متنی
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}
      </div>
      </>
      )}

      {/* Modal 1: Register New Artisan by Executor */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto text-right">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">
                {newEntityType === 'engineering_service'
                  ? 'معرفی خدمات تخصصی مهندسی توسط اعضا'
                  : newEntityType === 'vendor'
                  ? 'ثبت فروشگاه و تامین‌کننده کالا/خدمات'
                  : 'ثبت استادکار توسط مهندس مجری یا ناظر'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Entity Type Toggle (3 tabs: خدمات مهندسی, استادکار, فروشنده) */}
            <div className="grid grid-cols-3 rounded-xl bg-slate-100 p-1 border border-slate-200 gap-1">
              <button
                type="button"
                onClick={() => {
                  setNewEntityType('engineering_service');
                  setNewTrade('طراحی سازه');
                }}
                className={`py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all ${
                  newEntityType === 'engineering_service'
                    ? 'bg-white text-indigo-900 shadow-xs border border-indigo-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span className="truncate">خدمات مهندسی</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setNewEntityType('artisan');
                  setNewTrade('آرماتوربند');
                }}
                className={`py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all ${
                  newEntityType === 'artisan'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Hammer className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span className="truncate">استادکاران</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setNewEntityType('vendor');
                  setNewTrade('مصالح ساختمانی (سیمان، گچ، آجر، بلوک)');
                }}
                className={`py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all ${
                  newEntityType === 'vendor'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Store className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                <span className="truncate">فروشندگان</span>
              </button>
            </div>

            {submitSuccess ? (
              <div className="p-6 text-center space-y-3">
                <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto" />
                <h4 className="text-sm font-bold text-slate-900">
                  {newEntityType === 'engineering_service'
                    ? 'خدمات تخصصی مهندسی با موفقیت در بازار ثبت و منتشر گردید'
                    : newEntityType === 'vendor'
                    ? 'اطلاعات فروشنده با موفقیت ثبت و منتشر گردید'
                    : 'استادکار با موفقیت ثبت و منتشر گردید'}
                </h4>
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-right text-xs text-emerald-950 space-y-1.5">
                  <p className="font-bold flex items-center gap-1.5 text-emerald-900">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>انتشار فوری در بازار:</span>
                  </p>
                  <p className="text-[11px] text-emerald-800 leading-relaxed">
                    اطلاعات با موفقیت ذخیره شد و هم‌اکنون برای کلیه مهندسان، اعضا و کاربران سامانه قابل مشاهده و تماس است.
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleAddArtisan} className="space-y-3 text-xs">
                {newEntityType === 'engineering_service' && (
                  <div className="p-3 rounded-2xl bg-indigo-50/80 border border-indigo-200 text-indigo-950 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-xs text-indigo-900">
                      <Briefcase className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span>بازار خدمات تخصصی مهندسی اعضا</span>
                    </div>
                    <p className="text-[11px] text-indigo-800 leading-relaxed">
                      یک بخش برای معرفی خدمات حرفه‌ای اعضا (طراحی سازه، متره و برآورد، مشاوره فنی، نظارت، نقشه‌برداری، آزمایش‌های مصالح، طراحی و اجرای سوله، تهیه نقشه‌های اجرایی و...) تا متقاضیان و همکاران مستقیماً ارتباط بگیرند.
                    </p>
                  </div>
                )}

                {newEntityType === 'engineering_service' ? (
                  <>
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">
                        نام و نام خانوادگی مهندس یا عنوان دفتر مهندسی: *
                      </label>
                      <input
                        type="text"
                        required
                        value={newFullName}
                        onChange={(e) => setNewFullName(e.target.value)}
                        placeholder="مثال: مهندس محمد رضایی یا دفتر مهندسی سازه ارومیه"
                        className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:border-indigo-500 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">
                        شماره پروانه اشتغال یا شماره نظام مهندسی (اختیاری):
                      </label>
                      <input
                        type="text"
                        value={newEngineerLicense}
                        onChange={(e) => setNewEngineerLicense(e.target.value)}
                        placeholder="مثال: پروانه طراحی/نظارت پایه ۱"
                        className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </>
                ) : newEntityType === 'vendor' ? (
                  <>
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">
                        نام فروشگاه / شرکت / دفتر فروش: *
                      </label>
                      <input
                        type="text"
                        required
                        value={newStoreName}
                        onChange={(e) => setNewStoreName(e.target.value)}
                        placeholder="مثال: بازرگانی آهن‌آلات ارومیه - برادران کمالی"
                        className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:border-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">
                        نام مدیر یا مسئول فروش:
                      </label>
                      <input
                        type="text"
                        value={newManagerName}
                        onChange={(e) => setNewManagerName(e.target.value)}
                        placeholder="مثال: آقای مهندس کمالی"
                        className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:border-teal-500"
                      />
                    </div>
                  </>
                ) : (
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      نام و نام خانوادگی استادکار / سرپرست اکیپ: *
                    </label>
                    <input
                      type="text"
                      required
                      value={newFullName}
                      onChange={(e) => setNewFullName(e.target.value)}
                      placeholder="مثال: استاد فریدون قنبری"
                      className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:border-teal-500"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      {newEntityType === 'engineering_service'
                        ? 'دسته خدمت تخصصی مهندسی:'
                        : newEntityType === 'vendor'
                        ? 'دسته کالا / خدمات:'
                        : 'رشته تخصصی:'}
                    </label>
                    <select
                      value={newTrade}
                      onChange={(e) => setNewTrade(e.target.value)}
                      className="w-full h-10 px-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium"
                    >
                      {(newEntityType === 'engineering_service'
                        ? engineeringCategories
                        : newEntityType === 'vendor'
                        ? vendorCategories
                        : artisanCategories)
                        .filter((c) => c !== 'همه دسته‌ها')
                        .map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      {newEntityType === 'engineering_service' ? 'سابقه حرفه‌ای (سال):' : 'سابقه فعالیت (سال):'}
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={newYears}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) =>
                        setNewYears(
                          sanitizeNumericInput(e.target.value, false)
                        )
                      }
                      className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    شماره تماس / همراه: *
                  </label>
                  <input
                    type="tel"
                    required
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="۰۹۱۴xxxxxxx یا تلفن دفتر"
                    className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    {newEntityType === 'engineering_service'
                      ? 'آدرس دفتر یا محدوده فعالیت در ارومیه:'
                      : newEntityType === 'vendor'
                      ? 'آدرس یا محدوده فروشگاه در ارومیه:'
                      : 'محدوده فعالیت یا کارگاه در ارومیه:'}
                  </label>
                  <input
                    type="text"
                    value={newDistrict}
                    onChange={(e) => setNewDistrict(e.target.value)}
                    placeholder="مثال: ارومیه - خیابان بهشتی، بلوار حسنی، خیام..."
                    className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                  />
                </div>

                {/* Recommending Engineer Meta (Mandatory for artisan & vendor) */}
                {newEntityType !== 'engineering_service' && (
                  <div className="p-3 rounded-2xl bg-amber-50/90 border-2 border-amber-300 space-y-2">
                    <div className="flex items-center gap-1.5 text-amber-950 font-bold text-xs">
                      <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>مشخصات مهندس معرف (الزامی جهت تایید و اصالت):</span>
                    </div>
                    <p className="text-[10px] text-amber-900 leading-relaxed">
                      طبق قوانین سامانه، معرفی کلیه استادکاران و فروشندگان حتماً باید با ذکر نام مهندس ناظر یا مجری انجام گیرد.
                    </p>
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div>
                        <label className="block text-amber-950 font-bold mb-1 text-[11px]">
                          نام و نام خانوادگی مهندس * :
                        </label>
                        <input
                          type="text"
                          required
                          value={newEngineerName}
                          onChange={(e) => setNewEngineerName(e.target.value)}
                          placeholder="مهندس ..."
                          className="w-full h-9 px-2.5 rounded-xl bg-white border border-amber-300 text-xs font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-amber-950 font-bold mb-1 text-[11px]">
                          شماره پروانه مهندسی (اختیاری):
                        </label>
                        <input
                          type="text"
                          value={newEngineerLicense}
                          onChange={(e) => setNewEngineerLicense(e.target.value)}
                          placeholder="پروانه نظام مهندسی"
                          className="w-full h-9 px-2.5 rounded-xl bg-white border border-amber-200 text-xs font-mono focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Initial Wage Rate Registration (for the 12 approved trades) */}
                {newEntityType === 'artisan' && isWageRateRegistrationAllowed(newTrade) && (() => {
                  const matchedTrade = getApprovedTradeForCategory(newTrade);
                  if (!matchedTrade) return null;
                  return (
                    <div className="p-3.5 rounded-2xl bg-amber-50/90 border-2 border-amber-300 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 font-bold text-xs text-amber-950">
                          <Coins className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>ثبت نرخ دستمزد استادکار (اختیاری - بانک نرخ‌ها):</span>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white text-amber-950 border border-amber-300 font-mono">
                          واحد: {matchedTrade.unit}
                        </span>
                      </div>

                      <div className="p-2 rounded-lg bg-amber-100/60 border border-amber-200/80 text-[11px] text-amber-950 flex items-center justify-between">
                        <span className="font-medium">خدمت در بانک نرخ‌ها:</span>
                        <span className="font-bold">{matchedTrade.title}</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-amber-950 font-bold mb-1 text-[11px]">
                            مبلغ دستمزد (تومان):
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              inputMode="numeric"
                              value={newWageAmount ? formatPersianNumber(newWageAmount) : ''}
                              onChange={(e) => setNewWageAmount(sanitizeNumericInput(e.target.value, false))}
                              placeholder="مثال: ۴۵۰,۰۰۰"
                              className="w-full h-9 pr-2.5 pl-12 rounded-xl bg-white border border-amber-300 text-xs font-bold font-mono focus:ring-2 focus:ring-amber-500 focus:outline-none"
                            />
                            <span className="absolute left-2.5 top-2 text-[10px] font-bold text-slate-400">
                              تومان
                            </span>
                          </div>
                        </div>

                        <div>
                          <label className="block text-amber-950 font-bold mb-1 text-[11px]">
                            نوع نرخ:
                          </label>
                          <select
                            value={newWageType}
                            onChange={(e) => setNewWageType(e.target.value as WagePriceType)}
                            className="w-full h-9 px-2.5 rounded-xl bg-white border border-amber-300 text-xs font-medium focus:outline-none"
                          >
                            <option value="executed_contract">کار اجراشده (قرارداد)</option>
                            <option value="quote_inquiry">استعلام یا توافقی</option>
                          </select>
                        </div>
                      </div>

                      {newWageAmount && Number(sanitizeNumericInput(newWageAmount, false)) > 0 && (
                        <div className="space-y-2 pt-2 border-t border-amber-200">
                          <div>
                            <label className="block text-amber-950 font-bold mb-1 text-[11px]">
                              تاریخ کار یا استعلام:
                            </label>
                            <SimpleJalaliDatePicker
                              value={newWageDate}
                              onChange={(val) => setNewWageDate(val)}
                              placeholder="انتخاب تاریخ"
                            />
                          </div>
                          <div>
                            <label className="block text-amber-950 font-bold mb-1 text-[11px]">
                              توضیحات تکمیلی نرخ (اختیاری):
                            </label>
                            <input
                              type="text"
                              value={newWageNote}
                              onChange={(e) => setNewWageNote(e.target.value)}
                              placeholder="مثال: کار درجه یک، بدون احتساب مصالح..."
                              className="w-full h-8 px-2.5 rounded-xl bg-white border border-amber-200 text-xs focus:outline-none"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    {newEntityType === 'engineering_service'
                      ? 'شرح خدمات تخصصی، نرم‌افزارها و سوابق پروژه‌ها: *'
                      : newEntityType === 'vendor'
                      ? 'توضیحات، تخفیفات و شرایط برای اعضای انجمن:'
                      : 'توضیحات، تجهیزات و سوابق پروژه‌ها:'}
                  </label>
                  <textarea
                    rows={3}
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder={
                      newEntityType === 'engineering_service'
                        ? 'توضیحات کامل در خصوص تخصص، نرم‌افزارهای مورد استفاده (ETABS, SAFE, Revit, AutoCAD, ...)، سوابق طراحی و پروژه‌های اجرا شده...'
                        : newEntityType === 'vendor'
                        ? 'تخفیف ویژه مهندسان، شرایط پرداخت چکی، خدمات تحویل پای کارگاه...'
                        : 'تجهیزات، تعداد نفرات اکیپ، کیفیت کار...'
                    }
                    className="w-full p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs resize-none"
                  />
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-[11px] leading-relaxed flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>روند انتشار همگانی:</strong> پس از تایید توسط مدیریت، به صورت خودکار برای تمام اعضا و کاربران برنامه در سراسر ارومیه نمایش داده می‌شود.
                  </span>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-medium"
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 font-bold shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {isSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    <span>{isSubmitting ? 'در حال ارسال...' : 'ثبت و ارسال به مدیریت'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Modal 2: Submit Rating & Evaluation (1 per user, editable) */}
      {rateModalOpen && selectedArtisanForRating && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto text-right">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-1.5">
                <Star className="w-5 h-5 text-amber-500 fill-amber-400" />
                <h3 className="text-sm font-bold text-slate-900">
                  {editingReviewId ? 'ویرایش ارزیابی و امتیاز شما' : 'ثبت امتیاز و ارزیابی کیفی'}: {selectedArtisanForRating.fullName}
                </h3>
              </div>
              <button
                onClick={() => setRateModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {rateSuccess ? (
              <div className="p-6 text-center space-y-2">
                <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto" />
                <h4 className="text-sm font-bold text-slate-800">
                  {editingReviewId ? 'ارزیابی شما با موفقیت ویرایش و به‌روزرسانی شد' : 'ارزیابی شما با موفقیت ثبت شد'}
                </h4>
                <p className="text-xs text-slate-500">
                  امتیاز کلی به‌روزرسانی شد و نظر شما در صفحه نمایش داده خواهد شد.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitRating} className="space-y-3 text-xs">
                {/* 1 Review Notice */}
                <div className={`p-2.5 rounded-xl border text-[11px] leading-relaxed flex items-start gap-2 ${
                  editingReviewId
                    ? 'bg-teal-50 border-teal-200 text-teal-900'
                    : 'bg-amber-50 border-amber-200 text-amber-900'
                }`}>
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    {editingReviewId
                      ? 'شما قبلاً برای این مورد نظر ثبت کرده‌اید. اعمال تغییرات باعث ویرایش و به‌روزرسانی نظر و امتیاز قبلی شما خواهد شد.'
                      : 'قانون سامانه: هر کاربر برای هر استادکار یا فروشنده مجاز به ثبت ۱ نظر و امتیاز است و بعداً می‌تواند آن را ویرایش نماید.'}
                  </span>
                </div>

                {/* Overall Star Picker */}
                <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-center space-y-1.5">
                  <span className="text-xs font-bold text-amber-950 block">
                    امتیاز کلی شما به این {selectedArtisanForRating.entityType === 'vendor' ? 'فروشنده' : 'استادکار'}:
                  </span>
                  <div className="flex items-center justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewScore(star)}
                        className="p-1 transition-transform hover:scale-125 focus:outline-none"
                      >
                        <Star
                          className={`w-7 h-7 ${
                            star <= reviewScore
                              ? 'text-amber-500 fill-amber-400'
                              : 'text-slate-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <span className="text-[11px] font-bold text-amber-900 font-mono">
                    {toPersianDigits(reviewScore)} از ۵ ستاره
                  </span>
                </div>

                {/* Criteria Ratings */}
                <div className="space-y-2 p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-700 font-medium">کیفیت، اصالت و استاندارد:</span>
                    <select
                      value={reviewQuality}
                      onChange={(e) => setReviewQuality(Number(e.target.value))}
                      className="h-8 px-2 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-800"
                    >
                      <option value="5">۵ - عالی و بی‌نقص</option>
                      <option value="4">۴ - خوب و استاندارد</option>
                      <option value="3">۳ - متوسط</option>
                      <option value="2">۲ - نیازمند بررسی بیشتر</option>
                      <option value="1">۱ - ضعیف</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-700 font-medium">سرعت تحویل، وقت‌شناسی و اخلاق کاری:</span>
                    <select
                      value={reviewSpeed}
                      onChange={(e) => setReviewSpeed(Number(e.target.value))}
                      className="h-8 px-2 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-800"
                    >
                      <option value="5">۵ - سریع و متعهد به زمان‌بندی</option>
                      <option value="4">۴ - خوب</option>
                      <option value="3">۳ - معمولی</option>
                      <option value="2">۲ - دارای تاخیر</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-700 font-medium">رعایت اصول ایمنی و استانداردهای فنی:</span>
                    <select
                      value={reviewSafety}
                      onChange={(e) => setReviewSafety(Number(e.target.value))}
                      className="h-8 px-2 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-800"
                    >
                      <option value="5">۵ - رعایت کامل استانداردها</option>
                      <option value="4">۴ - خوب</option>
                      <option value="3">۳ - متوسط</option>
                    </select>
                  </div>
                </div>

                {/* Anonymous Review Toggle Option */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isAnonymousReview}
                      onChange={(e) => setIsAnonymousReview(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300"
                    />
                    <div className="space-y-0.5">
                      <span className="font-bold text-slate-800 text-xs block">
                        ثبت نظر به صورت ناشناس
                      </span>
                      <span className="text-[11px] text-slate-500 block leading-relaxed">
                        با فعال کردن این گزینه، نام شما برای سایر کاربران نمایش داده نخواهد شد و نظر با عنوان «مهندس عضو انجمن (ناشناس)» ثبت می‌شود.
                      </span>
                    </div>
                  </label>
                </div>

                {/* Reviewer Engineer Details */}
                {!isAnonymousReview ? (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">
                        نام مهندس نظردهنده:
                      </label>
                      <input
                        type="text"
                        required
                        value={reviewerName}
                        onChange={(e) => setReviewerName(e.target.value)}
                        placeholder="مهندس ..."
                        className="w-full h-9 px-2 rounded-lg bg-slate-50 border border-slate-200 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">
                        شماره پروانه (اختیاری):
                      </label>
                      <input
                        type="text"
                        value={reviewerLicense}
                        onChange={(e) => setReviewerLicense(e.target.value)}
                        placeholder="پروانه نظام مهندسی"
                        className="w-full h-9 px-2 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 text-[11px] flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
                    <span>
                      نام شما برای عموم پنهان می‌ماند و نظر با عنوان <strong>مهندس عضو انجمن (ناشناس)</strong> منتشر خواهد شد.
                    </span>
                  </div>
                )}

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    متن ارزیابی و تجربه همکاری <span className="text-slate-400 font-normal text-[10px]">(اختیاری - می‌توانید بدون نوشتن نظر نیز امتیاز دهید)</span>:
                  </label>
                  <textarea
                    rows={3}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="اختیاری: در صورت تمایل توضیحات و جزییات تجربه کاری خود را بنویسید، یا تنها با تعیین ستاره‌ها امتیاز دهید..."
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs resize-none focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="pt-2 flex items-center justify-between gap-2">
                  <div>
                    {editingReviewId && (
                      <button
                        type="button"
                        onClick={handleDeleteReview}
                        disabled={isSubmittingReview}
                        className="px-3.5 py-2 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold border border-rose-200 flex items-center gap-1.5 transition-colors disabled:opacity-50 text-[11px]"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                        <span>حذف ارزیابی و امتیاز</span>
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setRateModalOpen(false)}
                      className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-medium"
                    >
                      انصراف
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingReview}
                      className="px-5 py-2 rounded-xl bg-amber-600 text-white hover:bg-amber-700 font-bold shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {isSubmittingReview && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                      <span>{editingReviewId ? 'ذخیره ویرایش نظر و امتیاز' : 'ثبت نهایی امتیاز'}</span>
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Modal 3: Edit Artisan or Vendor (Admin action) */}
      <EditArtisanModal
        isOpen={isEditModalOpen}
        artisan={editingArtisan}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingArtisan(null);
        }}
        onSaveSuccess={(updated) => {
          setApprovedArtisans((prev) =>
            prev.map((a) => (a.id === updated.id ? updated : a))
          );
          setAdminActionMessage(`مشخصات «${updated.fullName}» با موفقیت ویرایش و ذخیره گردید.`);
          setTimeout(() => setAdminActionMessage(null), 4000);
        }}
      />

      {/* 4. Market Intro Modal */}
      <MarketIntroModal
        isOpen={isIntroModalOpen}
        onClose={() => setIsIntroModalOpen(false)}
      />

      {/* 5. Add Wage Rate Modal */}
      {/* 5. Add Wage Rate Modal */}
      {addWageModalOpen && (
        <AddWageRateModal
          isOpen={addWageModalOpen}
          onClose={() => {
            setAddWageModalOpen(false);
            setAddWagePreselectedArtisan(null);
            setAddWagePreselectedService(undefined);
          }}
          onSuccess={() => {
            setAddWageModalOpen(false);
            setAddWagePreselectedArtisan(null);
            setAddWagePreselectedService(undefined);
            fetchLiveArtisans(true);
            setAdminActionMessage('سابقه نرخ خدمت با موفقیت ثبت شد و پس از بررسی و تایید مدیریت منتشر خواهد شد.');
            setTimeout(() => setAdminActionMessage(null), 4500);
          }}
          preselectedArtisan={addWagePreselectedArtisan}
          preselectedService={addWagePreselectedService}
          artisansList={approvedArtisans.filter((a) => a.entityType !== 'engineering_service' && a.entityType !== 'vendor')}
          currentUser={currentUser}
        />
      )}

      {/* 6. Wage History Modal for Artisan & Service */}
      {wageHistoryModalOpen && (
        <WageHistoryModal
          isOpen={wageHistoryModalOpen}
          onClose={() => {
            setWageHistoryModalOpen(false);
            setHistoryModalArtisan(null);
          }}
          artisan={historyModalArtisan}
          serviceTitle={historyModalService}
          unit={historyModalUnit}
          records={wagePrices}
          onOpenAddRate={(artisan, service) => {
            setWageHistoryModalOpen(false);
            setAddWagePreselectedArtisan(artisan);
            setAddWagePreselectedService(service);
            setAddWageModalOpen(true);
          }}
        />
      )}

      {/* 7. 30-Day Statistics & Analytics Modal for a Service */}
      {serviceStatsModalOpen && (
        <ServiceStatsModal
          isOpen={serviceStatsModalOpen}
          onClose={() => setServiceStatsModalOpen(false)}
          serviceTitle={statsModalService}
          allWageRecords={wagePrices}
          onOpenAddRateForService={(service) => {
            setServiceStatsModalOpen(false);
            setAddWagePreselectedArtisan(null);
            setAddWagePreselectedService(service);
            setAddWageModalOpen(true);
          }}
        />
      )}

      {/* 8. Admin Wage Moderation & Excel Export Modal */}
      {adminWageModalOpen && (
        <AdminWageModerationModal
          isOpen={adminWageModalOpen}
          onClose={() => setAdminWageModalOpen(false)}
          wageRecords={wagePrices}
          onRefresh={() => fetchLiveArtisans(true)}
        />
      )}

      {/* 9. Admin Login Modal for direct access to wage moderation */}
      {isAdminLoginOpen && (
        <AdminLoginModal
          isOpen={isAdminLoginOpen}
          onClose={() => setIsAdminLoginOpen(false)}
          onLoginSuccess={() => {
            setIsAdminLoginOpen(false);
            setLocalAdminAuthenticated(true);
            setAdminWageModalOpen(true);
            setAdminActionMessage('احراز هویت مدیر با موفقیت انجام شد. هم‌اکنون به پنل مدیریت نرخ‌ها دسترسی دارید.');
            setTimeout(() => setAdminActionMessage(null), 4000);
          }}
        />
      )}
    </div>
  );
};
