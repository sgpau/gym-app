import Dexie, { type EntityTable } from 'dexie'
import type { TrackingType } from '../core/stats'

export const MUSCLE_GROUPS = ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'legs', 'glutes', 'core', 'cardio', 'other'] as const
export type MuscleGroup = (typeof MUSCLE_GROUPS)[number]

export interface Exercise {
  id: string
  name: string
  muscleGroup: MuscleGroup
  trackingType: TrackingType
  notes: string
  createdAt: number
}

/** Ejercicio dentro de una rutina, con su objetivo de series × reps (o × segundos). */
export interface RoutineItem {
  exerciseId: string
  sets: number
  reps: number
  duration: number
}

export interface Routine {
  id: string
  name: string
  createdAt: number
  items: RoutineItem[]
}

/** Serie: reps o duración (segundos) y peso opcional en kg. Vacía mientras no se rellena. */
export interface WorkoutSet {
  reps: number | null
  duration: number | null
  weight: number | null
}

export interface WorkoutEntry {
  exerciseId: string
  sets: WorkoutSet[]
}

export interface Workout {
  id: string
  /** Milisegundos desde 1970. */
  date: number
  routineId: string | null
  notes: string
  /** Un entreno sin finalizar sigue «en curso». */
  finished: boolean
  entries: WorkoutEntry[]
}

export class GymDatabase extends Dexie {
  exercises!: EntityTable<Exercise, 'id'>
  routines!: EntityTable<Routine, 'id'>
  workouts!: EntityTable<Workout, 'id'>

  constructor(name = 'gym') {
    super(name)
    this.version(1).stores({
      exercises: 'id, name',
      routines: 'id, createdAt',
      workouts: 'id, date, routineId',
    })
  }
}

export const newId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
