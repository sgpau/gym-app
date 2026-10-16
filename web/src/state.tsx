import { useLiveQuery } from 'dexie-react-hooks'
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { GymDatabase, type Exercise, type Routine, type Workout } from './db/model'
import { seedIfEmpty } from './db/seed'
import { deviceLang, makeI18n, type I18n, type Lang } from './i18n'

export const db = new GymDatabase()

// ---------- Ajustes (localStorage: comodidades por dispositivo) ----------

export type Appearance = 'system' | 'light' | 'dark'
export type LangSetting = 'device' | Lang
export const ACCENTS = {
  blue: ['#007AFF', '#0A84FF'],
  indigo: ['#5856D6', '#5E5CE6'],
  purple: ['#AF52DE', '#BF5AF2'],
  pink: ['#FF2D55', '#FF375F'],
  red: ['#FF3B30', '#FF453A'],
  orange: ['#FF9500', '#FF9F0A'],
  green: ['#34C759', '#30D158'],
  mint: ['#00C7BE', '#63E6E2'],
  teal: ['#30B0C7', '#40C8E0'],
} as const
export type Accent = keyof typeof ACCENTS

interface Settings {
  appearance: Appearance
  accent: Accent
  lang: LangSetting
  developerMode: boolean
}

const DEFAULTS: Settings = { appearance: 'system', accent: 'blue', lang: 'device', developerMode: false }

function loadSettings(): Settings {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem('settings') ?? '{}') }
  } catch {
    return DEFAULTS
  }
}

interface AppContextValue extends I18n {
  settings: Settings
  update: (patch: Partial<Settings>) => void
  isDark: boolean
}

const AppContext = createContext<AppContextValue | null>(null)

function usePrefersDark() {
  const query = '(prefers-color-scheme: dark)'
  const [dark, setDark] = useState(() => typeof matchMedia !== 'undefined' && matchMedia(query).matches)
  useEffect(() => {
    const media = matchMedia(query)
    const listener = () => setDark(media.matches)
    media.addEventListener('change', listener)
    return () => media.removeEventListener('change', listener)
  }, [])
  return dark
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState(loadSettings)
  const prefersDark = usePrefersDark()
  const lang = settings.lang === 'device' ? deviceLang() : settings.lang
  const i18n = useMemo(() => makeI18n(lang), [lang])
  const isDark = settings.appearance === 'dark' || (settings.appearance === 'system' && prefersDark)

  const update = (patch: Partial<Settings>) =>
    setSettings((current) => {
      const next = { ...current, ...patch }
      try {
        localStorage.setItem('settings', JSON.stringify(next))
      } catch {
        // Modo privado o almacenamiento bloqueado: los ajustes duran lo que la sesión.
      }
      return next
    })

  // Tema, color principal, idioma del documento y color de la barra de estado.
  useEffect(() => {
    const root = document.documentElement
    if (settings.appearance === 'system') root.removeAttribute('data-theme')
    else root.dataset.theme = settings.appearance
    root.style.setProperty('--accent', ACCENTS[settings.accent][isDark ? 1 : 0])
    root.lang = lang
    for (const meta of document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')) {
      meta.content = isDark ? '#000000' : '#f2f2f7'
    }
  }, [settings.appearance, settings.accent, isDark, lang])

  // Ejercicios iniciales la primera vez, y pedir que Safari no borre los datos.
  useEffect(() => {
    void seedIfEmpty(db, lang)
    void navigator.storage?.persist?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <AppContext.Provider value={{ ...i18n, settings, update, isDark }}>{children}</AppContext.Provider>
}

export function useApp() {
  const value = useContext(AppContext)
  if (!value) throw new Error('useApp fuera de AppProvider')
  return value
}

// ---------- Datos (IndexedDB, se actualizan solos al cambiar) ----------

export interface Data {
  exercises: Exercise[]
  routines: Routine[]
  workouts: Workout[]
  exerciseMap: Map<string, Exercise>
  loaded: boolean
}

const DataContext = createContext<Data | null>(null)

/** Una sola suscripción a cada tabla para toda la app. */
export function DataProvider({ children }: { children: ReactNode }) {
  const { locale } = useApp()
  const exercises = useLiveQuery(() => db.exercises.toArray(), [])
  const routines = useLiveQuery(() => db.routines.orderBy('createdAt').toArray(), [])
  const workouts = useLiveQuery(() => db.workouts.orderBy('date').toArray(), [])
  const value = useMemo(() => {
    const sortedExercises = [...(exercises ?? [])].sort((a, b) => a.name.localeCompare(b.name, locale))
    return {
      exercises: sortedExercises,
      routines: routines ?? [],
      workouts: workouts ?? [],
      exerciseMap: new Map(sortedExercises.map((e) => [e.id, e])),
      loaded: exercises !== undefined && routines !== undefined && workouts !== undefined,
    }
  }, [exercises, routines, workouts, locale])
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData(): Data {
  const value = useContext(DataContext)
  if (!value) throw new Error('useData fuera de DataProvider')
  return value
}
