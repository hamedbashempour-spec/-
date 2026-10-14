import React, { useState } from 'react';
import {
  Calculator,
  Layers,
  Sparkles,
  Info,
  DollarSign,
  Grid,
  Box,
  Copy,
  Check,
  RotateCcw,
  Hammer,
  Droplet,
  Paintbrush,
  Building,
  Truck,
  CheckCircle2,
  BarChart3,
  Scale,
  Compass,
} from 'lucide-react';
import {
  toPersianDigits,
  formatPersianNumber,
  sanitizeNumericInput,
} from '../utils/formatters';

type CalcCategory = 'all' | 'structural' | 'masonry' | 'finishing' | 'cost';

type CalcTab =
  | 'rules_of_thumb' // ضرایب سرانگشتی برآورد مصالح بر اساس زیربنای کل
  | 'foam_joist' // یونولیت و تیرچه سقف
  | 'tiles' // کاشی و سرامیک
  | 'concrete' // بتن و میکسر
  | 'rebar' // میلگرد و آرماتور
  | 'blocks' // سفال و بلوک
  | 'lightweight_fill' // پوکه ریزی و فوم بتن
  | 'plaster' // گچ و خاک و سفیدکاری
  | 'waterproofing' // ایزوگام و قیرگونی
  | 'stairs' // سنگ پله و پاگرد
  | 'paint' // نقاشی و رنگ
  | 'formwork' // قالب‌بندی
  | 'cost'; // برآورد ریالی اسکلت

export const CalculatorsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<CalcTab>('rules_of_thumb');
  const [activeCategory, setActiveCategory] = useState<CalcCategory>('all');
  const [copied, setCopied] = useState(false);

  // ==================== 0. ضرایب سرانگشتی برآورد مصالح کل زیربنا ====================
  const [thumbGrossArea, setThumbGrossArea] = useState<string>('1000'); // زیربنای کل به متر مربع
  const [thumbStructureType, setThumbStructureType] = useState<
    'concrete' | 'steel_cbf' | 'steel_ebf' | 'steel_imf' | 'steel_smf' | 'steel_dual'
  >('concrete');
  const [thumbRoofType, setThumbRoofType] = useState<'joist_block' | 'composite' | 'rc_slab'>('joist_block');

  const numThumbArea = parseFloat(thumbGrossArea) || 0;

  // بتن‌آرمه:
  // بتن سازه‌ای: ۰٫۳۵ تا ۰٫۵۰ مترمکعب؛ مقدار پایه ۰٫۴۲
  const thumbConcMin = (numThumbArea * 0.35).toFixed(1);
  const thumbConcMax = (numThumbArea * 0.50).toFixed(1);
  const thumbConcBase = (numThumbArea * 0.42).toFixed(1);

  // میلگرد سازه: ۴۰ تا ۶۰ کیلوگرم؛ مقدار پایه ۵۰
  const thumbRebarMinKg = Math.round(numThumbArea * 40);
  const thumbRebarMaxKg = Math.round(numThumbArea * 60);
  const thumbRebarBaseKg = Math.round(numThumbArea * 50);

  // قالب‌بندی: ۲٫۵ تا ۴ مترمربع
  const thumbFormworkMinM2 = Math.round(numThumbArea * 2.5);
  const thumbFormworkMaxM2 = Math.round(numThumbArea * 4.0);

  // اسکلت فلزی بر مبنای سیستم باربر جانبی:
  const steelConfigMap: Record<
    string,
    { minRate: number; maxRate: number; title: string; desc: string }
  > = {
    steel_cbf: {
      minRate: 45,
      maxRate: 70,
      title: 'مهاربندی هم‌محور (CBF)',
      desc: 'سیستم بادبند ضربدری یا همگرا (۴۵ تا ۷۰ کیلوگرم بر متر مربع)',
    },
    steel_ebf: {
      minRate: 50,
      maxRate: 75,
      title: 'مهاربندی واگرا (EBF)',
      desc: 'بادبند با تیر پیوند برشی شکل‌پذیر (۵۰ تا ۷۵ کیلوگرم بر متر مربع)',
    },
    steel_imf: {
      minRate: 65,
      maxRate: 105,
      title: 'قاب خمشی متوسط (IMF)',
      desc: 'اتصالات تیر به ستون گیردار با شکل‌پذیری متوسط (۶۵ تا ۱۰۵ کیلوگرم)',
    },
    steel_smf: {
      minRate: 70,
      maxRate: 115,
      title: 'قاب خمشی ویژه (SMF)',
      desc: 'اتصالات گیردار پیش‌تأییدشده با شکل‌پذیری ویژه (۷۰ تا ۱۱۵ کیلوگرم)',
    },
    steel_dual: {
      minRate: 70,
      maxRate: 120,
      title: 'سیستم دوگانه (Dual)',
      desc: 'قاب خمشی به همراه مهاربندی (۷۰ تا ۱۲۰ کیلوگرم بر متر مربع)',
    },
  };

  const currentSteel = steelConfigMap[thumbStructureType] || steelConfigMap.steel_cbf;
  const thumbSteelMinKg = Math.round(numThumbArea * currentSteel.minRate);
  const thumbSteelMaxKg = Math.round(numThumbArea * currentSteel.maxRate);

  // آرماتور سقف:
  const roofRebarMap = {
    joist_block: { minRate: 5, maxRate: 7, label: 'تیرچه‌بلوک (۵ تا ۷ کیلوگرم بر متر مربع سقف)' },
    composite: { minRate: 8, maxRate: 12, label: 'کامپوزیت (۸ تا ۱۲ کیلوگرم بر متر مربع سقف)' },
    rc_slab: { minRate: 10, maxRate: 16, label: 'دال بتن‌آرمه (۱۰ تا ۱۶ کیلوگرم بر متر مربع سقف)' },
  };
  const currentRoof = roofRebarMap[thumbRoofType];
  const thumbRoofRebarMinKg = Math.round(numThumbArea * currentRoof.minRate);
  const thumbRoofRebarMaxKg = Math.round(numThumbArea * currentRoof.maxRate);

  // مصالح معماری - ضرایب تقریبی به ازای هر مترمربع زیربنای کل:
  const thumbPlasterMinKg = Math.round(numThumbArea * 65);
  const thumbPlasterMaxKg = Math.round(numThumbArea * 77);
  const thumbWallTileM2 = (numThumbArea * 0.45).toFixed(1);
  const thumbFloorTileM2 = (numThumbArea * 0.22).toFixed(1);
  const thumbMosaicM2 = (numThumbArea * 0.74).toFixed(1);
  const thumbBricksMinCount = Math.round(numThumbArea * 338);
  const thumbBricksMaxCount = Math.round(numThumbArea * 390);
  const thumbWindowProfileKg = (numThumbArea * 2.9).toFixed(1);

  // شن و ماسه و سیمان:
  const thumbGravelMinM3 = (numThumbArea * 0.33).toFixed(1);
  const thumbGravelMaxM3 = (numThumbArea * 0.57).toFixed(1);
  const thumbSandMinM3 = (numThumbArea * 0.40).toFixed(1);
  const thumbSandMaxM3 = (numThumbArea * 0.55).toFixed(1);
  const thumbCementMinKg = Math.round(numThumbArea * 163);
  const thumbCementMaxKg = Math.round(numThumbArea * 330);
  const thumbCementMinBags = Math.ceil(thumbCementMinKg / 50);
  const thumbCementMaxBags = Math.ceil(thumbCementMaxKg / 50);

  // ==================== 1. فوم یونولیت سقفی و تیرچه ====================
  const [roofArea, setRoofArea] = useState<string>('150'); // مساحت سقف به متر مربع
  const [joistSpacing, setJoistSpacing] = useState<'50' | '66'>('50'); // فاصله آکس به آکس تیرچه‌ها (سانتی‌متر)
  const [foamHeight, setFoamHeight] = useState<'20' | '25' | '30'>('25'); // ارتفاع فوم (سانت)
  const [foamWastePercent, setFoamWastePercent] = useState<number>(4); // درصد پرت و برش فوم

  const numRoofArea = parseFloat(roofArea) || 0;
  // در هر متر مربع سقف تیرچه بلوک با فاصله آکس ۵۰ سانت حدود ۱.۴ تا ۱.۵ عدد یونولیت ۲ متری یا ۳ عدد ۱ متری نیاز است
  // فرمول دقیق: در فواصل ۵۰ سانتیمتر، هر بلوک استاندارد ۵۰*۲۰۰ سانتی‌متر مساحت ۱ متر مربع را پوشش می‌دهد. با کسر تیرها و ژوئن‌ها (حدود ۲۵ الی ۳۰٪ سطح سقف را تیرهای اصلی و تای‌بیم اشغال می‌کنند)، سطح خالص بلوک‌خور حدود ۰.۷۰ مساحت سقف است.
  const netFoamArea = numRoofArea * 0.72; // مساحت خالص فوم‌خور
  const foamBlockLength = 2.0; // ۲ متری
  const foamWidth = parseFloat(joistSpacing) === 50 ? 0.5 : 0.66;
  const singleFoamArea = foamWidth * foamBlockLength; // متراژ پوشش هر عدد بلوک ۲ متری
  const rawFoamBlocksCount = singleFoamArea > 0 ? netFoamArea / singleFoamArea : 0;
  const grossFoamBlocksCount = Math.ceil(rawFoamBlocksCount * (1 + foamWastePercent / 100));

  // متراژ کل تیرچه مورد نیاز: معمولاً ۱.۴ تا ۱.۶ متر طول تیرچه به ازای هر متر مربع سقف
  const joistLengthFactor = parseFloat(joistSpacing) === 50 ? 1.55 : 1.25;
  const estimatedJoistMeters = Math.round(numRoofArea * joistLengthFactor);

  // بتن سقف تیرچه یونولیت: حدود ۰.۱۴ تا ۰.۱۸ متر مکعب به ازای هر متر مربع سقف
  const estimatedRoofConcreteM3 = (numRoofArea * 0.16).toFixed(1);

  // میلگرد حرارتی نمره ۶ یا ۸ (فواصل ۲۵ سانت در دو جهت): حدود ۴.۵ تا ۵ کیلوگرم در هر متر مربع
  const estimatedThermalRebarKg = Math.round(numRoofArea * 4.8);

  // ==================== 2. کاشی و سرامیک بدنه و کف ====================
  const [tileTarget, setTileTarget] = useState<'floor' | 'wall' | 'combined'>('floor');
  const [roomLength, setRoomLength] = useState<string>('6'); // طول فضا (متر)
  const [roomWidth, setRoomWidth] = useState<string>('4'); // عرض فضا (متر)
  const [wallTileHeight, setWallTileHeight] = useState<string>('2.8'); // ارتفاع کاشی دیوار
  const [doorWindowArea, setDoorWindowArea] = useState<string>('4.5'); // مساحت کسر بازشوها
  const [tileTileSize, setTileTileSize] = useState<string>('60x60'); // ابعاد تایل (سانتی‌متر)
  const [tileBoxArea, setTileBoxArea] = useState<string>('1.44'); // متراژ هر کارتن (متر مربع)
  const [tileWastePercent, setTileWastePercent] = useState<number>(8); // درصد پرت و فارسی‌بُر

  const numRoomL = parseFloat(roomLength) || 0;
  const numRoomW = parseFloat(roomWidth) || 0;
  const numWallH = parseFloat(wallTileHeight) || 0;
  const numOpeningsArea = parseFloat(doorWindowArea) || 0;
  const numBoxArea = parseFloat(tileBoxArea) || 1.44;

  const floorAreaNet = numRoomL * numRoomW;
  const wallPerimeter = 2 * (numRoomL + numRoomW);
  const wallAreaGross = wallPerimeter * numWallH;
  const wallAreaNet = Math.max(0, wallAreaGross - numOpeningsArea);

  const selectedNetTileArea =
    tileTarget === 'floor'
      ? floorAreaNet
      : tileTarget === 'wall'
      ? wallAreaNet
      : floorAreaNet + wallAreaNet;

  const selectedGrossTileArea = selectedNetTileArea * (1 + tileWastePercent / 100);
  const estimatedTileBoxes = Math.ceil(selectedGrossTileArea / (numBoxArea > 0 ? numBoxArea : 1.44));

  // مصرف چسب کاشی پودری: میانگین ۴.۵ کیلوگرم بر متر مربع (هر کیسه ۲۵ کیلویی حدود ۵.۵ متر مربع پوشش می‌دهد)
  const tileGlueKg = Math.round(selectedGrossTileArea * 4.5);
  const tileGlueBags = Math.ceil(tileGlueKg / 25);

  // پودر بندکشی آنتی‌باکتریال: حدود ۳۵۰ گرم بر متر مربع
  const groutPowderKg = Math.max(1, Math.round(selectedGrossTileArea * 0.35));

  // ==================== 3. حجم بتن و میکسر ====================
  const [concType, setConcType] = useState<'strip' | 'column' | 'slab'>('strip');
  const [concLength, setConcLength] = useState<string>('30');
  const [concWidth, setConcWidth] = useState<string>('0.8');
  const [concHeight, setConcHeight] = useState<string>('0.6');
  const [concCount, setConcCount] = useState<string>('1');
  const [concWastage, setConcWastage] = useState<number>(5);

  const numConcLength = parseFloat(concLength) || 0;
  const numConcWidth = parseFloat(concWidth) || 0;
  const numConcHeight = parseFloat(concHeight) || 0;
  const numConcCount = parseFloat(concCount) || 0;
  const netConcVolume = numConcLength * numConcWidth * numConcHeight * numConcCount;
  const grossConcVolume = netConcVolume * (1 + concWastage / 100);
  const mixerCount = Math.ceil(grossConcVolume / 7);

  // ==================== 4. میلگرد و آرماتور ====================
  const [rebarMode, setRebarMode] = useState<'rough' | 'detailed'>('rough');
  const [totalArea, setTotalArea] = useState<string>('500');
  const [structureType, setStructureType] = useState<
    'concrete_moment' | 'concrete_wall' | 'steel'
  >('concrete_moment');
  const [rebarDiameter, setRebarDiameter] = useState<number>(16);
  const [rebarLengthPerBranch, setRebarLengthPerBranch] = useState<string>('12');
  const [rebarBranchCount, setRebarBranchCount] = useState<string>('100');

  const unitWeightMap: Record<number, number> = {
    8: 0.395,
    10: 0.617,
    12: 0.888,
    14: 1.21,
    16: 1.58,
    18: 2.0,
    20: 2.47,
    22: 2.98,
    25: 3.85,
    28: 4.83,
    32: 6.31,
  };

  const rebarDensityMap = {
    concrete_moment: 50,
    concrete_wall: 60,
    steel: 75,
  };

  const numTotalArea = parseFloat(totalArea) || 0;
  const numRebarLength = parseFloat(rebarLengthPerBranch) || 0;
  const numRebarBranches = parseFloat(rebarBranchCount) || 0;

  const estimatedTotalRebarWeightKg =
    rebarMode === 'rough'
      ? numTotalArea * rebarDensityMap[structureType]
      : (unitWeightMap[rebarDiameter] || 1.58) * numRebarLength * numRebarBranches;
  const estimatedRebarTons = estimatedTotalRebarWeightKg / 1000;

  // ==================== 5. آجر، سفال و بلوک ====================
  const [blockType, setBlockType] = useState<
    'clay15' | 'clay10' | 'leca' | 'hebel' | 'cement'
  >('clay15');
  const [blockWallArea, setBlockWallArea] = useState<string>('50');
  const [blockWastePercent, setBlockWastePercent] = useState<number>(5);

  const blockPerM2Map = {
    clay15: 25,
    clay10: 25,
    leca: 14,
    hebel: 6.67,
    cement: 12.5,
  };

  const numBlockWallArea = parseFloat(blockWallArea) || 0;
  const netBlocksCount = Math.round(numBlockWallArea * blockPerM2Map[blockType]);
  const grossBlocksCount = Math.round(netBlocksCount * (1 + blockWastePercent / 100));
  const cementBags = Math.round(numBlockWallArea * 0.35);
  const sandTons = (numBlockWallArea * 0.05).toFixed(1);

  // ==================== 6. پوکه‌ریزی و فوم‌بتن ====================
  const [floorArea, setFloorArea] = useState<string>('120'); // مساحت کف طبقه (m2)
  const [fillThickness, setFillThickness] = useState<string>('8'); // ضخامت پوکه یا فوم بتن (سانتی‌متر)
  const [fillType, setFillType] = useState<'mineral_pumice' | 'foam_concrete'>('mineral_pumice');

  const numFloorArea = parseFloat(floorArea) || 0;
  const numFillThickness = parseFloat(fillThickness) || 0;
  const fillVolumeM3 = (numFloorArea * (numFillThickness / 100)); // حجم کل به متر مکعب

  // در پوکه معدنی قروه: با ضریب تراکم ۱۰٪
  const pumiceVolumeM3 = (fillVolumeM3 * 1.1).toFixed(1);
  const pumiceTrucks = (parseFloat(pumiceVolumeM3) / 10).toFixed(1); // هر کمپرسی ده چرخ حدود ۱۰ الی ۱۲ متر مکعب
  // ملات لیسه‌ای روی پوکه: حدود ۳ سانتی‌متر ملات لیسه‌ای با عیار ۳۰۰
  const pumiceCementBags = Math.ceil(numFloorArea * 0.3);

  // در فوم بتن: هر متر مکعب فوم بتن حدود ۲۵۰ الی ۳۰۰ کیلوگرم سیمان (۵ الی ۶ کیسه) و ۰.۸ لیتر فوم مایع
  const foamConcCementBags = Math.ceil(fillVolumeM3 * 5.5);
  const foamConcLiquidLiters = (fillVolumeM3 * 0.85).toFixed(1);

  // ==================== 7. گچ‌وخاک و سفیدکاری ====================
  const [plasterWallArea, setPlasterWallArea] = useState<string>('100'); // مساحت دیوار و سقف (m2)
  const [plasterThickness, setPlasterThickness] = useState<string>('2.5'); // ضخامت گچ و خاک (سانتی‌متر)

  const numPlasterArea = parseFloat(plasterWallArea) || 0;
  // مصرف گچ و خاک: به ازای هر سانتی‌متر ضخامت، حدود ۱۲ کیلوگرم گچ و خاک نیاز است. (یک کیسه ۴۰ کیلویی گچ و خاک برای ۲.۵ تا ۳ متر مربع با ضخامت ۲ سانت)
  const plasterRoughBags = Math.ceil(numPlasterArea / 2.6);
  // سفیدکاری (پرداخت ۲ میلی‌متری): هر کیسه ۳۰ کیلویی گچ سفید مرغوب حدود ۱۰ الی ۱۲ متر مربع را پوشش می‌دهد
  const plasterFinishBags = Math.ceil(numPlasterArea / 11);

  // ==================== 8. ایزوگام و عایق رطوبتی ====================
  const [waterproofArea, setWaterproofArea] = useState<string>('80'); // مساحت بام یا سرویس
  const [upstandLength, setUpstandLength] = useState<string>('36'); // محیط لبه‌های جان‌پناه یا دور دیواره (متر طول)
  const [upstandHeight, setUpstandHeight] = useState<string>('0.4'); // ارتفاع بالاآمدگی عایق روی لبه دیوار (متر)
  const [waterproofLayers, setWaterproofLayers] = useState<1 | 2>(1); // یک لایه یا دو لایه

  const numWpArea = parseFloat(waterproofArea) || 0;
  const numUpstandL = parseFloat(upstandLength) || 0;
  const numUpstandH = parseFloat(upstandHeight) || 0;
  const upstandArea = numUpstandL * numUpstandH;
  const totalNetWpArea = (numWpArea + upstandArea) * waterproofLayers;
  // هر رول ایزوگام ۱۰ متر مربع است، اما با کسر ۱۰ سانتی‌متر اورلپ و سرهم‌بندی، حدود ۸.۸ متر مربع خالص را پوشش می‌دهد (حدود ۱۲ الی ۱۵ درصد همپوشانی)
  const isogamRollsCount = Math.ceil(totalNetWpArea / 8.8);
  // قیر پرایمر زیرسازی: حدود ۰.۸ کیلوگرم بر متر مربع
  const bitumenPrimerKg = Math.round(totalNetWpArea * 0.8);

  // ==================== 9. سنگ پله و پاگرد ====================
  const [stairStepsCount, setStairStepsCount] = useState<string>('20'); // تعداد پله
  const [stepWidth, setStepWidth] = useState<string>('1.2'); // طول هر پله (متر)
  const [stepTread, setStepTread] = useState<string>('0.35'); // عرض کف پله (متر)
  const [stepRiser, setStepRiser] = useState<string>('0.17'); // ارتفاع پله (متر)
  const [landingsArea, setLandingsArea] = useState<string>('4.5'); // مساحت پاگردها (متر مربع)

  const numStepsCount = parseFloat(stairStepsCount) || 0;
  const numStepW = parseFloat(stepWidth) || 0;
  const numStepT = parseFloat(stepTread) || 0;
  const numStepR = parseFloat(stepRiser) || 0;
  const numLandingsArea = parseFloat(landingsArea) || 0;

  const totalStepMeters = (numStepsCount * numStepW).toFixed(1); // متر طول سنگ کف پله
  const stairTreadStoneArea = numStepsCount * numStepW * numStepT; // مساحت سنگ کف پله
  const stairRiserStoneArea = numStepsCount * numStepW * numStepR; // مساحت سنگ پیشانی
  const totalStairStoneArea = (stairTreadStoneArea + stairRiserStoneArea + numLandingsArea).toFixed(2);
  const skirtMeters = (numStepsCount * (numStepT + numStepR) + Math.sqrt(numLandingsArea) * 4).toFixed(1); // قرنیز

  // ==================== 10. نقاشی و رنگ ====================
  const [paintArea, setPaintArea] = useState<string>('200'); // مساحت دیوار و سقف
  const [paintType, setPaintType] = useState<'acrylic' | 'plastic' | 'oil'>('acrylic');
  const [paintCoats, setPaintCoats] = useState<number>(3); // تعداد دست رنگ

  const numPaintArea = parseFloat(paintArea) || 0;
  // پوشش‌دهی رنگ: هر کیلوگرم رنگ اکریلیک استاندارد در یک دست حدود ۸ متر مربع، پلاستیک حدود ۷ متر مربع و روغنی حدود ۹ متر مربع را پوشش می‌دهد
  const paintCoverageMap = {
    acrylic: 8,
    plastic: 7,
    oil: 9,
  };
  const paintNeededKg = Math.ceil(
    (numPaintArea * paintCoats) / paintCoverageMap[paintType]
  );
  const puttyKg = Math.round(numPaintArea * 0.4); // بتونه ماستیک

  // ==================== 11. قالب‌بندی ====================
  const [fwType, setFwType] = useState<'column' | 'beam' | 'shear_wall'>('column');
  const [fwDimension1, setFwDimension1] = useState<string>('0.5');
  const [fwDimension2, setFwDimension2] = useState<string>('0.5');
  const [fwHeight, setFwHeight] = useState<string>('3.2');
  const [fwQuantity, setFwQuantity] = useState<string>('12');

  const numFwD1 = parseFloat(fwDimension1) || 0;
  const numFwD2 = parseFloat(fwDimension2) || 0;
  const numFwH = parseFloat(fwHeight) || 0;
  const numFwQ = parseFloat(fwQuantity) || 0;

  const singleFormworkArea =
    fwType === 'column'
      ? 2 * (numFwD1 + numFwD2) * numFwH
      : fwType === 'beam'
      ? (2 * numFwH + numFwD1) * numFwD2
      : 2 * numFwD2 * numFwH;
  const totalFormworkArea = singleFormworkArea * numFwQ;
  const moldReleaseOilLiters = (totalFormworkArea * 0.12).toFixed(1); // روغن قالب امولسیون

  // ==================== 12. برآورد ریالی اسکلت ====================
  const [rebarPricePerTon, setRebarPricePerTon] = useState<string>('33000000');
  const [concretePricePerM3, setConcretePricePerM3] = useState<string>('1650000');
  const [wagePerM2, setWagePerM2] = useState<string>('950000');
  const [costArea, setCostArea] = useState<string>('600');

  const numCostArea = parseFloat(costArea) || 0;
  const numRebarPrice = parseFloat(rebarPricePerTon) || 0;
  const numConcretePrice = parseFloat(concretePricePerM3) || 0;
  const numWage = parseFloat(wagePerM2) || 0;

  const totalEstimatedRebarCost = numCostArea * 0.05 * numRebarPrice;
  const totalEstimatedConcreteCost = numCostArea * 0.4 * numConcretePrice;
  const totalEstimatedWage = numCostArea * numWage;
  const totalEstimatedStructureCost =
    totalEstimatedRebarCost + totalEstimatedConcreteCost + totalEstimatedWage;

  // Tabs Definitions
  const tabs = [
    { id: 'rules_of_thumb' as CalcTab, label: 'ضرایب سرانگشتی زیربنا', category: 'structural', icon: BarChart3 },
    { id: 'foam_joist' as CalcTab, label: 'یونولیت و تیرچه', category: 'structural', icon: Box },
    { id: 'tiles' as CalcTab, label: 'کاشی و سرامیک', category: 'finishing', icon: Sparkles },
    { id: 'concrete' as CalcTab, label: 'حجم بتن و میکسر', category: 'structural', icon: Layers },
    { id: 'rebar' as CalcTab, label: 'میلگرد و آرماتور', category: 'structural', icon: Grid },
    { id: 'blocks' as CalcTab, label: 'سفال و بلوک', category: 'masonry', icon: Hammer },
    { id: 'lightweight_fill' as CalcTab, label: 'پوکه و فوم‌بتن', category: 'finishing', icon: Truck },
    { id: 'plaster' as CalcTab, label: 'گچ‌وخاک و سفید', category: 'finishing', icon: Paintbrush },
    { id: 'waterproofing' as CalcTab, label: 'ایزوگام و عایق', category: 'masonry', icon: Droplet },
    { id: 'stairs' as CalcTab, label: 'سنگ پله و پاگرد', category: 'finishing', icon: Building },
    { id: 'paint' as CalcTab, label: 'رنگ و نقاشی', category: 'finishing', icon: Paintbrush },
    { id: 'formwork' as CalcTab, label: 'قالب‌بندی', category: 'structural', icon: Layers },
    { id: 'cost' as CalcTab, label: 'برآورد هزینه اسکلت', category: 'cost', icon: DollarSign },
  ];

  const filteredTabs =
    activeCategory === 'all'
      ? tabs
      : tabs.filter((t) => t.category === activeCategory || t.id === 'cost');

  // Copy active calculation summary
  const handleCopyEstimate = () => {
    let text = `📐 گزارش برآورد متره کارگاهی - انجمن مجریان ذیصلاح ارومیه\n`;

    if (activeTab === 'rules_of_thumb') {
      text += `موضوع: ضرایب سرانگشتی برآورد مصالح به ازای هر متر مربع زیربنای کل\n`;
      text += `- زیربنای کل ساختمان: ${toPersianDigits(numThumbArea)} متر مربع\n`;
      if (thumbStructureType === 'concrete') {
        text += `- نوع سازه: ساختمان بتن‌آرمه\n`;
        text += `  • بتن سازه‌ای: ${toPersianDigits(thumbConcMin)} تا ${toPersianDigits(thumbConcMax)} م³ (مقدار پایه: ${toPersianDigits(thumbConcBase)} م³ معادل ${toPersianDigits(Math.round(parseFloat(thumbConcBase)/7))} میکسر)\n`;
        text += `  • میلگرد سازه: ${toPersianDigits(thumbRebarMinKg.toLocaleString('fa-IR'))} تا ${toPersianDigits(thumbRebarMaxKg.toLocaleString('fa-IR'))} کیلوگرم (پایه: ${toPersianDigits(thumbRebarBaseKg.toLocaleString('fa-IR'))} کیلوگرم / ${toPersianDigits((thumbRebarBaseKg/1000).toFixed(1))} تن)\n`;
        text += `  • قالب‌بندی سازه: ${toPersianDigits(thumbFormworkMinM2.toLocaleString('fa-IR'))} تا ${toPersianDigits(thumbFormworkMaxM2.toLocaleString('fa-IR'))} متر مربع\n`;
      } else {
        text += `- نوع سازه: اسکلت فلزی با ${currentSteel.title}\n`;
        text += `  • فولاد اسکلت: ${toPersianDigits(thumbSteelMinKg.toLocaleString('fa-IR'))} تا ${toPersianDigits(thumbSteelMaxKg.toLocaleString('fa-IR'))} کیلوگرم (${toPersianDigits((thumbSteelMinKg/1000).toFixed(1))} تا ${toPersianDigits((thumbSteelMaxKg/1000).toFixed(1))} تن)\n`;
      }
      text += `- آرماتور سقف (${currentRoof.label}): ${toPersianDigits(thumbRoofRebarMinKg.toLocaleString('fa-IR'))} تا ${toPersianDigits(thumbRoofRebarMaxKg.toLocaleString('fa-IR'))} کیلوگرم\n`;
      text += `- شن، ماسه و سیمان کل پروژه:\n`;
      text += `  • سیمان: ${toPersianDigits(thumbCementMinKg.toLocaleString('fa-IR'))} تا ${toPersianDigits(thumbCementMaxKg.toLocaleString('fa-IR'))} کیلوگرم (${toPersianDigits(thumbCementMinBags.toLocaleString('fa-IR'))} تا ${toPersianDigits(thumbCementMaxBags.toLocaleString('fa-IR'))} کیسه)\n`;
      text += `  • شن: ${toPersianDigits(thumbGravelMinM3)} تا ${toPersianDigits(thumbGravelMaxM3)} متر مکعب\n`;
      text += `  • ماسه: ${toPersianDigits(thumbSandMinM3)} تا ${toPersianDigits(thumbSandMaxM3)} متر مکعب\n`;
      text += `- مصالح معماری (ضرایب تقریبی):\n`;
      text += `  • گچ: ${toPersianDigits(thumbPlasterMinKg.toLocaleString('fa-IR'))} تا ${toPersianDigits(thumbPlasterMaxKg.toLocaleString('fa-IR'))} کیلوگرم\n`;
      text += `  • کاشی دیوار: حدود ${toPersianDigits(thumbWallTileM2)} متر مربع\n`;
      text += `  • سرامیک کف: حدود ${toPersianDigits(thumbFloorTileM2)} متر مربع\n`;
      text += `  • موزاییک: حدود ${toPersianDigits(thumbMosaicM2)} متر مربع\n`;
      text += `  • آجر: حدود ${toPersianDigits(thumbBricksMinCount.toLocaleString('fa-IR'))} تا ${toPersianDigits(thumbBricksMaxCount.toLocaleString('fa-IR'))} قالب\n`;
      text += `  • پروفیل در و پنجره: حدود ${toPersianDigits(thumbWindowProfileKg)} کیلوگرم\n`;
      text += `\n*تذکر: تمام ضرایب فوق برآورد سرانگشتی هستند و مقدار واقعی به نقشه، تعداد طبقات، نوع سازه، نوع سقف، دهانه‌ها، معماری و شرایط پروژه وابسته است. ضرایب بتن، میلگرد و فولاد از نظر قابلیت استفاده برای برآورد مقدماتی قابل اتکاتر از ضرایب مصالح معماری هستند.*\n`;
    } else if (activeTab === 'foam_joist') {
      text += `موضوع: متره سقف تیرچه و فوم یونولیت پلی‌استایرن EPS\n`;
      text += `- مساحت سقف: ${toPersianDigits(numRoofArea)} متر مربع\n`;
      text += `- فاصله آکس به آکس تیرچه‌ها: ${toPersianDigits(joistSpacing)} سانتیمتر (ارتفاع فوم: ${toPersianDigits(foamHeight)} سانت)\n`;
      text += `- تعداد بلوک یونولیت ۲ متری مورد نیاز: ${toPersianDigits(grossFoamBlocksCount)} عدد (با ${toPersianDigits(foamWastePercent)}٪ پرت)\n`;
      text += `- متراژ کل تیرچه تخمینی: حدود ${toPersianDigits(estimatedJoistMeters)} متر طول\n`;
      text += `- حجم بتن رویه دال سقف: حدود ${toPersianDigits(estimatedRoofConcreteM3)} متر مکعب\n`;
      text += `- میلگرد حرارتی دال: حدود ${toPersianDigits(estimatedThermalRebarKg)} کیلوگرم\n`;
    } else if (activeTab === 'tiles') {
      text += `موضوع: برآورد کاشی و سرامیک، چسب و پودر بندکشی\n`;
      text += `- بخش: ${tileTarget === 'floor' ? 'کف' : tileTarget === 'wall' ? 'بدنه (دیوار)' : 'کف و بدنه'}\n`;
      text += `- مساحت خالص کار: ${toPersianDigits(selectedNetTileArea.toFixed(1))} متر مربع\n`;
      text += `- مساحت ناخالص با پرت (${toPersianDigits(tileWastePercent)}٪): ${toPersianDigits(selectedGrossTileArea.toFixed(1))} متر مربع\n`;
      text += `- تعداد کارتن کاشی مورد نیاز: ${toPersianDigits(estimatedTileBoxes)} کارتن (${toPersianDigits(numBoxArea)} متری)\n`;
      text += `- چسب کاشی پودری: ${toPersianDigits(tileGlueKg)} کیلوگرم (${toPersianDigits(tileGlueBags)} کیسه ۲۵ کیلویی)\n`;
      text += `- پودر بندکشی آنتی‌باکتریال: حدود ${toPersianDigits(groutPowderKg)} کیلوگرم\n`;
    } else if (activeTab === 'concrete') {
      text += `موضوع: حجم بتن و تعداد میکسر\n`;
      text += `- حجم خالص: ${toPersianDigits(netConcVolume.toFixed(2))} متر مکعب\n`;
      text += `- حجم با پرت (${toPersianDigits(concWastage)}٪): ${toPersianDigits(grossConcVolume.toFixed(2))} متر مکعب\n`;
      text += `- تعداد تراک‌میکسر ۷ متری: ${toPersianDigits(mixerCount)} دستگاه\n`;
    } else if (activeTab === 'rebar') {
      text += `موضوع: برآورد وزن میلگرد سازه\n`;
      text += `- وزن کل آرماتور: ${toPersianDigits(Math.round(estimatedTotalRebarWeightKg))} کیلوگرم (${toPersianDigits(estimatedRebarTons.toFixed(2))} تن)\n`;
    } else if (activeTab === 'blocks') {
      text += `موضوع: برآورد سفال و بلوک دیوارچینی\n`;
      text += `- مساحت دیوار: ${toPersianDigits(numBlockWallArea)} متر مربع\n`;
      text += `- تعداد بلوک با پرت (${toPersianDigits(blockWastePercent)}٪): ${toPersianDigits(grossBlocksCount)} عدد\n`;
      text += `- سیمان ملات: ${toPersianDigits(cementBags)} کیسه ۵۰ کیلویی | ماسه شسته: ${toPersianDigits(sandTons)} تن\n`;
    } else if (activeTab === 'lightweight_fill') {
      text += `موضوع: برآورد کفسازی پوکه‌ریزی یا فوم‌بتن\n`;
      text += `- مساحت کف: ${toPersianDigits(numFloorArea)} متر مربع با ضخامت ${toPersianDigits(numFillThickness)} سانتیمتر\n`;
      text += `- حجم کل پرکننده: ${toPersianDigits(fillVolumeM3.toFixed(2))} متر مکعب\n`;
      if (fillType === 'mineral_pumice') {
        text += `- حجم پوکه معدنی با تراکم: ${toPersianDigits(pumiceVolumeM3)} متر مکعب (حدود ${toPersianDigits(pumiceTrucks)} کمپرسی ده چرخ)\n`;
        text += `- سیمان ملات لیسه‌ای روکش: حدود ${toPersianDigits(pumiceCementBags)} کیسه\n`;
      } else {
        text += `- سیمان فوم‌بتن: حدود ${toPersianDigits(foamConcCementBags)} کیسه\n`;
        text += `- مایع فوم شیمیایی: حدود ${toPersianDigits(foamConcLiquidLiters)} لیتر\n`;
      }
    } else if (activeTab === 'waterproofing') {
      text += `موضوع: برآورد ایزوگام و عایق‌کاری رطوبتی\n`;
      text += `- مساحت سطح و ماهیچه جان‌پناه: ${toPersianDigits((numWpArea + upstandArea).toFixed(1))} متر مربع\n`;
      text += `- تعداد رول ایزوگام با اورلپ: ${toPersianDigits(isogamRollsCount)} رول ۱۰ متری\n`;
      text += `- قیر پرایمر زیرسازی: حدود ${toPersianDigits(bitumenPrimerKg)} کیلوگرم\n`;
    } else if (activeTab === 'stairs') {
      text += `موضوع: متره سنگ پله، پیشانی و پاگرد\n`;
      text += `- تعداد پله: ${toPersianDigits(numStepsCount)} پله به طول ${toPersianDigits(numStepW)} متر\n`;
      text += `- متراژ سنگ کف پله: ${toPersianDigits(totalStepMeters)} متر طول (${toPersianDigits(stairTreadStoneArea.toFixed(2))} متر مربع)\n`;
      text += `- سنگ پیشانی و پاگرد: ${toPersianDigits(stairRiserStoneArea.toFixed(2))} متر مربع پیشانی + ${toPersianDigits(numLandingsArea)} متر مربع پاگرد\n`;
      text += `- مساحت کل سنگ: ${toPersianDigits(totalStairStoneArea)} متر مربع\n`;
    } else if (activeTab === 'plaster') {
      text += `موضوع: برآورد گچ و خاک و سفیدکاری\n`;
      text += `- مساحت کار: ${toPersianDigits(numPlasterArea)} متر مربع\n`;
      text += `- گچ و خاک زیرکار: حدود ${toPersianDigits(plasterRoughBags)} کیسه\n`;
      text += `- گچ سفیدکاری نهایی: حدود ${toPersianDigits(plasterFinishBags)} کیسه\n`;
    } else if (activeTab === 'paint') {
      text += `موضوع: برآورد نقاشی ساختمان (${paintType === 'acrylic' ? 'اکریلیک' : paintType === 'plastic' ? 'پلاستیک' : 'روغنی'})\n`;
      text += `- مساحت کار: ${toPersianDigits(numPaintArea)} متر مربع (${toPersianDigits(paintCoats)} دست)\n`;
      text += `- رنگ مصرفی: حدود ${toPersianDigits(paintNeededKg)} کیلوگرم\n`;
      text += `- بتونه ماستیک: حدود ${toPersianDigits(puttyKg)} کیلوگرم\n`;
    } else if (activeTab === 'cost') {
      text += `موضوع: برآورد اولیه هزینه اجرای اسکلت سازه (${toPersianDigits(numCostArea)} متر مربع)\n`;
      text += `- هزینه کل آهن‌آلات: ${toPersianDigits(Math.round(totalEstimatedRebarCost).toLocaleString('fa-IR'))} تومان\n`;
      text += `- هزینه کل بتن: ${toPersianDigits(Math.round(totalEstimatedConcreteCost).toLocaleString('fa-IR'))} تومان\n`;
      text += `- هزینه دستمزد اجرا: ${toPersianDigits(Math.round(totalEstimatedWage).toLocaleString('fa-IR'))} تومان\n`;
      text += `- جمع کل برآورد اسکلت: ${toPersianDigits(Math.round(totalEstimatedStructureCost).toLocaleString('fa-IR'))} تومان\n`;
    }

    text += `\nسامانه انجمن مجریان ذیصلاح ارومیه`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-4 pb-12 animate-fadeIn text-right">
      {/* Title & Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-violet-800 bg-violet-50 px-2.5 py-0.5 rounded-md border border-violet-200">
              ۱۳ ابزار تخصصی متره و برآورد
            </span>
            <h1 className="text-base font-bold text-slate-900">
              متره و برآورد هوشمند کارگاهی
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            ضرایب سرانگشتی زیربنا، یونولیت، کاشی، بتن، میلگرد، سفال، پوکه‌ریزی، ایزوگام، گچ، سنگ پله، رنگ و هزینه‌ها
          </p>
        </div>

        {/* Copy Report Button */}
        <button
          onClick={handleCopyEstimate}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold shadow-2xs transition-colors shrink-0"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>کپی شد!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>کپی برآورد</span>
            </>
          )}
        </button>
      </div>

      {/* Filter Categories Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
        <button
          onClick={() => setActiveCategory('all')}
          className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-colors ${
            activeCategory === 'all'
              ? 'bg-slate-900 text-white font-bold'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          همه محاسبات ({tabs.length})
        </button>
        <button
          onClick={() => setActiveCategory('structural')}
          className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-colors ${
            activeCategory === 'structural'
              ? 'bg-violet-700 text-white font-bold'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          سازه و سقف (یونولیت/بتن/میلگرد)
        </button>
        <button
          onClick={() => setActiveCategory('masonry')}
          className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-colors ${
            activeCategory === 'masonry'
              ? 'bg-amber-700 text-white font-bold'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          سفت‌کاری و عایق (بلوک/ایزوگام)
        </button>
        <button
          onClick={() => setActiveCategory('finishing')}
          className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-colors ${
            activeCategory === 'finishing'
              ? 'bg-teal-700 text-white font-bold'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          نازک‌کاری (کاشی/پوکه/گچ/سنگ/رنگ)
        </button>
      </div>

      {/* Tabs Horizontal Scroll */}
      <div className="overflow-x-auto pb-1 -mx-2 px-2 flex gap-1.5 scrollbar-none">
        {filteredTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs whitespace-nowrap transition-all shrink-0 ${
                isActive
                  ? 'bg-violet-600 text-white shadow-2xs font-bold'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Calculator Container */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
        {/* ============================================================== */}
        {/* TAB 0: ضرایب سرانگشتی برآورد مصالح بر اساس زیربنای کل (NEW) */}
        {/* ============================================================== */}
        {activeTab === 'rules_of_thumb' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-violet-600" />
                <h2 className="text-xs font-bold text-slate-900">
                  ضرایب سرانگشتی برآورد مصالح ساختمان به ازای هر مترمربع زیربنای کل
                </h2>
              </div>
              <span className="text-[10px] text-violet-700 bg-violet-50 px-2 py-0.5 rounded font-medium border border-violet-100">
                برآورد مقدماتی پروژه
              </span>
            </div>

            {/* Inputs: Gross Area & Structure / Roof Type */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  زیربنای کل ناخالص ساختمان (متر مربع):
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={thumbGrossArea}
                  onChange={(e) => setThumbGrossArea(sanitizeNumericInput(e.target.value))}
                  placeholder="مثال: ۱۰۰۰"
                  className="w-full h-9 px-3 rounded-lg bg-slate-50 border border-slate-300 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  نوع اسکلت و سیستم باربر سازه:
                </label>
                <select
                  value={thumbStructureType}
                  onChange={(e) => setThumbStructureType(e.target.value as any)}
                  className="w-full h-9 px-3 rounded-lg bg-slate-50 border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-violet-500"
                >
                  <option value="concrete">ساختمان بتن‌آرمه (قاب خمشی یا دیوار برشی)</option>
                  <option value="steel_cbf">اسکلت فلزی - مهاربندی هم‌محور CBF (۴۵-۷۰ کیلو)</option>
                  <option value="steel_ebf">اسکلت فلزی - مهاربندی واگرا EBF (۵۰-۷۵ کیلو)</option>
                  <option value="steel_imf">اسکلت فلزی - قاب خمشی متوسط IMF (۶۵-۱۰۵ کیلو)</option>
                  <option value="steel_smf">اسکلت فلزی - قاب خمشی ویژه SMF (۷۰-۱۱۵ کیلو)</option>
                  <option value="steel_dual">اسکلت فلزی - سیستم دوگانه Dual (۷۰-۱۲۰ کیلو)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  نوع سیستم سقف سازه:
                </label>
                <select
                  value={thumbRoofType}
                  onChange={(e) => setThumbRoofType(e.target.value as any)}
                  className="w-full h-9 px-3 rounded-lg bg-slate-50 border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-violet-500"
                >
                  <option value="joist_block">سقف تیرچه‌بلوک (۵ تا ۷ کیلوگرم آرماتور)</option>
                  <option value="composite">سقف کامپوزیت (۸ تا ۱۲ کیلوگرم آرماتور)</option>
                  <option value="rc_slab">سقف دال بتن‌آرمه (۱۰ تا ۱۶ کیلوگرم آرماتور)</option>
                </select>
              </div>
            </div>

            {/* Quick Summary Banner */}
            <div className="p-3 rounded-xl bg-violet-50/80 border border-violet-200/80 flex items-center justify-between text-xs flex-wrap gap-2">
              <span className="font-bold text-violet-950">
                برآورد مصالح برای {toPersianDigits(numThumbArea)} متر مربع زیربنا:
              </span>
              <span className="text-[11px] text-violet-700 font-medium">
                {thumbStructureType === 'concrete' ? 'سازه بتن‌آرمه' : currentSteel.title} + سقف {currentRoof.label.split('(')[0]}
              </span>
            </div>

            {/* 1. Structural Materials Card */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <Layers className="w-3.5 h-3.5 text-violet-600" />
                <span>۱. مصالح سازه‌ای اصلی (اسکلت و قالب‌بندی)</span>
              </div>

              {thumbStructureType === 'concrete' ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-right">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-800">بتن سازه‌ای:</span>
                      <span className="text-[10px] text-slate-500 font-mono">۰٫۳۵ تا ۰٫۵۰ م³/م²</span>
                    </div>
                    <span className="text-base font-bold text-violet-950 font-mono mt-1 block">
                      {toPersianDigits(thumbConcMin)} تا {toPersianDigits(thumbConcMax)} م³
                    </span>
                    <span className="text-[10px] text-slate-600 block mt-0.5">
                      مقدار پایه (۰٫۴۲): <strong className="text-violet-700">{toPersianDigits(thumbConcBase)} م³</strong> (~{toPersianDigits(Math.ceil(parseFloat(thumbConcBase) / 7))} میکسر)
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-right">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-800">میلگرد سازه:</span>
                      <span className="text-[10px] text-slate-500 font-mono">۴۰ تا ۶۰ کیلو/م²</span>
                    </div>
                    <span className="text-base font-bold text-violet-950 font-mono mt-1 block">
                      {toPersianDigits((thumbRebarMinKg / 1000).toFixed(1))} تا {toPersianDigits((thumbRebarMaxKg / 1000).toFixed(1))} تن
                    </span>
                    <span className="text-[10px] text-slate-600 block mt-0.5">
                      مقدار پایه (۵۰ کیلو): <strong className="text-violet-700">{toPersianDigits((thumbRebarBaseKg / 1000).toFixed(1))} تن</strong> ({toPersianDigits(thumbRebarBaseKg.toLocaleString('fa-IR'))} کیلو)
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-right">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-800">قالب‌بندی سازه:</span>
                      <span className="text-[10px] text-slate-500 font-mono">۲٫۵ تا ۴ م²/م²</span>
                    </div>
                    <span className="text-base font-bold text-violet-950 font-mono mt-1 block">
                      {toPersianDigits(thumbFormworkMinM2.toLocaleString('fa-IR'))} تا {toPersianDigits(thumbFormworkMaxM2.toLocaleString('fa-IR'))} م²
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      سطح کل قالب ستون، تیر، دیوار و سقف
                    </span>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-right">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-800">فولاد اسکلت فلزی ({currentSteel.title}):</span>
                      <span className="text-[10px] text-slate-500 font-mono">{currentSteel.minRate} تا {currentSteel.maxRate} کیلو/م²</span>
                    </div>
                    <span className="text-base font-bold text-violet-950 font-mono mt-1 block">
                      {toPersianDigits((thumbSteelMinKg / 1000).toFixed(1))} تا {toPersianDigits((thumbSteelMaxKg / 1000).toFixed(1))} تن
                    </span>
                    <span className="text-[10px] text-slate-600 block mt-0.5">
                      معادل {toPersianDigits(thumbSteelMinKg.toLocaleString('fa-IR'))} تا {toPersianDigits(thumbSteelMaxKg.toLocaleString('fa-IR'))} کیلوگرم آهن‌آلات سازه
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-right">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-800">سیستم جانبی انتخاب‌شده:</span>
                      <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-bold">مصوب آیین‌نامه ۲۸۰۰</span>
                    </div>
                    <p className="text-xs font-semibold text-slate-900 mt-1">
                      {currentSteel.desc}
                    </p>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      ضریب مصرف به ازای هر متر مربع زیربنا
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Roof Reinforcement Card */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <Box className="w-3.5 h-3.5 text-indigo-600" />
                <span>۲. آرماتور سقف‌ها ({currentRoof.label.split('(')[0].trim()})</span>
              </div>

              <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-200/80 grid grid-cols-1 sm:grid-cols-3 gap-2 items-center text-right">
                <div>
                  <span className="text-[10px] text-indigo-800 block">نرخ مصرف آرماتور سقف:</span>
                  <span className="text-xs font-bold text-indigo-950 font-mono mt-0.5 block">
                    {toPersianDigits(currentRoof.minRate)} تا {toPersianDigits(currentRoof.maxRate)} کیلوگرم بر م² سقف
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-indigo-800 block">مجموع آرماتور سقف‌ها برای کل زیربنا:</span>
                  <span className="text-base font-bold text-indigo-950 font-mono mt-0.5 block">
                    {toPersianDigits((thumbRoofRebarMinKg / 1000).toFixed(1))} تا {toPersianDigits((thumbRoofRebarMaxKg / 1000).toFixed(1))} تن
                  </span>
                </div>

                <div className="text-[10px] text-indigo-700 leading-relaxed">
                  {thumbRoofType === 'joist_block'
                    ? 'شامل میلگردهای ممان منفی (اتکا)، برشی (ادکا)، ژوئن و شبکه حرارتی دال رویه.'
                    : thumbRoofType === 'composite'
                    ? 'شامل شبکه آرماتور روی دال و گل‌میخ‌های برش‌گیر تیرها.'
                    : 'شامل شبکه‌های تحتانی و فوقانی دال بتن‌آرمه و آرماتورهای برش پانچ.'}
                </div>
              </div>
            </div>

            {/* 3. Aggregates & Cement Card */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <Truck className="w-3.5 h-3.5 text-amber-600" />
                <span>۳. شن، ماسه و سیمان کل پروژه</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-right">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-800">سیمان کل پروژه:</span>
                    <span className="text-[10px] text-slate-500 font-mono">۱۶۳ تا ۳۳۰ کیلو/م²</span>
                  </div>
                  <span className="text-base font-bold text-slate-900 font-mono mt-1 block">
                    {toPersianDigits((thumbCementMinKg / 1000).toFixed(1))} تا {toPersianDigits((thumbCementMaxKg / 1000).toFixed(1))} تن
                  </span>
                  <span className="text-[10px] text-slate-600 block mt-0.5">
                    معادل <strong>{toPersianDigits(thumbCementMinBags.toLocaleString('fa-IR'))} تا {toPersianDigits(thumbCementMaxBags.toLocaleString('fa-IR'))}</strong> کیسه ۵۰ کیلویی
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-right">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-800">شن ساختمانی:</span>
                    <span className="text-[10px] text-slate-500 font-mono">۰٫۳۳ تا ۰٫۵۷ م³/م²</span>
                  </div>
                  <span className="text-base font-bold text-slate-900 font-mono mt-1 block">
                    {toPersianDigits(thumbGravelMinM3)} تا {toPersianDigits(thumbGravelMaxM3)} م³
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    حدود {toPersianDigits(Math.round(parseFloat(thumbGravelMinM3) / 10))} تا {toPersianDigits(Math.round(parseFloat(thumbGravelMaxM3) / 10))} کمپرسی ده‌چرخ
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-right">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-800">ماسه شسته:</span>
                    <span className="text-[10px] text-slate-500 font-mono">۰٫۴۰ تا ۰٫۵۵ م³/م²</span>
                  </div>
                  <span className="text-base font-bold text-slate-900 font-mono mt-1 block">
                    {toPersianDigits(thumbSandMinM3)} تا {toPersianDigits(thumbSandMaxM3)} م³
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    حدود {toPersianDigits(Math.round(parseFloat(thumbSandMinM3) / 10))} تا {toPersianDigits(Math.round(parseFloat(thumbSandMaxM3) / 10))} کمپرسی ده‌چرخ
                  </span>
                </div>
              </div>
            </div>

            {/* 4. Architectural Materials Card */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                <span>۴. مصالح معماری و نازک‌کاری (ضرایب تقریبی)</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-right">
                  <span className="text-[10px] text-slate-600 block">گچ سفید و خاک:</span>
                  <span className="text-xs font-bold text-slate-900 font-mono mt-0.5 block">
                    {toPersianDigits((thumbPlasterMinKg / 1000).toFixed(1))} - {toPersianDigits((thumbPlasterMaxKg / 1000).toFixed(1))} تن
                  </span>
                  <span className="text-[9px] text-slate-500 block mt-0.5">۶۵ تا ۷۷ کیلو/م²</span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-right">
                  <span className="text-[10px] text-slate-600 block">کاشی دیوار:</span>
                  <span className="text-xs font-bold text-slate-900 font-mono mt-0.5 block">
                    {toPersianDigits(thumbWallTileM2)} م²
                  </span>
                  <span className="text-[9px] text-slate-500 block mt-0.5">حدود ۰٫۴۵ م²/م²</span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-right">
                  <span className="text-[10px] text-slate-600 block">سرامیک کف:</span>
                  <span className="text-xs font-bold text-slate-900 font-mono mt-0.5 block">
                    {toPersianDigits(thumbFloorTileM2)} م²
                  </span>
                  <span className="text-[9px] text-slate-500 block mt-0.5">حدود ۰٫۲۲ م²/م²</span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-right">
                  <span className="text-[10px] text-slate-600 block">موزاییک:</span>
                  <span className="text-xs font-bold text-slate-900 font-mono mt-0.5 block">
                    {toPersianDigits(thumbMosaicM2)} م²
                  </span>
                  <span className="text-[9px] text-slate-500 block mt-0.5">حدود ۰٫۷۴ م²/م²</span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-right">
                  <span className="text-[10px] text-slate-600 block">آجر / سفال:</span>
                  <span className="text-xs font-bold text-slate-900 font-mono mt-0.5 block">
                    {toPersianDigits((thumbBricksMinCount / 1000).toFixed(0))}k - {toPersianDigits((thumbBricksMaxCount / 1000).toFixed(0))}k قالب
                  </span>
                  <span className="text-[9px] text-slate-500 block mt-0.5">۳۳۸ تا ۳۹۰ قالب/م²</span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-right">
                  <span className="text-[10px] text-slate-600 block">پروفیل در و پنجره:</span>
                  <span className="text-xs font-bold text-slate-900 font-mono mt-0.5 block">
                    {toPersianDigits(thumbWindowProfileKg)} کیلو
                  </span>
                  <span className="text-[9px] text-slate-500 block mt-0.5">حدود ۲٫۹ کیلو/م²</span>
                </div>
              </div>
            </div>

            {/* Authoritative Engineering Disclaimer (Requested by User) */}
            <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200/90 text-right space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                <Info className="w-4 h-4 text-amber-700 shrink-0" />
                <span>توضیح فنی و درجه اتکاپذیری ضرایب برآورد سرانگشتی:</span>
              </div>
              <p className="text-[11px] text-amber-900 leading-relaxed">
                تمام ضرایب فوق برآورد سرانگشتی هستند و مقدار واقعی به نقشه، تعداد طبقات، نوع سازه، نوع سقف، دهانه‌ها، معماری و شرایط پروژه وابسته است. ضرایب بتن، میلگرد و فولاد از نظر قابلیت استفاده برای برآورد مقدماتی قابل اتکاتر از ضرایب مصالح معماری هستند.
              </p>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 1: یونولیت و تیرچه سقف (CRITICAL USER REQUEST) */}
        {/* ============================================================== */}
        {activeTab === 'foam_joist' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <Box className="w-4 h-4 text-violet-600" />
                <h2 className="text-xs font-bold text-slate-900">
                  برآورد بلوک یونولیت (فوم پلی‌استایرن EPS)، تیرچه‌ها و بتن رویه
                </h2>
              </div>
              <span className="text-[10px] text-violet-700 bg-violet-50 px-2 py-0.5 rounded font-medium border border-violet-100">
                سقف تیرچه بلوک
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  مساحت کل سقف (متر مربع):
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={roofArea}
                  onChange={(e) => setRoofArea(sanitizeNumericInput(e.target.value))}
                  placeholder="مثال: ۱۵۰"
                  className="w-full h-9 px-3 rounded-lg bg-slate-50 border border-slate-300 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  فاصله آکس به آکس تیرچه‌ها:
                </label>
                <select
                  value={joistSpacing}
                  onChange={(e) => setJoistSpacing(e.target.value as '50' | '66')}
                  className="w-full h-9 px-3 rounded-lg bg-slate-50 border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-violet-500"
                >
                  <option value="50">۵۰ سانتی‌متر (معمول و استاندارد)</option>
                  <option value="66">۶۶ سانتی‌متر (تیرچه دوبل یا دهانه بزرگ)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  ارتفاع یونولیت سقف:
                </label>
                <select
                  value={foamHeight}
                  onChange={(e) => setFoamHeight(e.target.value as '20' | '25' | '30')}
                  className="w-full h-9 px-3 rounded-lg bg-slate-50 border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-violet-500"
                >
                  <option value="20">۲۰ سانتی‌متر (تیرچه پاشنه بتنی نازک)</option>
                  <option value="25">۲۵ سانتی‌متر (متداول‌ترین ارتفاع سقف مسکونی)</option>
                  <option value="30">۳۰ سانتی‌متر (دهانه‌های بلند و پارکینگ)</option>
                </select>
              </div>
            </div>

            {/* Waste adjustment slider */}
            <div className="flex items-center justify-between text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <span className="text-slate-700 text-[11px] font-medium">
                درصد پرت برش گوشه‌ها و شکستگی فوم:
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={foamWastePercent}
                  onChange={(e) => setFoamWastePercent(Number(e.target.value))}
                  className="w-24 accent-violet-600"
                />
                <span className="font-mono font-bold text-violet-700 w-8 text-left">
                  {toPersianDigits(foamWastePercent)}٪
                </span>
              </div>
            </div>

            {/* Results Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              <div className="p-3 rounded-xl bg-violet-50 border border-violet-200 text-right">
                <span className="text-[10px] text-violet-800 block">
                  تعداد بلوک یونولیت ۲ متری:
                </span>
                <span className="text-lg font-bold text-violet-950 font-mono mt-0.5 block">
                  {toPersianDigits(grossFoamBlocksCount)} عدد
                </span>
                <span className="text-[10px] text-violet-600 block">
                  ابعاد: {joistSpacing}×۲۰۰×{foamHeight} سانت
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-right">
                <span className="text-[10px] text-slate-600 block">
                  متراژ کل تیرچه تخمینی:
                </span>
                <span className="text-lg font-bold text-slate-900 font-mono mt-0.5 block">
                  {toPersianDigits(estimatedJoistMeters)} متر
                </span>
                <span className="text-[10px] text-slate-500 block">
                  متر طول پاشنه تیرچه
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-right">
                <span className="text-[10px] text-slate-600 block">
                  بتن رویه دال (ضخامت ۵ تا ۷ سانت):
                </span>
                <span className="text-lg font-bold text-slate-900 font-mono mt-0.5 block">
                  {toPersianDigits(estimatedRoofConcreteM3)} م³
                </span>
                <span className="text-[10px] text-slate-500 block">
                  حدود {toPersianDigits(Math.ceil(parseFloat(estimatedRoofConcreteM3) / 7))} میکسر
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-right">
                <span className="text-[10px] text-slate-600 block">
                  میلگرد حرارتی سقف (نمره ۶ یا ۸):
                </span>
                <span className="text-lg font-bold text-slate-900 font-mono mt-0.5 block">
                  {toPersianDigits(estimatedThermalRebarKg)} کیلو
                </span>
                <span className="text-[10px] text-slate-500 block">
                  شبکه متعامد فواصل ۲۵ سانت
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-[11px] text-amber-900 leading-relaxed flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>نکته نظارتی:</strong> طبق استاندارد ملی و مرکز تحقیقات، یونولیت سقفی باید حتماً از نوع
                <strong> «کندسوز استاندارد»</strong> با دانسیته حداقل ۱۲ کیلوگرم بر متر مکعب باشد. استفاده از فوم‌های سبک دانسیته پایین یا ضایعاتی به دلیل خطر اشتعال شدید در آتش‌سوزی اکیداً مردود است.
              </span>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: کاشی و سرامیک (CRITICAL USER REQUEST) */}
        {/* ============================================================== */}
        {activeTab === 'tiles' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-teal-600" />
                <h2 className="text-xs font-bold text-slate-900">
                  برآورد کاشی و سرامیک، تعداد کارتن، چسب پودری و پودر بندکشی
                </h2>
              </div>
              <span className="text-[10px] text-teal-700 bg-teal-50 px-2 py-0.5 rounded font-medium border border-teal-100">
                کف و بدنه
              </span>
            </div>

            {/* Target Selector */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 text-xs">
              <button
                onClick={() => setTileTarget('floor')}
                className={`flex-1 py-1.5 rounded-lg font-bold transition-colors ${
                  tileTarget === 'floor' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                }`}
              >
                فقط کف (سرامیک / پرسلان)
              </button>
              <button
                onClick={() => setTileTarget('wall')}
                className={`flex-1 py-1.5 rounded-lg font-bold transition-colors ${
                  tileTarget === 'wall' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                }`}
              >
                فقط دیوار (کاشی بدنه)
              </button>
              <button
                onClick={() => setTileTarget('combined')}
                className={`flex-1 py-1.5 rounded-lg font-bold transition-colors ${
                  tileTarget === 'combined' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                }`}
              >
                کف و دیوار با هم (حمام/سرویس)
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  طول فضا (متر):
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={roomLength}
                  onChange={(e) => setRoomLength(sanitizeNumericInput(e.target.value))}
                  placeholder="مثال: ۶"
                  className="w-full h-9 px-3 rounded-lg bg-slate-50 border border-slate-300 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  عرض فضا (متر):
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={roomWidth}
                  onChange={(e) => setRoomWidth(sanitizeNumericInput(e.target.value))}
                  placeholder="مثال: ۴"
                  className="w-full h-9 px-3 rounded-lg bg-slate-50 border border-slate-300 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-teal-500"
                />
              </div>

              {(tileTarget === 'wall' || tileTarget === 'combined') && (
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    ارتفاع کاشی دیوار (متر):
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={wallTileHeight}
                    onChange={(e) => setWallTileHeight(sanitizeNumericInput(e.target.value))}
                    placeholder="مثال: ۲.۸"
                    className="w-full h-9 px-3 rounded-lg bg-slate-50 border border-slate-300 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-teal-500"
                  />
                </div>
              )}

              {(tileTarget === 'wall' || tileTarget === 'combined') && (
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    کسر درب و پنجره (متر مربع):
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={doorWindowArea}
                    onChange={(e) => setDoorWindowArea(sanitizeNumericInput(e.target.value))}
                    placeholder="مثال: ۴.۵"
                    className="w-full h-9 px-3 rounded-lg bg-slate-50 border border-slate-300 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-teal-500"
                  />
                </div>
              )}

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  متراژ هر کارتن کاشی (م²):
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={tileBoxArea}
                  onChange={(e) => setTileBoxArea(sanitizeNumericInput(e.target.value))}
                  placeholder="معمولاً ۱.۴۴ یا ۲.۱۶"
                  className="w-full h-9 px-3 rounded-lg bg-slate-50 border border-slate-300 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  درصد پرت و برش (معمولاً ۵ تا ۱۰٪):
                </label>
                <div className="flex items-center gap-2 h-9">
                  <input
                    type="range"
                    min="3"
                    max="15"
                    value={tileWastePercent}
                    onChange={(e) => setTileWastePercent(Number(e.target.value))}
                    className="w-full accent-teal-600"
                  />
                  <span className="font-mono font-bold text-teal-800 text-xs w-8 text-left">
                    {toPersianDigits(tileWastePercent)}٪
                  </span>
                </div>
              </div>
            </div>

            {/* Results Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 text-right">
                <span className="text-[10px] text-teal-800 block">
                  تعداد کارتن مورد نیاز:
                </span>
                <span className="text-lg font-bold text-teal-950 font-mono mt-0.5 block">
                  {toPersianDigits(estimatedTileBoxes)} کارتن
                </span>
                <span className="text-[10px] text-teal-600 block">
                  معادل {toPersianDigits(selectedGrossTileArea.toFixed(1))} م² ناخالص
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-right">
                <span className="text-[10px] text-slate-600 block">
                  مساحت خالص کار:
                </span>
                <span className="text-lg font-bold text-slate-900 font-mono mt-0.5 block">
                  {toPersianDigits(selectedNetTileArea.toFixed(1))} م²
                </span>
                <span className="text-[10px] text-slate-500 block">
                  بدون احتساب پرت
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-right">
                <span className="text-[10px] text-slate-600 block">
                  چسب کاشی پودری (کیسه ۲۵ کیلویی):
                </span>
                <span className="text-lg font-bold text-slate-900 font-mono mt-0.5 block">
                  {toPersianDigits(tileGlueBags)} کیسه
                </span>
                <span className="text-[10px] text-slate-500 block">
                  حدود {toPersianDigits(tileGlueKg)} کیلوگرم چسب
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-right">
                <span className="text-[10px] text-slate-600 block">
                  پودر بندکشی آنتی‌باکتریال:
                </span>
                <span className="text-lg font-bold text-slate-900 font-mono mt-0.5 block">
                  {toPersianDigits(groutPowderKg)} کیلو
                </span>
                <span className="text-[10px] text-slate-500 block">
                  برای درزهای ۲ تا ۳ میلی‌متری
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 leading-relaxed">
              <strong>راهنمای کارگاهی:</strong> در چیدمان‌های لوزی (۴۵ درجه) یا سرامیک‌های سایز بزرگ (اسلب)، به دلیل برش‌های محیطی فارسی‌بُر، درصد پرت را حداقل ۱۰ تا ۱۲ درصد در نظر بگیرید تا در پایان کار دچار کسری کالیبر کاشی نشوید.
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: پوکه‌ریزی و فوم‌بتن */}
        {/* ============================================================== */}
        {activeTab === 'lightweight_fill' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-emerald-600" />
                <h2 className="text-xs font-bold text-slate-900">
                  برآورد کفسازی طبقات و شیب‌بندی بام (پوکه معدنی / فوم‌بتن)
                </h2>
              </div>
              <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-100 text-[10px]">
                <button
                  onClick={() => setFillType('mineral_pumice')}
                  className={`px-2 py-1 rounded-md font-bold transition-colors ${
                    fillType === 'mineral_pumice' ? 'bg-white shadow-2xs text-slate-900' : 'text-slate-600'
                  }`}
                >
                  پوکه معدنی قروه
                </button>
                <button
                  onClick={() => setFillType('foam_concrete')}
                  className={`px-2 py-1 rounded-md font-bold transition-colors ${
                    fillType === 'foam_concrete' ? 'bg-white shadow-2xs text-slate-900' : 'text-slate-600'
                  }`}
                >
                  فوم‌بتن
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  مساحت کف یا بام (متر مربع):
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={floorArea}
                  onChange={(e) => setFloorArea(sanitizeNumericInput(e.target.value))}
                  placeholder="مثال: ۱۲۰"
                  className="w-full h-9 px-3 rounded-lg bg-slate-50 border border-slate-300 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  میانگین ضخامت کفسازی (سانتی‌متر):
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={fillThickness}
                  onChange={(e) => setFillThickness(sanitizeNumericInput(e.target.value))}
                  placeholder="معمولاً ۸ تا ۱۰ سانتی‌متر"
                  className="w-full h-9 px-3 rounded-lg bg-slate-50 border border-slate-300 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-right">
                <span className="text-[10px] text-emerald-800 block">
                  حجم کل فضا:
                </span>
                <span className="text-lg font-bold text-emerald-950 font-mono mt-0.5 block">
                  {toPersianDigits(fillVolumeM3.toFixed(2))} م³
                </span>
                <span className="text-[10px] text-emerald-600 block">
                  متر مکعب فضا
                </span>
              </div>

              {fillType === 'mineral_pumice' ? (
                <>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-right">
                    <span className="text-[10px] text-slate-600 block">
                      حجم پوکه با ۱۰٪ تراکم:
                    </span>
                    <span className="text-lg font-bold text-slate-900 font-mono mt-0.5 block">
                      {toPersianDigits(pumiceVolumeM3)} م³
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      حدود {toPersianDigits(pumiceTrucks)} کمپرسی ده چرخ
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-right">
                    <span className="text-[10px] text-slate-600 block">
                      سیمان ملات لیسه‌ای روکش:
                    </span>
                    <span className="text-lg font-bold text-slate-900 font-mono mt-0.5 block">
                      {toPersianDigits(pumiceCementBags)} کیسه
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      برای ملات ۳ سانتی روی پوکه
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-right">
                    <span className="text-[10px] text-slate-600 block">
                      سیمان مصرفی فوم‌بتن:
                    </span>
                    <span className="text-lg font-bold text-slate-900 font-mono mt-0.5 block">
                      {toPersianDigits(foamConcCementBags)} کیسه
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      عیار ۲۸۰ کیلوگرم در متر مکعب
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-right">
                    <span className="text-[10px] text-slate-600 block">
                      مایع فوم شیمیایی:
                    </span>
                    <span className="text-lg font-bold text-slate-900 font-mono mt-0.5 block">
                      {toPersianDigits(foamConcLiquidLiters)} لیتر
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      تولید کف پایدار حباب‌دار
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 4: ایزوگام و عایق رطوبتی */}
        {/* ============================================================== */}
        {activeTab === 'waterproofing' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <Droplet className="w-4 h-4 text-sky-600" />
                <h2 className="text-xs font-bold text-slate-900">
                  برآورد ایزوگام، قیر پرایمر، همپوشانی و ماهیچه جان‌پناه
                </h2>
              </div>
              <span className="text-[10px] text-sky-700 bg-sky-50 px-2 py-0.5 rounded font-medium border border-sky-100">
                بام و سرویس‌ها
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  مساحت کف بام یا سرویس (م²):
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={waterproofArea}
                  onChange={(e) => setWaterproofArea(sanitizeNumericInput(e.target.value))}
                  placeholder="مثال: ۸۰"
                  className="w-full h-9 px-3 rounded-lg bg-slate-50 border border-slate-300 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  محیط لبه‌ها و جان‌پناه (متر طول):
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={upstandLength}
                  onChange={(e) => setUpstandLength(sanitizeNumericInput(e.target.value))}
                  placeholder="محیط دیواره‌های دور"
                  className="w-full h-9 px-3 rounded-lg bg-slate-50 border border-slate-300 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  تعداد لایه‌های عایق:
                </label>
                <select
                  value={waterproofLayers}
                  onChange={(e) => setWaterproofLayers(Number(e.target.value) as 1 | 2)}
                  className="w-full h-9 px-3 rounded-lg bg-slate-50 border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-sky-500"
                >
                  <option value={1}>یک لایه استاندارد دولایه فویل‌دار</option>
                  <option value={2}>دو لایه متقاطع (ویژه استخر و سرویس لوکس)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
              <div className="p-3 rounded-xl bg-sky-50 border border-sky-200 text-right">
                <span className="text-[10px] text-sky-800 block">
                  تعداد رول ایزوگام ۱۰ متری:
                </span>
                <span className="text-lg font-bold text-sky-950 font-mono mt-0.5 block">
                  {toPersianDigits(isogamRollsCount)} رول
                </span>
                <span className="text-[10px] text-sky-600 block">
                  با ۱۰ سانت اورلپ استاندارد
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-right">
                <span className="text-[10px] text-slate-600 block">
                  مساحت کل با احتساب بالاآمدگی:
                </span>
                <span className="text-lg font-bold text-slate-900 font-mono mt-0.5 block">
                  {toPersianDigits(totalNetWpArea.toFixed(1))} م²
                </span>
                <span className="text-[10px] text-slate-500 block">
                  شامل ماهیچه‌کشی دور
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-right">
                <span className="text-[10px] text-slate-600 block">
                  قیر پرایمر امولسیونی زیرسازی:
                </span>
                <span className="text-lg font-bold text-slate-900 font-mono mt-0.5 block">
                  {toPersianDigits(bitumenPrimerKg)} کیلو
                </span>
                <span className="text-[10px] text-slate-500 block">
                  جهت چسبندگی کامل به بتن
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 5: گچ و خاک و سفیدکاری */}
        {/* ============================================================== */}
        {activeTab === 'plaster' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <Paintbrush className="w-4 h-4 text-amber-600" />
                <h2 className="text-xs font-bold text-slate-900">
                  برآورد گچ‌وخاک (لایه ضخیم) و گچ سفیدکاری سوپر (نازک‌کاری)
                </h2>
              </div>
              <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-medium border border-amber-100">
                اندود گچ
              </span>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                مساحت کل دیوارها و سقف‌ها (متر مربع):
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={plasterWallArea}
                onChange={(e) => setPlasterWallArea(sanitizeNumericInput(e.target.value))}
                placeholder="مثال: ۱۰۰"
                className="w-full h-9 px-3 rounded-lg bg-slate-50 border border-slate-300 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-right">
                <span className="text-[10px] text-amber-800 block">
                  گچ و خاک زیرکار (کیسه ۴۰ کیلویی):
                </span>
                <span className="text-lg font-bold text-amber-950 font-mono mt-0.5 block">
                  {toPersianDigits(plasterRoughBags)} کیسه
                </span>
                <span className="text-[10px] text-amber-600 block">
                  ضخامت میانگین ۲ الی ۲.۵ سانت
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-right">
                <span className="text-[10px] text-slate-600 block">
                  گچ سفیدکاری پرداخت (کیسه ۳۰ کیلویی):
                </span>
                <span className="text-lg font-bold text-slate-900 font-mono mt-0.5 block">
                  {toPersianDigits(plasterFinishBags)} کیسه
                </span>
                <span className="text-[10px] text-slate-500 block">
                  پوشش لایه نهایی ۲ میلی‌متری
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-right">
                <span className="text-[10px] text-slate-600 block">
                  آب مصرفی ساخت ملات:
                </span>
                <span className="text-lg font-bold text-slate-900 font-mono mt-0.5 block">
                  {toPersianDigits(Math.round(numPlasterArea * 18))} لیتر
                </span>
                <span className="text-[10px] text-slate-500 block">
                  مخلوط تمیز بدون املاح
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 6: سنگ پله و پاگرد */}
        {/* ============================================================== */}
        {activeTab === 'stairs' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-slate-700" />
                <h2 className="text-xs font-bold text-slate-900">
                  متره سنگ کف پله، سنگ پیشانی پله، پاگرد و قرنیز پله
                </h2>
              </div>
              <span className="text-[10px] text-slate-700 bg-slate-100 px-2 py-0.5 rounded font-medium border border-slate-200">
                راه‌پله و پاگرد
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  تعداد کل پله‌ها:
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={stairStepsCount}
                  onChange={(e) => setStairStepsCount(sanitizeNumericInput(e.target.value))}
                  placeholder="مثال: ۲۰"
                  className="w-full h-9 px-3 rounded-lg bg-slate-50 border border-slate-300 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-slate-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  عرض هر پله (متر):
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={stepWidth}
                  onChange={(e) => setStepWidth(sanitizeNumericInput(e.target.value))}
                  placeholder="مثال: ۱.۲"
                  className="w-full h-9 px-3 rounded-lg bg-slate-50 border border-slate-300 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-slate-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  عمق کف پله (متر):
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={stepTread}
                  onChange={(e) => setStepTread(sanitizeNumericInput(e.target.value))}
                  placeholder="معمولاً ۰.۳۵"
                  className="w-full h-9 px-3 rounded-lg bg-slate-50 border border-slate-300 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-slate-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  مساحت کل پاگردها (م²):
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={landingsArea}
                  onChange={(e) => setLandingsArea(sanitizeNumericInput(e.target.value))}
                  placeholder="مثال: ۴.۵"
                  className="w-full h-9 px-3 rounded-lg bg-slate-50 border border-slate-300 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-slate-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              <div className="p-3 rounded-xl bg-slate-100 border border-slate-300 text-right">
                <span className="text-[10px] text-slate-700 block">
                  متر طول سنگ کف پله:
                </span>
                <span className="text-lg font-bold text-slate-950 font-mono mt-0.5 block">
                  {toPersianDigits(totalStepMeters)} م.طول
                </span>
                <span className="text-[10px] text-slate-600 block">
                  ضخامت ۳ یا ۴ سانت
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-right">
                <span className="text-[10px] text-slate-600 block">
                  مساحت سنگ پیشانی:
                </span>
                <span className="text-lg font-bold text-slate-900 font-mono mt-0.5 block">
                  {toPersianDigits(stairRiserStoneArea.toFixed(2))} م²
                </span>
                <span className="text-[10px] text-slate-500 block">
                  ضخامت ۲ سانت
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-right">
                <span className="text-[10px] text-slate-600 block">
                  مساحت کل سنگ (با پاگرد):
                </span>
                <span className="text-lg font-bold text-slate-900 font-mono mt-0.5 block">
                  {toPersianDigits(totalStairStoneArea)} م²
                </span>
                <span className="text-[10px] text-slate-500 block">
                  کف، پیشانی و پاگرد
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-right">
                <span className="text-[10px] text-slate-600 block">
                  متر طول قرنیز پله و پاگرد:
                </span>
                <span className="text-lg font-bold text-slate-900 font-mono mt-0.5 block">
                  {toPersianDigits(skirtMeters)} م.طول
                </span>
                <span className="text-[10px] text-slate-500 block">
                  قرنیز ۱۰ یا ۱۵ سانتی
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 7: رنگ و نقاشی ساختمان */}
        {/* ============================================================== */}
        {activeTab === 'paint' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <Paintbrush className="w-4 h-4 text-indigo-600" />
                <h2 className="text-xs font-bold text-slate-900">
                  برآورد رنگ ساختمانی (اکریلیک، پلاستیک یا روغنی) و بتونه
                </h2>
              </div>
              <span className="text-[10px] text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded font-medium border border-indigo-100">
                نقاشی ساختمان
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  مساحت کل رنگ‌آمیزی (م²):
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={paintArea}
                  onChange={(e) => setPaintArea(sanitizeNumericInput(e.target.value))}
                  placeholder="مثال: ۲۰۰"
                  className="w-full h-9 px-3 rounded-lg bg-slate-50 border border-slate-300 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  نوع رنگ مصرفی:
                </label>
                <select
                  value={paintType}
                  onChange={(e) => setPaintType(e.target.value as 'acrylic' | 'plastic' | 'oil')}
                  className="w-full h-9 px-3 rounded-lg bg-slate-50 border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                >
                  <option value="acrylic">اکریلیک پایه آب (قابل شستشو و بی‌بو)</option>
                  <option value="plastic">پلاستیک استاندارد (مخصوص سقف‌ها)</option>
                  <option value="oil">روغنی آلکیدی (مخصوص درب، پنجره و قرنیز)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  تعداد دست رنگ‌آمیزی:
                </label>
                <select
                  value={paintCoats}
                  onChange={(e) => setPaintCoats(Number(e.target.value))}
                  className="w-full h-9 px-3 rounded-lg bg-slate-50 border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                >
                  <option value={2}>۲ دست (روی دیوار قبلاً رنگ‌شده)</option>
                  <option value={3}>۳ دست استاندارد (روی گچ تازه با آستر)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
              <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-right">
                <span className="text-[10px] text-indigo-800 block">
                  رنگ خالص مورد نیاز:
                </span>
                <span className="text-lg font-bold text-indigo-950 font-mono mt-0.5 block">
                  {toPersianDigits(paintNeededKg)} کیلوگرم
                </span>
                <span className="text-[10px] text-indigo-600 block">
                  حدود {toPersianDigits(Math.ceil(paintNeededKg / 12))} حلب استاندارد
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-right">
                <span className="text-[10px] text-slate-600 block">
                  بتونه ماستیک زیرسازی:
                </span>
                <span className="text-lg font-bold text-slate-900 font-mono mt-0.5 block">
                  {toPersianDigits(puttyKg)} کیلو
                </span>
                <span className="text-[10px] text-slate-500 block">
                  ترمیم ترک‌ها و تسطیح سطح
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-right">
                <span className="text-[10px] text-slate-600 block">
                  روغن الیف یا پرایمر آستر:
                </span>
                <span className="text-lg font-bold text-slate-900 font-mono mt-0.5 block">
                  {toPersianDigits(Math.round(numPaintArea * 0.15))} لیتر
                </span>
                <span className="text-[10px] text-slate-500 block">
                  کاهش مکش گچ تازه
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 8: حجم بتن و میکسر */}
        {/* ============================================================== */}
        {activeTab === 'concrete' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-slate-700" />
                <h2 className="text-xs font-bold text-slate-900">
                  محاسبه حجم بتن‌ریزی فونداسیون، ستون یا سقف
                </h2>
              </div>
              <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-100 text-[10px]">
                <button
                  onClick={() => setConcType('strip')}
                  className={`px-2 py-1 rounded-md transition-colors ${
                    concType === 'strip' ? 'bg-white shadow-2xs font-bold text-slate-900' : 'text-slate-500'
                  }`}
                >
                  نواری / پی
                </button>
                <button
                  onClick={() => setConcType('column')}
                  className={`px-2 py-1 rounded-md transition-colors ${
                    concType === 'column' ? 'bg-white shadow-2xs font-bold text-slate-900' : 'text-slate-500'
                  }`}
                >
                  ستون‌ها
                </button>
                <button
                  onClick={() => setConcType('slab')}
                  className={`px-2 py-1 rounded-md transition-colors ${
                    concType === 'slab' ? 'bg-white shadow-2xs font-bold text-slate-900' : 'text-slate-500'
                  }`}
                >
                  سقف و دال
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  {concType === 'strip' ? 'طول نوار (متر)' : concType === 'column' ? 'بعد اول ستون (متر)' : 'طول سقف (متر)'}:
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={concLength}
                  onChange={(e) => setConcLength(sanitizeNumericInput(e.target.value))}
                  className="w-full h-9 px-3 rounded-lg bg-slate-50 border border-slate-300 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-slate-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  {concType === 'strip' ? 'عرض نوار (متر)' : concType === 'column' ? 'بعد دوم ستون (متر)' : 'عرض سقف (متر)'}:
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={concWidth}
                  onChange={(e) => setConcWidth(sanitizeNumericInput(e.target.value))}
                  className="w-full h-9 px-3 rounded-lg bg-slate-50 border border-slate-300 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-slate-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  {concType === 'strip' ? 'ارتفاع پی (متر)' : concType === 'column' ? 'ارتفاع ستون (متر)' : 'ضخامت دال (متر)'}:
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={concHeight}
                  onChange={(e) => setConcHeight(sanitizeNumericInput(e.target.value))}
                  className="w-full h-9 px-3 rounded-lg bg-slate-50 border border-slate-300 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-slate-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  {concType === 'column' ? 'تعداد ستون‌ها' : 'تعداد تکرار'}:
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={concCount}
                  onChange={(e) => setConcCount(sanitizeNumericInput(e.target.value))}
                  className="w-full h-9 px-3 rounded-lg bg-slate-50 border border-slate-300 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-slate-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
              <div className="p-3 rounded-xl bg-slate-100 border border-slate-300 text-right">
                <span className="text-[10px] text-slate-700 block">حجم بتن خالص:</span>
                <span className="text-lg font-bold text-slate-950 font-mono mt-0.5 block">
                  {toPersianDigits(netConcVolume.toFixed(2))} م³
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-right">
                <span className="text-[10px] text-slate-600 block">حجم با احتساب پرت ({toPersianDigits(concWastage)}٪):</span>
                <span className="text-lg font-bold text-slate-900 font-mono mt-0.5 block">
                  {toPersianDigits(grossConcVolume.toFixed(2))} م³
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-right">
                <span className="text-[10px] text-slate-600 block">تعداد تراک‌میکسر ۷ متری:</span>
                <span className="text-lg font-bold text-slate-900 font-mono mt-0.5 block">
                  {toPersianDigits(mixerCount)} دستگاه
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 9: میلگرد و آرماتور */}
        {/* ============================================================== */}
        {activeTab === 'rebar' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <Grid className="w-4 h-4 text-slate-700" />
                <h2 className="text-xs font-bold text-slate-900">
                  محاسبه وزن میلگرد مصرفی (سرانگشتی بر اساس زیربنا یا دقیق شاخه‌ای)
                </h2>
              </div>
              <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-100 text-[10px]">
                <button
                  onClick={() => setRebarMode('rough')}
                  className={`px-2 py-1 rounded-md transition-colors ${
                    rebarMode === 'rough' ? 'bg-white shadow-2xs font-bold text-slate-900' : 'text-slate-500'
                  }`}
                >
                  سرانگشتی مترمربع
                </button>
                <button
                  onClick={() => setRebarMode('detailed')}
                  className={`px-2 py-1 rounded-md transition-colors ${
                    rebarMode === 'detailed' ? 'bg-white shadow-2xs font-bold text-slate-900' : 'text-slate-500'
                  }`}
                >
                  دقیق شاخه‌ای (اشتال)
                </button>
              </div>
            </div>

            {rebarMode === 'rough' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    متراژ کل زیربنای ناخالص (متر مربع):
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={totalArea}
                    onChange={(e) => setTotalArea(sanitizeNumericInput(e.target.value))}
                    placeholder="مثال: ۵۰۰"
                    className="w-full h-9 px-3 rounded-lg bg-slate-50 border border-slate-300 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-slate-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    نوع سیستم سازه‌ای:
                  </label>
                  <select
                    value={structureType}
                    onChange={(e) => setStructureType(e.target.value as any)}
                    className="w-full h-9 px-3 rounded-lg bg-slate-50 border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-slate-500"
                  >
                    <option value="concrete_moment">اسکلت بتنی قاب خمشی (۵۰ کیلوگرم بر متر مربع)</option>
                    <option value="concrete_wall">اسکلت بتنی با دیوار برشی (۶۰ کیلوگرم بر متر مربع)</option>
                    <option value="steel">اسکلت فولادی (آرماتور فونداسیون و سقف حدود ۳۰ کیلو)</option>
                  </select>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    نمره میلگرد:
                  </label>
                  <select
                    value={rebarDiameter}
                    onChange={(e) => setRebarDiameter(Number(e.target.value))}
                    className="w-full h-9 px-3 rounded-lg bg-slate-50 border border-slate-300 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-slate-500"
                  >
                    {Object.keys(unitWeightMap).map((d) => (
                      <option key={d} value={d}>
                        نمره {toPersianDigits(d)} ({unitWeightMap[Number(d)]} کیلو/متر)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    طول هر شاخه (متر):
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={rebarLengthPerBranch}
                    onChange={(e) => setRebarLengthPerBranch(sanitizeNumericInput(e.target.value))}
                    className="w-full h-9 px-3 rounded-lg bg-slate-50 border border-slate-300 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-slate-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    تعداد شاخه‌ها:
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={rebarBranchCount}
                    onChange={(e) => setRebarBranchCount(sanitizeNumericInput(e.target.value))}
                    className="w-full h-9 px-3 rounded-lg bg-slate-50 border border-slate-300 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-slate-500"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="p-3 rounded-xl bg-slate-100 border border-slate-300 text-right">
                <span className="text-[10px] text-slate-700 block">وزن کل آرماتور:</span>
                <span className="text-lg font-bold text-slate-950 font-mono mt-0.5 block">
                  {toPersianDigits(Math.round(estimatedTotalRebarWeightKg))} کیلوگرم
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-right">
                <span className="text-[10px] text-slate-600 block">معادل به تن:</span>
                <span className="text-lg font-bold text-slate-900 font-mono mt-0.5 block">
                  {toPersianDigits(estimatedRebarTons.toFixed(2))} تن
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 10: سفال و بلوک دیوارچینی */}
        {/* ============================================================== */}
        {activeTab === 'blocks' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <Hammer className="w-4 h-4 text-amber-700" />
                <h2 className="text-xs font-bold text-slate-900">
                  برآورد تعداد بلوک، سفال، سیمان و ماسه دیوارچینی
                </h2>
              </div>
              <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-medium border border-amber-100">
                سفت‌کاری
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  مساحت خالص دیوارچینی (متر مربع):
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={blockWallArea}
                  onChange={(e) => setBlockWallArea(sanitizeNumericInput(e.target.value))}
                  placeholder="مثال: ۵۰"
                  className="w-full h-9 px-3 rounded-lg bg-slate-50 border border-slate-300 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  نوع مصالح دیوارچینی:
                </label>
                <select
                  value={blockType}
                  onChange={(e) => setBlockType(e.target.value as any)}
                  className="w-full h-9 px-3 rounded-lg bg-slate-50 border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                >
                  <option value="clay15">سفال تیغه ۱۵ سانتی‌متری (۲۵ عدد/م²)</option>
                  <option value="clay10">سفال تیغه ۱۰ سانتی‌متری (۲۵ عدد/م²)</option>
                  <option value="leca">بلوک سبک لیکا (۱۴ عدد/م²)</option>
                  <option value="hebel">بلوک هوادار اتوکلاو هبلکس AAC (۶.۷ عدد/م²)</option>
                  <option value="cement">بلوک سیمانی توخالی ۲۰×۴۰ (۱۲.۵ عدد/م²)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-right">
                <span className="text-[10px] text-amber-800 block">تعداد بلوک با ۵٪ پرت:</span>
                <span className="text-lg font-bold text-amber-950 font-mono mt-0.5 block">
                  {toPersianDigits(grossBlocksCount)} قالب
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-right">
                <span className="text-[10px] text-slate-600 block">سیمان ملات (کیسه ۵۰ کیلویی):</span>
                <span className="text-lg font-bold text-slate-900 font-mono mt-0.5 block">
                  {toPersianDigits(cementBags)} کیسه
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-right">
                <span className="text-[10px] text-slate-600 block">ماسه شسته ملات:</span>
                <span className="text-lg font-bold text-slate-900 font-mono mt-0.5 block">
                  {toPersianDigits(sandTons)} تن
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 11: قالب‌بندی */}
        {/* ============================================================== */}
        {activeTab === 'formwork' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-slate-700" />
                <h2 className="text-xs font-bold text-slate-900">
                  محاسبه مساحت قالب‌بندی ستون، تیر یا دیوار برشی
                </h2>
              </div>
              <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-100 text-[10px]">
                <button
                  onClick={() => setFwType('column')}
                  className={`px-2 py-1 rounded-md font-bold transition-colors ${
                    fwType === 'column' ? 'bg-white shadow-2xs text-slate-900' : 'text-slate-500'
                  }`}
                >
                  ستون
                </button>
                <button
                  onClick={() => setFwType('beam')}
                  className={`px-2 py-1 rounded-md font-bold transition-colors ${
                    fwType === 'beam' ? 'bg-white shadow-2xs text-slate-900' : 'text-slate-500'
                  }`}
                >
                  تیر
                </button>
                <button
                  onClick={() => setFwType('shear_wall')}
                  className={`px-2 py-1 rounded-md font-bold transition-colors ${
                    fwType === 'shear_wall' ? 'bg-white shadow-2xs text-slate-900' : 'text-slate-500'
                  }`}
                >
                  دیوار برشی
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  {fwType === 'column' ? 'بعد اول مقطع (متر)' : fwType === 'beam' ? 'عرض تیر (متر)' : 'ضخامت دیوار (متر)'}:
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={fwDimension1}
                  onChange={(e) => setFwDimension1(sanitizeNumericInput(e.target.value))}
                  className="w-full h-9 px-3 rounded-lg bg-slate-50 border border-slate-300 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-slate-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  {fwType === 'column' ? 'بعد دوم مقطع (متر)' : fwType === 'beam' ? 'طول تیر (متر)' : 'طول دیوار برشی (متر)'}:
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={fwDimension2}
                  onChange={(e) => setFwDimension2(sanitizeNumericInput(e.target.value))}
                  className="w-full h-9 px-3 rounded-lg bg-slate-50 border border-slate-300 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-slate-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  {fwType === 'beam' ? 'ارتفاع مقطع تیر (متر)' : 'ارتفاع المان (متر)'}:
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={fwHeight}
                  onChange={(e) => setFwHeight(sanitizeNumericInput(e.target.value))}
                  className="w-full h-9 px-3 rounded-lg bg-slate-50 border border-slate-300 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-slate-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">تعداد المان‌ها:</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={fwQuantity}
                  onChange={(e) => setFwQuantity(sanitizeNumericInput(e.target.value))}
                  className="w-full h-9 px-3 rounded-lg bg-slate-50 border border-slate-300 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-slate-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="p-3 rounded-xl bg-slate-100 border border-slate-300 text-right">
                <span className="text-[10px] text-slate-700 block">مساحت کل قالب‌بندی:</span>
                <span className="text-lg font-bold text-slate-950 font-mono mt-0.5 block">
                  {toPersianDigits(totalFormworkArea.toFixed(2))} م²
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-right">
                <span className="text-[10px] text-slate-600 block">روغن قالب امولسیونی:</span>
                <span className="text-lg font-bold text-slate-900 font-mono mt-0.5 block">
                  {toPersianDigits(moldReleaseOilLiters)} لیتر
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 12: برآورد هزینه ریالی اسکلت سازه */}
        {/* ============================================================== */}
        {activeTab === 'cost' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <h2 className="text-xs font-bold text-slate-900">
                  برآورد سرانگشتی هزینه اسکلت بتنی (مصالح و دستمزد در ارومیه)
                </h2>
              </div>
              <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-medium border border-emerald-100">
                برآورد مالی
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  متراژ زیربنای کل ساختمان (متر مربع):
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={costArea}
                  onChange={(e) => setCostArea(sanitizeNumericInput(e.target.value))}
                  placeholder="مثال: ۶۰۰"
                  className="w-full h-9 px-3 rounded-lg bg-slate-50 border border-slate-300 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  قیمت هر تن میلگرد (تومان):
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={rebarPricePerTon}
                  onChange={(e) => setRebarPricePerTon(sanitizeNumericInput(e.target.value))}
                  className="w-full h-9 px-3 rounded-lg bg-slate-50 border border-slate-300 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  قیمت هر متر مکعب بتن آماده (تومان):
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={concretePricePerM3}
                  onChange={(e) => setConcretePricePerM3(sanitizeNumericInput(e.target.value))}
                  className="w-full h-9 px-3 rounded-lg bg-slate-50 border border-slate-300 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  دستمزد اکیپ اسکلت به ازای هر متر مربع (تومان):
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={wagePerM2}
                  onChange={(e) => setWagePerM2(sanitizeNumericInput(e.target.value))}
                  className="w-full h-9 px-3 rounded-lg bg-slate-50 border border-slate-300 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-right">
                <span className="text-[10px] text-slate-600 block">هزینه کل آهن‌آلات و میلگرد:</span>
                <span className="text-sm font-bold text-slate-900 font-mono mt-0.5 block">
                  {formatPersianNumber(Math.round(totalEstimatedRebarCost))} تومان
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-right">
                <span className="text-[10px] text-slate-600 block">هزینه کل بتن آماده:</span>
                <span className="text-sm font-bold text-slate-900 font-mono mt-0.5 block">
                  {formatPersianNumber(Math.round(totalEstimatedConcreteCost))} تومان
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-right">
                <span className="text-[10px] text-slate-600 block">دستمزد اجرای اسکلت:</span>
                <span className="text-sm font-bold text-slate-900 font-mono mt-0.5 block">
                  {formatPersianNumber(Math.round(totalEstimatedWage))} تومان
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-right flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-emerald-900 block">
                  جمع کل برآورد اسکلت سازه:
                </span>
                <span className="text-[11px] text-emerald-700">
                  شامل میلگرد، بتن و دستمزد آرماتوربندی و قالب‌بندی
                </span>
              </div>
              <span className="text-lg font-bold text-emerald-950 font-mono">
                {formatPersianNumber(Math.round(totalEstimatedStructureCost))} تومان
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
