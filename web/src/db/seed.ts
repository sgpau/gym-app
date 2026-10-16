import type { TrackingType } from '../core/stats'
import type { Lang } from '../i18n'
import { newId, type Exercise, type GymDatabase, type MuscleGroup } from './model'

/** Ejercicios iniciales, en castellano y catalán. Se crean en el idioma activo. */
export const SEED_EXERCISES: [es: string, ca: string, MuscleGroup, TrackingType][] = [
  ['Press de banca', 'Press de banca', 'chest', 'reps'],
  ['Press inclinado con mancuernas', 'Press inclinat amb manuelles', 'chest', 'reps'],
  ['Aperturas con mancuernas', 'Obertures amb manuelles', 'chest', 'reps'],
  ['Fondos en paralelas', 'Fons a paral·leles', 'chest', 'reps'],
  ['Flexiones', 'Flexions', 'chest', 'reps'],
  ['Dominadas', 'Dominades', 'back', 'reps'],
  ['Remo con barra', 'Rem amb barra', 'back', 'reps'],
  ['Jalón al pecho', 'Jaló al pit', 'back', 'reps'],
  ['Remo en polea baja', 'Rem a la politja baixa', 'back', 'reps'],
  ['Peso muerto', 'Pes mort', 'back', 'reps'],
  ['Press militar', 'Press militar', 'shoulders', 'reps'],
  ['Elevaciones laterales', 'Elevacions laterals', 'shoulders', 'reps'],
  ['Face pull', 'Face pull', 'shoulders', 'reps'],
  ['Curl con barra', 'Curl amb barra', 'biceps', 'reps'],
  ['Curl martillo', 'Curl martell', 'biceps', 'reps'],
  ['Press francés', 'Press francès', 'triceps', 'reps'],
  ['Extensión de tríceps en polea', 'Extensió de tríceps a la politja', 'triceps', 'reps'],
  ['Sentadilla', 'Esquat', 'legs', 'reps'],
  ['Prensa de piernas', 'Premsa de cames', 'legs', 'reps'],
  ['Zancadas', 'Gambades', 'legs', 'reps'],
  ['Extensión de cuádriceps', 'Extensió de quàdriceps', 'legs', 'reps'],
  ['Curl femoral', 'Curl femoral', 'legs', 'reps'],
  ['Elevación de gemelos', 'Elevació de bessons', 'legs', 'reps'],
  ['Hip thrust', 'Hip thrust', 'glutes', 'reps'],
  ['Peso muerto rumano', 'Pes mort romanès', 'glutes', 'reps'],
  ['Plancha', 'Planxa', 'core', 'time'],
  ['Plancha lateral', 'Planxa lateral', 'core', 'time'],
  ['Crunch abdominal', 'Crunch abdominal', 'core', 'reps'],
  ['Elevación de piernas colgado', 'Elevació de cames penjat', 'core', 'reps'],
  ['Cinta de correr', 'Cinta de córrer', 'cardio', 'time'],
  ['Bicicleta estática', 'Bicicleta estàtica', 'cardio', 'time'],
  ['Remo ergómetro', 'Rem ergòmetre', 'cardio', 'time'],
  ['Saltar a la comba', 'Saltar a corda', 'cardio', 'time'],
]

/** Rutinas y notas de los datos de prueba. */
const OTHER_NAMES: [es: string, ca: string][] = [
  ['Empuje', 'Empenta'],
  ['Tirón', 'Estirada'],
  ['Pierna', 'Cama'],
  ['Cardio y core', 'Cardio i core'],
  ['Torso', 'Tors'],
  ['Semana de descarga', 'Setmana de descàrrega'],
]

const translations = new Map<string, [string, string]>(
  [...SEED_EXERCISES.map(([es, ca]) => [es, ca] as [string, string]), ...OTHER_NAMES].flatMap(([es, ca]) => [
    [es.toLowerCase(), [es, ca]],
    [ca.toLowerCase(), [es, ca]],
  ]),
)

/** Traduce un nombre conocido (en castellano o catalán) al idioma activo; los demás se dejan igual. */
export function localizedName(name: string, lang: Lang): string {
  const pair = translations.get(name.trim().toLowerCase())
  return pair ? pair[lang === 'ca' ? 1 : 0] : name
}

export async function seedIfEmpty(db: GymDatabase, lang: Lang): Promise<boolean> {
  if ((await db.exercises.count()) > 0) return false
  const now = Date.now()
  const exercises: Exercise[] = SEED_EXERCISES.map(([es, ca, muscleGroup, trackingType], i) => ({
    id: newId(),
    name: lang === 'ca' ? ca : es,
    muscleGroup,
    trackingType,
    notes: '',
    createdAt: now + i,
  }))
  await db.exercises.bulkAdd(exercises)
  return true
}
