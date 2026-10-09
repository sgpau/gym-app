import SwiftData
import SwiftUI

struct ExerciseListView: View {
    @Query(sort: \Exercise.name) private var exercises: [Exercise]
    @Environment(\.modelContext) private var context
    @State private var search = ""
    @State private var editing: ExerciseEditorTarget? = nil
    @State private var pendingDeletion: Exercise? = nil

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
                                Button { editing = .edit(exercise) } label: {
                                    ExerciseLabel(exercise: exercise)
                                        .foregroundStyle(.primary)
                                        .frame(maxWidth: .infinity, alignment: .leading)
                                        .contentShape(.rect)
                                }
                                .swipeActions {
                                    Button("Eliminar", systemImage: "trash", role: .destructive) {
                                        requestDeletion(of: exercise)
                                    }
                                }
                            }
                        }
                    }
                }
            }
            .searchable(text: $search, prompt: "Buscar ejercicio")
            .overlay {
                if exercises.isEmpty {
                    ContentUnavailableView("Sin ejercicios", systemImage: "dumbbell", description: Text("Añade tu primer ejercicio con +."))
                } else if filtered.isEmpty {
                    ContentUnavailableView.search(text: search)
                }
            }
            .navigationTitle("Ejercicios")
            .minimizesNavigationBarOnScroll()
            .toolbar {
                ToolbarItem(placement: .pinnedPrimary) {
                    Button("Nuevo ejercicio", systemImage: "plus") { editing = .new }
                }
            }
            .sheet(item: $editing) { target in
                ExerciseEditorView(exercise: target.exercise)
            }
            .confirmationDialog(
                "¿Eliminar este ejercicio?",
                isPresented: Binding(isPresent: $pendingDeletion),
                titleVisibility: .visible,
                presenting: pendingDeletion
            ) { exercise in
                Button("Eliminar ejercicio e historial", role: .destructive) { context.delete(exercise) }
            } message: { exercise in
                Text(deletionMessage(for: exercise))
            }
        }
    }

    private func requestDeletion(of exercise: Exercise) {
        if exercise.workoutEntries.isEmpty && exercise.routineItems.isEmpty {
            context.delete(exercise)
        } else {
            pendingDeletion = exercise
        }
    }

    private func deletionMessage(for exercise: Exercise) -> String {
        var parts: [String] = []
        if !exercise.workoutEntries.isEmpty { parts.append("aparece en \(exercise.workoutEntries.count) entrenos") }
        if !exercise.routineItems.isEmpty { parts.append("en \(exercise.routineItems.count) rutinas") }
        return "Este ejercicio \(parts.joined(separator: " y ")). Se borrarán también esas series y no se puede deshacer."
    }
}

enum ExerciseEditorTarget: Identifiable {
    case new
    case edit(Exercise)

    var id: AnyHashable {
        switch self {
        case .new: AnyHashable("new")
        case .edit(let exercise): AnyHashable(exercise.persistentModelID)
        }
    }

    var exercise: Exercise? {
        if case .edit(let exercise) = self { return exercise }
        return nil
    }
}

#Preview {
    ExerciseListView()
        .modelContainer(PreviewData.container)
}
