import Foundation

nonisolated enum Trend: Hashable {
    case up
    case down
    case same
    /// No hay nada con lo que comparar.
    case new
}

/// Un valor de hoy frente al de la vez anterior.
nonisolated struct Delta: Hashable {
    var current: Double
    var previous: Double?

    var change: Double? { previous.map { current - $0 } }

    /// Cambio relativo (0.06 = +6 %). `nil` si no hay valor anterior o era 0.
    var percent: Double? {
        guard let previous, previous != 0 else { return nil }
        return (current - previous) / previous
    }

    var trend: Trend {
        guard let change else { return .new }
        if abs(change) < 0.0001 { return .same }
        return change > 0 ? .up : .down
    }
}

nonisolated enum RecordKind: String, Hashable, CaseIterable {
    case maxWeight
    case oneRepMax
    case maxReps
    case maxDuration

    var title: String {
        switch self {
        case .maxWeight: "Récord de peso"
        case .oneRepMax: "Récord de 1RM"
        case .maxReps: "Récord de repeticiones"
        case .maxDuration: "Récord de tiempo"
        }
    }
}

nonisolated struct MetricDelta: Hashable, Identifiable {
    var metric: ProgressMetric
    var delta: Delta

    var id: ProgressMetric { metric }
}

nonisolated struct ExerciseComparison: Hashable, Identifiable {
    var exerciseID: String
    var name: String
    var trackingType: TrackingType
    var current: SessionSummary
    var previous: SessionSummary?
    var previousDate: Date?
    var metrics: [MetricDelta]
    var newRecords: [RecordKind]

    var id: String { exerciseID }
    var isFirstTime: Bool { previous == nil }
}

nonisolated struct PreviousWorkout: Hashable {
    var date: Date
    var logs: [ExerciseLog]
}

nonisolated struct WorkoutComparison: Hashable {
    var exercises: [ExerciseComparison]
    /// Fecha del entreno anterior de la misma rutina, si lo hay.
    var previousDate: Date?
    var volume: Delta
    var sets: Delta
    var reps: Delta
    var duration: Delta

    var newRecordCount: Int { exercises.reduce(0) { $0 + $1.newRecords.count } }
}

nonisolated enum WorkoutComparator {
    /// Compara un entreno recién hecho con el anterior.
    /// - Parameters:
    ///   - current: los ejercicios del entreno de hoy.
    ///   - previous: el entreno anterior de la misma rutina (nil en entrenos libres o si es el primero).
    ///   - lastLogs: la última vez que se hizo cada ejercicio, para los que no estaban en `previous`.
    ///   - bests: las mejores marcas de cada ejercicio *antes* de hoy, para detectar récords.
    static func compare(
        current: [ExerciseLog],
        previous: PreviousWorkout?,
        lastLogs: [String: ExerciseLog] = [:],
        bests: [String: PersonalBests] = [:]
    ) -> WorkoutComparison {
        let logs = current.filter { !$0.sets.isEmpty }
        let exercises = logs.map { log in
            let previousLog = previous?.logs.first { $0.exerciseID == log.exerciseID && !$0.sets.isEmpty }
                ?? lastLogs[log.exerciseID]
            return compare(log, with: previousLog, best: bests[log.exerciseID])
        }

        let today = SessionSummary(sets: logs.flatMap(\.sets))
        let before = previous.map { SessionSummary(sets: $0.logs.flatMap(\.sets)) }

        return WorkoutComparison(
            exercises: exercises,
            previousDate: previous?.date,
            volume: Delta(current: today.volume, previous: before?.volume),
            sets: Delta(current: Double(today.setCount), previous: before.map { Double($0.setCount) }),
            reps: Delta(current: Double(today.totalReps), previous: before.map { Double($0.totalReps) }),
            duration: Delta(current: today.totalDuration, previous: before?.totalDuration)
        )
    }

    static func compare(_ log: ExerciseLog, with previousLog: ExerciseLog?, best: PersonalBests?) -> ExerciseComparison {
        let current = log.summary
        let previous = previousLog?.summary
        let usesWeight = current.maxWeight > 0 || (previous?.maxWeight ?? 0) > 0
        let metrics = ProgressMetric.available(for: log.trackingType, usesWeight: usesWeight).map { metric in
            MetricDelta(
                metric: metric,
                delta: Delta(
                    current: current.value(for: metric) ?? 0,
                    previous: previous.map { $0.value(for: metric) ?? 0 }
                )
            )
        }
        return ExerciseComparison(
            exerciseID: log.exerciseID,
            name: log.name,
            trackingType: log.trackingType,
            current: current,
            previous: previous,
            previousDate: previousLog?.date,
            metrics: metrics,
            newRecords: newRecords(in: current, type: log.trackingType, best: best)
        )
    }

    /// Récords respecto a todo el historial. La primera vez que se hace un ejercicio no cuenta como récord.
    static func newRecords(in summary: SessionSummary, type: TrackingType, best: PersonalBests?) -> [RecordKind] {
        guard let best, best.sessionCount > 0 else { return [] }
        var records: [RecordKind] = []
        switch type {
        case .reps:
            if summary.maxWeight > 0 {
                if summary.maxWeight > best.maxWeight { records.append(.maxWeight) }
                if let oneRepMax = summary.bestOneRepMax, oneRepMax > best.oneRepMax { records.append(.oneRepMax) }
            } else if summary.maxReps > best.maxReps {
                records.append(.maxReps)
            }
        case .time:
            if summary.maxDuration > best.maxDuration { records.append(.maxDuration) }
        }
        return records
    }
}
