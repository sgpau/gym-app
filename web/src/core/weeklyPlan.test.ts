import { describe, expect, it } from 'vitest'
import { day } from '../test/helpers'
import { planProgress, weekStart, type PlanWorkout } from './weeklyPlan'

let counter = 0
const w = (routineId: string | null, date: Date, finished = true): PlanWorkout => ({ id: `w${counter++}`, date: date.getTime(), routineId, finished })

// 2026-10-26 es lunes.
describe('plan semanal', () => {
  it('la semana empieza el lunes', () => {
    expect(weekStart(day(2026, 10, 26))).toEqual(new Date(2026, 9, 26))
    expect(weekStart(day(2026, 11, 1))).toEqual(new Date(2026, 9, 26)) // domingo
    expect(weekStart(day(2026, 11, 2))).toEqual(new Date(2026, 10, 2))
  })

  it('sin entrenos toca el primero', () => {
    const p = planProgress(['A', 'B', 'C'], [], day(2026, 10, 28))
    expect(p.next).toBe(0)
    expect(p.doneToday).toBeNull()
  })

  it('avanza al siguiente y marca el de hoy', () => {
    const a = w('A', day(2026, 10, 26))
    const b = w('B', day(2026, 10, 28))
    const p = planProgress(['A', 'B', 'C'], [a, b], day(2026, 10, 28))
    expect(p.slots.map((s) => s.workoutId)).toEqual([a.id, b.id, null])
    expect(p.next).toBe(2)
    expect(p.doneToday).toBe(b.id)
    expect(planProgress(['A', 'B', 'C'], [a, b], day(2026, 10, 29)).doneToday).toBeNull()
  })

  it('permite repetir rutinas y hacerlas en otro orden', () => {
    const a1 = w('A', day(2026, 10, 26))
    const c = w('C', day(2026, 10, 27))
    const a2 = w('A', day(2026, 10, 28))
    const p = planProgress(['A', 'B', 'A', 'C'], [a1, c, a2], day(2026, 10, 29))
    expect(p.slots.map((s) => s.workoutId)).toEqual([a1.id, null, a2.id, c.id])
    expect(p.next).toBe(1)
  })

  it('ignora la semana anterior, los libres y las rutinas fuera del plan', () => {
    const workouts = [w('A', day(2026, 10, 25)), w(null, day(2026, 10, 27)), w('X', day(2026, 10, 27))]
    const p = planProgress(['A', 'B'], workouts, day(2026, 10, 27))
    expect(p.next).toBe(0)
    expect(p.doneToday).toBeNull()
  })

  it('semana completa y reinicio el lunes', () => {
    const workouts = [w('A', day(2026, 10, 26)), w('B', day(2026, 10, 27))]
    expect(planProgress(['A', 'B'], workouts, day(2026, 10, 30)).next).toBeNull()
    expect(planProgress(['A', 'B'], workouts, day(2026, 11, 2)).next).toBe(0)
  })

  it('un entreno sin finalizar no cuenta pero se puede continuar', () => {
    const open = w('A', day(2026, 10, 28), false)
    const p = planProgress(['A', 'B'], [open], day(2026, 10, 28))
    expect(p.next).toBe(0)
    expect(p.inProgress).toBe(open.id)
  })
})
