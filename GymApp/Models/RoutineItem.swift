import Foundation
import SwiftData

/// Un ejercicio dentro de una rutina, con su objetivo de series × reps (o × tiempo).
@Model
final class RoutineItem {
    var order: Int = 0
    var targetSets: Int = 3
    var targetReps: Int = 10
    /// Segundos por serie, para ejercicios por tiempo.
    var targetDuration: Double = 60
    var routine: Routine?
    var exercise: Exercise?

    init(order: Int) {
        self.order = order
    }
}
