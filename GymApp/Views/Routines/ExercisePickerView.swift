import SwiftData
import SwiftUI

/// Selector de ejercicios con búsqueda, agrupados por músculo. Devuelve los elegidos en el orden en que se marcaron.
struct ExercisePickerView: View {
    var title: LocalizedStringKey
    var onPick: ([Exercise]) -> Void

    @Environment(\.dismiss) private var dismiss
    @Query(sort: \Exercise.name) private var exercises: [Exercise]
    @State private var search = ""
    @State private var selection: [PersistentIdentifier] = []

    private var filtered: [Exercise] {
        search.isEmpty ? exercises : exercises.filter { $0.name.localizedStandardContains(search) }
    }

    var body: some View {
        NavigationStack {
            List {
                ForEach(MuscleGroup.allCases) { group in
                    let items = filtered.filter { $0.muscleGroup == group }
                    if !items.isEmpty {
                        Section(group.title) {
                            ForEach(items) { exercise in
                                row(exercise)
                            }
                        }
                    }
                }
            }
            .searchable(text: $search, prompt: "Buscar ejercicio")
            .overlay {
                if filtered.isEmpty {
                    ContentUnavailableView.search(text: search)
                }
            }
            .navigationTitle(title)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancelar") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button(selection.isEmpty ? String(localized: "Añadir") : String(localized: "Añadir (\(selection.count))")) {
                        onPick(selection.compactMap { id in exercises.first { $0.persistentModelID == id } })
                        dismiss()
                    }
                    .disabled(selection.isEmpty)
                }
            }
            .sensoryFeedback(.selection, trigger: selection)
        }
    }

    private func row(_ exercise: Exercise) -> some View {
        let isSelected = selection.contains(exercise.persistentModelID)
        return Button {
            if let index = selection.firstIndex(of: exercise.persistentModelID) {
                selection.remove(at: index)
            } else {
                selection.append(exercise.persistentModelID)
            }
        } label: {
            HStack {
                ExerciseLabel(exercise: exercise)
                Spacer()
                Image(systemName: isSelected ? "checkmark.circle.fill" : "circle")
                    .font(.title3)
                    .foregroundStyle(isSelected ? AnyShapeStyle(.tint) : AnyShapeStyle(.tertiary))
                    .contentTransition(.symbolEffect(.replace))
            }
            .contentShape(.rect)
        }
        .buttonStyle(.plain)
        .accessibilityAddTraits(isSelected ? .isSelected : [])
    }
}

/// Nombre del ejercicio con un reloj si se mide por tiempo.
struct ExerciseLabel: View {
    let exercise: Exercise

    var body: some View {
        HStack(spacing: 6) {
            Text(exercise.name)
            if exercise.trackingType == .time {
                Image(systemName: "timer")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
                    .accessibilityLabel("por tiempo")
            }
        }
    }
}

#Preview {
    ExercisePickerView(title: "Añadir ejercicios") { _ in }
        .modelContainer(PreviewData.container)
}
