import SwiftUI

/// Modo claro / oscuro elegido en Ajustes.
nonisolated enum AppAppearance: String, CaseIterable, Identifiable {
    case system, light, dark

    static let storageKey = "appearance"

    var id: String { rawValue }

    var title: String {
        switch self {
        case .system: String(localized: "Sistema")
        case .light: String(localized: "Claro")
        case .dark: String(localized: "Oscuro")
        }
    }

    /// `nil` sigue el ajuste del iPhone.
    var colorScheme: ColorScheme? {
        switch self {
        case .system: nil
        case .light: .light
        case .dark: .dark
        }
    }
}
