import Foundation
import SwiftData

/// Crea entrenos, ejercicios y series ya rellenados con los objetivos de la rutina
/// y el peso que se usó la última vez.
enum WorkoutFactory {
    /// Hoy usa la hora actual; otro día del calendario usa ese día a la hora actual,
    /// para que varios entrenos del mismo día mantengan su orden.
    static func workoutDate(for day: Date, now: Date = .now, calendar: Calendar = .current) -> Date {
        if calendar.isDate(day, inSameDayAs: now) { return now }
        let time = calendar.dateComponents([.hour, .minute, .second], from: now)
        return calendar.date(
            bySettingHour: time.hour ?? 12, minute: time.minute ?? 0, second: time.second ?? 0, of: day
        ) ?? day
    }

    @discardableResult
    static func makeWorkout(routine: Routine?, day: Date, in context: ModelContext) -> Workout {
        let workout = Workout(date: workoutDate(for: day))
        context.insert(workout)
        workout.routine = routine
        for item in routine?.sortedItems ?? [] {
            guard let exercise = item.exercise else { continue }
            addEntry(
                for: exercise, to: workout, sets: item.targetSets,
                reps: item.targetReps, duration: item.targetDuration, in: context
            )
        }
        return workout
    }

    @discardableResult
    static func addEntry(
        for exercise: Exercise,
        to workout: Workout,
        sets: Int = 3,
        reps: Int? = nil,
        duration: TimeInterval? = nil,
        in context: ModelContext
    ) -> WorkoutExercise {
        let last = exercise.logs(before: workout.date, excluding: workout).last?.summary
        let lastWeight = last.flatMap { $0.maxWeight > 0 ? $0.maxWeight : nil }

        let entry = WorkoutExercise(order: (workout.entries.map(\.order).max() ?? -1) + 1)
        context.insert(entry)
        entry.exercise = exercise
        entry.workout = workout

        for index in 0..<max(sets, 1) {
            let set = WorkoutSet(order: index)
            context.insert(set)
            switch exercise.trackingType {
            case .reps: set.reps = reps ?? last?.bestSet?.reps
            case .time: set.duration = duration ?? last?.bestSet?.duration
            }
            set.weight = lastWeight
            set.entry = entry
        }
        return entry
    }

    /// Añade una serie copiando la anterior, que suele ser lo que se repite.
    static func addSet(to entry: WorkoutExercise, in context: ModelContext) {
        let previous = entry.sortedSets.last
        let set = WorkoutSet(order: entry.nextSetOrder)
        context.insert(set)
        set.reps = previous?.reps
        set.duration = previous?.duration
        set.weight = previous?.weight
        set.entry = entry
    }
}
