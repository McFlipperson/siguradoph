/**
 * Shared loyalty card configuration used by both server actions and client components.
 * Maps service keys (stored in LoyaltyCardTemplate.serviceName) to LoyaltyCard field names.
 */

export type CardTemplateService = {
  id: string
  serviceKey: string      // CLEANING, FILLING, RCT, etc.
  label: string
  isFree: boolean         // true = unlimited (CHECKUP)
  tier1Uses: number
  tier1Discount: number   // 0–100
  hasTier2: boolean
  tier2Uses: number       // 0 if no tier2
  tier2Discount: number   // 0 if no tier2
}

/** Maps serviceKey → field names on LoyaltyCard and benefit keys used at checkout */
export const SERVICE_CARD_FIELDS: Record<string, {
  t1Field: string
  t2Field?: string
  t1Key: string
  t2Key?: string
}> = {
  CLEANING:     { t1Field: 'cleaningUses50', t2Field: 'cleaningUses25', t1Key: 'CLEANING_50', t2Key: 'CLEANING_25' },
  FILLING:      { t1Field: 'fillingUses50',  t2Field: 'fillingUses25',  t1Key: 'FILLING_50',  t2Key: 'FILLING_25'  },
  RCT:          { t1Field: 'rctUses',         t1Key: 'RCT'          },
  DENTURES:     { t1Field: 'dentureUses',     t1Key: 'DENTURES'     },
  BRACES:       { t1Field: 'bracesUses',      t1Key: 'BRACES'       },
  EXTRACTION:   { t1Field: 'extractionUses',  t1Key: 'EXTRACTION'   },
  WISDOM_TOOTH: { t1Field: 'wisdomToothUses', t1Key: 'WISDOM_TOOTH' },
}

export const SERVICE_LABELS: Record<string, string> = {
  CLEANING:     'Cleaning',
  FILLING:      'Filling',
  RCT:          'RCT',
  DENTURES:     'Dentures',
  BRACES:       'Braces',
  EXTRACTION:   'Extraction',
  WISDOM_TOOTH: 'Wisdom Tooth',
  CHECKUP:      'Check-up',
}

/** Default template used when a clinic has no rows yet */
export const DEFAULT_TEMPLATE_ROWS: Array<{
  serviceName: string
  isFree: boolean
  tier1Uses: number
  tier1Discount: number
  tier2Uses: number | null
  tier2Discount: number | null
  sortOrder: number
}> = [
  { serviceName: 'CLEANING',     isFree: false, tier1Uses: 2, tier1Discount: 50, tier2Uses: 2, tier2Discount: 25, sortOrder: 0 },
  { serviceName: 'FILLING',      isFree: false, tier1Uses: 2, tier1Discount: 50, tier2Uses: 2, tier2Discount: 25, sortOrder: 1 },
  { serviceName: 'RCT',          isFree: false, tier1Uses: 2, tier1Discount: 10, tier2Uses: null, tier2Discount: null, sortOrder: 2 },
  { serviceName: 'DENTURES',     isFree: false, tier1Uses: 2, tier1Discount: 15, tier2Uses: null, tier2Discount: null, sortOrder: 3 },
  { serviceName: 'BRACES',       isFree: false, tier1Uses: 2, tier1Discount: 10, tier2Uses: null, tier2Discount: null, sortOrder: 4 },
  { serviceName: 'EXTRACTION',   isFree: false, tier1Uses: 8, tier1Discount: 20, tier2Uses: null, tier2Discount: null, sortOrder: 5 },
  { serviceName: 'WISDOM_TOOTH', isFree: false, tier1Uses: 2, tier1Discount: 10, tier2Uses: null, tier2Discount: null, sortOrder: 6 },
  { serviceName: 'CHECKUP',      isFree: true,  tier1Uses: 0, tier1Discount: 0,  tier2Uses: null, tier2Discount: null, sortOrder: 7 },
]
