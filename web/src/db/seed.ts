import type { TrackingType } from '../core/stats'
import type { Lang } from '../i18n'
import { newId, type Exercise, type GymDatabase, type MuscleGroup, type Routine } from './model'

/** Ejercicios por defecto, en castellano y catalán. Se crean en el idioma activo. */
export const SEED_EXERCISES: [es: string, ca: string, MuscleGroup, TrackingType][] = [
  ['Press de banca', 'Press de banca', 'chest', 'reps'],
  ['Remo neutro', 'Rem neutre', 'back', 'reps'],
  ['Press militar', 'Press militar', 'shoulders', 'reps'],
  ['Curl de bíceps', 'Curl de bíceps', 'biceps', 'reps'],
  ['Extensión de tríceps', 'Extensió de tríceps', 'triceps', 'reps'],
  ['Hip thrust', 'Hip thrust', 'glutes', 'reps'],
  ['Sentadilla en multipower', 'Esquat a la multipower', 'legs', 'reps'],
  ['Zancadas en multipower', 'Gambades a la multipower', 'legs', 'reps'],
  ['Extensión de cuádriceps', 'Extensió de quàdriceps', 'legs', 'reps'],
  ['Elevación de talones', 'Elevació de talons', 'legs', 'reps'],
  ['Jalón al pecho', 'Jaló al pit', 'back', 'reps'],
  ['Press inclinado', 'Press inclinat', 'chest', 'reps'],
  ['Remo abierto', 'Rem obert', 'back', 'reps'],
  ['Face pull', 'Face pull', 'shoulders', 'reps'],
  ['Elevaciones laterales', 'Elevacions laterals', 'shoulders', 'reps'],
  ['Peso muerto rumano', 'Pes mort romanès', 'glutes', 'reps'],
  ['Sentadilla búlgara', 'Esquat búlgar', 'legs', 'reps'],
  ['Abducción', 'Abducció', 'glutes', 'reps'],
  ['Aducción', 'Adducció', 'legs', 'reps'],
  ['Curl femoral', 'Curl femoral', 'legs', 'reps'],
]

/** Rutinas por defecto (y orden del plan semanal), con sus ejercicios por nombre en castellano. */
export const SEED_ROUTINES: [es: string, ca: string, exercises: string[]][] = [
  ['Tren superior 1', 'Tren superior 1', ['Press de banca', 'Remo neutro', 'Press militar', 'Curl de bíceps', 'Extensión de tríceps']],
  ['Tren inferior 1', 'Tren inferior 1', ['Hip thrust', 'Sentadilla en multipower', 'Zancadas en multipower', 'Extensión de cuádriceps', 'Elevación de talones']],
  ['Tren superior 2', 'Tren superior 2', ['Jalón al pecho', 'Press inclinado', 'Remo abierto', 'Face pull', 'Elevaciones laterales']],
  ['Tren inferior 2', 'Tren inferior 2', ['Peso muerto rumano', 'Sentadilla búlgara', 'Abducción', 'Aducción', 'Curl femoral']],
]

/** Ejercicios por defecto de versiones anteriores: solo para traducir copias y datos antiguos. */
const LEGACY_NAMES: [es: string, ca: string][] = [
  ['Press inclinado con mancuernas', 'Press inclinat amb manuelles'],
  ['Aperturas con mancuernas', 'Obertures amb manuelles'],
  ['Fondos en paralelas', 'Fons a paral·leles'],
  ['Flexiones', 'Flexions'],
  ['Dominadas', 'Dominades'],
  ['Remo con barra', 'Rem amb barra'],
  ['Remo en polea baja', 'Rem a la politja baixa'],
  ['Peso muerto', 'Pes mort'],
  ['Curl con barra', 'Curl amb barra'],
  ['Curl martillo', 'Curl martell'],
  ['Press francés', 'Press francès'],
  ['Extensión de tríceps en polea', 'Extensió de tríceps a la politja'],
  ['Sentadilla', 'Esquat'],
  ['Prensa de piernas', 'Premsa de cames'],
  ['Zancadas', 'Gambades'],
  ['Elevación de gemelos', 'Elevació de bessons'],
  ['Plancha', 'Planxa'],
  ['Plancha lateral', 'Planxa lateral'],
  ['Crunch abdominal', 'Crunch abdominal'],
  ['Elevación de piernas colgado', 'Elevació de cames penjat'],
  ['Cinta de correr', 'Cinta de córrer'],
  ['Bicicleta estática', 'Bicicleta estàtica'],
  ['Remo ergómetro', 'Rem ergòmetre'],
  ['Saltar a la comba', 'Saltar a corda'],
  ['Empuje', 'Empenta'],
  ['Tirón', 'Estirada'],
  ['Pierna', 'Cama'],
  ['Cardio y core', 'Cardio i core'],
  ['Torso', 'Tors'],
]

/** Notas de los datos de prueba. */
const OTHER_NAMES: [es: string, ca: string][] = [['Semana de descarga', 'Setmana de descàrrega']]

const translations = new Map<string, [string, string]>(
  [
    ...SEED_EXERCISES.map(([es, ca]) => [es, ca] as [string, string]),
    ...SEED_ROUTINES.map(([es, ca]) => [es, ca] as [string, string]),
    ...LEGACY_NAMES,
    ...OTHER_NAMES,
  ].flatMap(([es, ca]) => [
    [es.toLowerCase(), [es, ca]],
    [ca.toLowerCase(), [es, ca]],
  ]),
)

/** Traduce un nombre conocido (en castellano o catalán) al idioma activo; los demás se dejan igual. */
export function localizedName(name: string, lang: Lang): string {
  const pair = translations.get(name.trim().toLowerCase())
  return pair ? pair[lang === 'ca' ? 1 : 0] : name
}

const key = (name: string, lang: Lang) => localizedName(name, lang).trim().toLowerCase()

/**
 * Crea los ejercicios y rutinas por defecto que falten (por nombre, en cualquier idioma) sin tocar
 * nada más. Si el plan semanal está vacío, lo rellena con las rutinas por defecto.
 */
export async function seedDefaults(db: GymDatabase, lang: Lang): Promise<{ exercisesCreated: number; routinesCreated: number }> {
  return db.transaction('rw', [db.exercises, db.routines, db.plan], async () => {
    const now = Date.now()
    const pick = (es: string, ca: string) => (lang === 'ca' ? ca : es)

    const exercises = new Map((await db.exercises.toArray()).map((e) => [key(e.name, lang), e]))
    const newExercises: Exercise[] = []
    for (const [es, ca, muscleGroup, trackingType] of SEED_EXERCISES) {
      if (exercises.has(key(es, lang))) continue
      const exercise: Exercise = { id: newId(), name: pick(es, ca), muscleGroup, trackingType, notes: '', createdAt: now + newExercises.length }
      exercises.set(key(es, lang), exercise)
      newExercises.push(exercise)
    }
    await db.exercises.bulkAdd(newExercises)

    const routines = new Map((await db.routines.toArray()).map((r) => [key(r.name, lang), r]))
    const newRoutines: Routine[] = []
    for (const [es, ca, names] of SEED_ROUTINES) {
      if (routines.has(key(es, lang))) continue
      const routine: Routine = {
        id: newId(),
        name: pick(es, ca),
        createdAt: now + newRoutines.length,
        items: names.map((name) => ({ exerciseId: exercises.get(key(name, lang))!.id, sets: 3, reps: 10, duration: 60 })),
      }
      routines.set(key(es, lang), routine)
      newRoutines.push(routine)
    }
    await db.routines.bulkAdd(newRoutines)

    const plan = await db.plan.get('week')
    if (!plan?.routineIds.length) {
      await db.plan.put({ id: 'week', routineIds: SEED_ROUTINES.map(([es]) => routines.get(key(es, lang))!.id) })
    }
    return { exercisesCreated: newExercises.length, routinesCreated: newRoutines.length }
  })
}

/** Primera vez (sin ejercicios): crea los datos por defecto. */
export async function seedIfEmpty(db: GymDatabase, lang: Lang): Promise<boolean> {
  if ((await db.exercises.count()) > 0) return false
  await seedDefaults(db, lang)
  return true
}
