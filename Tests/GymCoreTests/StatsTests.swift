import Foundation
import Testing
@testable import GymCore

func isClose(_ a: Double?, _ b: Double, tolerance: Double = 0.001) -> Bool {
    guard let a else { return false }
    return abs(a - b) < tolerance
}

func day(_ year: Int, _ month: Int, _ day: Int) -> Date {
    var calendar = Calendar(identifier: .gregorian)
    calendar.timeZone = TimeZone(identifier: "UTC")!
    return calendar.date(from: DateComponents(year: year, month: month, day: day, hour: 12))!
}

func log(_ id: String, _ date: Date, _ sets: [SetRecord], type: TrackingType = .reps) -> ExerciseLog {
    ExerciseLog(exerciseID: id, name: id, trackingType: type, date: date, sets: sets)
}

@Suite("Series")
struct SetRecordTests {
    @Test func volumeIsRepsTimesWeight() {
        #expect(SetRecord.reps(8, weight: 60).volume == 480)
    }

    @Test func epleyOneRepMax() {
        #expect(isClose(SetRecord.reps(8, weight: 60).estimatedOneRepMax, 76))
        #expect(SetRecord.reps(1, weight: 100).estimatedOneRepMax == 100)
    }

    @Test func bodyweightAndTimedSetsHaveNoOneRepMax() {
        #expect(SetRecord.reps(10, weight: 0).estimatedOneRepMax == nil)
        #expect(SetRecord.time(60, weight: 10).estimatedOneRepMax == nil)
        #expect(SetRecord.time(60, weight: 10).volume == 0)
    }
}

@Suite("Estadísticas")
struct ExerciseStatsTests {
    @Test func summaryOfRepSets() {
        let summary = SessionSummary(sets: [.reps(8, weight: 60), .reps(8, weight: 60), .reps(6, weight: 65)])
        #expect(summary.setCount == 3)
        #expect(summary.totalReps == 22)
        #expect(summary.maxReps == 8)
        #expect(summary.maxWeight == 65)
        #expect(summary.volume == 1350)
        #expect(summary.bestSet == .reps(6, weight: 65))
        #expect(isClose(summary.bestOneRepMax, 78)) // 65 kg × 6 → 78 supera a 60 kg × 8 → 76
    }

    @Test func summaryOfTimedSets() {
        let summary = SessionSummary(sets: [.time(60, weight: 0), .time(45, weight: 0), .time(60, weight: 5)])
        #expect(summary.maxDuration == 60)
        #expect(summary.totalDuration == 165)
        #expect(summary.volume == 0)
        #expect(summary.bestSet == .time(60, weight: 5))
    }

    @Test func bestSetPrefersMoreRepsAtSameWeight() {
        #expect(ExerciseStats.bestSet(in: [.reps(5, weight: 80), .reps(7, weight: 80)]) == .reps(7, weight: 80))
        #expect(ExerciseStats.bestSet(in: []) == nil)
    }

    @Test func progressIsChronologicalAndFiltered() {
        let logs = [
            log("press", day(2026, 9, 20), [.reps(8, weight: 62.5)]),
            log("press", day(2026, 6, 1), [.reps(8, weight: 55)]),
            log("press", day(2026, 9, 1), [.reps(8, weight: 60)]),
            log("press", day(2026, 9, 5), []),
        ]
        let all = ExerciseStats.progress(of: logs, metric: .maxWeight)
        #expect(all.map(\.value) == [55, 60, 62.5])

        let recent = ExerciseStats.progress(of: logs, metric: .maxWeight, since: day(2026, 8, 1))
        #expect(recent.map(\.value) == [60, 62.5])
    }

    @Test func personalBests() {
        let bests = PersonalBests(logs: [
            log("press", day(2026, 9, 1), [.reps(10, weight: 50)]),
            log("press", day(2026, 9, 8), [.reps(5, weight: 70)]),
            log("press", day(2026, 9, 9), []),
        ])
        #expect(bests.sessionCount == 2)
        #expect(bests.maxWeight == 70)
        #expect(bests.maxReps == 10)
        #expect(bests.volume == 500)
        #expect(isClose(bests.oneRepMax, 81.6667))
    }

    @Test func metricsDependOnTypeAndWeight() {
        #expect(ProgressMetric.available(for: .reps, usesWeight: true) == [.maxWeight, .oneRepMax, .volume])
        #expect(ProgressMetric.available(for: .reps, usesWeight: false) == [.totalReps])
        #expect(ProgressMetric.available(for: .time, usesWeight: false) == [.maxDuration, .totalDuration])
    }
}
