import Foundation

/// Métricas que se pueden seguir en la evolución de un ejercicio.
nonisolated enum ProgressMetric: String, CaseIterable, Identifiable {
    case maxWeight
    case oneRepMax
    case volume
    case totalReps
    case maxDuration
    case totalDuration

    var id: String { rawValue }

    var title: String {
        switch self {
        case .maxWeight: "Peso máx."
        case .oneRepMax: "1RM est."
        case .volume: "Volumen"
        case .totalReps: "Reps"
        case .maxDuration: "Duración máx."
        case .totalDuration: "Tiempo total"
        }
    }

    /// Las métricas que tienen sentido para un tipo de ejercicio.
    /// Un ejercicio de peso corporal (dominadas sin lastre) se sigue por repeticiones.
    static func available(for type: TrackingType, usesWeight: Bool) -> [ProgressMetric] {
        switch type {
        case .reps: usesWeight ? [.maxWeight, .oneRepMax, .volume] : [.totalReps]
        case .time: usesWeight ? [.maxDuration, .totalDuration, .maxWeight] : [.maxDuration, .totalDuration]
        }
    }
}

/// Resumen de un conjunto de series (un ejercicio en un entreno, o un entreno entero).
nonisolated struct SessionSummary: Hashable {
    var setCount: Int
    var totalReps: Int
    var maxReps: Int
    var maxWeight: Double
    var bestOneRepMax: Double?
    var volume: Double
    var maxDuration: TimeInterval
    var totalDuration: TimeInterval
    var bestSet: SetRecord?

    init(sets: [SetRecord]) {
        setCount = sets.count
        totalReps = sets.reduce(0) { $0 + ($1.reps ?? 0) }
        maxReps = sets.compactMap(\.reps).max() ?? 0
        maxWeight = sets.map(\.weight).max() ?? 0
        bestOneRepMax = sets.compactMap(\.estimatedOneRepMax).max()
        volume = sets.reduce(0) { $0 + $1.volume }
        maxDuration = sets.compactMap(\.duration).max() ?? 0
        totalDuration = sets.reduce(0) { $0 + ($1.duration ?? 0) }
        bestSet = ExerciseStats.bestSet(in: sets)
    }

    func value(for metric: ProgressMetric) -> Double? {
        switch metric {
        case .maxWeight: maxWeight
        case .oneRepMax: bestOneRepMax
        case .volume: volume
        case .totalReps: Double(totalReps)
        case .maxDuration: maxDuration
        case .totalDuration: totalDuration
        }
    }
}

/// Mejores marcas históricas de un ejercicio.
nonisolated struct PersonalBests: Hashable {
    var sessionCount = 0
    var maxWeight: Double = 0
    var oneRepMax: Double = 0
    var maxReps = 0
    var volume: Double = 0
    var maxDuration: TimeInterval = 0

    init() {}

    init(logs: [ExerciseLog]) {
        for log in logs where !log.sets.isEmpty {
            include(log.summary)
        }
    }

    mutating func include(_ summary: SessionSummary) {
        sessionCount += 1
        maxWeight = max(maxWeight, summary.maxWeight)
        oneRepMax = max(oneRepMax, summary.bestOneRepMax ?? 0)
        maxReps = max(maxReps, summary.maxReps)
        volume = max(volume, summary.volume)
        maxDuration = max(maxDuration, summary.maxDuration)
    }
}

nonisolated struct ProgressPoint: Hashable, Identifiable {
    var date: Date
    var value: Double

    var id: Date { date }
}

nonisolated enum ExerciseStats {
    /// La mejor serie: por reps, la de más peso (y a igual peso, más reps);
    /// por tiempo, la más larga (y a igual tiempo, más peso).
    static func bestSet(in sets: [SetRecord]) -> SetRecord? {
        sets.max { rank($0) < rank($1) }
    }

    private static func rank(_ set: SetRecord) -> (Double, Double) {
        switch set {
        case .reps(let reps, let weight): (weight, Double(reps))
        case .time(let duration, let weight): (duration, weight)
        }
    }

    /// Un punto por entreno, en orden cronológico, desde `start` (o todo el historial).
    static func progress(of logs: [ExerciseLog], metric: ProgressMetric, since start: Date? = nil) -> [ProgressPoint] {
        logs
            .filter { log in start.map { log.date >= $0 } ?? true }
            .sorted { $0.date < $1.date }
            .compactMap { log in
                guard !log.sets.isEmpty, let value = log.summary.value(for: metric) else { return nil }
                return ProgressPoint(date: log.date, value: value)
            }
    }
}
