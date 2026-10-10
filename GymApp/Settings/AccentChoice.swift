import SwiftUI

/// Color principal de la app. Son colores del sistema: Apple ya los ajusta
/// para modo claro, oscuro y alto contraste. El amarillo queda fuera por su poco
/// contraste sobre fondo claro.
nonisolated enum AccentChoice: String, CaseIterable, Identifiable {
    case blue, indigo, purple, pink, red, orange, green, mint, teal

    static let storageKey = "accentColor"

    var id: String { rawValue }

    var title: String {
        switch self {
        case .blue: String(localized: "Azul")
        case .indigo: String(localized: "Índigo")
        case .purple: String(localized: "Morado")
        case .pink: String(localized: "Rosa")
        case .red: String(localized: "Rojo")
        case .orange: String(localized: "Naranja")
        case .green: String(localized: "Verde")
        case .mint: String(localized: "Menta")
        case .teal: String(localized: "Turquesa")
        }
    }

    var color: Color {
        switch self {
        case .blue: .blue
        case .indigo: .indigo
        case .purple: .purple
        case .pink: .pink
        case .red: .red
        case .orange: .orange
        case .green: .green
        case .mint: .mint
        case .teal: .teal
        }
    }
}
