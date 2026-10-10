import SwiftData
import SwiftUI

struct RoutineListView: View {
    @Query(sort: \Routine.createdAt) private var routines: [Routine]
    @Environment(\.modelContext) private var context
    @State private var path: [Routine] = []
    @State private var pendingDeletion: Routine? = nil

    var body: some View {
        NavigationStack(path: $path) {
            List {
                ForEach(routines) { routine in
                    NavigationLink(value: routine) {
                        VStack(alignment: .leading, spacing: 3) {
                            Text(routine.name.isEmpty ? String(localized: "Rutina sin nombre") : routine.name)
                                .font(.headline)
                            Text(subtitle(for: routine))
                                .font(.subheadline)
                                .foregroundStyle(.secondary)
                                .lineLimit(2)
                        }
                        .padding(.vertical, 2)
                    }
                }
                .onDelete { offsets in
                    pendingDeletion = offsets.first.map { routines[$0] }
                }
            }
            .overlay {
                if routines.isEmpty {
                    ContentUnavailableView {
                        Label("Sin rutinas", systemImage: "list.bullet.rectangle.portrait")
                    } description: {
                        Text("Crea una rutina con los ejercicios que sueles hacer juntos.")
                    } actions: {
                        Button("Crear rutina", action: addRoutine)
                            .buttonStyle(.glassProminent)
                    }
                }
            }
            .navigationTitle("Rutinas")
            .navigationDestination(for: Routine.self) { RoutineEditorView(routine: $0) }
            .toolbar {
                ToolbarItem(placement: .pinnedPrimary) {
                    Button("Nueva rutina", systemImage: "plus", action: addRoutine)
                }
            }
            .confirmationDialog(
                "¿Eliminar esta rutina?",
                isPresented: Binding(isPresent: $pendingDeletion),
                titleVisibility: .visible,
                presenting: pendingDeletion
            ) { routine in
                Button("Eliminar", role: .destructive) { context.delete(routine) }
            } message: { _ in
                Text("Los entrenos que ya hiciste con ella se conservan.")
            }
        }
    }

    private func subtitle(for routine: Routine) -> String {
        let names = routine.sortedItems.compactMap { $0.exercise?.name }
        return names.isEmpty ? String(localized: "Sin ejercicios") : names.joined(separator: " · ")
    }

    private func addRoutine() {
        let routine = Routine(name: "")
        context.insert(routine)
        path.append(routine)
    }
}

#Preview {
    RoutineListView()
        .modelContainer(PreviewData.container)
}
