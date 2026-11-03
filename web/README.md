# Gym · versión web instalable (PWA)

La misma app de rutinas que la versión Swift, pero como **app web instalable**. Se publica sola en GitHub Pages con cada `git push`, y en el iPhone se instala desde Safari, sin Xcode, sin Mac y sin cuenta de Apple. No caduca.

- **Rutinas por defecto**: la primera vez se crean 4 rutinas (Tren superior 1 y 2, Tren inferior 1 y 2) con sus 20 ejercicios, y el plan semanal en ese orden. Desde **Ajustes → Restaurar rutinas por defecto** se vuelven a crear las que falten, sin borrar nada.
- **Hoy**: plan semanal con las rutinas en orden, sin día fijo. Al abrir la app sale el siguiente entreno pendiente; al terminarlo, al día siguiente toca el siguiente. Cada lunes vuelve a empezar.
- **Calendario**: los días con entreno llevan un punto. Desde ahí se registra el entreno, por rutina o libre.
- **Registro**: series de repeticiones + kg, o de tiempo con cronómetro. Los ejercicios y las series se reordenan arrastrando el asa ≡. Las repeticiones se anotan al hacer cada serie y pueden ser distintas en cada una; en gris sale lo que hiciste esa misma serie la última vez.
- **Resumen al finalizar**: comparación con el entreno anterior (▲/▼, %) y récords personales 🏆. El botón **Copiar entreno** copia las series, repeticiones y pesos para pegarlos, por ejemplo, en la descripción de la actividad de Strava.
- **Progreso**: gráfica por ejercicio y periodo, récords e historial.
- **Ajustes** (pestaña propia): modo Sistema / Claro / Oscuro, 9 colores, castellano o catalán, y **exportar o importar una copia de seguridad (JSON)**.
- **Menú oculto**: toca 7 veces «Versión» en Ajustes. Sirve para cargar un año de datos de prueba o borrar los entrenos y rutinas.
- **Sin conexión**: funciona sin internet. Los datos se guardan solo en el iPhone (IndexedDB). La app pide almacenamiento persistente y Ajustes → Datos muestra si lo tiene.

## Instalarla en el iPhone

1. Abre **https://sgpau.github.io/gym-app/** en **Safari**.
2. Pulsa **Compartir** → **Añadir a pantalla de inicio**.
3. Ábrela desde el icono **Gym**: va a pantalla completa, como una app. Cuando se publica una versión nueva, se actualiza sola al abrirla.

Los datos solo están en ese iPhone. Haz de vez en cuando **Ajustes → Exportar copia de seguridad** y guárdala en Archivos o iCloud. Si borras la app de la pantalla de inicio, se borran sus datos.

## Primera publicación (una sola vez, en GitHub)

1. **Settings → General → Danger Zone → Change visibility → Public**. GitHub Pages gratis necesita un repo público, y con él todo el historial, incluidos los correos de los commits, pasa a ser visible.
2. **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Si publicas desde `main`, no hace falta nada más. Si publicas desde `claude/gym-pwa`: **Settings → Environments → github-pages → Deployment branches and tags** → añade la regla `claude/gym-pwa`.
4. Lanza la publicación: **Actions → Publicar la app en GitHub Pages → Run workflow** (o haz cualquier push que toque `web/`).

## Desarrollo

```sh
cd web
npm install
npm run dev        # http://localhost:5173/gym-app/ (abre la IP del Mac en el iPhone, misma wifi)
npm test           # lógica, base de datos e importación (Vitest)
npm run build      # versión de producción en dist/
node scripts/e2e.mjs http://localhost:4173/gym-app/ capturas   # recorrido completo con capturas (tras npm run preview)
```

Estructura:

```
src/core/     Lógica pura (port de GymApp/Core): estadísticas, comparación, calendario, formatos, formato JSON.
src/db/       IndexedDB (Dexie): modelo, ejercicios iniciales, creación de entrenos, importar/exportar.
src/i18n/     Textos en castellano (es.ts) y catalán (ca.ts), con plurales.
src/theme/    Estilos tipo iOS: claro/oscuro, barras translúcidas, zonas seguras.
src/ui/       Componentes: navegación, hojas, diálogos, listas, gráficas.
src/screens/  Calendario, entreno, resumen, rutinas, ejercicios, progreso, ajustes.
public/       Iconos y sample-data.json (generado con ../scripts/generate_sample_data.py).
```

El formato JSON de importación y exportación es el mismo que el de la app Swift; está descrito en el README principal.
