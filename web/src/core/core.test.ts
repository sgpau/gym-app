import { describe, expect, it } from 'vitest'
import { close, day, es, ca, log } from '../test/helpers'
import { compareExercise, compareWorkout, deltaPercent, newRecords, trendOf } from './comparison'
import { formatChange, formatDuration, formatMetricValue, formatPercent, formatSet, formatSetSummary, formatWeight } from './format'
import { addMonths, monthGrid, weekdaySymbols } from './monthGrid'
import {
  availableMetrics, bestSet, oneRepMaxOf, personalBests, progress, repsSet, summarize, timeSet, volumeOf,
} from './stats'

describe('series', () => {
  it('volumen = reps × peso', () => expect(volumeOf(repsSet(8, 60))).toBe(480))
  it('1RM de Epley', () => {
    expect(close(oneRepMaxOf(repsSet(8, 60)), 76)).toBe(true)
    expect(oneRepMaxOf(repsSet(1, 100))).toBe(100)
  })
  it('sin peso o por tiempo no hay 1RM ni volumen', () => {
    expect(oneRepMaxOf(repsSet(10, 0))).toBeNull()
    expect(oneRepMaxOf(timeSet(60, 10))).toBeNull()
    expect(volumeOf(timeSet(60, 10))).toBe(0)
  })
})

describe('estadísticas', () => {
  it('resume series por reps', () => {
    const s = summarize([repsSet(8, 60), repsSet(8, 60), repsSet(6, 65)])
    expect(s).toMatchObject({ setCount: 3, totalReps: 22, maxReps: 8, maxWeight: 65, volume: 1350 })
    expect(s.bestSet).toEqual(repsSet(6, 65))
    expect(close(s.bestOneRepMax, 78)).toBe(true)
  })
  it('resume series por tiempo', () => {
    const s = summarize([timeSet(60), timeSet(45), timeSet(60, 5)])
    expect(s).toMatchObject({ maxDuration: 60, totalDuration: 165, volume: 0 })
    expect(s.bestSet).toEqual(timeSet(60, 5))
  })
  it('mejor serie: a igual peso, más reps', () => {
    expect(bestSet([repsSet(5, 80), repsSet(7, 80)])).toEqual(repsSet(7, 80))
    expect(bestSet([])).toBeNull()
  })
  it('progreso cronológico y filtrado por fecha', () => {
    const logs = [
      log('press', day(2026, 9, 20), [repsSet(8, 62.5)]),
      log('press', day(2026, 6, 1), [repsSet(8, 55)]),
      log('press', day(2026, 9, 1), [repsSet(8, 60)]),
      log('press', day(2026, 9, 5), []),
    ]
    expect(progress(logs, 'maxWeight').map((p) => p.value)).toEqual([55, 60, 62.5])
    expect(progress(logs, 'maxWeight', day(2026, 8, 1)).map((p) => p.value)).toEqual([60, 62.5])
  })
  it('récords personales', () => {
    const b = personalBests([
      log('press', day(2026, 9, 1), [repsSet(10, 50)]),
      log('press', day(2026, 9, 8), [repsSet(5, 70)]),
      log('press', day(2026, 9, 9), []),
    ])
    expect(b).toMatchObject({ sessionCount: 2, maxWeight: 70, maxReps: 10, volume: 500 })
    expect(close(b.oneRepMax, 81.6667)).toBe(true)
  })
  it('métricas según tipo y peso', () => {
    expect(availableMetrics('reps', true)).toEqual(['maxWeight', 'oneRepMax', 'volume'])
    expect(availableMetrics('reps', false)).toEqual(['totalReps'])
    expect(availableMetrics('time', false)).toEqual(['maxDuration', 'totalDuration'])
  })
})

describe('comparación con el entreno anterior', () => {
  const lastWeek = day(2026, 10, 2)
  const today = day(2026, 10, 9)

  it('tendencia y porcentaje', () => {
    expect(trendOf({ current: 10, previous: 8 })).toBe('up')
    expect(trendOf({ current: 8, previous: 10 })).toBe('down')
    expect(trendOf({ current: 8, previous: 8 })).toBe('same')
    expect(trendOf({ current: 8, previous: null })).toBe('new')
    expect(close(deltaPercent({ current: 1060, previous: 1000 }), 0.06)).toBe(true)
    expect(deltaPercent({ current: 100, previous: 0 })).toBeNull()
  })

  it('compara totales y ejercicios', () => {
    const result = compareWorkout(
      [log('press', today, [repsSet(8, 62.5), repsSet(8, 62.5)]), log('remo', today, [repsSet(10, 45)])],
      { date: lastWeek, logs: [log('press', lastWeek, [repsSet(8, 60), repsSet(8, 60)]), log('remo', lastWeek, [repsSet(10, 50)])] },
    )
    expect(result.previousDate).toEqual(lastWeek)
    expect(result.volume).toEqual({ current: 1450, previous: 1460 })
    expect(trendOf(result.volume)).toBe('down')
    expect(trendOf(result.sets)).toBe('same')
    const press = result.exercises.find((e) => e.exerciseId === 'press')!
    expect(press.metrics.find((m) => m.metric === 'maxWeight')!.delta).toEqual({ current: 62.5, previous: 60 })
  })

  it('un ejercicio nuevo se compara con su última vez', () => {
    const lastPlank = log('plancha', day(2026, 9, 20), [timeSet(60)], 'time')
    const result = compareWorkout(
      [log('press', today, [repsSet(8, 60)]), log('plancha', today, [timeSet(70)], 'time'), log('curl', today, [repsSet(12, 12)])],
      { date: lastWeek, logs: [log('press', lastWeek, [repsSet(8, 60)])] },
      { plancha: lastPlank },
    )
    const plank = result.exercises.find((e) => e.exerciseId === 'plancha')!
    expect(plank.previousDate).toEqual(lastPlank.date)
    expect(plank.metrics.map((m) => m.metric)).toEqual(['maxDuration', 'totalDuration'])
    expect(plank.metrics[0].delta).toEqual({ current: 70, previous: 60 })
    const curl = result.exercises.find((e) => e.exerciseId === 'curl')!
    expect(curl.previous).toBeNull()
    expect(curl.metrics.every((m) => trendOf(m.delta) === 'new')).toBe(true)
  })

  it('entreno libre sin totales anteriores; ejercicios vacíos se ignoran', () => {
    expect(trendOf(compareWorkout([log('press', today, [repsSet(5, 80)])], null).volume)).toBe('new')
    expect(compareWorkout([log('press', today, [])], null).exercises).toHaveLength(0)
  })

  it('récords respecto a todo el historial', () => {
    const history = [log('press', day(2026, 9, 1), [repsSet(3, 70)]), log('press', lastWeek, [repsSet(8, 60)])]
    const best = personalBests(history)
    expect(compareExercise(log('press', today, [repsSet(2, 72.5)]), history[1], best).newRecords).toContain('maxWeight')
    expect(compareExercise(log('press', today, [repsSet(8, 62.5)]), history[1], best).newRecords).not.toContain('maxWeight')
    expect(newRecords(summarize([repsSet(10)]), 'reps', personalBests([log('d', lastWeek, [repsSet(8)])]))).toEqual(['maxReps'])
    expect(newRecords(summarize([timeSet(90)]), 'time', personalBests([log('p', lastWeek, [timeSet(60)], 'time')]))).toEqual(['maxDuration'])
    expect(newRecords(summarize([repsSet(5, 100)]), 'reps', null)).toEqual([])
  })
})

describe('cuadrícula del mes', () => {
  it('empieza en lunes (1 oct 2026 es jueves)', () => {
    const grid = monthGrid(day(2026, 10, 15), 1)
    expect(grid.days.slice(0, 3)).toEqual([null, null, null])
    expect(grid.days.filter(Boolean)).toHaveLength(31)
  })
  it('empieza en domingo', () => expect(monthGrid(day(2026, 10, 15), 0).days.slice(0, 4).every((d) => d === null)).toBe(true))
  it('febrero bisiesto', () => {
    const grid = monthGrid(day(2028, 2, 10), 1)
    expect(grid.days.filter(Boolean)).toHaveLength(29)
    expect(grid.days[0]).toBeNull()
  })
  it('cambia de año', () => expect(addMonths(monthGrid(day(2026, 12, 15)), 1).monthStart).toEqual(new Date(2027, 0, 1)))
  it('iniciales en castellano y catalán', () => {
    expect(weekdaySymbols('es-ES')).toHaveLength(7)
    expect(weekdaySymbols('es-ES')[0]).toBe('L')
    expect(weekdaySymbols('es-ES')[2]).toBe('X')
    expect(weekdaySymbols('ca-ES')).toHaveLength(7)
  })
})

describe('formatos', () => {
  it('pesos', () => {
    expect(formatWeight(62.5, es)).toBe('62,5 kg')
    expect(formatWeight(60, es)).toBe('60 kg')
    expect(formatMetricValue(79.1667, 'oneRepMax', es)).toBe('79,2 kg')
  })
  it('duraciones', () => {
    expect(formatDuration(45)).toBe('0:45')
    expect(formatDuration(65)).toBe('1:05')
    expect(formatDuration(3725)).toBe('1:02:05')
  })
  it('series', () => {
    expect(formatSet(repsSet(8, 62.5), es)).toBe('62,5 kg × 8')
    expect(formatSet(repsSet(12), es)).toBe('12 reps')
    expect(formatSet(repsSet(1), es)).toBe('1 rep')
    expect(formatSet(timeSet(45, 10), es)).toBe('0:45 · 10 kg')
  })
  it('resúmenes', () => {
    expect(formatSetSummary([repsSet(8, 60), repsSet(8, 60), repsSet(8, 60)], es)).toBe('3×8 · 60 kg')
    expect(formatSetSummary([repsSet(8, 60), repsSet(8, 60), repsSet(6, 55)], es)).toBe('8, 8, 6 · 60 kg')
    expect(formatSetSummary([timeSet(60), timeSet(60), timeSet(60)], es)).toBe('3×1:00')
    expect(formatSetSummary([], es)).toBe('Sin series')
    expect(formatSetSummary([], ca)).toBe('Sense sèries')
  })
  it('diferencias', () => {
    expect(formatChange({ current: 62.5, previous: 60 }, 'maxWeight', es)).toBe('+2,5 kg')
    expect(formatChange({ current: 45, previous: 60 }, 'maxDuration', es)).toBe('−0:15')
    expect(formatChange({ current: 8, previous: 8 }, 'totalReps', es)).toBe('Igual')
    expect(formatChange({ current: 8, previous: null }, 'totalReps', ca)).toBe('Nou')
    expect(formatPercent(0.0625)).toBe('+6 %')
    expect(formatPercent(-0.031)).toBe('−3 %')
  })
})
