import SwiftData
import SwiftUI

/// Elegir con qué rutina empezar (o entrenamiento libre).
struct StartWorkoutView: View {
    let day: Date
    var title = "Nuevo entreno"
    /// Entreno sin finalizar que se puede retomar.
    var inProgress: Workout?
    var onResume: (Workout) -> Void = { _ in }
    var onCancel: (() -> Void)?
    var onPick: (Routine?) -> Void

    @Query(sort: \Routine.createdAt) private var routines: [Routine]

    var body: some View {
        List {
            if let inProgress {
                Section("En curso") {
                    Button { onResume(inProgress) } label: {
                        RoutineRowLabel(
                            title: inProgress.title,
                            subtitle: "Empezado \(inProgress.date.formatted(.relative(presentation: .named)))",
                            systemImage: "play.circle.fill"
                        )
                    }
                }
            }

            Section {
                Button { onPick(nil) } label: {
                    RoutineRowLabel(title: "Entrenamiento libre", subtitle: "Añade los ejercicios sobre la marcha", systemImage: "bolt.fill")
                }
            } footer: {
                Text(day.dayTitle.capitalized(with: .current))
            }

            Section("Rutinas") {
                ForEach(routines.filter { !$0.items.isEmpty }) { routine in
                    Button { onPick(routine) } label: {
                        RoutineRowLabel(title: routine.name, subtitle: subtitle(for: routine), systemImage: "list.bullet.rectangle.portrait.fill")
                    }
                }
            }
        }
        .overlay {
            if routines.allSatisfy(\.items.isEmpty) {
                ContentUnavailableView(
                    "Aún no tienes rutinas",
                    systemImage: "list.bullet.rectangle.portrait",
                    description: Text("Créalas en la pestaña Rutinas, o empieza un entrenamiento libre.")
                )
                .padding(.top, 220)
                .allowsHitTesting(false)
            }
        }
        .navigationTitle(title)
        .toolbar {
            if let onCancel {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancelar", action: onCancel)
                }
            }
        }
    }

    private func subtitle(for routine: Routine) -> String {
        let count = "\(routine.items.count) ejercicios"
        guard let last = routine.lastPerformed else { return count }
        return "\(count) · Última vez: \(last.shortDay)"
    }
}

private struct RoutineRowLabel: View {
    let title: String
    let subtitle: String
    let systemImage: String

    var body: some View {
        HStack(spacing: 14) {
            Image(systemName: systemImage)
                .font(.title2)
                .foregroundStyle(.tint)
                .frame(width: 32)
            VStack(alignment: .leading, spacing: 2) {
                Text(title).font(.headline).foregroundStyle(.primary)
                Text(subtitle).font(.subheadline).foregroundStyle(.secondary)
            }
            Spacer()
            Image(systemName: "chevron.right")
                .font(.footnote.weight(.semibold))
                .foregroundStyle(.tertiary)
        }
        .contentShape(.rect)
    }
}

#Preview {
    NavigationStack {
        StartWorkoutView(day: .now, onCancel: {}) { _ in }
    }
    .modelContainer(PreviewData.container)
}
