import Charts
import SwiftData
import SwiftUI

/// Resumen al finalizar: qué ha mejorado respecto al entreno anterior y los récords nuevos.
struct WorkoutSummaryView: View {
    let workout: Workout
    /// Al terminar el flujo de entreno; si es `nil` (abierto desde el calendario) se cierra la hoja.
    var onDone: (() -> Void)?

    @Environment(\.dismiss) private var dismiss
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @AppStorage(AccentChoice.storageKey) private var accent: AccentChoice = .blue
    @State private var celebrate = false

    var body: some View {
        let comparison = workout.comparison()
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                header(comparison)
                totals(comparison)
                if comparison.newRecordCount > 0 {
                    recordsBanner(count: comparison.newRecordCount)
                }
                volumeChart(comparison)
                VStack(spacing: 12) {
                    ForEach(comparison.exercises) { ComparisonRow(comparison: $0) }
                }
            }
            .padding()
        }
        .navigationTitle("Resumen")
        .navigationBarTitleDisplayMode(.inline)
        .navigationBarBackButtonHidden(onDone != nil)
        .toolbar {
            ToolbarItem(placement: .pinnedPrimary) {
                Button("Listo") {
                    if let onDone { onDone() } else { dismiss() }
                }
                .buttonStyle(.glassProminent)
            }
        }
        .sensoryFeedback(.success, trigger: celebrate)
        .task {
            // Solo se celebra al acabar el entreno, no al revisarlo desde el calendario.
            guard onDone != nil, comparison.newRecordCount > 0 else { return }
            try? await Task.sleep(for: .milliseconds(350))
            celebrate = true
        }
    }

    private func header(_ comparison: WorkoutComparison) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(onDone != nil ? String(localized: "¡Entreno completado!") : workout.title)
                .font(.largeTitle.bold())
            Text(onDone != nil ? "\(workout.title) · \(workout.date.dayTitle)" : workout.date.dayTitle.capitalized(with: .current))
                .font(.headline)
                .foregroundStyle(.secondary)
            Text(comparisonCaption(comparison))
                .font(.subheadline)
                .foregroundStyle(.secondary)
        }
    }

    private func comparisonCaption(_ comparison: WorkoutComparison) -> String {
        if let date = comparison.previousDate {
            return String(localized: "Comparado con tu entreno del \(date.formatted(.dateTime.day().month(.wide)))")
        }
        if workout.routine != nil {
            return String(localized: "Primera vez con esta rutina: cada ejercicio se compara con la última vez que lo hiciste.")
        }
        return String(localized: "Cada ejercicio se compara con la última vez que lo hiciste.")
    }

    @ViewBuilder
    private func totals(_ comparison: WorkoutComparison) -> some View {
        let columns = [GridItem(.flexible(), spacing: 12), GridItem(.flexible(), spacing: 12)]
        LazyVGrid(columns: columns, spacing: 12) {
            if comparison.volume.current > 0 || (comparison.volume.previous ?? 0) > 0 {
                TotalTile(title: "Volumen", delta: comparison.volume, metric: .volume)
            }
            TotalTile(title: "Series", delta: comparison.sets, metric: .totalReps)
            if comparison.reps.current > 0 {
                TotalTile(title: "Repeticiones", delta: comparison.reps, metric: .totalReps)
            }
            if comparison.duration.current > 0 {
                TotalTile(title: "Tiempo", delta: comparison.duration, metric: .totalDuration)
            }
        }
    }

    private func recordsBanner(count: Int) -> some View {
        HStack(spacing: 14) {
            Image(systemName: "trophy.fill")
                .font(.title)
                .foregroundStyle(.orange)
                .symbolEffect(.bounce, value: reduceMotion ? false : celebrate)
            VStack(alignment: .leading, spacing: 2) {
                Text(count == 1 ? String(localized: "¡Nuevo récord personal!") : String(localized: "¡\(count) nuevos récords personales!"))
                    .font(.headline)
                Text("Superas tu mejor marca de siempre.")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
        }
        .glassCard(tint: .orange.opacity(0.25))
        .accessibilityElement(children: .combine)
    }

    @ViewBuilder
    private func volumeChart(_ comparison: WorkoutComparison) -> some View {
        let todayLabel = String(localized: "Hoy")
        let previousLabel = String(localized: "Anterior")
        let rows = comparison.exercises.filter { $0.current.volume > 0 || ($0.previous?.volume ?? 0) > 0 }
        if !rows.isEmpty {
            VStack(alignment: .leading, spacing: 12) {
                Text("Volumen por ejercicio")
                    .font(.headline)
                Chart {
                    ForEach(rows) { row in
                        if let previous = row.previous?.volume {
                            BarMark(x: .value("Volumen", previous), y: .value("Ejercicio", row.name))
                                .foregroundStyle(by: .value("Entreno", previousLabel))
                                .position(by: .value("Entreno", previousLabel))
                        }
                        BarMark(x: .value("Volumen", row.current.volume), y: .value("Ejercicio", row.name))
                            .foregroundStyle(by: .value("Entreno", todayLabel))
                            .position(by: .value("Entreno", todayLabel))
                    }
                }
                .chartForegroundStyleScale([todayLabel: accent.color, previousLabel: Color.secondary.opacity(0.45)])
                .chartXAxis {
                    AxisMarks { value in
                        AxisGridLine()
                        AxisValueLabel {
                            if let kg = value.as(Double.self) { Text(Format.weight(kg, fractionDigits: 0)) }
                        }
                    }
                }
                .frame(height: CGFloat(rows.count) * 56 + 40)
            }
            .contentCard()
        }
    }
}

private struct TotalTile: View {
    let title: LocalizedStringKey
    let delta: Delta
    let metric: ProgressMetric

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(title)
                .font(.subheadline)
                .foregroundStyle(.secondary)
            Text(Format.value(delta.current, for: metric))
                .font(.title2.bold())
                .monospacedDigit()
                .lineLimit(1)
                .minimumScaleFactor(0.7)
            DeltaBadge(delta: delta, metric: metric, showsPercent: true)
        }
        .contentCard(cornerRadius: 18)
        .accessibilityElement(children: .combine)
    }
}

/// Un ejercicio: mejor serie de hoy frente a la anterior y cómo cambia cada métrica.
struct ComparisonRow: View {
    let comparison: ExerciseComparison
    @AppStorage(AccentChoice.storageKey) private var accent: AccentChoice = .blue

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(alignment: .firstTextBaseline) {
                Text(comparison.name)
                    .font(.headline)
                Spacer()
                if comparison.isFirstTime {
                    Text("Primera vez")
                        .font(.caption.weight(.semibold))
                        .padding(.horizontal, 8)
                        .padding(.vertical, 3)
                        .background(accent.color.opacity(0.15), in: .capsule)
                        .foregroundStyle(accent.color)
                }
                if !comparison.newRecords.isEmpty {
                    Label("Récord", systemImage: "trophy.fill")
                        .font(.caption.weight(.bold))
                        .foregroundStyle(.orange)
                }
            }

            if let best = comparison.current.bestSet {
                VStack(alignment: .leading, spacing: 2) {
                    Text("Hoy: \(Format.set(best))")
                        .font(.subheadline.weight(.medium))
                    if let previous = comparison.previous?.bestSet, let date = comparison.previousDate {
                        Text("\(date.shortDay): \(Format.set(previous))")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                    }
                }
                .monospacedDigit()
            }

            HStack(alignment: .top, spacing: 16) {
                ForEach(comparison.metrics) { item in
                    VStack(alignment: .leading, spacing: 3) {
                        Text(item.metric.title)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                        Text(Format.value(item.delta.current, for: item.metric))
                            .font(.subheadline.weight(.semibold))
                            .monospacedDigit()
                            .lineLimit(1)
                            .minimumScaleFactor(0.8)
                        if !comparison.isFirstTime {
                            DeltaBadge(delta: item.delta, metric: item.metric)
                        }
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                }
            }

            if !comparison.newRecords.isEmpty {
                Text(comparison.newRecords.map(\.title).joined(separator: " · "))
                    .font(.caption.weight(.medium))
                    .foregroundStyle(.orange)
            }
        }
        .contentCard()
    }
}

#Preview {
    NavigationStack {
        WorkoutSummaryView(workout: PreviewData.lastWorkout) {}
    }
    .modelContainer(PreviewData.container)
}
