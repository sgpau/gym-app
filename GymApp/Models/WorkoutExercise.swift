import Foundation
import SwiftData

/// Un ejercicio hecho en un entreno concreto.
@Model
final class WorkoutExercise {
    var order: Int = 0
    var workout: Workout?
    var exercise: Exercise?

    @Relationship(deleteRule: .cascade, inverse: \WorkoutSet.entry)
    var sets: [WorkoutSet] = []

    init(order: Int) {
        self.order = order
    }

    var sortedSets: [WorkoutSet] { sets.sorted { $0.order < $1.order } }

    var nextSetOrder: Int { (sets.map(\.order).max() ?? -1) + 1 }
}
