import SwiftData
import SwiftUI

/// Los entrenos del día elegido en el calendario.
struct DayDetailView: View {
    let day: Date
    let workouts: [Workout]
    var onAdd: () -> Void
    var onOpen: (Workout) -> Void
    var onCompare: (Workout) -> Void

    @Environment(\.modelContext) private var context
    @State private var pendingDeletion: Workout? = nil

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(day.dayTitle.capitalized(with: .current))
                .font(.title3.bold())

            if workouts.isEmpty {
                Text("Sin entrenos este día")
                    .foregroundStyle(.secondary)
            }

            ForEach(workouts) { workout in
                Button { onOpen(workout) } label: {
                    WorkoutCard(workout: workout)
                }
                .buttonStyle(.plain)
                .contextMenu {
                    if workout.isFinished {
                        Button("Ver comparación", systemImage: "chart.bar.xaxis") { onCompare(workout) }
                    }
                    Button("Eliminar", systemImage: "trash", role: .destructive) { pendingDeletion = workout }
                }
            }

            Button(action: onAdd) {
                Label("Registrar entrenamiento", systemImage: "plus")
                    .font(.headline)
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(.glassProminent)
            .controlSize(.large)
            .padding(.top, 4)
        }
        .confirmationDialog(
            "¿Eliminar este entreno?",
            isPresented: Binding(isPresent: $pendingDeletion),
            titleVisibility: .visible,
            presenting: pendingDeletion
        ) { workout in
            Button("Eliminar", role: .destructive) { context.delete(workout) }
        } message: { _ in
            Text("Se borrarán todas sus series. No se puede deshacer.")
        }
    }
}

private struct WorkoutCard: View {
    let workout: Workout
    @AppStorage(AccentChoice.storageKey) private var accent: AccentChoice = .blue

    var body: some View {
        let summary = workout.summary
        HStack(spacing: 12) {
            VStack(alignment: .leading, spacing: 4) {
                HStack(spacing: 8) {
                    Text(workout.title)
                        .font(.headline)
                    if !workout.isFinished {
                        Text("En curso")
                            .font(.caption.weight(.semibold))
                            .padding(.horizontal, 8)
                            .padding(.vertical, 2)
                            .background(accent.color.opacity(0.15), in: .capsule)
                            .foregroundStyle(accent.color)
                    }
                }
                Text(subtitle(summary))
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .monospacedDigit()
            }
            Spacer()
            Image(systemName: "chevron.right")
                .font(.footnote.weight(.semibold))
                .foregroundStyle(.tertiary)
        }
        .contentCard(cornerRadius: 18)
        .contentShape(.rect)
    }

    private func subtitle(_ summary: SessionSummary) -> String {
        var parts = ["\(workout.logs.count) ejercicios", "\(summary.setCount) series"]
        if summary.volume > 0 { parts.append(Format.weight(summary.volume)) }
        if summary.totalDuration > 0 { parts.append(Format.duration(summary.totalDuration)) }
        return parts.joined(separator: " · ")
    }
}
