# Gym · rutinas de gimnasio para iPhone

App nativa en SwiftUI + SwiftData (iOS 27) para:

- **Ejercicios**: más de 30 precargados, editables. Cada uno se mide por **repeticiones** o por **tiempo**.
- **Rutinas**: listas ordenadas de ejercicios con objetivo de series × reps (o × tiempo).
- **Calendario**: marca qué rutina hiciste cada día y anota series, repeticiones o duración (con cronómetro) y peso en kg.
- **Comparación al finalizar**: al terminar un entreno ves qué ha mejorado respecto al anterior (▲/▼ por ejercicio, volumen total, récords personales 🏆).
- **Progreso**: gráfica de la evolución de cada ejercicio (peso máximo, 1RM estimado, volumen, reps o tiempo) y récords.
- **Ajustes**: modo Sistema / Claro / Oscuro y color principal a elegir.

Los datos se guardan solo en el iPhone.

## Ejecutarla en tu iPhone

Necesitas un Mac con **Xcode 27** y un iPhone con **iOS 27**.

1. Clona el repositorio y abre `GymApp.xcodeproj`.
2. En el proyecto → target **GymApp** → **Signing & Capabilities**, elige tu **Team** (vale tu Apple ID gratuito). Si Xcode se queja del Bundle Identifier, cámbialo por uno tuyo, p. ej. `com.tunombre.GymApp`.
3. Conecta el iPhone, selecciónalo arriba y pulsa ▶︎ (Cmd+R).
4. La primera vez, en el iPhone: **Ajustes → General → VPN y gestión de dispositivos** → confía en tu certificado de desarrollador. Con un Apple ID gratuito la app caduca a los 7 días; basta con volver a instalarla desde Xcode.

También puedes probarla en el simulador sin firmar nada.

## Estructura

```
GymApp/
  Core/        Lógica pura (estadísticas, comparación, calendario, formatos). Sin dependencias de Apple.
  Models/      Modelos de SwiftData, datos iniciales y datos de ejemplo para las previews.
  Settings/    Apariencia y color principal.
  Views/       Calendario, Entreno, Rutinas, Ejercicios, Progreso y componentes compartidos.
Tests/         Tests de Core con Swift Testing.
Package.swift  Compila Core como paquete para poder ejecutar los tests con `swift test`.
```

`GymApp.xcodeproj` usa carpetas sincronizadas: cualquier archivo nuevo dentro de `GymApp/` entra solo en el target, sin tocar el proyecto.

## Tests

```sh
swift test
```

Cubren el 1RM estimado, volumen, récords, la comparación con el entreno anterior, la cuadrícula del calendario y los formatos de peso y tiempo.
