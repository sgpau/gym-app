// Genera los iconos PNG de la app a partir de un SVG (usa el Chromium de Playwright).
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'

const [svgPath, outDir] = process.argv.slice(2)
const svg = readFileSync(svgPath, 'utf8')
const browser = await chromium.launch()
const page = await browser.newPage()
for (const [name, size] of [['icon-192.png', 192], ['icon-512.png', 512], ['apple-touch-icon.png', 180]]) {
  await page.setViewportSize({ width: size, height: size })
  await page.setContent(`<style>html,body{margin:0}</style><img src="data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}" width="${size}" height="${size}">`)
  await page.screenshot({ path: `${outDir}/${name}` })
}
await browser.close()
