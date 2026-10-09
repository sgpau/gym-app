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
        case .blue: "Azul"
        case .indigo: "Índigo"
        case .purple: "Morado"
        case .pink: "Rosa"
        case .red: "Rojo"
        case .orange: "Naranja"
        case .green: "Verde"
        case .mint: "Menta"
        case .teal: "Turquesa"
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
