const capitalize = (s: string) => s.charAt(0).toLocaleUpperCase() + s.slice(1)

/** "Sábado, 4 de octubre" */
export const dayTitle = (d: Date, locale: string) =>
  capitalize(new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long' }).format(d))

/** "4 oct" */
export const shortDay = (d: Date, locale: string) =>
  new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' }).format(d).replace('.', '')

/** "4 de octubre" */
export const longDay = (d: Date, locale: string) => new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long' }).format(d)

/** "4 oct 2026" */
export const shortDate = (d: Date, locale: string) =>
  new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' }).format(d).replace('.', '')

/** "Octubre de 2026" */
export const monthTitle = (d: Date, locale: string) =>
  capitalize(new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(d))

/** Valor para <input type="datetime-local"> */
export const toLocalInput = (ms: number) => {
  const d = new Date(ms)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** "4 de octubre", o "4 de octubre de 2025" si no es de este año. */
export const longDayMaybeYear = (d: Date, locale: string) =>
  new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', ...(d.getFullYear() !== new Date().getFullYear() ? { year: 'numeric' } : {}) }).format(d)
