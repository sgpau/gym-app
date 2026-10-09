import Foundation
import SwiftData

@Model
final class Routine {
    var name: String = ""
    var createdAt: Date = Date.now

    @Relationship(deleteRule: .cascade, inverse: \RoutineItem.routine)
    var items: [RoutineItem] = []

    /// Al borrar una rutina, sus entrenos se conservan como entrenos libres.
    @Relationship(deleteRule: .nullify, inverse: \Workout.routine)
    var workouts: [Workout] = []

    init(name: String) {
        self.name = name
    }

    /// SwiftData no conserva el orden de los arrays: se ordena por `order`.
    var sortedItems: [RoutineItem] { items.sorted { $0.order < $1.order } }

    var lastPerformed: Date? {
        workouts.filter(\.isFinished).map(\.date).max()
    }
}
