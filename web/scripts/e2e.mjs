// Recorrido completo a tamaño iPhone con capturas: node scripts/e2e.mjs <url> <carpeta-capturas>
import { chromium } from 'playwright'

const [url, out] = process.argv.slice(2)
const browser = await chromium.launch()
const errors = []

async function run(name, { colorScheme = 'light', locale = 'es-ES' } = {}) {
  const context = await browser.newContext({
    viewport: { width: 393, height: 852 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, colorScheme, locale,
  })
  const page = await context.newPage()
  page.on('pageerror', (e) => errors.push(`${name}: ${e.message}`))
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`${name}: ${m.text()}`) })
  const shot = (step) => page.screenshot({ path: `${out}/${name}-${step}.png` })
  const tap = (selector) => page.locator(`${selector} >> visible=true`).first().click()

  await page.goto(url)
  await page.waitForSelector('.tabbar')
  await page.waitForTimeout(500)
  await shot('00-today-empty')
  await tap('.tab:nth-child(2)')
  await page.waitForTimeout(300)
  await shot('01-calendar-empty')

  // Pestaña Ajustes → restaurar por defecto (ya está todo) → 7 toques en Versión → cargar datos de prueba
  await page.locator('.tab').nth(5).click()
  await page.waitForTimeout(400)
  await shot('02-settings')
  await page.locator('button.row:visible', { hasText: /Restaurar/ }).click()
  await page.waitForSelector('.alert-box')
  await shot('02b-defaults-already-there')
  await page.locator('.alert-box button').click()
  const version = page.locator('button.row:visible', { hasText: /Versi/ })
  for (let i = 0; i < 7; i++) await version.click()
  await shot('02c-settings-dev')
  await page.locator('button.row:visible', { hasText: /prueba|prova/ }).click()
  await page.waitForSelector('.alert-box', { timeout: 10000 })
  await shot('03-imported')
  await page.locator('.alert-box button').click()
  await page.locator('.tab').nth(1).click()
  await page.waitForTimeout(600)
  await shot('04-calendar-data')

  // Registrar un entreno de la rutina Tren superior 1 hoy, subir el peso del press y finalizar
  await tap('.primary-button')
  await page.waitForTimeout(500)
  await page.locator('.sheet button.row', { hasText: /Tren superior 1/ }).click()
  await page.waitForTimeout(600)
  await shot('05-editor')
  const weight = page.locator('.sheet input[inputmode="decimal"]')
  const current = await weight.first().inputValue()
  const heavier = String(parseFloat(current.replace(',', '.')) + 5).replace('.', ',')
  for (let i = 0; i < 3; i++) { await weight.nth(i).fill(heavier) }
  // Las repeticiones se anotan serie a serie y pueden ser distintas
  const reps = page.locator('.sheet input[inputmode="numeric"]')
  for (let i = 0; i < await reps.count(); i++) await reps.nth(i).fill(String([10, 9, 8, 8][i % 4]))
  await shot('05b-editor-reps')
  await page.locator('.sheet .bar-button.prominent').click()
  await page.waitForTimeout(800)
  await shot('06-summary')
  await page.locator('.sheet .screen').last().evaluate((el) => el.scrollTo(0, 900))
  await page.waitForTimeout(300)
  await shot('07-summary-scrolled')
  await page.locator('.sheet .bar-button.prominent').last().click()
  await page.waitForTimeout(600)

  // Progreso → Press de banca
  await page.locator('.tab').nth(4).click()
  await page.waitForTimeout(400)
  await shot('08-progress-list')
  await page.locator('button.row:visible', { hasText: /Press de banca/ }).first().click()
  await page.waitForTimeout(600)
  await shot('09-progress-detail')

  // Rutinas y ejercicios
  await page.locator('.tab').nth(2).click()
  await page.waitForTimeout(300)
  await shot('10-routines')
  await page.locator('.tab').nth(3).click()
  await page.waitForTimeout(300)
  await shot('11-exercises')

  // La barra con 6 pestañas en una pantalla estrecha (iPhone SE)
  await page.setViewportSize({ width: 320, height: 568 })
  await page.waitForTimeout(300)
  await shot('12-tabbar-320')
  await context.close()
}

await run('es-light')
await run('ca-dark', { colorScheme: 'dark', locale: 'ca-ES' })
await browser.close()
console.log(errors.length ? `ERRORES:\n${errors.join('\n')}` : 'Sin errores en consola')
