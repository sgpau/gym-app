// Días de un mes en una cuadrícula de 7 columnas (port de GymApp/Core/MonthGrid.swift).
// Se trabaja con fechas locales a medianoche.

export interface MonthGrid {
  /** Primer día del mes. */
  monthStart: Date
  /** null = hueco antes del día 1. */
  days: (Date | null)[]
}

export const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())

export const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

export const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`

export const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n, d.getHours(), d.getMinutes(), d.getSeconds())

/** @param firstWeekday 0 = domingo, 1 = lunes (España). */
export function monthGrid(date: Date, firstWeekday = 1): MonthGrid {
  const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
  const dayCount = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  const leading = (monthStart.getDay() - firstWeekday + 7) % 7
  const days: (Date | null)[] = Array(leading).fill(null)
  for (let i = 0; i < dayCount; i++) days.push(new Date(date.getFullYear(), date.getMonth(), i + 1))
  return { monthStart, days }
}

export const addMonths = (grid: MonthGrid, months: number, firstWeekday = 1) =>
  monthGrid(new Date(grid.monthStart.getFullYear(), grid.monthStart.getMonth() + months, 1), firstWeekday)

/** Iniciales de los días empezando por `firstWeekday` (L M X J V S D en castellano). */
export function weekdaySymbols(locale: string, firstWeekday = 1): string[] {
  const formatter = new Intl.DateTimeFormat(locale, { weekday: 'narrow' })
  // 2024-01-07 fue domingo.
  const symbols = Array.from({ length: 7 }, (_, i) => formatter.format(new Date(2024, 0, 7 + i)))
  if (locale.startsWith('es')) symbols[3] = 'X' // miércoles: X, como en los calendarios españoles
  return [...symbols.slice(firstWeekday), ...symbols.slice(0, firstWeekday)]
}
