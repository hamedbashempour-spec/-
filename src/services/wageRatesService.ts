import {
  WagePriceRecord,
  WageServiceStatistics,
  ArtisanLatestWage,
  WagePriceType,
} from '../types';
import {
  getCurrentJalaliDate,
  parseJalaliDate,
  jalaliToDays,
} from '../utils/jalaliDate';
import {
  getFixedUnitForTrade,
  APPROVED_CONSTRUCTION_TRADES,
} from '../data/wageTradesData';
import { db } from './firebase';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  query,
} from 'firebase/firestore';

const WAGE_PRICES_COLLECTION = 'wagePrices';
const STORAGE_KEY_CACHE = 'urmia_wage_prices_data';

export interface FetchWagePricesParams {
  status?: 'all' | 'approved' | 'pending' | 'rejected';
  serviceTitle?: string;
  artisanId?: string;
  priceType?: 'all' | 'executed_contract' | 'inquiry_quote';
}

/**
 * Fetch wage prices from Server API (authoritative persistent storage)
 * with Firestore cloud fallback and local caching.
 */
export async function fetchWagePrices(
  params: FetchWagePricesParams = {}
): Promise<WagePriceRecord[]> {
  const queryParams = new URLSearchParams();
  if (params.status) queryParams.set('status', params.status);
  if (params.serviceTitle) queryParams.set('serviceTitle', params.serviceTitle);
  if (params.artisanId) queryParams.set('artisanId', params.artisanId);
  if (params.priceType && params.priceType !== 'all') {
    queryParams.set('priceType', params.priceType);
  }
  queryParams.set('_t', String(Date.now()));

  let items: WagePriceRecord[] = [];
  let serverSuccess = false;

  // 1. Fetch from server API
  try {
    const res = await fetch(`/api/market/wages?${queryParams.toString()}`);
    const json = await res.json();
    if (json.success && Array.isArray(json.items)) {
      items = json.items;
      serverSuccess = true;
    }
  } catch (err) {
    console.warn('[WageRates] Server fetch notice:', err);
  }

  // 2. Fallback to Firestore if server was unreachable
  if (!serverSuccess) {
    try {
      const colRef = collection(db, WAGE_PRICES_COLLECTION);
      const snapshot = await getDocs(query(colRef));
      const fsItems: WagePriceRecord[] = [];
      snapshot.forEach((d) => {
        const data = d.data() as WagePriceRecord;
        fsItems.push({
          ...data,
          id: d.id,
          unit: getFixedUnitForTrade(data.serviceTitle),
        });
      });

      if (fsItems.length > 0) {
        items = fsItems;
      }
    } catch (fsErr) {
      console.warn('[WageRates] Firestore fetch notice:', fsErr);
    }
  }

  // 3. Fallback to local storage cache if both failed
  if (items.length === 0) {
    try {
      const cached = localStorage.getItem(STORAGE_KEY_CACHE);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) items = parsed;
      }
    } catch {}
  } else {
    // Update local cache
    try {
      localStorage.setItem(STORAGE_KEY_CACHE, JSON.stringify(items));
    } catch {}
  }

  // In-memory filter applying the parameters if needed
  let filtered = [...items];
  if (params.status && params.status !== 'all') {
    filtered = filtered.filter((r) => r.status === params.status);
  }
  if (params.serviceTitle && params.serviceTitle !== 'همه خدمات') {
    filtered = filtered.filter((r) => r.serviceTitle === params.serviceTitle);
  }
  if (params.artisanId) {
    filtered = filtered.filter((r) => r.artisanId === params.artisanId);
  }
  if (params.priceType && params.priceType !== 'all') {
    filtered = filtered.filter((r) => r.priceType === params.priceType);
  }

  // Sort descending by actionDate then createdAt
  filtered.sort((a, b) => {
    const dateCmp = (b.actionDate || '').localeCompare(a.actionDate || '');
    if (dateCmp !== 0) return dateCmp;
    return (b.createdAt || '').localeCompare(a.createdAt || '');
  });

  return filtered;
}

/**
 * Submit new wage price record (starts in 'pending' status).
 */
export async function createWagePrice(
  payload: Partial<WagePriceRecord>
): Promise<WagePriceRecord> {
  const serviceTitle = (payload.serviceTitle || '').trim();
  const fixedUnit = getFixedUnitForTrade(serviceTitle);

  const res = await fetch('/api/market/wages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...payload,
      unit: fixedUnit,
    }),
  });

  const json = await res.json();
  if (!json.success || !json.item) {
    throw new Error(json.error || 'خطا در ثبت نرخ دستمزد');
  }

  // Also write to Firestore client SDK for real-time visibility
  try {
    const docRef = doc(db, WAGE_PRICES_COLLECTION, json.item.id);
    await setDoc(docRef, json.item);
  } catch (fsErr) {
    console.warn('[WageRates] Firestore client setDoc notice:', fsErr);
  }

  return json.item;
}

function safeEncodeSessionHeader(sessionData: any): string {
  if (!sessionData) return '';
  try {
    return encodeURIComponent(JSON.stringify(sessionData));
  } catch {
    return '';
  }
}

/**
 * Admin action: Approve a wage price record.
 */
export async function approveWagePrice(id: string): Promise<WagePriceRecord> {
  let sessionData: any = null;
  try {
    const raw = localStorage.getItem('urmia_user_session');
    if (raw) sessionData = JSON.parse(raw);
  } catch {}

  const isAdminAuth =
    localStorage.getItem('urmia_admin_authenticated') === 'true' ||
    sessionStorage.getItem('urmia_admin_authenticated') === 'true' ||
    sessionData?.role === 'admin';

  const effectiveAdminUsername =
    (isAdminAuth && (sessionData?.username || 'admin')) ||
    sessionData?.username ||
    'admin';

  const res = await fetch(`/api/market/wages/${id}/approve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-authenticated': 'true',
      'x-user-session': safeEncodeSessionHeader(sessionData),
    },
    body: JSON.stringify({
      adminUsername: effectiveAdminUsername,
      isAdminAuthenticated: true,
      userSession: sessionData,
    }),
  });

  const json = await res.json();
  if (!json.success || !json.item) {
    throw new Error(json.error || 'خطا در تایید نرخ دستمزد');
  }

  // Update in Firestore
  try {
    const docRef = doc(db, WAGE_PRICES_COLLECTION, id);
    await setDoc(docRef, { status: 'approved', approvedAt: json.item.approvedAt, approvedBy: json.item.approvedBy }, { merge: true });
  } catch {}

  // Update in local storage cache immediately
  try {
    const cached = localStorage.getItem(STORAGE_KEY_CACHE);
    if (cached) {
      const list = JSON.parse(cached);
      if (Array.isArray(list)) {
        const idx = list.findIndex((w: any) => w.id === id);
        if (idx !== -1) {
          list[idx] = { ...list[idx], ...json.item };
          localStorage.setItem(STORAGE_KEY_CACHE, JSON.stringify(list));
        }
      }
    }
  } catch {}

  return json.item;
}

/**
 * Admin action: Reject a wage price record.
 */
export async function rejectWagePrice(
  id: string,
  rejectionReason?: string
): Promise<WagePriceRecord> {
  let sessionData: any = null;
  try {
    const raw = localStorage.getItem('urmia_user_session');
    if (raw) sessionData = JSON.parse(raw);
  } catch {}

  const isAdminAuth =
    localStorage.getItem('urmia_admin_authenticated') === 'true' ||
    sessionStorage.getItem('urmia_admin_authenticated') === 'true' ||
    sessionData?.role === 'admin';

  const effectiveAdminUsername =
    (isAdminAuth && (sessionData?.username || 'admin')) ||
    sessionData?.username ||
    'admin';

  const res = await fetch(`/api/market/wages/${id}/reject`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-authenticated': 'true',
      'x-user-session': safeEncodeSessionHeader(sessionData),
    },
    body: JSON.stringify({
      rejectionReason: rejectionReason || 'عدم تطابق با شرایط بازار',
      adminUsername: effectiveAdminUsername,
      isAdminAuthenticated: true,
      userSession: sessionData,
    }),
  });

  const json = await res.json();
  if (!json.success || !json.item) {
    throw new Error(json.error || 'خطا در رد نرخ دستمزد');
  }

  try {
    const docRef = doc(db, WAGE_PRICES_COLLECTION, id);
    await setDoc(docRef, { status: 'rejected', rejectionReason: json.item.rejectionReason }, { merge: true });
  } catch {}

  try {
    const cached = localStorage.getItem(STORAGE_KEY_CACHE);
    if (cached) {
      const list = JSON.parse(cached);
      if (Array.isArray(list)) {
        const idx = list.findIndex((w: any) => w.id === id);
        if (idx !== -1) {
          list[idx] = { ...list[idx], ...json.item };
          localStorage.setItem(STORAGE_KEY_CACHE, JSON.stringify(list));
        }
      }
    }
  } catch {}

  return json.item;
}

/**
 * Admin action: Delete a wage price record.
 */
export async function deleteWagePrice(id: string): Promise<void> {
  let sessionData: any = null;
  try {
    const raw = localStorage.getItem('urmia_user_session');
    if (raw) sessionData = JSON.parse(raw);
  } catch {}

  const res = await fetch(`/api/market/wages/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-authenticated': 'true',
      'x-user-session': safeEncodeSessionHeader(sessionData),
    },
    body: JSON.stringify({
      isAdminAuthenticated: true,
      userSession: sessionData,
    }),
  });
  const json = await res.json();
  if (!json.success) {
    throw new Error(json.error || 'خطا در حذف نرخ دستمزد');
  }

  try {
    const cached = localStorage.getItem(STORAGE_KEY_CACHE);
    if (cached) {
      const list = JSON.parse(cached);
      if (Array.isArray(list)) {
        const filtered = list.filter((w: any) => w.id !== id);
        localStorage.setItem(STORAGE_KEY_CACHE, JSON.stringify(filtered));
      }
    }
  } catch {}
}

/**
 * Calculates 30-day statistics based strictly on ACTUAL actionDate
 * for approved records of a given service.
 */
export function calculate30DayStats(
  allApprovedRecords: WagePriceRecord[],
  serviceTitle: string,
  priceTypeFilter: 'all' | 'executed_contract' | 'inquiry_quote' = 'all'
): WageServiceStatistics {
  const unit = getFixedUnitForTrade(serviceTitle);
  const curJalali = getCurrentJalaliDate();
  const curDays = jalaliToDays(curJalali.year, curJalali.month, curJalali.day);

  // 1. Filter by service title and approved status
  const serviceRecords = allApprovedRecords.filter(
    (r) =>
      r.status === 'approved' &&
      r.serviceTitle === serviceTitle &&
      r.priceAmountTomans > 0
  );

  // 2. Filter by 30-day window based on actionDate (date of work or quote)
  const windowRecords = serviceRecords.filter((r) => {
    if (!r.actionDate) return false;
    const parsed = parseJalaliDate(r.actionDate);
    if (!parsed) return false;
    const recDays = jalaliToDays(parsed.year, parsed.month, parsed.day);
    const diff = curDays - recDays;
    // Exactly within the last 30 days (diff >= 0 and diff <= 30)
    return diff >= 0 && diff <= 30;
  });

  // 3. Filter by priceType if specified
  const targetRecords =
    priceTypeFilter === 'all'
      ? windowRecords
      : windowRecords.filter((r) => r.priceType === priceTypeFilter);

  const sampleCount = targetRecords.length;
  const executedCount = targetRecords.filter(
    (r) => r.priceType === 'executed_contract'
  ).length;
  const inquiryCount = targetRecords.filter(
    (r) => r.priceType === 'inquiry_quote'
  ).length;

  if (sampleCount === 0) {
    return {
      serviceTitle,
      unit,
      averagePrice: 0,
      minPrice: 0,
      maxPrice: 0,
      sampleCount: 0,
      hasEnoughData: false,
      executedCount: 0,
      inquiryCount: 0,
    };
  }

  const prices = targetRecords.map((r) => r.priceAmountTomans);
  const sum = prices.reduce((a, b) => a + b, 0);
  const averagePrice = Math.round(sum / sampleCount);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  return {
    serviceTitle,
    unit,
    averagePrice,
    minPrice,
    maxPrice,
    sampleCount,
    hasEnoughData: true,
    executedCount,
    inquiryCount,
  };
}

/**
 * Extracts the latest approved wage for each service offered by each artisan.
 * Groups by artisanId -> map of serviceTitle -> latest record (by actionDate).
 */
export function extractArtisansLatestWages(
  approvedRecords: WagePriceRecord[]
): Map<string, ArtisanLatestWage[]> {
  const result = new Map<string, ArtisanLatestWage[]>();

  // Filter only approved records with valid amounts
  const validRecords = approvedRecords.filter(
    (r) => r.status === 'approved' && r.priceAmountTomans > 0 && r.artisanId
  );

  // Group by artisanId
  const byArtisan = new Map<string, WagePriceRecord[]>();
  for (const r of validRecords) {
    const list = byArtisan.get(r.artisanId) || [];
    list.push(r);
    byArtisan.set(r.artisanId, list);
  }

  for (const [artisanId, records] of byArtisan.entries()) {
    // Group by serviceTitle
    const byService = new Map<string, WagePriceRecord>();
    for (const r of records) {
      const existing = byService.get(r.serviceTitle);
      if (!existing) {
        byService.set(r.serviceTitle, r);
      } else {
        // Compare by actionDate (newest first)
        const cmp = (r.actionDate || '').localeCompare(existing.actionDate || '');
        if (cmp > 0) {
          byService.set(r.serviceTitle, r);
        } else if (cmp === 0 && (r.createdAt || '').localeCompare(existing.createdAt || '') > 0) {
          byService.set(r.serviceTitle, r);
        }
      }
    }

    const latestList: ArtisanLatestWage[] = [];
    for (const [sTitle, rec] of byService.entries()) {
      latestList.push({
        serviceTitle: sTitle,
        unit: rec.unit || getFixedUnitForTrade(sTitle),
        priceAmountTomans: rec.priceAmountTomans,
        priceType: rec.priceType,
        actionDate: rec.actionDate,
        recordId: rec.id,
      });
    }

    // Sort by service title
    latestList.sort((a, b) => a.serviceTitle.localeCompare(b.serviceTitle, 'fa'));
    result.set(artisanId, latestList);
  }

  return result;
}
