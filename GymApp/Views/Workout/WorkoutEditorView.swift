import SwiftData
import SwiftUI

/// Registro de un entreno: ejercicios con sus series de reps/tiempo y peso.
struct WorkoutEditorView: View {
    @Bindable var workout: Workout
    let isNew: Bool
    var onCancel: () -> Void
    var onFinish: () -> Void

    @Environment(\.modelContext) private var context
    @State private var showPicker = false
    @State private var confirmDiscard = false
    @State private var pendingRemoval: WorkoutExercise? = nil

    var body: some View {
        List {
            Section {
                DatePicker("Fecha", selection: $workout.date)
                TextField("Notas", text: $workout.notes, axis: .vertical)
                    .lineLimit(1...4)
            }

            ForEach(workout.sortedEntries) { entry in
                ExerciseSetsSection(entry: entry, workout: workout) {
                    pendingRemoval = entry
                }
            }

            Section {
                Button { showPicker = true } label: {
                    Label("Añadir ejercicio", systemImage: "plus.circle.fill")
                        .font(.headline)
                }
            }
        }
        .scrollDismissesKeyboard(.interactively)
        .navigationTitle(workout.title)
        .navigationBarTitleDisplayMode(.inline)
        .navigationBarBackButtonHidden()
        .toolbar {
            ToolbarItem(placement: .cancellationAction) {
                Button(isNew ? String(localized: "Cancelar") : String(localized: "Cerrar")) {
                    if isNew && !workout.entries.isEmpty {
                        confirmDiscard = true
                    } else {
                        onCancel()
                    }
                }
            }
            ToolbarItem(placement: .pinnedPrimary) {
                Button(workout.isFinished ? String(localized: "Guardar") : String(localized: "Finalizar"), action: onFinish)
                    .buttonStyle(.glassProminent)
                    .disabled(workout.logs.isEmpty)
            }
            ToolbarItemGroup(placement: .keyboard) {
                Spacer()
                Button("OK") { hideKeyboard() }
            }
        }
        .confirmationDialog("¿Descartar este entreno?", isPresented: $confirmDiscard, titleVisibility: .visible) {
            Button("Descartar", role: .destructive, action: onCancel)
        } message: {
            Text("Se perderán las series que hayas anotado.")
        }
        .confirmationDialog(
            "¿Quitar este ejercicio?",
            isPresented: Binding(isPresent: $pendingRemoval),
            titleVisibility: .visible,
            presenting: pendingRemoval
        ) { entry in
            Button("Quitar", role: .destructive) { context.delete(entry) }
        }
        .sheet(isPresented: $showPicker) {
            ExercisePickerView(title: "Añadir ejercicio") { exercises in
                for exercise in exercises {
                    WorkoutFactory.addEntry(for: exercise, to: workout, in: context)
                }
            }
        }
    }
}

/// Un ejercicio del entreno con sus series y lo que hiciste la última vez.
struct ExerciseSetsSection: View {
    let entry: WorkoutExercise
    let workout: Workout
    var onRemove: () -> Void

    @Environment(\.modelContext) private var context

    private var type: TrackingType { entry.exercise?.trackingType ?? .reps }

    private var exerciseName: String { entry.exercise?.name ?? String(localized: "Ejercicio") }

    private var lastTime: String? {
        guard let log = entry.exercise?.logs(before: workout.date, excluding: workout).last else { return nil }
        return String(localized: "Última vez (\(log.date.shortDay)): \(Format.setSummary(log.sets))")
    }

    var body: some View {
        Section {
            ForEach(Array(entry.sortedSets.enumerated()), id: \.element.persistentModelID) { index, set in
                SetRow(set: set, number: index + 1, type: type)
            }
            .onDelete(perform: deleteSets)

            Button {
                WorkoutFactory.addSet(to: entry, in: context)
            } label: {
                Label("Añadir serie", systemImage: "plus")
            }
            .sensoryFeedback(.increase, trigger: entry.sets.count)
        } header: {
            HStack(alignment: .firstTextBaseline) {
                VStack(alignment: .leading, spacing: 2) {
                    Text(exerciseName)
                        .font(.headline)
                        .foregroundStyle(.primary)
                    if let lastTime {
                        Text(lastTime)
                            .font(.caption)
                            .monospacedDigit()
                    }
                }
                .textCase(nil)
                Spacer()
                Menu {
                    Button("Quitar ejercicio", systemImage: "trash", role: .destructive, action: onRemove)
                } label: {
                    Image(systemName: "ellipsis.circle")
                        .imageScale(.large)
                }
                .accessibilityLabel("Opciones de \(exerciseName)")
            }
        }
    }

    private func deleteSets(at offsets: IndexSet) {
        let sets = entry.sortedSets
        for index in offsets {
            context.delete(sets[index])
        }
    }
}

#Preview {
    NavigationStack {
        WorkoutEditorView(workout: PreviewData.lastWorkout, isNew: false, onCancel: {}, onFinish: {})
    }
    .modelContainer(PreviewData.container)
}
