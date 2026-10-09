import Foundation
import SwiftData

/// Puente entre los modelos de SwiftData y la lógica pura de `Core/`.

enum AppSchema {
    static let models: [any PersistentModel.Type] = [
        Exercise.self, Routine.self, RoutineItem.self, Workout.self, WorkoutExercise.self, WorkoutSet.self,
    ]
}

extension WorkoutExercise {
    var records: [SetRecord] {
        guard let type = exercise?.trackingType else { return [] }
        return sortedSets.compactMap { $0.record(as: type) }
    }

    var log: ExerciseLog? {
        guard let exercise, let workout else { return nil }
        return ExerciseLog(
            exerciseID: exercise.uuid.uuidString,
            name: exercise.name,
            trackingType: exercise.trackingType,
            date: workout.date,
            sets: records
        )
    }
}

extension Exercise {
    /// Historial de entrenos finalizados con series, del más antiguo al más reciente.
    func logs(before date: Date? = nil, excluding excluded: Workout? = nil) -> [ExerciseLog] {
        workoutEntries
            .filter { entry in
                guard let workout = entry.workout, workout.isFinished else { return false }
                if let excluded, workout.persistentModelID == excluded.persistentModelID { return false }
                if let date, workout.date >= date { return false }
                return true
            }
            .compactMap(\.log)
            .filter { !$0.sets.isEmpty }
            .sorted { $0.date < $1.date }
    }
}

extension Workout {
    var logs: [ExerciseLog] {
        sortedEntries.compactMap(\.log).filter { !$0.sets.isEmpty }
    }

    var summary: SessionSummary { SessionSummary(sets: logs.flatMap(\.sets)) }

    /// El último entreno finalizado de la misma rutina antes de este.
    var previousWorkoutOfRoutine: Workout? {
        routine?.workouts
            .filter { $0.isFinished && $0.persistentModelID != persistentModelID && $0.date < date }
            .max { $0.date < $1.date }
    }

    /// Compara este entreno con el anterior de su rutina y con el historial de cada ejercicio.
    func comparison() -> WorkoutComparison {
        let previous = previousWorkoutOfRoutine.map { PreviousWorkout(date: $0.date, logs: $0.logs) }
        var lastLogs: [String: ExerciseLog] = [:]
        var bests: [String: PersonalBests] = [:]
        for entry in sortedEntries {
            guard let exercise = entry.exercise else { continue }
            let history = exercise.logs(before: date, excluding: self)
            let key = exercise.uuid.uuidString
            lastLogs[key] = history.last
            bests[key] = PersonalBests(logs: history)
        }
        return WorkoutComparator.compare(current: logs, previous: previous, lastLogs: lastLogs, bests: bests)
    }
}
