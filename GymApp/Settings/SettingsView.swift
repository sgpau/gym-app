import SwiftUI

struct SettingsView: View {
    @AppStorage(AppAppearance.storageKey) private var appearance: AppAppearance = .system
    @AppStorage(AccentChoice.storageKey) private var accent: AccentChoice = .blue
    @AppStorage("developerMode") private var developerMode = false
    @Environment(\.dismiss) private var dismiss
    @State private var versionTaps = 0

    private let columns = Array(repeating: GridItem(.flexible(), spacing: 12), count: 5)

    var body: some View {
        NavigationStack {
            Form {
                Section("Apariencia") {
                    Picker("Apariencia", selection: $appearance) {
                        ForEach(AppAppearance.allCases) { Text($0.title).tag($0) }
                    }
                    .pickerStyle(.segmented)
                }

                Section {
                    LazyVGrid(columns: columns, spacing: 16) {
                        ForEach(AccentChoice.allCases) { choice in
                            ColorSwatch(choice: choice, isSelected: choice == accent) {
                                accent = choice
                            }
                        }
                    }
                    .padding(.vertical, 8)
                } header: {
                    Text("Color principal")
                } footer: {
                    Text("Se usa en botones, pestañas, el calendario y las gráficas.")
                }

                Section {
                    HStack {
                        Text("Versión")
                        Spacer()
                        Text(appVersion)
                            .foregroundStyle(.secondary)
                    }
                    .contentShape(.rect)
                    .onTapGesture(perform: tapVersion)
                }

                if developerMode {
                    DeveloperSection { developerMode = false }
                }
            }
            .navigationTitle("Ajustes")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("OK") { dismiss() }
                }
            }
            .sensoryFeedback(.selection, trigger: accent)
            .sensoryFeedback(.selection, trigger: appearance)
            .sensoryFeedback(.success, trigger: developerMode) { _, isOn in isOn }
        }
    }

    private var appVersion: String {
        let version = Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String ?? "1.0"
        let build = Bundle.main.object(forInfoDictionaryKey: "CFBundleVersion") as? String ?? "1"
        return "\(version) (\(build))"
    }

    /// Menú oculto: 7 toques seguidos en «Versión».
    private func tapVersion() {
        guard !developerMode else { return }
        versionTaps += 1
        if versionTaps >= 7 {
            withAnimation { developerMode = true }
            versionTaps = 0
        }
    }
}

private struct ColorSwatch: View {
    let choice: AccentChoice
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Circle()
                .fill(choice.color)
                .frame(width: 40, height: 40)
                .overlay {
                    if isSelected {
                        Image(systemName: "checkmark")
                            .font(.headline.bold())
                            .foregroundStyle(.white)
                            .transition(.scale(scale: 0.6).combined(with: .opacity))
                    }
                }
                .padding(4)
                .overlay {
                    Circle().strokeBorder(choice.color.opacity(isSelected ? 0.5 : 0), lineWidth: 2)
                }
                .animation(.snappy(duration: 0.2), value: isSelected)
        }
        .buttonStyle(.plain)
        .accessibilityLabel(choice.title)
        .accessibilityAddTraits(isSelected ? .isSelected : [])
    }
}

#Preview("Claro") {
    SettingsView()
}

#Preview("Oscuro") {
    SettingsView()
        .preferredColorScheme(.dark)
}
