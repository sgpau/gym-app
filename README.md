# Gym · rutinas de gimnasio para iPhone

App nativa en SwiftUI + SwiftData (iOS 27) para:

- **Ejercicios**: más de 30 precargados, editables. Cada uno se mide por **repeticiones** o por **tiempo**.
- **Rutinas**: listas ordenadas de ejercicios con objetivo de series × reps (o × tiempo).
- **Calendario**: marca qué rutina hiciste cada día y anota series, repeticiones o duración (con cronómetro) y peso en kg.
- **Comparación al finalizar**: al terminar un entreno ves qué ha mejorado respecto al anterior (▲/▼ por ejercicio, volumen total, récords personales 🏆).
- **Progreso**: gráfica de la evolución de cada ejercicio (peso máximo, 1RM estimado, volumen, reps o tiempo) y récords.
- **Ajustes**: modo Sistema / Claro / Oscuro y color principal a elegir.
- **Herramientas de desarrollo (ocultas)**: cargar un año de datos de prueba, importar un JSON o borrar los entrenos.

Los datos se guardan solo en el iPhone. La app está en **castellano y catalán** y sigue el idioma del iPhone. Para cambiarlo solo en la app: Ajustes de iOS → Gym → Idioma, o desde la fila «Idioma» de los ajustes de la app.

## Versión web instalable (sin Xcode)

En la carpeta [`web/`](web/README.md) está la misma app como **PWA**. Se publica sola en GitHub Pages con cada push y se instala en el iPhone desde Safari: abre **https://sgpau.github.io/gym-app/** → Compartir → **Añadir a pantalla de inicio**. No necesita Mac ni Xcode y no caduca.

## Ejecutarla en tu iPhone


Necesitas un Mac con **Xcode 27** y un iPhone con **iOS 27**.

1. Clona el repositorio y abre `GymApp.xcodeproj`.
2. En el proyecto → target **GymApp** → **Signing & Capabilities**, elige tu **Team** (vale tu Apple ID gratuito). Si Xcode se queja del Bundle Identifier, cámbialo por uno tuyo, p. ej. `com.tunombre.GymApp`.
3. Conecta el iPhone, selecciónalo arriba y pulsa ▶︎ (Cmd+R).
4. La primera vez, en el iPhone: **Ajustes → General → VPN y gestión de dispositivos** → confía en tu certificado de desarrollador. Con un Apple ID gratuito la app caduca a los 7 días; basta con volver a instalarla desde Xcode.

También puedes probarla en el simulador sin firmar nada.

## Datos de prueba e importación

En **Calendario → ⚙︎ Ajustes**, toca **7 veces** la fila «Versión». Aparece la sección **Desarrollo**:

- **Cargar datos de prueba (último año)**: importa `GymApp/Resources/sample-data.json`, que va dentro de la app. Son unos 160 entrenos con progresión realista, semanas de descarga y vacaciones. Las fechas se desplazan para que el último entreno sea hoy.
- **Importar datos desde archivo…**: elige un `.json` en Archivos. En el simulador, arrastra el archivo a la ventana y se guarda en Archivos. En el iPhone, pásalo por AirDrop o iCloud Drive.
- **Borrar entrenos y rutinas**: deja los ejercicios intactos.

Si ya tienes entrenos, te pregunta si **reemplazar** o **añadir**.

Para regenerar el archivo de prueba (otra semilla u otra fecha final):

```sh
python3 scripts/generate_sample_data.py --end 2026-10-09 --seed 7
```

### Formato del JSON

Todas las secciones son opcionales. Los ejercicios y las rutinas se buscan por nombre, sin distinguir mayúsculas; los que no existan se crean.

```json
{
  "version": 1,
  "exercises": [{ "name": "Press de banca", "muscleGroup": "chest", "trackingType": "reps" }],
  "routines": [{ "name": "Torso", "items": [{ "exercise": "Press de banca", "sets": 4, "reps": 8 }] }],
  "workouts": [{
    "date": "2026-03-14T18:30:00Z",
    "routine": "Torso",
    "notes": "opcional",
    "exercises": [
      { "exercise": "Press de banca", "sets": [{ "reps": 8, "weight": 60 }, { "reps": 7, "weight": 62.5 }] },
      { "exercise": "Plancha", "sets": [{ "duration": 60 }] }
    ]
  }]
}
```

- `muscleGroup`: `chest`, `back`, `shoulders`, `biceps`, `triceps`, `legs`, `glutes`, `core`, `cardio` u `other`.
- `trackingType`: `reps` o `time`.
- `duration`: en segundos.
- `weight`: en kg.

## Estructura

```
GymApp/
  Core/        Lógica pura (estadísticas, comparación, calendario, formatos). Sin dependencias de Apple.
  Models/      Modelos de SwiftData, datos iniciales y datos de ejemplo para las previews.
  Settings/    Apariencia, color principal y herramientas de desarrollo ocultas.
  Resources/   sample-data.json (un año de entrenos de prueba).
  Localizable.xcstrings  Catálogo de textos: castellano (base) y catalán.
  Views/       Calendario, Entreno, Rutinas, Ejercicios, Progreso y componentes compartidos.
scripts/       generate_sample_data.py (datos de prueba) y build_strings_catalog.py (traducciones).
Tests/         Tests de Core con Swift Testing.
Package.swift  Compila Core como paquete para poder ejecutar los tests con `swift test`.
```

`GymApp.xcodeproj` usa carpetas sincronizadas: cualquier archivo nuevo dentro de `GymApp/` entra solo en el target, sin tocar el proyecto.

## Traducciones

Los textos están en `GymApp/Localizable.xcstrings`; la clave de cada texto es la frase en castellano. Ese archivo se genera con `scripts/build_strings_catalog.py`: para corregir una traducción, edítala ahí y ejecuta `python3 scripts/build_strings_catalog.py`. También se puede editar directamente en Xcode.

Los ejercicios precargados se crean con el nombre en el idioma que tenga el iPhone la primera vez que se abre la app. Al importar un JSON, los nombres conocidos en castellano (ejercicios y rutinas de prueba) se traducen al idioma actual.

## Tests

```sh
swift test
```

Cubren el 1RM estimado, volumen, récords, la comparación con el entreno anterior, la cuadrícula del calendario, los formatos de peso y tiempo, y la lectura del JSON de importación (incluido el de datos de prueba).
