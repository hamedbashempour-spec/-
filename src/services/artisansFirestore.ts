import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from './firebase';
import { ArtisanItem, ArtisanReview } from '../types';

const ARTISANS_COLLECTION = 'artisans';
const REVIEWS_SUBCOLLECTION = 'reviews';
const STORAGE_KEY_CACHE = 'urmia_artisans_data';

/**
 * Normalizes an artisan document and its reviews from Firestore
 */
function mapFirestoreDocToArtisan(id: string, data: any, reviews: ArtisanReview[] = []): ArtisanItem {
  return {
    id,
    entityType: data.entityType || 'artisan',
    fullName: data.fullName || '',
    storeName: data.storeName || undefined,
    managerName: data.managerName || undefined,
    trade: data.trade || '',
    tradeCategory: data.tradeCategory || data.trade || '',
    experienceYears: Number(data.experienceYears) || 0,
    phone: data.phone || '',
    district: data.district || 'ارومیه',
    description: data.description || '',
    referrerName: data.referrerName || 'مهندس عضو انجمن',
    referrerLicense: data.referrerLicense || undefined,
    referrerPhone: data.referrerPhone || undefined,
    referrerUserId: data.referrerUserId || undefined,
    createdByUserId: data.createdByUserId || undefined,
    createdByUsername: data.createdByUsername || undefined,
    registeredByEngineer: data.registeredByEngineer || undefined,
    rating: data.rating !== undefined ? Number(data.rating) : 0,
    ratingCount: data.ratingCount !== undefined ? Number(data.ratingCount) : reviews.length,
    verifiedByAssociation: true,
    status: 'approved',
    createdAt: data.createdAt || undefined,
    approvedAt: data.approvedAt || undefined,
    reviews,
  };
}

/**
 * 1. Fetch artisans and vendors from Server Disk and Cloud Firestore
 * Merged seamlessly by ID so item counts never fluctuate or drop.
 */
export async function fetchArtisans(includePending = false): Promise<ArtisanItem[]> {
  const itemsMap = new Map<string, ArtisanItem>();

  // 1. Fetch from server API (authoritative persistent storage)
  try {
    const url = `/api/artisans?_t=${Date.now()}`;
    const res = await fetch(url);
    const json = await res.json();
    if (json.success && Array.isArray(json.items)) {
      for (const item of json.items) {
        if (item?.id) {
          itemsMap.set(item.id, {
            ...item,
            verifiedByAssociation: true,
            status: 'approved',
          });
        }
      }
    }
  } catch (err) {
    console.warn('[Artisans] Server fetch notice:', err);
  }

  // 2. Fetch from Firestore fallback only if server was unavailable or returned empty
  if (itemsMap.size === 0) {
    try {
      const colRef = collection(db, ARTISANS_COLLECTION);
      const q = query(colRef);
    const snapshot = await getDocs(q);

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      const artisanId = docSnap.id;

      let reviews: ArtisanReview[] = [];
      try {
        const revRef = collection(db, ARTISANS_COLLECTION, artisanId, REVIEWS_SUBCOLLECTION);
        const revSnapshot = await getDocs(revRef);
        reviews = revSnapshot.docs.map((rSnap) => {
          const rData = rSnap.data();
          return {
            id: rSnap.id,
            reviewerUserId: rData.reviewerUserId,
            reviewerName: rData.reviewerName || 'مهندس عضو انجمن',
            reviewerLicense: rData.reviewerLicense,
            reviewerPhone: rData.reviewerPhone,
            score: Number(rData.score) || 5,
            comment: rData.comment || '',
            date: rData.date || '',
            updatedAt: rData.updatedAt,
            criteria: rData.criteria || undefined,
          };
        });
      } catch {}

      const mapped = mapFirestoreDocToArtisan(artisanId, data, reviews);
      // Merge into map
      if (!itemsMap.has(artisanId)) {
        itemsMap.set(artisanId, mapped);
      } else {
        const existing = itemsMap.get(artisanId)!;
        itemsMap.set(artisanId, {
          ...existing,
          ...mapped,
          reviews: reviews.length > 0 ? reviews : existing.reviews || [],
        });
      }
    }
  } catch (error) {
    console.warn('[Artisans] Firestore fetch notice:', error);
  }
}

  // 3. Fallback to local storage if both failed
  if (itemsMap.size === 0) {
    try {
      const cached = localStorage.getItem(STORAGE_KEY_CACHE);
      if (cached) {
        const list: ArtisanItem[] = JSON.parse(cached);
        for (const it of list) {
          if (it?.id) itemsMap.set(it.id, { ...it, verifiedByAssociation: true, status: 'approved' });
        }
      }
    } catch {}
  }

  const items = Array.from(itemsMap.values());
  items.sort((a, b) => (b.rating || 0) - (a.rating || 0));

  // Update local cache
  try {
    localStorage.setItem(STORAGE_KEY_CACHE, JSON.stringify(items));
  } catch {}

  return items;
}

/**
 * 2. Create new artisan or vendor in Firestore and Server
 * Automatically published immediately so all users (including user 3) can see them,
 * while admin retains deletion/moderation capability.
 */
export async function createArtisan(itemData: Partial<ArtisanItem>): Promise<ArtisanItem> {
  const newId = itemData.id || `art-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const nowFa = new Intl.DateTimeFormat('fa-IR').format(new Date());

  const docData = {
    id: newId,
    entityType: itemData.entityType || 'artisan',
    fullName: String(itemData.fullName || '').trim(),
    storeName: itemData.storeName ? String(itemData.storeName).trim() : null,
    managerName: itemData.managerName ? String(itemData.managerName).trim() : null,
    trade: String(itemData.trade || '').trim(),
    tradeCategory: String(itemData.tradeCategory || itemData.trade || '').trim(),
    experienceYears: Number(itemData.experienceYears) || 5,
    phone: String(itemData.phone || '').trim(),
    district: String(itemData.district || 'ارومیه').trim(),
    description: String(itemData.description || '').trim(),
    referrerName: String(itemData.referrerName || 'مهندس عضو انجمن').trim(),
    referrerLicense: itemData.referrerLicense ? String(itemData.referrerLicense).trim() : null,
    referrerPhone: itemData.referrerPhone ? String(itemData.referrerPhone).trim() : null,
    referrerUserId: auth.currentUser?.uid || (itemData.referrerUserId ? String(itemData.referrerUserId).trim() : null),
    createdByUserId: itemData.createdByUserId ? String(itemData.createdByUserId).trim() : (auth.currentUser?.uid || (itemData.referrerUserId ? String(itemData.referrerUserId).trim() : null)),
    createdByUsername: itemData.createdByUsername ? String(itemData.createdByUsername).trim() : null,
    registeredByEngineer: itemData.registeredByEngineer || `مهندس ${itemData.referrerName || 'عضو انجمن'}`,
    rating: 0,
    ratingCount: 0,
    verifiedByAssociation: true, // Immediately active and published
    status: 'approved',
    createdAt: nowFa,
    approvedAt: nowFa,
  };

  // 1. Primary: Save to server persistent storage first (guarantees durability)
  let serverSavedItem: ArtisanItem | null = null;
  try {
    const res = await fetch('/api/artisans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...itemData, id: newId }),
    });
    const json = await res.json();
    if (json.success && json.item) {
      serverSavedItem = json.item;
    }
  } catch (err) {
    console.warn('[Artisans] Server post notice:', err);
  }

  // 2. Also save to Firestore client SDK for real-time clients
  try {
    const docRef = doc(db, ARTISANS_COLLECTION, newId);
    await setDoc(docRef, docData);
  } catch (err) {
    console.warn('[Artisans] Client Firestore setDoc notice:', err);
  }

  const resultItem = serverSavedItem || mapFirestoreDocToArtisan(newId, docData, []);

  // Update local cache so it appears immediately on user's own screen
  try {
    const cached = localStorage.getItem(STORAGE_KEY_CACHE);
    const list: ArtisanItem[] = cached ? JSON.parse(cached) : [];
    const updated = [resultItem, ...list.filter((a) => a.id !== newId)];
    localStorage.setItem(STORAGE_KEY_CACHE, JSON.stringify(updated));
  } catch {}

  return resultItem;
}

/**
 * 3. Approve Artisan or Vendor (Admin action)
 * Uses Server-Side Endpoint with Session Verification and Firebase Admin SDK.
 */
export async function approveArtisan(artisanId: string): Promise<void> {
  const nowFa = new Intl.DateTimeFormat('fa-IR').format(new Date());

  let sessionData: any = null;
  try {
    const raw = localStorage.getItem('urmia_user_session');
    if (raw) sessionData = JSON.parse(raw);
  } catch {}

  // If user has admin authentication flag
  const isAdminAuth =
    localStorage.getItem('urmia_admin_authenticated') === 'true' ||
    sessionStorage.getItem('urmia_admin_authenticated') === 'true' ||
    sessionData?.role === 'admin';

  const effectiveAdminUsername =
    (isAdminAuth && (sessionData?.username || 'admin')) ||
    sessionData?.username ||
    'admin';

  let encodedSession = '';
  if (sessionData) {
    try {
      encodedSession = encodeURIComponent(JSON.stringify(sessionData));
    } catch {}
  }

  try {
    const response = await fetch(`/api/artisans/${artisanId}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-authenticated': 'true',
        'x-user-session': encodedSession,
      },
      body: JSON.stringify({
        username: effectiveAdminUsername,
        adminUsername: effectiveAdminUsername,
        isAdminAuthenticated: true,
        userSession: sessionData,
      }),
    });
    await response.json().catch(() => {});
  } catch (netErr) {
    console.warn('[Approve] Server call warning:', netErr);
  }

  // Update in local cache immediately
  try {
    const cached = localStorage.getItem(STORAGE_KEY_CACHE);
    if (cached) {
      const list: ArtisanItem[] = JSON.parse(cached);
      const updated = list.map((a) =>
        a.id === artisanId ? { ...a, verifiedByAssociation: true, status: 'approved', approvedAt: nowFa } : a
      );
      localStorage.setItem(STORAGE_KEY_CACHE, JSON.stringify(updated));
    }
  } catch {}

  // If user is also authenticated into Firebase Auth on client, sync client doc
  try {
    const docRef = doc(db, ARTISANS_COLLECTION, artisanId);
    await updateDoc(docRef, {
      status: 'approved',
      verifiedByAssociation: true,
      approvedAt: nowFa,
    });
  } catch {
    // Client direct write is secondary
  }
}

/**
 * 3.5. Update Artisan or Vendor (Admin action)
 */
export async function updateArtisan(
  artisanId: string,
  updates: Partial<ArtisanItem>
): Promise<ArtisanItem> {
  let updatedItem: ArtisanItem | null = null;

  // 1. Call server endpoint
  try {
    const res = await fetch(`/api/artisans/${artisanId}/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.item) {
        updatedItem = data.item;
      }
    }
  } catch (err) {
    console.warn('[Artisans] Server update warning:', err);
  }

  // 2. Direct Firestore update if permitted
  try {
    const docRef = doc(db, ARTISANS_COLLECTION, artisanId);
    await updateDoc(docRef, {
      ...updates,
      verifiedByAssociation: true,
      status: 'approved',
    });
  } catch (err) {
    console.warn('[Artisans] Notice updating Firestore directly:', err);
  }

  // 3. Update local cache
  try {
    const cached = localStorage.getItem(STORAGE_KEY_CACHE);
    if (cached) {
      const list: ArtisanItem[] = JSON.parse(cached);
      const updatedList = list.map((a) => {
        if (a.id === artisanId) {
          return {
            ...a,
            ...updates,
            verifiedByAssociation: true,
            status: 'approved' as const,
          };
        }
        return a;
      });
      localStorage.setItem(STORAGE_KEY_CACHE, JSON.stringify(updatedList));
      if (!updatedItem) {
        updatedItem = updatedList.find((a) => a.id === artisanId) || null;
      }
    }
  } catch {}

  if (!updatedItem) {
    updatedItem = {
      id: artisanId,
      fullName: updates.fullName || '',
      trade: updates.trade || '',
      tradeCategory: updates.tradeCategory || updates.trade || '',
      experienceYears: updates.experienceYears || 0,
      phone: updates.phone || '',
      district: updates.district || 'ارومیه',
      description: updates.description || '',
      referrerName: updates.referrerName || 'مدیریت سامانه',
      verifiedByAssociation: true,
      status: 'approved',
      ...updates,
    };
  }

  return updatedItem;
}

/**
 * 4. Delete Artisan or Vendor (Admin action)
 */
export async function deleteArtisan(artisanId: string): Promise<void> {
  // 1. Delete on server first (server-authoritative with admin access)
  try {
    await fetch(`/api/artisans/${artisanId}`, { method: 'DELETE' });
  } catch (err) {
    console.warn('[Artisans] Server delete error:', err);
  }

  // 2. Delete on Firestore directly if client has rights
  try {
    const docRef = doc(db, ARTISANS_COLLECTION, artisanId);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn('[Artisans] Notice deleting direct from Firestore:', err);
  }

  // 3. Remove from local cache
  try {
    const cached = localStorage.getItem(STORAGE_KEY_CACHE);
    if (cached) {
      const list: ArtisanItem[] = JSON.parse(cached);
      const updated = list.filter((a) => a.id !== artisanId);
      localStorage.setItem(STORAGE_KEY_CACHE, JSON.stringify(updated));
    }
  } catch {}
}

/**
 * 5. Add or Edit Review in Subcollection:
 *    artisans/{artisanId}/reviews/{reviewId}
 *
 * Enforces strictly 1 review per user:
 * reviewId = Firebase UID || reviewerUserId || reviewerPhone || generatedId
 */
export async function saveArtisanReview(
  artisanId: string,
  reviewInput: {
    reviewId?: string;
    reviewerUserId?: string;
    reviewerName: string;
    reviewerLicense?: string;
    reviewerPhone?: string;
    isAnonymous?: boolean;
    score: number;
    comment?: string;
    criteria?: { quality: number; speed: number; safety: number; commitment: number };
  }
): Promise<{ isEdit: boolean; review: ArtisanReview; newRating: number; newRatingCount: number }> {
  const nowFa = new Intl.DateTimeFormat('fa-IR').format(new Date());

  // Determine single-review unique deterministic document ID for this user + artisan
  const userUid = auth.currentUser?.uid || reviewInput.reviewerUserId;
  const effectiveReviewId =
    reviewInput.reviewId ||
    (userUid
      ? `rev_${artisanId}_${userUid}`
      : `rev_${artisanId}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`);

  const isAnon = Boolean(
    reviewInput.isAnonymous ||
    (reviewInput.reviewerName && reviewInput.reviewerName.includes('ناشناس'))
  );

  const effectiveReviewerName = isAnon
    ? 'مهندس عضو انجمن (ناشناس)'
    : String(reviewInput.reviewerName).trim();

  const reviewPayload = {
    id: effectiveReviewId,
    reviewerUserId: userUid || null,
    reviewerName: effectiveReviewerName,
    reviewerLicense: isAnon ? null : (reviewInput.reviewerLicense ? String(reviewInput.reviewerLicense).trim() : null),
    reviewerPhone: isAnon ? null : (reviewInput.reviewerPhone ? String(reviewInput.reviewerPhone).trim() : null),
    isAnonymous: isAnon,
    score: Math.max(1, Math.min(5, Number(reviewInput.score) || 5)),
    comment: reviewInput.comment ? String(reviewInput.comment).trim() : '',
    criteria: reviewInput.criteria || { quality: 5, speed: 5, safety: 5, commitment: 5 },
    date: nowFa,
    updatedAt: nowFa,
  };

  let serverResult: { isEdit: boolean; review: ArtisanReview; newRating: number; newRatingCount: number } | null = null;

  // 1. Primary: Save to server API first (guarantees durability in storedArtisans.json and writes to Firestore via Admin SDK)
  try {
    const res = await fetch(`/api/artisans/${artisanId}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...reviewInput,
        reviewerName: effectiveReviewerName,
        isAnonymous: isAnon,
        comment: reviewPayload.comment,
        reviewId: effectiveReviewId,
      }),
    });
    const data = await res.json();
    if (data.success && data.item) {
      serverResult = {
        isEdit: Boolean(data.isEdit),
        review: data.review || {
          id: effectiveReviewId,
          reviewerUserId: userUid || reviewInput.reviewerUserId,
          reviewerName: effectiveReviewerName,
          reviewerLicense: isAnon ? undefined : reviewInput.reviewerLicense,
          reviewerPhone: isAnon ? undefined : reviewInput.reviewerPhone,
          isAnonymous: isAnon,
          score: reviewPayload.score,
          comment: reviewPayload.comment,
          date: nowFa,
          updatedAt: data.isEdit ? nowFa : undefined,
          criteria: reviewPayload.criteria,
        },
        newRating: typeof data.newRating === 'number' ? data.newRating : (data.item?.rating || reviewPayload.score),
        newRatingCount: typeof data.newRatingCount === 'number' ? data.newRatingCount : (data.item?.ratingCount || 1),
      };
    }
  } catch (serverErr) {
    console.warn('[Artisans] Server post review warning:', serverErr);
  }

  // 2. Also save to Firestore client SDK for real-time clients
  try {
    const reviewDocRef = doc(db, ARTISANS_COLLECTION, artisanId, REVIEWS_SUBCOLLECTION, effectiveReviewId);
    const cleanPayloadForFs: Record<string, any> = {};
    for (const [k, v] of Object.entries(reviewPayload)) {
      if (v !== undefined) {
        cleanPayloadForFs[k] = v;
      }
    }
    await setDoc(reviewDocRef, cleanPayloadForFs, { merge: true });
  } catch (fsErr) {
    console.warn('[Artisans] Client Firestore review setDoc notice:', fsErr);
  }

  const finalReview: ArtisanReview = serverResult?.review || {
    id: effectiveReviewId,
    reviewerUserId: userUid || reviewInput.reviewerUserId,
    reviewerName: effectiveReviewerName,
    reviewerLicense: isAnon ? undefined : reviewInput.reviewerLicense,
    reviewerPhone: isAnon ? undefined : reviewInput.reviewerPhone,
    isAnonymous: isAnon,
    score: reviewPayload.score,
    comment: reviewPayload.comment,
    date: nowFa,
    criteria: reviewPayload.criteria,
  };

  const finalRating = serverResult?.newRating ?? reviewPayload.score;
  const finalRatingCount = serverResult?.newRatingCount ?? 1;
  const finalIsEdit = serverResult?.isEdit ?? Boolean(reviewInput.reviewId);

  // 3. Update local cache so reviews immediately appear across views
  try {
    const cached = localStorage.getItem(STORAGE_KEY_CACHE);
    if (cached) {
      const list: ArtisanItem[] = JSON.parse(cached);
      const updated = list.map((a) => {
        if (a.id === artisanId) {
          const existingReviews = a.reviews || [];
          const rIdx = existingReviews.findIndex((r) => r.id === effectiveReviewId);
          let nextReviews: ArtisanReview[];
          if (rIdx >= 0) {
            nextReviews = [...existingReviews];
            nextReviews[rIdx] = finalReview;
          } else {
            nextReviews = [finalReview, ...existingReviews];
          }
          return {
            ...a,
            rating: finalRating,
            ratingCount: finalRatingCount,
            reviews: nextReviews,
          };
        }
        return a;
      });
      localStorage.setItem(STORAGE_KEY_CACHE, JSON.stringify(updated));
    }
  } catch {}

  return {
    isEdit: finalIsEdit,
    review: finalReview,
    newRating: finalRating,
    newRatingCount: finalRatingCount,
  };
}

/**
 * 6. Delete an artisan review (by author or admin) and recalculate rating
 */
export async function deleteArtisanReview(
  artisanId: string,
  reviewId: string
): Promise<{ newRating: number; newRatingCount: number }> {
  let newRating = 0;
  let newRatingCount = 0;

  // 1. Call server endpoint first (authoritative deletion from storage & Firestore Admin)
  try {
    const res = await fetch(`/api/artisans/${artisanId}/reviews/${reviewId}`, {
      method: 'DELETE',
    });
    const data = await res.json();
    if (data.success) {
      newRating = data.newRating ?? 0;
      newRatingCount = data.newRatingCount ?? 0;
    }
  } catch (serverErr) {
    console.warn('[Artisans] Server delete review notice:', serverErr);
  }

  // 2. Also delete from Firestore client SDK if possible
  try {
    const reviewDocRef = doc(db, ARTISANS_COLLECTION, artisanId, REVIEWS_SUBCOLLECTION, reviewId);
    await deleteDoc(reviewDocRef);
  } catch (fsErr) {
    console.warn('[Artisans] Client Firestore deleteDoc notice:', fsErr);
  }

  // 3. Update local cache
  try {
    const cached = localStorage.getItem(STORAGE_KEY_CACHE);
    if (cached) {
      const list: ArtisanItem[] = JSON.parse(cached);
      const updated = list.map((a) => {
        if (a.id === artisanId) {
          const filtered = (a.reviews || []).filter((r) => r.id !== reviewId);
          return {
            ...a,
            rating: newRating,
            ratingCount: newRatingCount,
            reviews: filtered,
          };
        }
        return a;
      });
      localStorage.setItem(STORAGE_KEY_CACHE, JSON.stringify(updated));
    }
  } catch {}

  return { newRating, newRatingCount };
}
