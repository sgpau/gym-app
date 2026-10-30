import { describe, expect, it } from 'vitest'
import { dropIndex, moveItem } from './sortable'

describe('reordenar arrastrando', () => {
  it('mueve un elemento hacia abajo y hacia arriba', () => {
    expect(moveItem(['a', 'b', 'c', 'd'], 0, 2)).toEqual(['b', 'c', 'a', 'd'])
    expect(moveItem(['a', 'b', 'c', 'd'], 3, 1)).toEqual(['a', 'd', 'b', 'c'])
    expect(moveItem(['a', 'b'], 1, 1)).toEqual(['a', 'b'])
  })

  // Filas de alturas distintas: 0–100, 100–140, 140–240, 240–280.
  const slots = [{ top: 0, height: 100 }, { top: 100, height: 40 }, { top: 140, height: 100 }, { top: 240, height: 40 }]

  it('sin pasar del centro del vecino, se queda en su sitio', () => {
    expect(dropIndex(slots, 0, 0)).toBe(0)
    expect(dropIndex(slots, 0, 60)).toBe(0) // centro en 110 < 120 (centro del 2º)
  })
  it('al pasar el centro de otros, ocupa su posición', () => {
    expect(dropIndex(slots, 0, 80)).toBe(1)
    expect(dropIndex(slots, 0, 500)).toBe(3)
    expect(dropIndex(slots, 3, -200)).toBe(1)
    expect(dropIndex(slots, 3, -1000)).toBe(0)
  })
})
