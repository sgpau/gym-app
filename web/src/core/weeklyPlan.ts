// Plan semanal: rutinas en orden, sin día fijo. Cada lunes vuelve a empezar.
import { addDays, sameDay, startOfDay } from './monthGrid'

/** Lo mínimo de un entreno que necesita el plan. */
export interface PlanWorkout {
  id: string
  date: number
  routineId: string | null
  finished: boolean
}

export interface PlanSlot {
  routineId: string
  /** Entreno finalizado esta semana que cuenta para este hueco. */
  workoutId: string | null
}

export interface PlanProgress {
  slots: PlanSlot[]
  /** Primer hueco sin hacer, o null si la semana está completa. */
  next: number | null
  /** Entreno del plan finalizado hoy: hoy ya no toca otro. */
  doneToday: string | null
  /** Entreno del plan empezado hoy y sin finalizar. */
  inProgress: string | null
}

/** Lunes a las 00:00 de la semana de `date`. */
export const weekStart = (date: Date) => {
  const day = startOfDay(date)
  return addDays(day, -((day.getDay() + 6) % 7))
}

export function planProgress(routineIds: string[], workouts: PlanWorkout[], now = new Date()): PlanProgress {
  const from = weekStart(now).getTime()
  const to = addDays(weekStart(now), 7).getTime()
  const inPlan = new Set(routineIds)
  const week = workouts
    .filter((w) => w.routineId !== null && inPlan.has(w.routineId) && w.date >= from && w.date < to)
    .sort((a, b) => a.date - b.date)

  // Cada hueco se queda con el entreno finalizado más antiguo de su rutina que aún no se ha usado,
  // así una rutina puede repetirse en el plan y los entrenos pueden hacerse en otro orden.
  const used = new Set<string>()
  const slots = routineIds.map((routineId) => {
    const match = week.find((w) => w.finished && w.routineId === routineId && !used.has(w.id))
    if (match) used.add(match.id)
    return { routineId, workoutId: match?.id ?? null }
  })
  const next = slots.findIndex((s) => s.workoutId === null)
  const today = week.filter((w) => sameDay(new Date(w.date), now))
  return {
    slots,
    next: next === -1 ? null : next,
    doneToday: today.filter((w) => w.finished && used.has(w.id)).at(-1)?.id ?? null,
    inProgress: today.find((w) => !w.finished)?.id ?? null,
  }
}
