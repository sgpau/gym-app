import SwiftData
import SwiftUI
import UniformTypeIdentifiers

/// Herramientas ocultas para probar la app: cargar datos de prueba, importar un JSON o borrar todo.
/// Aparece en Ajustes tras tocar 7 veces «Versión».
struct DeveloperSection: View {
    var onHide: () -> Void

    @Environment(\.modelContext) private var context
    @Query private var workouts: [Workout]
    @State private var showFileImporter = false
    @State private var pendingImport: PendingImport? = nil
    @State private var confirmDelete = false
    @State private var isWorking = false
    @State private var message: Message? = nil

    var body: some View {
        Section {
            Button {
                load { try DataImporter.bundledSample().shiftingDates(endingOn: .now) }
            } label: {
                Label("Cargar datos de prueba (último año)", systemImage: "wand.and.stars")
            }

            Button {
                showFileImporter = true
            } label: {
                Label("Importar datos desde archivo…", systemImage: "square.and.arrow.down")
            }

            Button(role: .destructive) {
                confirmDelete = true
            } label: {
                Label("Borrar entrenos y rutinas", systemImage: "trash")
            }

            Button("Ocultar herramientas de desarrollo", action: onHide)
                .foregroundStyle(.secondary)
        } header: {
            HStack {
                Text("Desarrollo")
                if isWorking {
                    Spacer()
                    ProgressView()
                }
            }
        } footer: {
            Text("\(workouts.count) entrenos guardados. El archivo debe ser un JSON con el formato descrito en el README.")
        }
        .disabled(isWorking)
        .fileImporter(isPresented: $showFileImporter, allowedContentTypes: [.json]) { result in
            switch result {
            case .success(let url): load { try DataImporter.backup(at: url) }
            case .failure(let error): message = Message(title: String(localized: "No se pudo abrir el archivo"), text: error.localizedDescription)
            }
        }
        .confirmationDialog(
            "Ya tienes \(workouts.count) entrenos",
            isPresented: Binding(isPresent: $pendingImport),
            titleVisibility: .visible,
            presenting: pendingImport
        ) { pending in
            Button("Reemplazar mis datos", role: .destructive) { run(pending.backup, replacing: true) }
            Button("Añadir a los existentes") { run(pending.backup, replacing: false) }
        } message: { pending in
            Text("El archivo trae \(pending.backup.workouts.count) entrenos. ¿Quieres reemplazar los actuales o añadirlos?")
        }
        .confirmationDialog("¿Borrar todos los entrenos y rutinas?", isPresented: $confirmDelete, titleVisibility: .visible) {
            Button("Borrar", role: .destructive) {
                perform { try DataImporter.deleteWorkoutsAndRoutines(in: context); return String(localized: "Entrenos y rutinas borrados.") }
            }
        } message: {
            Text("Los ejercicios se conservan. No se puede deshacer.")
        }
        .alert(item: $message) { message in
            Alert(title: Text(message.title), message: Text(message.text))
        }
    }

    /// Lee el archivo y, si ya hay entrenos, pregunta si reemplazar o añadir.
    private func load(_ read: () throws -> GymBackup) {
        do {
            let backup = try read()
            if workouts.isEmpty {
                run(backup, replacing: false)
            } else {
                pendingImport = PendingImport(backup: backup)
            }
        } catch {
            message = Message(title: String(localized: "Archivo no válido"), text: error.localizedDescription)
        }
    }

    private func run(_ backup: GymBackup, replacing: Bool) {
        perform {
            if replacing { try DataImporter.deleteWorkoutsAndRoutines(in: context) }
            return try DataImporter.importBackup(backup, into: context).summary
        }
    }

    /// Deja pintar el indicador de progreso antes de bloquear el hilo principal con la importación.
    private func perform(_ work: @escaping @MainActor () throws -> String) {
        isWorking = true
        Task {
            try? await Task.sleep(for: .milliseconds(100))
            do {
                message = Message(title: String(localized: "Listo"), text: try work())
            } catch {
                message = Message(title: String(localized: "Error"), text: error.localizedDescription)
            }
            isWorking = false
        }
    }
}

private struct PendingImport: Identifiable {
    let id = UUID()
    let backup: GymBackup
}

private struct Message: Identifiable {
    let id = UUID()
    let title: String
    let text: String
}
