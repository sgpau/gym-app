import 'fake-indexeddb/auto'
import { readFileSync } from 'node:fs'
import { beforeEach, describe, expect, it } from 'vitest'
import { parseBackup, serializeBackup, shiftDates } from '../core/backup'
import { day } from '../test/helpers'
import { makeWorkout, workoutDate } from './factory'
import { exerciseLogs, previousWorkoutOfRoutine, workoutComparison } from './history'
import { deleteWorkoutsAndRoutines, exportBackup, importBackup } from './importer'
import { GymDatabase, type Exercise } from './model'
import { localizeDefaults, localizedName, seedDefaults, seedIfEmpty } from './seed'

const sample = readFileSync(new URL('../../public/sample-data.json', import.meta.url), 'utf8')
let db: GymDatabase
let counter = 0

beforeEach(() => {
  db = new GymDatabase(`test-${counter++}`)
})

const exerciseMap = async () => new Map((await db.exercises.toArray()).map((e): [string, Exercise] => [e.id, e]))

describe('formato de importación', () => {
  it('lee un archivo mínimo', () => {
    const backup = parseBackup(JSON.stringify({
      workouts: [{ date: '2026-03-14T18:30:00Z', routine: 'Torso', exercises: [{ exercise: 'Press de banca', sets: [{ reps: 8, weight: 60 }] }] }],
    }))
    expect(backup.version).toBe(1)
    expect(backup.exercises).toEqual([])
    expect(backup.workouts[0].date.toISOString()).toBe('2026-03-14T18:30:00.000Z')
  })
  it('rechaza fechas no válidas', () => {
    expect(() => parseBackup('{"workouts":[{"date":"14/03/2026","exercises":[]}]}')).toThrow()
    expect(() => parseBackup('no es json')).toThrow()
  })
  it('desplaza las fechas para que el último entreno sea el día dado', () => {
    const backup = parseBackup(JSON.stringify({ workouts: [
      { date: '2025-10-01T12:00:00Z', exercises: [] },
      { date: '2026-09-30T12:00:00Z', exercises: [] },
    ] }))
    const shifted = shiftDates(backup, new Date(2026, 9, 10, 9))
    const last = shifted.workouts[1].date
    expect([last.getFullYear(), last.getMonth(), last.getDate()]).toEqual([2026, 9, 10])
  })
  it('el archivo de datos de prueba es válido', () => {
    const backup = parseBackup(sample)
    expect(backup.workouts.length).toBeGreaterThan(100)
    expect(backup.routines.map((r) => r.name)).toEqual(['Tren superior 1', 'Tren inferior 1', 'Tren superior 2', 'Tren inferior 2'])
  })
  it('las fechas se exportan sin milisegundos (compatible con la app Swift)', () => {
    const text = serializeBackup({ version: 1, exercises: [], routines: [], workouts: [{ date: new Date('2026-03-14T18:30:00.123Z'), exercises: [] }] })
    expect(text).toContain('"2026-03-14T18:30:00Z"')
  })
})

describe('base de datos', () => {
  it('crea los ejercicios, rutinas y plan por defecto una sola vez y en el idioma activo', async () => {
    expect(await seedIfEmpty(db, 'ca')).toBe(true)
    expect(await seedIfEmpty(db, 'ca')).toBe(false)
    const names = (await db.exercises.toArray()).map((e) => e.name)
    expect(names).toContain('Esquat búlgar')
    expect(names).toHaveLength(20)
    const exercises = new Map((await db.exercises.toArray()).map((e) => [e.id, e.name]))
    const routines = await db.routines.toArray()
    expect(routines).toHaveLength(4)
    const lower2 = routines.find((r) => r.name === 'Tren inferior 2')!
    expect(lower2.items.map((i) => exercises.get(i.exerciseId))).toEqual(['Pes mort romanès', 'Esquat búlgar', 'Abducció', 'Adducció', 'Curl femoral'])
    const byId = new Map(routines.map((r) => [r.id, r.name]))
    expect((await db.plan.get('week'))!.routineIds.map((id) => byId.get(id))).toEqual(['Tren superior 1', 'Tren inferior 1', 'Tren superior 2', 'Tren inferior 2'])
  })

  it('los nombres por defecto cambian al idioma de la app; los propios no', async () => {
    await seedIfEmpty(db, 'ca')
    await db.exercises.add({ id: 'mine', name: 'Mi ejercicio', muscleGroup: 'other', trackingType: 'reps', notes: '', createdAt: 0 })
    expect(await localizeDefaults(db, 'es')).toBe(14) // los demás se llaman igual en los dos idiomas
    const names = (await db.exercises.toArray()).map((e) => e.name)
    expect(names).toContain('Sentadilla búlgara')
    expect(names).toContain('Mi ejercicio')
    expect(names).not.toContain('Esquat búlgar')
    expect((await db.routines.toArray()).map((r) => r.name)).toContain('Tren inferior 2')
    expect(await localizeDefaults(db, 'es')).toBe(0)
  })

  it('al traducir no deja dos ejercicios con el mismo nombre', async () => {
    await db.exercises.bulkAdd([
      { id: 'a', name: 'Rem neutre', muscleGroup: 'back', trackingType: 'reps', notes: '', createdAt: 0 },
      { id: 'b', name: 'Remo neutro', muscleGroup: 'back', trackingType: 'reps', notes: '', createdAt: 1 },
    ])
    expect(await localizeDefaults(db, 'es')).toBe(0)
    expect((await db.exercises.get('a'))!.name).toBe('Rem neutre')
  })

  it('restaurar los datos por defecto solo crea lo que falta', async () => {
    await seedIfEmpty(db, 'es')
    const upper1 = (await db.routines.toArray()).find((r) => r.name === 'Tren superior 1')!
    await db.routines.delete(upper1.id)
    await db.plan.put({ id: 'week', routineIds: [] })
    const curl = (await db.exercises.toArray()).find((e) => e.name === 'Curl de bíceps')!
    await db.exercises.delete(curl.id)
    expect(await seedDefaults(db, 'es')).toEqual({ exercisesCreated: 1, routinesCreated: 1 })
    expect(await db.exercises.count()).toBe(20)
    expect(await db.routines.count()).toBe(4)
    expect((await db.plan.get('week'))!.routineIds).toHaveLength(4)
    // En otro idioma reconoce los nombres en castellano y no duplica nada.
    expect(await seedDefaults(db, 'ca')).toEqual({ exercisesCreated: 0, routinesCreated: 0 })
  })

  it('importa los datos de prueba reutilizando los ejercicios existentes', async () => {
    await seedIfEmpty(db, 'es')
    const result = await importBackup(db, parseBackup(sample), 'es')
    expect(result.exercisesCreated).toBe(0)
    expect(result.routinesCreated).toBe(0)
    expect(result.workoutsImported).toBeGreaterThan(100)
    expect(await db.exercises.count()).toBe(20)
    expect(await db.routines.count()).toBe(4)
  })

  it('al importar en catalán traduce los nombres conocidos', async () => {
    await seedIfEmpty(db, 'ca')
    await importBackup(db, parseBackup(sample), 'ca')
    expect(await db.routines.count()).toBe(4)
    expect(await db.exercises.count()).toBe(20)
    expect(localizedName('Sentadilla búlgara', 'ca')).toBe('Esquat búlgar')
    expect(localizedName('Sentadilla', 'ca')).toBe('Esquat')
    expect(localizedName('Mi ejercicio', 'ca')).toBe('Mi ejercicio')
  })

  it('reemplazar borra entrenos y rutinas anteriores', async () => {
    await seedIfEmpty(db, 'es')
    const backup = parseBackup(sample)
    await importBackup(db, backup, 'es')
    await importBackup(db, backup, 'es', { replace: true })
    expect(await db.workouts.count()).toBe(backup.workouts.length)
    expect(await db.routines.count()).toBe(4)
  })

  it('exportar e importar conserva los entrenos', async () => {
    await seedIfEmpty(db, 'es')
    await importBackup(db, parseBackup(sample), 'es')
    const exported = await exportBackup(db)
    const reparsed = parseBackup(serializeBackup(exported))
    expect(reparsed.workouts).toHaveLength(await db.workouts.count())
    expect(reparsed.routines).toHaveLength(4)
  })

  it('el plan semanal se exporta, se importa y se borra con las rutinas', async () => {
    await seedIfEmpty(db, 'es')
    await importBackup(db, parseBackup(sample), 'es')
    const byName = new Map((await db.routines.toArray()).map((r) => [r.name, r.id]))
    await db.plan.put({ id: 'week', routineIds: [byName.get('Tren inferior 2')!, byName.get('Tren superior 1')!] })
    const text = serializeBackup(await exportBackup(db))
    expect(parseBackup(text).weeklyPlan).toEqual(['Tren inferior 2', 'Tren superior 1'])

    const other = new GymDatabase(`test-${counter++}`)
    await importBackup(other, parseBackup(text), 'es')
    const names = new Map((await other.routines.toArray()).map((r) => [r.id, r.name]))
    expect((await other.plan.get('week'))!.routineIds.map((id) => names.get(id))).toEqual(['Tren inferior 2', 'Tren superior 1'])

    await deleteWorkoutsAndRoutines(other)
    expect(await other.plan.count()).toBe(0)
  })

  it('compara el último entreno con el anterior de su rutina', async () => {
    await seedIfEmpty(db, 'es')
    await importBackup(db, parseBackup(sample), 'es')
    const workouts = await db.workouts.toArray()
    const exercises = await exerciseMap()
    const routine = (await db.routines.toArray()).find((r) => r.name === 'Tren superior 1')!
    const last = workouts.filter((w) => w.routineId === routine.id).sort((a, b) => b.date - a.date)[0]
    const previous = previousWorkoutOfRoutine(last, workouts)!
    expect(previous.date).toBeLessThan(last.date)
    const comparison = workoutComparison(last, workouts, exercises)
    expect(comparison.previousDate?.getTime()).toBe(previous.date)
    expect(comparison.exercises.length).toBe(last.entries.length)
  })

  it('un entreno nuevo de una rutina trae las series y el peso de la última vez, sin repeticiones', async () => {
    await seedIfEmpty(db, 'es')
    await importBackup(db, parseBackup(sample), 'es')
    const workouts = await db.workouts.toArray()
    const exercises = await exerciseMap()
    const routine = (await db.routines.toArray()).find((r) => r.name === 'Tren superior 1')!
    const bench = [...exercises.values()].find((e) => e.name === 'Press de banca')!
    const workout = makeWorkout(routine, new Date(2030, 0, 1), workouts, exercises)
    expect(workout.entries).toHaveLength(routine.items.length)
    const benchEntry = workout.entries.find((e) => e.exerciseId === bench.id)!
    const lastBench = exerciseLogs(bench.id, workouts, exercises).at(-1)!
    // La rutina por defecto ya existía: manda su número de series (3), no el de los datos de prueba.
    expect(benchEntry.sets).toHaveLength(3)
    expect(benchEntry.sets.map((s) => s.reps)).toEqual([null, null, null]) // se anotan al hacer cada serie
    expect(benchEntry.sets[0].weight).toBe(Math.max(...lastBench.sets.map((s) => s.weight)))
  })

  it('la fecha de un entreno en otro día conserva la hora actual', () => {
    const date = new Date(workoutDate(day(2026, 3, 5), new Date(2026, 9, 10, 18, 45)))
    expect([date.getMonth(), date.getDate(), date.getHours(), date.getMinutes()]).toEqual([2, 5, 18, 45])
  })
})
