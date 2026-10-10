import SwiftData
import SwiftUI

/// Ejercicios con historial, del más reciente al más antiguo.
struct ProgressListView: View {
    @Query(sort: \Exercise.name) private var exercises: [Exercise]
    @Query private var workouts: [Workout]  // refresca la lista al registrar entrenos

    private struct TrackedExercise: Identifiable {
        let exercise: Exercise
        let last: ExerciseLog
        let sessions: Int
        var id: PersistentIdentifier { exercise.persistentModelID }
    }

    private var tracked: [TrackedExercise] {
        exercises
            .compactMap { exercise in
                let logs = exercise.logs()
                return logs.last.map { TrackedExercise(exercise: exercise, last: $0, sessions: logs.count) }
            }
            .sorted { $0.last.date > $1.last.date }
    }

    var body: some View {
        NavigationStack {
            List(tracked) { item in
                NavigationLink(value: item.exercise) {
                    VStack(alignment: .leading, spacing: 3) {
                        ExerciseLabel(exercise: item.exercise)
                            .font(.headline)
                        Text("\(Format.setSummary(item.last.sets)) · \(item.last.date.shortDay)")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                            .monospacedDigit()
                        Text("\(item.sessions) sesiones")
                            .font(.caption)
                            .foregroundStyle(.tertiary)
                    }
                    .padding(.vertical, 2)
                }
            }
            .overlay {
                if tracked.isEmpty {
                    ContentUnavailableView(
                        "Aún no hay progreso",
                        systemImage: "chart.line.uptrend.xyaxis",
                        description: Text("Cuando finalices entrenos, aquí verás la evolución de cada ejercicio.")
                    )
                }
            }
            .navigationTitle("Progreso")
            .navigationDestination(for: Exercise.self) { ExerciseProgressView(exercise: $0) }
        }
    }
}

#Preview {
    ProgressListView()
        .modelContainer(PreviewData.container)
}
