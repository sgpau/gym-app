import SwiftUI

// Las APIs de diseño de iOS 26/27 (Liquid Glass, barras y pestañas) se concentran aquí:
// si alguna cambia de nombre en el SDK, solo hay que tocar este archivo.

extension View {
    /// Superficie propia en Liquid Glass (cabeceras, récords, cronómetro).
    /// No usar sobre otro cristal ni en filas de listas.
    func glassCard(cornerRadius: CGFloat = 20, tint: Color? = nil) -> some View {
        padding()
            .frame(maxWidth: .infinity, alignment: .leading)
            .glassEffect(.regular.tint(tint), in: .rect(cornerRadius: cornerRadius))
    }

    /// Tarjeta de contenido normal, sobre el fondo secundario del sistema (claro y oscuro).
    func contentCard(cornerRadius: CGFloat = 20) -> some View {
        padding()
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(.background.secondary, in: .rect(cornerRadius: cornerRadius))
    }
}

extension ToolbarItemPlacement {
    /// Acción principal fijada al borde derecho: nunca se oculta en el menú de desbordamiento (iOS 27).
    static var pinnedPrimary: ToolbarItemPlacement { .topBarPinnedTrailing }
}
