import Foundation
import SwiftData

/// Una serie: repeticiones o duración, y peso opcional en kg.
@Model
final class WorkoutSet {
    var order: Int = 0
    var reps: Int?
    /// Segundos, para ejercicios por tiempo.
    var duration: Double?
    var weight: Double?
    var entry: WorkoutExercise?

    init(order: Int) {
        self.order = order
    }

    /// La serie como dato puro, o `nil` si aún está vacía.
    func record(as type: TrackingType) -> SetRecord? {
        switch type {
        case .reps:
            guard let reps, reps > 0 else { return nil }
            return .reps(reps, weight: weight ?? 0)
        case .time:
            guard let duration, duration > 0 else { return nil }
            return .time(duration, weight: weight ?? 0)
        }
    }
}
