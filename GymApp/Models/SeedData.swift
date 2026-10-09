import Foundation
import SwiftData

/// Ejercicios con los que arranca la app. Se pueden editar o borrar.
enum SeedData {
    static let exercises: [(String, MuscleGroup, TrackingType)] = [
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

    /// Inserta los ejercicios iniciales solo si no hay ninguno.
    static func insertIfEmpty(into context: ModelContext) {
        let count = (try? context.fetchCount(FetchDescriptor<Exercise>())) ?? 0
        guard count == 0 else { return }
        for (name, group, type) in exercises {
            context.insert(Exercise(name: name, muscleGroup: group, trackingType: type))
        }
        try? context.save()
    }
}
