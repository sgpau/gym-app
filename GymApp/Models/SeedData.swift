import Foundation
import SwiftData

/// Ejercicios con los que arranca la app. Se pueden editar o borrar.
/// Los nombres se guardan traducidos al idioma del iPhone en el momento de crearlos.
enum SeedData {
    static let exercises: [(LocalizedStringResource, MuscleGroup, TrackingType)] = [
        ("Press de banca", .chest, .reps),
        ("Press inclinado con mancuernas", .chest, .reps),
        ("Aperturas con mancuernas", .chest, .reps),
        ("Fondos en paralelas", .chest, .reps),
        ("Flexiones", .chest, .reps),
        ("Dominadas", .back, .reps),
        ("Remo con barra", .back, .reps),
        ("Jalón al pecho", .back, .reps),
        ("Remo en polea baja", .back, .reps),
        ("Peso muerto", .back, .reps),
        ("Press militar", .shoulders, .reps),
        ("Elevaciones laterales", .shoulders, .reps),
        ("Face pull", .shoulders, .reps),
        ("Curl con barra", .biceps, .reps),
        ("Curl martillo", .biceps, .reps),
        ("Press francés", .triceps, .reps),
        ("Extensión de tríceps en polea", .triceps, .reps),
        ("Sentadilla", .legs, .reps),
        ("Prensa de piernas", .legs, .reps),
        ("Zancadas", .legs, .reps),
        ("Extensión de cuádriceps", .legs, .reps),
        ("Curl femoral", .legs, .reps),
        ("Elevación de gemelos", .legs, .reps),
        ("Hip thrust", .glutes, .reps),
        ("Peso muerto rumano", .glutes, .reps),
        ("Plancha", .core, .time),
        ("Plancha lateral", .core, .time),
        ("Crunch abdominal", .core, .reps),
        ("Elevación de piernas colgado", .core, .reps),
        ("Cinta de correr", .cardio, .time),
        ("Bicicleta estática", .cardio, .time),
        ("Remo ergómetro", .cardio, .time),
        ("Saltar a la comba", .cardio, .time),
    ]

    /// Nombres de las rutinas de los datos de prueba, para traducirlos al importar.
    static let sampleRoutineNames: [LocalizedStringResource] = ["Empuje", "Tirón", "Pierna", "Cardio y core", "Torso"]
    static let sampleNotes: [LocalizedStringResource] = ["Semana de descarga"]

    /// Nombre en castellano (clave del catálogo) → nombre en el idioma actual.
    static let translatedNames: [String: String] = {
        var names: [String: String] = [:]
        for resource in exercises.map(\.0) + sampleRoutineNames + sampleNotes {
            names[resource.key.lowercased()] = String(localized: resource)
        }
        return names
    }()

    /// Traduce un nombre conocido (p. ej. "Press de banca" → "Press de banca" / "Sentadilla" → "Esquat").
    static func localizedName(_ name: String) -> String {
        translatedNames[name.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()] ?? name
    }

    /// Inserta los ejercicios iniciales solo si no hay ninguno.
    static func insertIfEmpty(into context: ModelContext) {
        let count = (try? context.fetchCount(FetchDescriptor<Exercise>())) ?? 0
        guard count == 0 else { return }
        for (name, group, type) in exercises {
            context.insert(Exercise(name: String(localized: name), muscleGroup: group, trackingType: type))
        }
        try? context.save()
    }
}
