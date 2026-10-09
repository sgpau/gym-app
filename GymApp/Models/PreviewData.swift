import Foundation
import SwiftData

/// Datos de ejemplo en memoria para los #Preview de Xcode.
enum PreviewData {
    static let container: ModelContainer = {
        let schema = Schema(AppSchema.models)
        let container = try! ModelContainer(for: schema, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        let context = container.mainContext
        SeedData.insertIfEmpty(into: context)

        let routine = Routine(name: "Torso")
        context.insert(routine)
        for (order, name) in ["Press de banca", "Remo con barra", "Dominadas", "Plancha"].enumerated() {
            let item = RoutineItem(order: order)
            context.insert(item)
            item.exercise = exercise(named: name, in: context)
            item.routine = routine
        }

        // Cuatro semanas progresando un poco cada vez.
        let progression: [[Double]] = [[55, 50], [57.5, 50], [60, 52.5], [62.5, 55]]
        for (week, weights) in progression.enumerated() {
            let day = Calendar.current.date(byAdding: .day, value: -7 * (progression.count - week), to: .now)!
            let workout = WorkoutFactory.makeWorkout(routine: routine, day: day, in: context)
            for (index, entry) in workout.sortedEntries.enumerated() {
                for set in entry.sets {
                    if index < weights.count { set.weight = weights[index] }
                    if entry.exercise?.name == "Dominadas" { set.reps = 6 + week }
                    if entry.exercise?.trackingType == .time { set.duration = 45 + Double(week) * 10 }
                }
            }
            workout.isFinished = true
        }
        try? context.save()
        return container
    }()

    static var routine: Routine {
        try! container.mainContext.fetch(FetchDescriptor<Routine>()).first!
    }

    static var benchPress: Exercise {
        exercise(named: "Press de banca", in: container.mainContext)!
    }

    static var lastWorkout: Workout {
        var descriptor = FetchDescriptor<Workout>(sortBy: [SortDescriptor(\.date, order: .reverse)])
        descriptor.fetchLimit = 1
        return try! container.mainContext.fetch(descriptor).first!
    }

    private static func exercise(named name: String, in context: ModelContext) -> Exercise? {
        let descriptor = FetchDescriptor<Exercise>(predicate: #Predicate { $0.name == name })
        return try? context.fetch(descriptor).first
    }
}
