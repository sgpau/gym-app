import SwiftData
import SwiftUI

/// Crear o editar un ejercicio. Los cambios solo se guardan al pulsar Guardar.
struct ExerciseEditorView: View {
    let exercise: Exercise?

    @Environment(\.dismiss) private var dismiss
    @Environment(\.modelContext) private var context
    @State private var name = ""
    @State private var group: MuscleGroup = .chest
    @State private var type: TrackingType = .reps
    @State private var notes = ""
    @State private var loaded = false

    private var trimmedName: String { name.trimmingCharacters(in: .whitespacesAndNewlines) }

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    TextField("Nombre del ejercicio", text: $name)
                        .font(.headline)
                }

                Section {
                    Picker("Grupo muscular", selection: $group) {
                        ForEach(MuscleGroup.allCases) { Text($0.title).tag($0) }
                    }
                    Picker("Se mide por", selection: $type) {
                        ForEach(TrackingType.allCases) { Text($0.title).tag($0) }
                    }
                    .pickerStyle(.segmented)
                } footer: {
                    Text(footer)
                }

                Section("Notas") {
                    TextField("Técnica, ajustes de la máquina…", text: $notes, axis: .vertical)
                        .lineLimit(3...6)
                }
            }
            .navigationTitle(exercise == nil ? "Nuevo ejercicio" : "Editar ejercicio")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancelar") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Guardar", action: save)
                        .disabled(trimmedName.isEmpty)
                }
            }
            .onAppear(perform: load)
        }
    }

    private var footer: String {
        var text = type == .reps
            ? "En cada serie anotarás repeticiones y peso."
            : "En cada serie anotarás la duración, con cronómetro, y un peso opcional (lastre, disco…)."
        if let exercise, exercise.trackingType != type, !exercise.workoutEntries.isEmpty {
            text += " Cambiar el tipo no convierte las series ya registradas."
        }
        return text
    }

    private func load() {
        guard !loaded else { return }
        loaded = true
        guard let exercise else { return }
        name = exercise.name
        group = exercise.muscleGroup
        type = exercise.trackingType
        notes = exercise.notes
    }

    private func save() {
        if let exercise {
            exercise.name = trimmedName
            exercise.muscleGroup = group
            exercise.trackingType = type
            exercise.notes = notes
        } else {
            context.insert(Exercise(name: trimmedName, muscleGroup: group, trackingType: type, notes: notes))
        }
        dismiss()
    }
}

#Preview("Nuevo") {
    ExerciseEditorView(exercise: nil)
        .modelContainer(PreviewData.container)
}
