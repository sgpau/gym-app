import Foundation

/// Formato JSON para importar ejercicios, rutinas y entrenos.
/// Los ejercicios y las rutinas se referencian por nombre; las fechas van en ISO 8601
/// ("2026-03-14T18:30:00Z").
nonisolated struct GymBackup: Codable, Hashable {
    var version: Int
    var exercises: [Exercise]
    var routines: [Routine]
    var workouts: [Workout]

    nonisolated struct Exercise: Codable, Hashable {
        var name: String
        /// `chest`, `back`, `legs`… (ver `MuscleGroup`). Opcional.
        var muscleGroup: String?
        var trackingType: TrackingType?
    }

    nonisolated struct Routine: Codable, Hashable {
        var name: String
        var items: [Item]
    }

    nonisolated struct Item: Codable, Hashable {
        var exercise: String
        var sets: Int?
        var reps: Int?
        /// Segundos por serie, para ejercicios por tiempo.
        var duration: Double?
    }

    nonisolated struct Workout: Codable, Hashable {
        var date: Date
        var routine: String?
        var notes: String?
        var exercises: [Entry]
    }

    nonisolated struct Entry: Codable, Hashable {
        var exercise: String
        var sets: [SetData]
    }

    nonisolated struct SetData: Codable, Hashable {
        var reps: Int?
        var duration: Double?
        var weight: Double?
    }

    init(version: Int = 1, exercises: [Exercise] = [], routines: [Routine] = [], workouts: [Workout] = []) {
        self.version = version
        self.exercises = exercises
        self.routines = routines
        self.workouts = workouts
    }

    /// Todas las secciones son opcionales en el archivo.
    init(from decoder: any Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        version = try container.decodeIfPresent(Int.self, forKey: .version) ?? 1
        exercises = try container.decodeIfPresent([Exercise].self, forKey: .exercises) ?? []
        routines = try container.decodeIfPresent([Routine].self, forKey: .routines) ?? []
        workouts = try container.decodeIfPresent([Workout].self, forKey: .workouts) ?? []
    }

    static func decode(_ data: Data) throws -> GymBackup {
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        return try decoder.decode(GymBackup.self, from: data)
    }

    var setCount: Int {
        workouts.reduce(0) { total, workout in total + workout.exercises.reduce(0) { $0 + $1.sets.count } }
    }

    /// Desplaza todas las fechas un número entero de días para que el último entreno caiga en `day`.
    /// Así unos datos de prueba generados hace tiempo siguen siendo "del último año".
    func shiftingDates(endingOn day: Date, calendar: Calendar = .current) -> GymBackup {
        guard let last = workouts.map(\.date).max() else { return self }
        let offset = calendar.dateComponents(
            [.day], from: calendar.startOfDay(for: last), to: calendar.startOfDay(for: day)
        ).day ?? 0
        guard offset != 0 else { return self }
        var copy = self
        copy.workouts = workouts.map { workout in
            var workout = workout
            workout.date = calendar.date(byAdding: .day, value: offset, to: workout.date) ?? workout.date
            return workout
        }
        return copy
    }
}
