import Foundation

/// Textos de pesos, tiempos y series tal y como se muestran en la app.
nonisolated enum Format {
    static func number(_ value: Double, fractionDigits: Int = 2, locale: Locale = .current) -> String {
        let formatter = NumberFormatter()
        formatter.locale = locale
        formatter.numberStyle = .decimal
        formatter.minimumFractionDigits = 0
        formatter.maximumFractionDigits = fractionDigits
        return formatter.string(from: NSNumber(value: value)) ?? String(value)
    }

    /// "62,5 kg"
    static func weight(_ kilograms: Double, fractionDigits: Int = 2, locale: Locale = .current) -> String {
        "\(number(kilograms, fractionDigits: fractionDigits, locale: locale)) kg"
    }

    /// "1:05" o "1:02:05"
    static func duration(_ seconds: TimeInterval) -> String {
        let total = max(0, Int(seconds.rounded()))
        let hours = total / 3600
        let minutes = (total % 3600) / 60
        let secs = total % 60
        return hours > 0
            ? String(format: "%d:%02d:%02d", hours, minutes, secs)
            : String(format: "%d:%02d", minutes, secs)
    }

    /// Una serie: "62,5 kg × 8", "12 reps", "1:00" o "0:45 · 10 kg".
    static func set(_ record: SetRecord, locale: Locale = .current) -> String {
        switch record {
        case .reps(let reps, let kg):
            kg > 0 ? "\(weight(kg, locale: locale)) × \(reps)" : "\(reps) reps"
        case .time(let seconds, let kg):
            kg > 0 ? "\(duration(seconds)) · \(weight(kg, locale: locale))" : duration(seconds)
        }
    }

    /// Resumen de varias series: "3×8 · 60 kg", "8, 8, 6 · 60 kg" o "3×1:00".
    static func setSummary(_ sets: [SetRecord], locale: Locale = .current) -> String {
        guard !sets.isEmpty else { return "Sin series" }
        let values = sets.map { set in
            switch set {
            case .reps(let reps, _): String(reps)
            case .time(let seconds, _): duration(seconds)
            }
        }
        let counts = Set(values).count == 1 ? "\(sets.count)×\(values[0])" : values.joined(separator: ", ")
        let maxWeight = sets.map(\.weight).max() ?? 0
        return maxWeight > 0 ? "\(counts) · \(weight(maxWeight, locale: locale))" : counts
    }

    /// El valor de una métrica con su unidad.
    static func value(_ value: Double, for metric: ProgressMetric, locale: Locale = .current) -> String {
        switch metric {
        case .maxWeight, .volume: weight(value, locale: locale)
        case .oneRepMax: weight(value, fractionDigits: 1, locale: locale)
        case .totalReps: number(value, fractionDigits: 0, locale: locale)
        case .maxDuration, .totalDuration: duration(value)
        }
    }

    /// La diferencia con signo: "+2,5 kg", "−0:15", "Igual" o "Nuevo".
    static func change(_ delta: Delta, for metric: ProgressMetric, locale: Locale = .current) -> String {
        guard let change = delta.change else { return "Nuevo" }
        if abs(change) < 0.0001 { return "Igual" }
        let sign = change > 0 ? "+" : "−"
        return sign + value(abs(change), for: metric, locale: locale)
    }

    /// "+6 %", "−3 %" o "0 %".
    static func percent(_ fraction: Double) -> String {
        let percent = Int((fraction * 100).rounded())
        if percent > 0 { return "+\(percent) %" }
        if percent < 0 { return "−\(-percent) %" }
        return "0 %"
    }
}
