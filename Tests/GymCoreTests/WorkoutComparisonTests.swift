import Foundation
import Testing
@testable import GymCore

@Suite("Comparación con el entreno anterior")
struct WorkoutComparisonTests {
    let lastWeek = day(2026, 10, 2)
    let today = day(2026, 10, 9)

    @Test func deltaTrend() {
        #expect(Delta(current: 10, previous: 8).trend == .up)
        #expect(Delta(current: 8, previous: 10).trend == .down)
        #expect(Delta(current: 8, previous: 8).trend == .same)
        #expect(Delta(current: 8, previous: nil).trend == .new)
    }

    @Test func percentAvoidsDivisionByZero() {
        #expect(isClose(Delta(current: 1060, previous: 1000).percent, 0.06))
        #expect(Delta(current: 100, previous: 0).percent == nil)
        #expect(Delta(current: 100, previous: nil).percent == nil)
    }

    @Test func comparesTotalsAndExercisesWithPreviousWorkout() throws {
        let previous = PreviousWorkout(date: lastWeek, logs: [
            log("press", lastWeek, [.reps(8, weight: 60), .reps(8, weight: 60)]),
            log("remo", lastWeek, [.reps(10, weight: 50)]),
        ])
        let current = [
            log("press", today, [.reps(8, weight: 62.5), .reps(8, weight: 62.5)]),
            log("remo", today, [.reps(10, weight: 45)]),
        ]
        let result = WorkoutComparator.compare(current: current, previous: previous)

        #expect(result.previousDate == lastWeek)
        #expect(result.volume == Delta(current: 1450, previous: 1460))
        #expect(result.volume.trend == .down)
        #expect(result.sets.trend == .same)

        let press = try #require(result.exercises.first { $0.exerciseID == "press" })
        #expect(press.metrics.first { $0.metric == .maxWeight }?.delta == Delta(current: 62.5, previous: 60))
        #expect(press.previousDate == lastWeek)

        let row = try #require(result.exercises.first { $0.exerciseID == "remo" })
        #expect(row.metrics.first { $0.metric == .maxWeight }?.delta.trend == .down)
    }

    @Test func newExerciseFallsBackToItsLastLog() throws {
        let previous = PreviousWorkout(date: lastWeek, logs: [log("press", lastWeek, [.reps(8, weight: 60)])])
        let current = [
            log("press", today, [.reps(8, weight: 60)]),
            log("plancha", today, [.time(70, weight: 0)], type: .time),
            log("curl", today, [.reps(12, weight: 12)]),
        ]
        let lastPlank = log("plancha", day(2026, 9, 20), [.time(60, weight: 0)], type: .time)
        let result = WorkoutComparator.compare(current: current, previous: previous, lastLogs: ["plancha": lastPlank])

        let plank = try #require(result.exercises.first { $0.exerciseID == "plancha" })
        #expect(plank.previousDate == lastPlank.date)
        #expect(plank.metrics.map(\.metric) == [.maxDuration, .totalDuration])
        #expect(plank.metrics[0].delta == Delta(current: 70, previous: 60))

        let curl = try #require(result.exercises.first { $0.exerciseID == "curl" })
        #expect(curl.isFirstTime)
        #expect(curl.metrics.allSatisfy { $0.delta.trend == .new })
    }

    @Test func freeWorkoutHasNoTotalsToCompare() {
        let result = WorkoutComparator.compare(current: [log("press", today, [.reps(5, weight: 80)])], previous: nil)
        #expect(result.previousDate == nil)
        #expect(result.volume.trend == .new)
    }

    @Test func emptyExercisesAreIgnored() {
        let result = WorkoutComparator.compare(current: [log("press", today, [])], previous: nil)
        #expect(result.exercises.isEmpty)
        #expect(result.volume.current == 0)
    }

    @Test func detectsAllTimeRecords() {
        let history = [
            log("press", day(2026, 9, 1), [.reps(3, weight: 70)]),
            log("press", lastWeek, [.reps(8, weight: 60)]),
        ]
        let best = PersonalBests(logs: history)

        let heavier = WorkoutComparator.compare(log("press", today, [.reps(2, weight: 72.5)]), with: history.last, best: best)
        #expect(heavier.newRecords.contains(.maxWeight))

        // Mejora frente a la semana pasada, pero no supera el récord histórico de 70 kg.
        let better = WorkoutComparator.compare(log("press", today, [.reps(8, weight: 62.5)]), with: history.last, best: best)
        #expect(!better.newRecords.contains(.maxWeight))
    }

    @Test func recordsForBodyweightAndTime() {
        let pullUps = PersonalBests(logs: [log("dominadas", lastWeek, [.reps(8, weight: 0)])])
        #expect(WorkoutComparator.newRecords(in: SessionSummary(sets: [.reps(10, weight: 0)]), type: .reps, best: pullUps) == [.maxReps])

        let plank = PersonalBests(logs: [log("plancha", lastWeek, [.time(60, weight: 0)], type: .time)])
        #expect(WorkoutComparator.newRecords(in: SessionSummary(sets: [.time(90, weight: 0)]), type: .time, best: plank) == [.maxDuration])
    }

    @Test func firstTimeIsNotARecord() {
        #expect(WorkoutComparator.newRecords(in: SessionSummary(sets: [.reps(5, weight: 100)]), type: .reps, best: PersonalBests()).isEmpty)
        #expect(WorkoutComparator.newRecords(in: SessionSummary(sets: [.reps(5, weight: 100)]), type: .reps, best: nil).isEmpty)
    }
}
