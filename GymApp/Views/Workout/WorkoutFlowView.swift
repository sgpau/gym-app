import SwiftData
import SwiftUI

/// Qué se abre a pantalla completa: elegir rutina para un día, o editar un entreno.
enum WorkoutFlow: Identifiable {
    case new(day: Date)
    case edit(Workout, isNew: Bool)

    var id: AnyHashable {
        switch self {
        case .new(let day): AnyHashable(day)
        case .edit(let workout, _): AnyHashable(workout.persistentModelID)
        }
    }
}

/// Elegir rutina → registrar series → Finalizar → resumen comparativo.
struct WorkoutFlowView: View {
    let flow: WorkoutFlow

    @Environment(\.dismiss) private var dismiss
    @Environment(\.modelContext) private var context
    @State private var created: Workout? = nil
    @State private var showSummary = false

    private var workout: Workout? {
        if case .edit(let workout, _) = flow { return workout }
        return created
    }

    private var isNew: Bool {
        if case .edit(_, let isNew) = flow { return isNew }
        return true
    }

    var body: some View {
        NavigationStack {
            Group {
                if let workout {
                    WorkoutEditorView(workout: workout, isNew: isNew, onCancel: cancel, onFinish: finish)
                } else if case .new(let day) = flow {
                    StartWorkoutView(day: day, onCancel: { dismiss() }) { routine in
                        created = WorkoutFactory.makeWorkout(routine: routine, day: day, in: context)
                    }
                }
            }
            .navigationDestination(isPresented: $showSummary) {
                if let workout {
                    WorkoutSummaryView(workout: workout) { dismiss() }
                }
            }
        }
    }

    private func cancel() {
        if isNew, let workout {
            context.delete(workout)
        }
        dismiss()
    }

    private func finish() {
        hideKeyboard()
        workout?.isFinished = true
        try? context.save()
        showSummary = true
    }
}
