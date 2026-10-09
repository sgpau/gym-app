import Foundation

/// Los días de un mes colocados en una cuadrícula de 7 columnas.
nonisolated struct MonthGrid: Hashable {
    let calendar: Calendar
    /// Primer instante del mes.
    let monthStart: Date
    /// Días del mes; los `nil` iniciales son los huecos antes del día 1.
    let days: [Date?]

    init(containing date: Date, calendar: Calendar = .current) {
        self.calendar = calendar
        let start = calendar.dateInterval(of: .month, for: date)?.start ?? calendar.startOfDay(for: date)
        monthStart = start
        let dayCount = calendar.range(of: .day, in: .month, for: start)?.count ?? 30
        let weekday = calendar.component(.weekday, from: start)
        let leading = (weekday - calendar.firstWeekday + 7) % 7
        days = Array(repeating: nil, count: leading)
            + (0..<dayCount).compactMap { calendar.date(byAdding: .day, value: $0, to: start) }
    }

    func adding(months: Int) -> MonthGrid {
        let date = calendar.date(byAdding: .month, value: months, to: monthStart) ?? monthStart
        return MonthGrid(containing: date, calendar: calendar)
    }

    func contains(_ date: Date) -> Bool {
        calendar.isDate(date, equalTo: monthStart, toGranularity: .month)
    }

    /// Iniciales de los días de la semana empezando por `firstWeekday` (L M X J V S D en España).
    var weekdaySymbols: [String] {
        let symbols = calendar.veryShortStandaloneWeekdaySymbols
        let shift = calendar.firstWeekday - 1
        return Array(symbols[shift...] + symbols[..<shift])
    }
}
