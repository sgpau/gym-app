import Foundation

/// Cómo se mide un ejercicio: por repeticiones o por tiempo.
nonisolated enum TrackingType: String, Codable, CaseIterable, Identifiable {
    case reps
    case time

    var id: String { rawValue }

    var title: String {
        switch self {
        case .reps: String(localized: "Repeticiones")
        case .time: String(localized: "Tiempo")
        }
    }
}

/// Una serie ya realizada, independiente de SwiftData para poder calcular y testear sin la app.
/// El peso está en kg; 0 significa peso corporal (sin carga añadida).
nonisolated enum SetRecord: Hashable {
    case reps(Int, weight: Double)
    case time(TimeInterval, weight: Double)

    var weight: Double {
        switch self {
        case .reps(_, let weight), .time(_, let weight): weight
        }
    }

    var reps: Int? {
        switch self {
        case .reps(let reps, _): reps
        case .time: nil
        }
    }

    var duration: TimeInterval? {
        switch self {
        case .reps: nil
        case .time(let duration, _): duration
        }
    }

    /// Kilos movidos en la serie (reps × peso). Las series por tiempo no suman volumen.
    var volume: Double {
        switch self {
        case .reps(let reps, let weight): Double(reps) * weight
        case .time: 0
        }
    }

    /// 1RM estimado con la fórmula de Epley. `nil` si la serie no tiene peso o repeticiones.
    var estimatedOneRepMax: Double? {
        guard case .reps(let reps, let weight) = self, reps > 0, weight > 0 else { return nil }
        return reps == 1 ? weight : weight * (1 + Double(reps) / 30)
    }
}

/// Todas las series de un ejercicio dentro de un entreno.
nonisolated struct ExerciseLog: Hashable {
    /// Identificador estable del ejercicio (su UUID en texto).
    var exerciseID: String
    var name: String
    var trackingType: TrackingType
    var date: Date
    var sets: [SetRecord]

    var summary: SessionSummary { SessionSummary(sets: sets) }
}
