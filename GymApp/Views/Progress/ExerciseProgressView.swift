import Charts
import SwiftData
import SwiftUI

nonisolated enum ProgressRange: String, CaseIterable, Identifiable {
    case threeMonths, sixMonths, year, all

    var id: String { rawValue }

    var title: String {
        switch self {
        case .threeMonths: String(localized: "3M")
        case .sixMonths: String(localized: "6M")
        case .year: String(localized: "1A")
        case .all: String(localized: "Todo")
        }
    }

    func start(from now: Date, calendar: Calendar = .current) -> Date? {
        switch self {
        case .threeMonths: calendar.date(byAdding: .month, value: -3, to: now)
        case .sixMonths: calendar.date(byAdding: .month, value: -6, to: now)
        case .year: calendar.date(byAdding: .year, value: -1, to: now)
        case .all: nil
        }
    }
}

/// Evolución de un ejercicio: gráfica por métrica, récords e historial.
struct ExerciseProgressView: View {
    let exercise: Exercise

    @State private var selectedMetric: ProgressMetric? = nil
    @State private var range: ProgressRange = .all
    @AppStorage(AccentChoice.storageKey) private var accent: AccentChoice = .blue

    var body: some View {
        let logs = exercise.logs()
        let metrics = ProgressMetric.available(
            for: exercise.trackingType,
            usesWeight: logs.contains { $0.summary.maxWeight > 0 }
        )
        let metric = selectedMetric.flatMap { metrics.contains($0) ? $0 : nil } ?? metrics[0]
        let points = ExerciseStats.progress(of: logs, metric: metric, since: range.start(from: .now))

        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                if metrics.count > 1 {
                    Picker("Métrica", selection: Binding(get: { metric }, set: { selectedMetric = $0 })) {
                        ForEach(metrics) { Text($0.title).tag($0) }
                    }
                    .pickerStyle(.segmented)
                }

                chartCard(points: points, metric: metric)

                records(PersonalBests(logs: logs))

                history(logs)
            }
            .padding()
        }
        .navigationTitle(exercise.name)
        .sensoryFeedback(.selection, trigger: range)
    }

    private func chartCard(points: [ProgressPoint], metric: ProgressMetric) -> some View {
        VStack(alignment: .leading, spacing: 14) {
            if let first = points.first, let last = points.last, points.count > 1 {
                VStack(alignment: .leading, spacing: 4) {
                    Text(Format.value(last.value, for: metric))
                        .font(.title.bold())
                        .monospacedDigit()
                    DeltaBadge(delta: Delta(current: last.value, previous: first.value), metric: metric, showsPercent: true)
                    Text("desde el \(first.date.formatted(.dateTime.day().month(.wide).year()))")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }

            if points.isEmpty {
                ContentUnavailableView("Sin datos en este periodo", systemImage: "chart.xyaxis.line")
                    .frame(height: 220)
            } else {
                Chart(points) { point in
                    LineMark(x: .value("Fecha", point.date), y: .value(metric.title, point.value))
                        .interpolationMethod(.monotone)
                        .foregroundStyle(accent.color)
                    PointMark(x: .value("Fecha", point.date), y: .value(metric.title, point.value))
                        .foregroundStyle(accent.color)
                    AreaMark(x: .value("Fecha", point.date), y: .value(metric.title, point.value))
                        .interpolationMethod(.monotone)
                        .foregroundStyle(
                            LinearGradient(colors: [accent.color.opacity(0.25), accent.color.opacity(0)], startPoint: .top, endPoint: .bottom)
                        )
                }
                .chartYAxis {
                    AxisMarks(position: .leading) { value in
                        AxisGridLine()
                        AxisValueLabel {
                            if let number = value.as(Double.self) {
                                Text(Format.value(number, for: metric))
                            }
                        }
                    }
                }
                .frame(height: 220)
                .accessibilityLabel("Evolución de \(metric.title)")
            }

            Picker("Periodo", selection: $range) {
                ForEach(ProgressRange.allCases) { Text($0.title).tag($0) }
            }
            .pickerStyle(.segmented)
        }
        .contentCard()
    }

    @ViewBuilder
    private func records(_ bests: PersonalBests) -> some View {
        let cards = recordCards(bests)
        VStack(alignment: .leading, spacing: 12) {
            Text("Récords personales")
                .font(.headline)
            GlassEffectContainer(spacing: 12) {
                LazyVGrid(columns: [GridItem(.flexible(), spacing: 12), GridItem(.flexible(), spacing: 12)], spacing: 12) {
                    ForEach(cards, id: \.title) { card in
                        VStack(alignment: .leading, spacing: 4) {
                            Text(card.title)
                                .font(.caption)
                                .foregroundStyle(.secondary)
                            Text(card.value)
                                .font(.title3.bold())
                                .monospacedDigit()
                                .lineLimit(1)
                                .minimumScaleFactor(0.7)
                        }
                        .glassCard(cornerRadius: 18)
                        .accessibilityElement(children: .combine)
                    }
                }
            }
        }
    }

    private func recordCards(_ bests: PersonalBests) -> [(title: String, value: String)] {
        var cards: [(title: String, value: String)] = []
        switch exercise.trackingType {
        case .reps:
            if bests.maxWeight > 0 {
                cards.append((String(localized: "Mejor peso"), Format.weight(bests.maxWeight)))
                cards.append((String(localized: "1RM estimado"), Format.weight(bests.oneRepMax, fractionDigits: 1)))
                cards.append((String(localized: "Más volumen"), Format.weight(bests.volume)))
            } else {
                cards.append((String(localized: "Más reps en una serie"), "\(bests.maxReps)"))
            }
        case .time:
            cards.append((String(localized: "Mejor tiempo"), Format.duration(bests.maxDuration)))
            if bests.maxWeight > 0 { cards.append((String(localized: "Mejor peso"), Format.weight(bests.maxWeight))) }
        }
        cards.append((String(localized: "Sesiones"), "\(bests.sessionCount)"))
        return cards
    }

    private func history(_ logs: [ExerciseLog]) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Historial")
                .font(.headline)
            VStack(spacing: 0) {
                ForEach(Array(logs.reversed().enumerated()), id: \.offset) { index, log in
                    if index > 0 { Divider() }
                    HStack {
                        Text(log.date.formatted(.dateTime.day().month(.abbreviated).year()))
                            .foregroundStyle(.secondary)
                        Spacer()
                        Text(Format.setSummary(log.sets))
                            .monospacedDigit()
                    }
                    .font(.subheadline)
                    .padding(.vertical, 10)
                }
            }
            .padding(.horizontal)
            .background(.background.secondary, in: .rect(cornerRadius: 20))
        }
    }
}

#Preview("Claro") {
    NavigationStack {
        ExerciseProgressView(exercise: PreviewData.benchPress)
    }
    .modelContainer(PreviewData.container)
}

#Preview("Oscuro") {
    NavigationStack {
        ExerciseProgressView(exercise: PreviewData.benchPress)
    }
    .modelContainer(PreviewData.container)
    .preferredColorScheme(.dark)
}
