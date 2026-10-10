import Foundation
import SwiftData

struct ImportResult {
    var exercisesCreated = 0
    var routinesCreated = 0
    var workoutsImported = 0
    var setsImported = 0

    var summary: String {
        "\(workoutsImported) entrenos y \(setsImported) series importados. "
            + "Nuevos: \(exercisesCreated) ejercicios, \(routinesCreated) rutinas."
    }
}

/// Inserta en SwiftData el contenido de un `GymBackup`.
/// Los ejercicios y rutinas que ya existen (mismo nombre, sin distinguir mayúsculas) se reutilizan.
enum DataImporter {
    /// Datos de prueba de un año incluidos en la app (GymApp/Resources/sample-data.json).
    static func bundledSample() throws -> GymBackup {
        guard let url = Bundle.main.url(forResource: "sample-data", withExtension: "json") else {
            throw CocoaError(.fileNoSuchFile)
        }
        return try GymBackup.decode(Data(contentsOf: url))
    }

    /// Lee un archivo elegido con el selector de Archivos (fuera del sandbox de la app).
    static func backup(at url: URL) throws -> GymBackup {
        let accessing = url.startAccessingSecurityScopedResource()
        defer { if accessing { url.stopAccessingSecurityScopedResource() } }
        return try GymBackup.decode(Data(contentsOf: url))
    }

    @discardableResult
    static func importBackup(_ backup: GymBackup, into context: ModelContext) throws -> ImportResult {
        var result = ImportResult()

        var exercises: [String: Exercise] = [:]
        for exercise in try context.fetch(FetchDescriptor<Exercise>()) {
            exercises[key(exercise.name)] = exercise
        }
        let exerciseInfo = Dictionary(backup.exercises.map { (key($0.name), $0) }, uniquingKeysWith: { first, _ in first })

        func exercise(named name: String, inferredType: TrackingType) -> Exercise {
            if let existing = exercises[key(name)] { return existing }
            let info = exerciseInfo[key(name)]
            let created = Exercise(
                name: name,
                muscleGroup: info?.muscleGroup.flatMap(MuscleGroup.init(rawValue:)) ?? .other,
                trackingType: info?.trackingType ?? inferredType
            )
            context.insert(created)
            exercises[key(name)] = created
            result.exercisesCreated += 1
            return created
        }

        for info in backup.exercises {
            _ = exercise(named: info.name, inferredType: info.trackingType ?? .reps)
        }

        var routines: [String: Routine] = [:]
        for routine in try context.fetch(FetchDescriptor<Routine>()) {
            routines[key(routine.name)] = routine
        }
        for info in backup.routines where routines[key(info.name)] == nil {
            let routine = Routine(name: info.name)
            context.insert(routine)
            for (order, itemInfo) in info.items.enumerated() {
                let item = RoutineItem(order: order)
                context.insert(item)
                item.exercise = exercise(named: itemInfo.exercise, inferredType: itemInfo.duration != nil ? .time : .reps)
                item.targetSets = itemInfo.sets ?? item.targetSets
                item.targetReps = itemInfo.reps ?? item.targetReps
                item.targetDuration = itemInfo.duration ?? item.targetDuration
                item.routine = routine
            }
            routines[key(info.name)] = routine
            result.routinesCreated += 1
        }

        for info in backup.workouts {
            let workout = Workout(date: info.date)
            context.insert(workout)
            workout.notes = info.notes ?? ""
            workout.isFinished = true
            workout.routine = info.routine.flatMap { routines[key($0)] }

            for (order, entryInfo) in info.exercises.enumerated() {
                let isTimed = entryInfo.sets.contains { $0.duration != nil }
                let entry = WorkoutExercise(order: order)
                context.insert(entry)
                entry.exercise = exercise(named: entryInfo.exercise, inferredType: isTimed ? .time : .reps)
                entry.workout = workout

                for (setOrder, setInfo) in entryInfo.sets.enumerated() {
                    let set = WorkoutSet(order: setOrder)
                    context.insert(set)
                    set.reps = setInfo.reps
                    set.duration = setInfo.duration
                    set.weight = setInfo.weight
                    set.entry = entry
                    result.setsImported += 1
                }
            }
            result.workoutsImported += 1
        }

        try context.save()
        return result
    }

    /// Borra entrenos y rutinas (los ejercicios se conservan).
    static func deleteWorkoutsAndRoutines(in context: ModelContext) throws {
        for workout in try context.fetch(FetchDescriptor<Workout>()) {
            context.delete(workout)
        }
        for routine in try context.fetch(FetchDescriptor<Routine>()) {
            context.delete(routine)
        }
        try context.save()
    }

    private static func key(_ name: String) -> String {
        name.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
    }
}
