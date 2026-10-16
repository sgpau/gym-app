// Formato JSON de importación/exportación (port de GymApp/Core/GymBackup.swift).
// Mismo formato que la app Swift, así que los archivos sirven en las dos.
import type { TrackingType } from './stats'

export interface GymBackup {
  version: number
  exercises: BackupExercise[]
  routines: BackupRoutine[]
  workouts: BackupWorkout[]
}

export interface BackupExercise {
  name: string
  muscleGroup?: string
  trackingType?: TrackingType
}

export interface BackupRoutine {
  name: string
  items: { exercise: string; sets?: number; reps?: number; duration?: number }[]
}

export interface BackupWorkout {
  date: Date
  routine?: string
  notes?: string
  exercises: { exercise: string; sets: BackupSet[] }[]
}

export interface BackupSet {
  reps?: number
  duration?: number
  weight?: number
}

export class BackupError extends Error {}

/** Lee y valida un JSON. Todas las secciones son opcionales; las fechas deben ser ISO 8601. */
export function parseBackup(text: string): GymBackup {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    throw new BackupError('JSON no válido')
  }
  if (!raw || typeof raw !== 'object') throw new BackupError('Formato no válido')
  const data = raw as Record<string, unknown>
  const list = (key: string) => {
    const value = data[key]
    if (value === undefined) return []
    if (!Array.isArray(value)) throw new BackupError(`"${key}" debe ser una lista`)
    return value as Record<string, unknown>[]
  }
  const workouts = list('workouts').map((w, index) => {
    const date = typeof w.date === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(w.date) ? new Date(w.date) : null
    if (!date || Number.isNaN(date.getTime())) throw new BackupError(`Fecha no válida en el entreno ${index + 1}`)
    return {
      date,
      routine: typeof w.routine === 'string' ? w.routine : undefined,
      notes: typeof w.notes === 'string' ? w.notes : undefined,
      exercises: ((w.exercises as BackupWorkout['exercises']) ?? []).map((e) => ({ exercise: String(e.exercise), sets: e.sets ?? [] })),
    }
  })
  return {
    version: typeof data.version === 'number' ? data.version : 1,
    exercises: list('exercises') as unknown as BackupExercise[],
    routines: (list('routines') as unknown as BackupRoutine[]).map((r) => ({ name: String(r.name), items: r.items ?? [] })),
    workouts,
  }
}

/** Fechas sin milisegundos ("2026-03-14T18:30:00Z"), que es lo que entiende también la app Swift. */
export function serializeBackup(backup: GymBackup): string {
  const workouts = backup.workouts.map((w) => ({ ...w, date: w.date.toISOString().replace(/\.\d{3}Z$/, 'Z') }))
  return JSON.stringify({ ...backup, workouts }, null, 2)
}

export const backupSetCount = (b: GymBackup) => b.workouts.reduce((a, w) => a + w.exercises.reduce((x, e) => x + e.sets.length, 0), 0)

/** Desplaza las fechas un número entero de días para que el último entreno caiga en `day`. */
export function shiftDates(backup: GymBackup, day: Date): GymBackup {
  if (!backup.workouts.length) return backup
  const last = new Date(Math.max(...backup.workouts.map((w) => w.date.getTime())))
  const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const offset = Math.round((startOf(day).getTime() - startOf(last).getTime()) / 86_400_000)
  if (!offset) return backup
  return {
    ...backup,
    workouts: backup.workouts.map((w) => {
      const d = new Date(w.date)
      d.setDate(d.getDate() + offset)
      return { ...w, date: d }
    }),
  }
}
