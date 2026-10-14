import { TariffRow } from '../types';

export const officialTariffsData: TariffRow[] = [
  {
    row: 1,
    buildingGroup: 'الف A',
    groupCode: 'الف A',
    floorsDescription: '۱ یا ۲ طبقه',
    minFloors: 1,
    maxFloors: 2,
    meterageDescription: 'زیر ۴۰۰',
    minMeterage: 0,
    maxMeterage: 400,
    feePerM2Rials: 3180855,
    feePerM2Tomans: 318085.5,
    feePerM2Formatted: '۳/۱۸۰/۸۵۵',
  },
  {
    row: 2,
    buildingGroup: 'الف B',
    groupCode: 'الف B',
    floorsDescription: '۱ یا ۲ طبقه',
    minFloors: 1,
    maxFloors: 2,
    meterageDescription: 'از ۴۰۰ تا ۶۰۰',
    minMeterage: 400.01,
    maxMeterage: 600,
    feePerM2Rials: 3562558,
    feePerM2Tomans: 356255.8,
    feePerM2Formatted: '۳/۵۶۲/۵۵۸',
  },
  {
    row: 3,
    buildingGroup: 'ب',
    groupCode: 'ب',
    floorsDescription: '۳ تا ۵ طبقه',
    minFloors: 3,
    maxFloors: 5,
    meterageDescription: 'از ۶۰۰ تا ۲۰۰۰',
    minMeterage: 600.01,
    maxMeterage: 2000,
    feePerM2Rials: 4534164,
    feePerM2Tomans: 453416.4,
    feePerM2Formatted: '۴/۵۳۴/۱۶۴',
  },
  {
    row: 4,
    buildingGroup: 'ج A',
    groupCode: 'ج A',
    floorsDescription: '۶ و ۷ طبقه',
    minFloors: 6,
    maxFloors: 7,
    meterageDescription: 'از ۲۰۰۰ تا ۵۰۰۰',
    minMeterage: 2000.01,
    maxMeterage: 5000,
    feePerM2Rials: 5117129,
    feePerM2Tomans: 511712.9,
    feePerM2Formatted: '۵/۱۱۷/۱۲۹',
  },
  {
    row: 5,
    buildingGroup: 'ج B',
    groupCode: 'ج B',
    floorsDescription: '۸ تا ۱۰ طبقه',
    minFloors: 8,
    maxFloors: 10,
    meterageDescription: 'از ۲۰۰۰ تا ۵۰۰۰',
    minMeterage: 2000.01,
    maxMeterage: 5000,
    feePerM2Rials: 5829641,
    feePerM2Tomans: 582964.1,
    feePerM2Formatted: '۵/۸۲۹/۶۴۱',
  },
  {
    row: 6,
    buildingGroup: 'د A',
    groupCode: 'د A',
    floorsDescription: '۱۱ و ۱۲ طبقه',
    minFloors: 11,
    maxFloors: 12,
    meterageDescription: 'بالای ۵۰۰۰',
    minMeterage: 5000.01,
    maxMeterage: 999999,
    feePerM2Rials: 7135115,
    feePerM2Tomans: 713511.5,
    feePerM2Formatted: '۷/۱۳۵/۱۱۵',
  },
  {
    row: 7,
    buildingGroup: 'د B',
    groupCode: 'د B',
    floorsDescription: '۱۳ تا ۱۵ طبقه',
    minFloors: 13,
    maxFloors: 15,
    meterageDescription: 'بالای ۵۰۰۰',
    minMeterage: 5000.01,
    maxMeterage: 999999,
    feePerM2Rials: 8420591,
    feePerM2Tomans: 842059.1,
    feePerM2Formatted: '۸/۴۲۰/۵۹۱',
  },
  {
    row: 8,
    buildingGroup: 'د C',
    groupCode: 'د C',
    floorsDescription: '۱۶ طبقه به بالا',
    minFloors: 16,
    maxFloors: 99,
    meterageDescription: 'بالای ۵۰۰۰',
    minMeterage: 5000.01,
    maxMeterage: 999999,
    feePerM2Rials: 8420591,
    feePerM2Tomans: 842059.1,
    feePerM2Formatted: '۸/۴۲۰/۵۹۱',
  },
];

/**
 * Determines the tariff row based on floors alone
 */
export function getTariffRowByFloors(floors: number): TariffRow {
  const f = Math.max(1, Math.round(floors) || 1);
  if (f <= 2) return officialTariffsData[0]; // Row 1 (الف A)
  if (f <= 5) return officialTariffsData[2]; // Row 3 (ب)
  if (f <= 7) return officialTariffsData[3]; // Row 4 (ج A)
  if (f <= 10) return officialTariffsData[4]; // Row 5 (ج B)
  if (f <= 12) return officialTariffsData[5]; // Row 6 (د A)
  if (f <= 15) return officialTariffsData[6]; // Row 7 (د B)
  return officialTariffsData[7]; // Row 8 (د C: ۱۶ طبقه و بالاتر)
}

/**
 * Determines the tariff row based on meterage alone
 */
export function getTariffRowByMeterage(meterage: number): TariffRow {
  const m = Math.max(0, meterage || 0);
  if (m <= 400) return officialTariffsData[0]; // Row 1 (الف A: زیر ۴۰۰)
  if (m <= 600) return officialTariffsData[1]; // Row 2 (الف B: ۴۰۰ تا ۶۰۰)
  if (m <= 2000) return officialTariffsData[2]; // Row 3 (ب: ۶۰۰ تا ۲۰۰۰)
  if (m <= 5000) return officialTariffsData[3]; // Row 4 (ج A: ۲۰۰۰ تا ۵۰۰۰)
  return officialTariffsData[5]; // Row 6 (د A: بالای ۵۰۰۰)
}

export interface TariffMatchDetails {
  tariff: TariffRow;
  floorsRow: TariffRow;
  meterageRow: TariffRow;
  determinedBy: 'floors' | 'meterage' | 'both';
}

/**
 * Finds matching tariff row using the official statutory rule:
 * Whichever of floors or meterage falls into the higher/larger building group determines the outcome.
 * Example: 300 sqm with 4 floors -> Group ب (because 4 floors is in Group ب).
 * Example: 650 sqm with 1 floor -> Group ب (because 650 sqm is in Group ب).
 */
export function matchTariff(meterage: number, floors: number): TariffRow {
  const details = getTariffMatchDetails(meterage, floors);
  return details.tariff;
}

export function getTariffMatchDetails(meterage: number, floors: number): TariffMatchDetails {
  const floorsRow = getTariffRowByFloors(floors);
  const meterageRow = getTariffRowByMeterage(meterage);

  if (floorsRow.row > meterageRow.row) {
    return {
      tariff: floorsRow,
      floorsRow,
      meterageRow,
      determinedBy: 'floors',
    };
  } else if (meterageRow.row > floorsRow.row) {
    return {
      tariff: meterageRow,
      floorsRow,
      meterageRow,
      determinedBy: 'meterage',
    };
  } else {
    // Both are in the exact same row (e.g. both Row 1 or both Row 3)
    return {
      tariff: floorsRow,
      floorsRow,
      meterageRow,
      determinedBy: 'both',
    };
  }
}
