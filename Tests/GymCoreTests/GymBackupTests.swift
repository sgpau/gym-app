import Foundation
import Testing
@testable import GymCore

@Suite("Importación de datos")
struct GymBackupTests {
    @Test func decodesMinimalFile() throws {
        let json = """
        {
          "workouts": [
            {
              "date": "2026-03-14T18:30:00Z",
              "routine": "Torso",
              "exercises": [
                { "exercise": "Press de banca", "sets": [{ "reps": 8, "weight": 60 }, { "reps": 8, "weight": 62.5 }] },
                { "exercise": "Plancha", "sets": [{ "duration": 60 }] }
              ]
            }
          ]
        }
        """
        let backup = try GymBackup.decode(Data(json.utf8))
        #expect(backup.version == 1)
        #expect(backup.exercises.isEmpty)
        #expect(backup.routines.isEmpty)
        #expect(backup.workouts.count == 1)
        #expect(backup.setCount == 3)

        let workout = try #require(backup.workouts.first)
        #expect(workout.routine == "Torso")
        #expect(workout.notes == nil)
        #expect(workout.exercises[0].sets[1].weight == 62.5)
        #expect(workout.exercises[1].sets[0].duration == 60)
        #expect(workout.exercises[1].sets[0].reps == nil)
    }

    @Test func rejectsInvalidDates() {
        let json = #"{ "workouts": [{ "date": "14/03/2026", "exercises": [] }] }"#
        #expect(throws: (any Error).self) { try GymBackup.decode(Data(json.utf8)) }
    }

    @Test func shiftsDatesSoTheLastWorkoutLandsOnTheGivenDay() {
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = TimeZone(identifier: "UTC")!
        let backup = GymBackup(workouts: [
            GymBackup.Workout(date: day(2025, 10, 1), exercises: []),
            GymBackup.Workout(date: day(2026, 9, 30), exercises: []),
        ])

        let shifted = backup.shiftingDates(endingOn: day(2026, 10, 10), calendar: calendar)
        #expect(shifted.workouts.map(\.date) == [day(2025, 10, 11), day(2026, 10, 10)])
        #expect(GymBackup().shiftingDates(endingOn: .now) == GymBackup())
    }

    /// El archivo de datos de prueba incluido en la app debe poder leerse.
    @Test func bundledSampleDataDecodes() throws {
        let url = URL(fileURLWithPath: #filePath)
            .deletingLastPathComponent().deletingLastPathComponent().deletingLastPathComponent()
            .appendingPathComponent("GymApp/Resources/sample-data.json")
        let backup = try GymBackup.decode(Data(contentsOf: url))

        #expect(backup.workouts.count > 100)
        #expect(backup.routines.map(\.name) == ["Empuje", "Tirón", "Pierna", "Cardio y core"])
        let names = Set(backup.exercises.map(\.name))
        for workout in backup.workouts {
            for entry in workout.exercises {
                #expect(names.contains(entry.exercise))
                #expect(!entry.sets.isEmpty)
            }
        }
    }
}
