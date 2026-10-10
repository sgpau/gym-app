import SwiftData
import SwiftUI

struct RoutineEditorView: View {
    @Bindable var routine: Routine
    @Environment(\.modelContext) private var context
    @State private var showPicker = false

    var body: some View {
        Form {
            Section("Nombre") {
                TextField("Ej. Torso, Pierna, Empuje…", text: $routine.name)
                    .font(.headline)
            }

            Section {
                ForEach(routine.sortedItems) { item in
                    RoutineItemRow(item: item)
                }
                .onMove(perform: move)
                .onDelete(perform: delete)

                Button { showPicker = true } label: {
                    Label("Añadir ejercicios", systemImage: "plus.circle.fill")
                }
            } header: {
                Text("Ejercicios")
            } footer: {
                if routine.items.count > 1 {
                    Text("Pulsa Editar para cambiar el orden.")
                }
            }
        }
        .navigationTitle(routine.name.isEmpty ? String(localized: "Nueva rutina") : routine.name)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            if !routine.items.isEmpty {
                EditButton()
            }
        }
        .sheet(isPresented: $showPicker) {
            ExercisePickerView(title: "Añadir ejercicios") { exercises in
                add(exercises)
            }
        }
        .onDisappear(perform: cleanUp)
    }

    private func add(_ exercises: [Exercise]) {
        var order = (routine.items.map(\.order).max() ?? -1) + 1
        for exercise in exercises {
            let item = RoutineItem(order: order)
            context.insert(item)
            item.exercise = exercise
            item.routine = routine
            order += 1
        }
    }

    private func move(from source: IndexSet, to destination: Int) {
        var items = routine.sortedItems
        items.move(fromOffsets: source, toOffset: destination)
        for (index, item) in items.enumerated() {
            item.order = index
        }
    }

    private func delete(at offsets: IndexSet) {
        let items = routine.sortedItems
        for index in offsets {
            context.delete(items[index])
        }
    }

    /// Una rutina recién creada y vacía se descarta; una sin nombre recibe uno.
    private func cleanUp() {
        let name = routine.name.trimmingCharacters(in: .whitespacesAndNewlines)
        if name.isEmpty && routine.items.isEmpty && routine.workouts.isEmpty {
            context.delete(routine)
        } else if name.isEmpty {
            routine.name = String(localized: "Rutina sin nombre")
        }
    }
}

/// Un ejercicio de la rutina con su objetivo de series y reps (o tiempo).
private struct RoutineItemRow: View {
    @Bindable var item: RoutineItem

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(item.exercise?.name ?? String(localized: "Ejercicio"))
                .font(.headline)
            Stepper("\(item.targetSets) series", value: $item.targetSets, in: 1...20)
                .monospacedDigit()
            if item.exercise?.trackingType == .time {
                Stepper("\(Format.duration(item.targetDuration)) por serie", value: $item.targetDuration, in: 5...3600, step: 15)
                    .monospacedDigit()
            } else {
                Stepper("\(item.targetReps) repeticiones", value: $item.targetReps, in: 1...100)
                    .monospacedDigit()
            }
        }
        .padding(.vertical, 4)
    }
}

#Preview {
    NavigationStack {
        RoutineEditorView(routine: PreviewData.routine)
    }
    .modelContainer(PreviewData.container)
}
