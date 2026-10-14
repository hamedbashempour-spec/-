import {
  DailyMojriItem,
  MojrianDailySnapshot,
  DailyReferralReport,
  MojriChangeDetail,
  ZeroCountMojriRecord,
} from '../types/referralMonitoring';

/**
 * Strict Comparison Engine adhering to:
 * 1. Is mojri removed? -> new job (count = previous count or at least 1)
 * 2. Is mojri added? -> released job (count = 1)
 * 3. Has count changed?
 *    - if count decreased: (oldCount - newCount) new jobs
 *    - if count increased: (newCount - oldCount) released jobs
 *    - DO NOT count meterage changes when count changed!
 * 4. If count is constant:
 *    - if meterage decreased: 1 new job
 *    - if meterage increased: 1 released job
 *    - if meterage constant: no change
 *
 * Zero-count records:
 *    - completely separate from main job referral stats
 *    - audited based on 300 m2 limit
 */

export function analyzeDailySnapshots(
  prevSnapshot: MojrianDailySnapshot | null,
  currentSnapshot: MojrianDailySnapshot
): DailyReferralReport {
  const currentDate = currentSnapshot.date;
  const currentTimestamp = currentSnapshot.timestamp;
  const currentItems = currentSnapshot.items;

  // Separate records with no count vs normal records in today's snapshot
  const zeroCountRecords: ZeroCountMojriRecord[] = [];
  let zeroCountTotalMeterage = 0;
  let zeroCountExceedingMeterage = 0;
  let zeroCountJobsWithinLimit = 0;
  let zeroCountJobsExceedingLimit = 0;

  // Standard items for referral counting
  const currentNormalItems: DailyMojriItem[] = [];

  for (const item of currentItems) {
    // Check if item has no remaining count (null, undefined, NaN)
    const isZeroCount =
      item.remainingCount === null ||
      item.remainingCount === undefined ||
      isNaN(item.remainingCount);

    if (isZeroCount) {
      const meterage = Number(item.remainingMeterage) || 0;
      const isSuspicious = meterage > 300;
      zeroCountTotalMeterage += meterage;
      if (isSuspicious) {
        zeroCountJobsExceedingLimit++;
        zeroCountExceedingMeterage += meterage;
      } else {
        zeroCountJobsWithinLimit++;
      }
      zeroCountRecords.push({
        name: item.name,
        type: item.type,
        phone: item.phone,
        manager: item.manager,
        meterage,
        isSuspicious,
        statusLabel: isSuspicious
          ? 'کار بدون تعداد کار - بالاتر از حد ۳۰۰ مترمربع'
          : 'کار بدون تعداد کار - در محدوده مجاز',
      });
    } else {
      currentNormalItems.push(item);
    }
  }

  // If no previous snapshot (Day 1 baseline)
  if (!prevSnapshot) {
    return {
      date: currentDate,
      timestamp: currentTimestamp,
      totalMojrian: currentItems.length,
      newJobsCount: 0,
      releasedJobsCount: 0,
      removedMojrianCount: 0,
      addedMojrianCount: 0,
      zeroCountJobsTotal: zeroCountRecords.length,
      zeroCountJobsWithinLimit,
      zeroCountJobsExceedingLimit,
      zeroCountTotalMeterage,
      zeroCountExceedingMeterage,
      zeroCountRecords,
      changes: [],
    };
  }

  // Previous normal items
  const prevItems = prevSnapshot.items;
  const prevNormalMap = new Map<string, DailyMojriItem>();

  for (const item of prevItems) {
    const isZeroCount =
      item.remainingCount === null ||
      item.remainingCount === undefined ||
      isNaN(item.remainingCount);
    if (!isZeroCount) {
      const key = `${item.name.trim()}_${item.type}`;
      prevNormalMap.set(key, item);
    }
  }

  const currentNormalMap = new Map<string, DailyMojriItem>();
  for (const item of currentNormalItems) {
    const key = `${item.name.trim()}_${item.type}`;
    currentNormalMap.set(key, item);
  }

  let newJobsCount = 0;
  let releasedJobsCount = 0;
  let removedMojrianCount = 0;
  let addedMojrianCount = 0;
  const changes: MojriChangeDetail[] = [];

  // Step 1: Detect Removed Mojrian (in prev, not in current) -> "اتمام ظرفیت و دریافت کار جدید"
  for (const [key, prevItem] of prevNormalMap.entries()) {
    if (!currentNormalMap.has(key)) {
      removedMojrianCount++;
      const exitJobs =
        typeof prevItem.remainingCount === 'number' && prevItem.remainingCount > 0
          ? Math.max(1, Math.round(prevItem.remainingCount))
          : 1;
      newJobsCount += exitJobs;

      changes.push({
        name: prevItem.name,
        type: prevItem.type,
        reason: 'removed_from_list',
        eventCount: exitJobs,
        eventType: 'new_job',
        oldCount: prevItem.remainingCount,
        newCount: null,
        countDelta: -(prevItem.remainingCount || 1),
        oldMeterage: prevItem.remainingMeterage,
        newMeterage: 0,
        meterageDelta: -prevItem.remainingMeterage,
        description: `اتمام ظرفیت و دریافت کار جدید (خروج از فهرست با ظرفیت قبلی ${prevItem.remainingCount ?? 1} کار)`,
      });
    }
  }

  // Step 2, 3, 4, 5: Check current normal items
  for (const [key, curItem] of currentNormalMap.entries()) {
    const prevItem = prevNormalMap.get(key);

    // Step 2: Added Mojrian -> "خاتمه کار و آزادسازی ظرفیت"
    if (!prevItem) {
      addedMojrianCount++;
      const enterJobs = 1;
      releasedJobsCount += enterJobs;

      changes.push({
        name: curItem.name,
        type: curItem.type,
        reason: 'added_to_list',
        eventCount: enterJobs,
        eventType: 'released_job',
        oldCount: null,
        newCount: curItem.remainingCount,
        countDelta: curItem.remainingCount ?? 1,
        oldMeterage: 0,
        newMeterage: curItem.remainingMeterage,
        meterageDelta: curItem.remainingMeterage,
        description: 'خاتمه کار و آزادسازی ظرفیت (ورود مجدد مجری به فهرست دارای ظرفیت)',
      });
      continue;
    }

    const oldCount = Number(prevItem.remainingCount);
    const newCount = Number(curItem.remainingCount);
    const oldMeterage = Number(prevItem.remainingMeterage) || 0;
    const newMeterage = Number(curItem.remainingMeterage) || 0;
    const meterageDelta = newMeterage - oldMeterage;

    // Step 3: Has Count Changed?
    if (oldCount !== newCount) {
      const countDiff = newCount - oldCount;
      if (countDiff < 0) {
        // Count decreased -> New job(s)
        const jobs = Math.abs(countDiff);
        newJobsCount += jobs;
        changes.push({
          name: curItem.name,
          type: curItem.type,
          reason: 'count_changed',
          eventCount: jobs,
          eventType: 'new_job',
          oldCount,
          newCount,
          countDelta: countDiff,
          oldMeterage,
          newMeterage,
          meterageDelta,
          description: `کاهش تعداد کار از ${oldCount} به ${newCount} (ثبت ${jobs} کار جدید - متراژ نادیده گرفته شد)`,
        });
      } else {
        // Count increased -> Released job(s)
        const jobs = countDiff;
        releasedJobsCount += jobs;
        changes.push({
          name: curItem.name,
          type: curItem.type,
          reason: 'count_changed',
          eventCount: jobs,
          eventType: 'released_job',
          oldCount,
          newCount,
          countDelta: countDiff,
          oldMeterage,
          newMeterage,
          meterageDelta,
          description: `افزایش تعداد کار از ${oldCount} به ${newCount} (ثبت ${jobs} کار خاتمه‌یافته و آزادسازی ظرفیت)`,
        });
      }
      // Note: As strictly instructed, meterage is ignored when count changes!
      continue;
    }

    // Step 4: Count is strictly constant (oldCount === newCount) -> Check Meterage
    if (meterageDelta < 0) {
      // Meterage decreased -> 1 New Job
      newJobsCount += 1;
      changes.push({
        name: curItem.name,
        type: curItem.type,
        reason: 'meterage_changed',
        eventCount: 1,
        eventType: 'new_job',
        oldCount,
        newCount,
        countDelta: 0,
        oldMeterage,
        newMeterage,
        meterageDelta,
        description: `تعداد کار ثابت (${newCount}) و کاهش متراژ از ${oldMeterage.toLocaleString()} به ${newMeterage.toLocaleString()} (ثبت ۱ کار جدید)`,
      });
    } else if (meterageDelta > 0) {
      // Meterage increased -> 1 Released Job
      releasedJobsCount += 1;
      changes.push({
        name: curItem.name,
        type: curItem.type,
        reason: 'meterage_changed',
        eventCount: 1,
        eventType: 'released_job',
        oldCount,
        newCount,
        countDelta: 0,
        oldMeterage,
        newMeterage,
        meterageDelta,
        description: `تعداد کار ثابت (${newCount}) و افزایش متراژ از ${oldMeterage.toLocaleString()} به ${newMeterage.toLocaleString()} (ثبت ۱ کار خاتمه‌یافته و آزادسازی ظرفیت)`,
      });
    } else {
      // Step 5: Both count and meterage constant -> No change
      // Not counted in events
    }
  }

  return {
    date: currentDate,
    timestamp: currentTimestamp,
    totalMojrian: currentItems.length,
    newJobsCount,
    releasedJobsCount,
    removedMojrianCount,
    addedMojrianCount,
    zeroCountJobsTotal: zeroCountRecords.length,
    zeroCountJobsWithinLimit,
    zeroCountJobsExceedingLimit,
    zeroCountTotalMeterage,
    zeroCountExceedingMeterage,
    zeroCountRecords,
    changes,
  };
}

/**
 * Builds chronological daily referral reports across a list of consecutive daily snapshots
 */
export function buildReferralReportsSeries(
  snapshots: MojrianDailySnapshot[]
): DailyReferralReport[] {
  if (!snapshots || snapshots.length === 0) return [];

  // Sort ascending by timestamp / date
  const sorted = [...snapshots].sort((a, b) => a.timestamp - b.timestamp);

  const reports: DailyReferralReport[] = [];
  for (let i = 0; i < sorted.length; i++) {
    const prev = i > 0 ? sorted[i - 1] : null;
    const cur = sorted[i];
    const report = analyzeDailySnapshots(prev, cur);
    reports.push(report);
  }

  return reports;
}
