import SwiftData
import SwiftUI

@main
struct GymApp: App {
    @AppStorage(AppAppearance.storageKey) private var appearance: AppAppearance = .system
    @AppStorage(AccentChoice.storageKey) private var accent: AccentChoice = .blue

    var body: some Scene {
        WindowGroup {
            MainTabView()
                .tint(accent.color)
                .preferredColorScheme(appearance.colorScheme)
        }
        .modelContainer(for: AppSchema.models)
    }
}
