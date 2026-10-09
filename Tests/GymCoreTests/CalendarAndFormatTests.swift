import Foundation
import Testing
@testable import GymCore

@Suite("Cuadrícula del mes")
struct MonthGridTests {
    func calendar(firstWeekday: Int) -> Calendar {
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = TimeZone(identifier: "UTC")!
        calendar.locale = Locale(identifier: "es_ES")
        calendar.firstWeekday = firstWeekday
        return calendar
    }

    @Test func mondayFirst() {
        // El 1 de octubre de 2026 es jueves: lunes, martes y miércoles quedan vacíos.
        let grid = MonthGrid(containing: day(2026, 10, 15), calendar: calendar(firstWeekday: 2))
        #expect(grid.days.prefix(3).allSatisfy { $0 == nil })
        #expect(grid.days[3] != nil)
        #expect(grid.days.compactMap { $0 }.count == 31)
        #expect(grid.weekdaySymbols.count == 7)
        #expect(grid.weekdaySymbols.first == "L")
    }

    @Test func sundayFirst() {
        let grid = MonthGrid(containing: day(2026, 10, 15), calendar: calendar(firstWeekday: 1))
        #expect(grid.days.prefix(4).allSatisfy { $0 == nil })
    }

    @Test func leapYearFebruary() {
        let grid = MonthGrid(containing: day(2028, 2, 10), calendar: calendar(firstWeekday: 2))
        #expect(grid.days.compactMap { $0 }.count == 29)
        #expect(grid.days.prefix(1).allSatisfy { $0 == nil })
    }

    @Test func movesAcrossYears() {
        let grid = MonthGrid(containing: day(2026, 12, 15), calendar: calendar(firstWeekday: 2)).adding(months: 1)
        #expect(grid.contains(day(2027, 1, 20)))
    }
}

@Suite("Formatos")
struct FormatTests {
    let es = Locale(identifier: "es_ES")

    @Test func weights() {
        #expect(Format.weight(62.5, locale: es) == "62,5 kg")
        #expect(Format.weight(60, locale: es) == "60 kg")
        #expect(Format.value(79.1667, for: .oneRepMax, locale: es) == "79,2 kg")
    }

    @Test func durations() {
        #expect(Format.duration(45) == "0:45")
        #expect(Format.duration(65) == "1:05")
        #expect(Format.duration(3725) == "1:02:05")
    }

    @Test func sets() {
        #expect(Format.set(.reps(8, weight: 62.5), locale: es) == "62,5 kg × 8")
        #expect(Format.set(.reps(12, weight: 0), locale: es) == "12 reps")
        #expect(Format.set(.time(45, weight: 10), locale: es) == "0:45 · 10 kg")
    }

    @Test func setSummaries() {
        let same: [SetRecord] = [.reps(8, weight: 60), .reps(8, weight: 60), .reps(8, weight: 60)]
        #expect(Format.setSummary(same, locale: es) == "3×8 · 60 kg")

        let mixed: [SetRecord] = [.reps(8, weight: 60), .reps(8, weight: 60), .reps(6, weight: 55)]
        #expect(Format.setSummary(mixed, locale: es) == "8, 8, 6 · 60 kg")

        let plank: [SetRecord] = [.time(60, weight: 0), .time(60, weight: 0), .time(60, weight: 0)]
        #expect(Format.setSummary(plank, locale: es) == "3×1:00")
        #expect(Format.setSummary([], locale: es) == "Sin series")
    }

    @Test func changes() {
        #expect(Format.change(Delta(current: 62.5, previous: 60), for: .maxWeight, locale: es) == "+2,5 kg")
        #expect(Format.change(Delta(current: 45, previous: 60), for: .maxDuration, locale: es) == "−0:15")
        #expect(Format.change(Delta(current: 8, previous: 8), for: .totalReps, locale: es) == "Igual")
        #expect(Format.change(Delta(current: 8, previous: nil), for: .totalReps, locale: es) == "Nuevo")
        #expect(Format.percent(0.0625) == "+6 %")
        #expect(Format.percent(-0.031) == "−3 %")
    }
}
