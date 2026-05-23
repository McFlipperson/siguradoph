// ─────────────────────────────────────────────────────────────────────────────
// Philippine Public Holidays 2025–2026
// Regular Holidays: employee paid even if absent (100%); 200% if worked
// Special Non-Working: no pay if absent; 130% if worked
// Sources: Official Gazette proclamations; Eid dates are approximate
// (moon-sighting dependent — verify via IATF/PAGASA each year)
// ─────────────────────────────────────────────────────────────────────────────

export type HolidayType = 'REGULAR' | 'SPECIAL_NON_WORKING'

export type Holiday = {
  date: string    // YYYY-MM-DD
  name: string
  type: HolidayType
}

const HOLIDAYS_BY_YEAR: Record<number, Holiday[]> = {
  2025: [
    // Regular Holidays
    { date: '2025-01-01', name: "New Year's Day",             type: 'REGULAR' },
    { date: '2025-03-31', name: "Eid'l Fitr (approx.)",       type: 'REGULAR' },
    { date: '2025-04-09', name: 'Day of Valor',               type: 'REGULAR' },
    { date: '2025-04-17', name: 'Maundy Thursday',            type: 'REGULAR' },
    { date: '2025-04-18', name: 'Good Friday',                type: 'REGULAR' },
    { date: '2025-05-01', name: 'Labor Day',                  type: 'REGULAR' },
    { date: '2025-06-07', name: "Eid'l Adha (approx.)",       type: 'REGULAR' },
    { date: '2025-06-12', name: 'Independence Day',           type: 'REGULAR' },
    { date: '2025-08-25', name: 'National Heroes Day',        type: 'REGULAR' },
    { date: '2025-11-30', name: 'Bonifacio Day',              type: 'REGULAR' },
    { date: '2025-12-25', name: 'Christmas Day',              type: 'REGULAR' },
    { date: '2025-12-30', name: 'Rizal Day',                  type: 'REGULAR' },
    // Special Non-Working Holidays
    { date: '2025-02-25', name: 'EDSA Revolution Anniversary',           type: 'SPECIAL_NON_WORKING' },
    { date: '2025-04-19', name: 'Black Saturday',                        type: 'SPECIAL_NON_WORKING' },
    { date: '2025-08-21', name: 'Ninoy Aquino Day',                      type: 'SPECIAL_NON_WORKING' },
    { date: '2025-11-01', name: "All Saints' Day",                       type: 'SPECIAL_NON_WORKING' },
    { date: '2025-11-02', name: "All Souls' Day",                        type: 'SPECIAL_NON_WORKING' },
    { date: '2025-12-08', name: 'Feast of the Immaculate Conception',    type: 'SPECIAL_NON_WORKING' },
    { date: '2025-12-24', name: 'Christmas Eve',                         type: 'SPECIAL_NON_WORKING' },
    { date: '2025-12-31', name: 'Last Day of the Year',                  type: 'SPECIAL_NON_WORKING' },
  ],
  2026: [
    // Regular Holidays
    { date: '2026-01-01', name: "New Year's Day",             type: 'REGULAR' },
    { date: '2026-03-20', name: "Eid'l Fitr (approx.)",       type: 'REGULAR' },
    { date: '2026-04-02', name: 'Maundy Thursday',            type: 'REGULAR' },
    { date: '2026-04-03', name: 'Good Friday',                type: 'REGULAR' },
    { date: '2026-04-09', name: 'Day of Valor',               type: 'REGULAR' },
    { date: '2026-05-01', name: 'Labor Day',                  type: 'REGULAR' },
    { date: '2026-05-27', name: "Eid'l Adha (approx.)",       type: 'REGULAR' },
    { date: '2026-06-12', name: 'Independence Day',           type: 'REGULAR' },
    { date: '2026-08-31', name: 'National Heroes Day',        type: 'REGULAR' },
    { date: '2026-11-30', name: 'Bonifacio Day',              type: 'REGULAR' },
    { date: '2026-12-25', name: 'Christmas Day',              type: 'REGULAR' },
    { date: '2026-12-30', name: 'Rizal Day',                  type: 'REGULAR' },
    // Special Non-Working Holidays
    { date: '2026-02-25', name: 'EDSA Revolution Anniversary',           type: 'SPECIAL_NON_WORKING' },
    { date: '2026-04-04', name: 'Black Saturday',                        type: 'SPECIAL_NON_WORKING' },
    { date: '2026-08-21', name: 'Ninoy Aquino Day',                      type: 'SPECIAL_NON_WORKING' },
    { date: '2026-11-01', name: "All Saints' Day",                       type: 'SPECIAL_NON_WORKING' },
    { date: '2026-11-02', name: "All Souls' Day",                        type: 'SPECIAL_NON_WORKING' },
    { date: '2026-12-08', name: 'Feast of the Immaculate Conception',    type: 'SPECIAL_NON_WORKING' },
    { date: '2026-12-24', name: 'Christmas Eve',                         type: 'SPECIAL_NON_WORKING' },
    { date: '2026-12-31', name: 'Last Day of the Year',                  type: 'SPECIAL_NON_WORKING' },
  ],
}

/** Return all holidays that fall on the given dates */
export function getHolidaysForDates(dates: string[]): Holiday[] {
  const result: Holiday[] = []
  for (const date of dates) {
    const year = parseInt(date.slice(0, 4), 10)
    const yearHolidays = HOLIDAYS_BY_YEAR[year] ?? []
    const match = yearHolidays.find(h => h.date === date)
    if (match) result.push(match)
  }
  return result
}

/** Return all holidays for a given year */
export function getHolidaysForYear(year: number): Holiday[] {
  return HOLIDAYS_BY_YEAR[year] ?? []
}
