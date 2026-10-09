import SwiftUI
import UIKit

extension Binding where Value == Bool {
    /// `true` mientras `item` tenga valor; al cerrarse, lo pone a `nil`.
    init<Wrapped>(isPresent item: Binding<Wrapped?>) {
        self.init(
            get: { item.wrappedValue != nil },
            set: { if !$0 { item.wrappedValue = nil } }
        )
    }
}

/// Cierra el teclado (los teclados numéricos no tienen tecla Intro).
@MainActor
func hideKeyboard() {
    UIApplication.shared.sendAction(#selector(UIResponder.resignFirstResponder), to: nil, from: nil, for: nil)
}

extension Date {
    /// "sábado, 4 de octubre"
    var dayTitle: String { formatted(.dateTime.weekday(.wide).day().month(.wide)) }
    /// "4 oct"
    var shortDay: String { formatted(.dateTime.day().month(.abbreviated)) }
}
