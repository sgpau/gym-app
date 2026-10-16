import { ca } from './ca'
import { es, type Dict } from './es'

export type Lang = 'es' | 'ca'
export type Key = keyof typeof es

export const LANGS: Lang[] = ['es', 'ca']
const dicts: Record<Lang, Dict> = { es, ca }
const locales: Record<Lang, string> = { es: 'es-ES', ca: 'ca-ES' }

export interface I18n {
  lang: Lang
  /** Locale BCP 47 para Intl (números, fechas). */
  locale: string
  /**
   * Texto traducido. Las variables se escriben `{nombre}`.
   * Si la entrada tiene formas singular/plural, se elige con `vars.n`.
   */
  t: (key: Key, vars?: Record<string, string | number>) => string
}

export function makeI18n(lang: Lang): I18n {
  const locale = locales[lang]
  const plural = new Intl.PluralRules(locale)
  const dict = dicts[lang]
  const t = (key: Key, vars: Record<string, string | number> = {}) => {
    const entry = dict[key] ?? es[key]
    const template = typeof entry === 'string' ? entry : entry[plural.select(Number(vars.n ?? 0)) === 'one' ? 'one' : 'other']
    return template.replace(/\{(\w+)\}/g, (_, name: string) => String(vars[name] ?? `{${name}}`))
  }
  return { lang, locale, t }
}

/** Idioma del dispositivo: catalán si el primero preferido es catalán; si no, castellano. */
export function deviceLang(languages: readonly string[] = typeof navigator === 'undefined' ? [] : navigator.languages): Lang {
  for (const language of languages) {
    if (language.toLowerCase().startsWith('ca')) return 'ca'
    if (language.toLowerCase().startsWith('es')) return 'es'
  }
  return 'es'
}
