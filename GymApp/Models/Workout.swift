import Foundation
import SwiftData

@Model
final class Workout {
    var date: Date = Date.now
    var notes: String = ""
    /// Un entreno sin finalizar sigue "en curso" (por ejemplo, si se cerró la app a mitad).
    var isFinished: Bool = false
    var routine: Routine?

    @Relationship(deleteRule: .cascade, inverse: \WorkoutExercise.workout)
    var entries: [WorkoutExercise] = []

    init(date: Date) {
        self.date = date
    }

    var sortedEntries: [WorkoutExercise] { entries.sorted { $0.order < $1.order } }

    var title: String {
        guard let name = routine?.name, !name.isEmpty else { return "Entrenamiento libre" }
        return name
    }
}
