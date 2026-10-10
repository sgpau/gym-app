import Foundation
import SwiftData

nonisolated enum MuscleGroup: String, Codable, CaseIterable, Identifiable {
    case chest, back, shoulders, biceps, triceps, legs, glutes, core, cardio, other

    var id: String { rawValue }

    var title: String {
        switch self {
        case .chest: String(localized: "Pecho")
        case .back: String(localized: "Espalda")
        case .shoulders: String(localized: "Hombros")
        case .biceps: String(localized: "Bíceps")
        case .triceps: String(localized: "Tríceps")
        case .legs: String(localized: "Piernas")
        case .glutes: String(localized: "Glúteos")
        case .core: String(localized: "Core")
        case .cardio: String(localized: "Cardio")
        case .other: String(localized: "Otros")
        }
    }
}

@Model
final class Exercise {
    /// Identificador estable que usa la lógica de `Core/` para agrupar el historial.
    var uuid: UUID = UUID()
    var name: String = ""
    var muscleGroupRaw: String = MuscleGroup.other.rawValue
    var trackingTypeRaw: String = TrackingType.reps.rawValue
    var notes: String = ""
    var createdAt: Date = Date.now

    @Relationship(deleteRule: .cascade, inverse: \WorkoutExercise.exercise)
    var workoutEntries: [WorkoutExercise] = []

    @Relationship(deleteRule: .cascade, inverse: \RoutineItem.exercise)
    var routineItems: [RoutineItem] = []

    init(name: String, muscleGroup: MuscleGroup, trackingType: TrackingType = .reps, notes: String = "") {
        self.name = name
        self.muscleGroupRaw = muscleGroup.rawValue
        self.trackingTypeRaw = trackingType.rawValue
        self.notes = notes
    }

    var muscleGroup: MuscleGroup {
        get { MuscleGroup(rawValue: muscleGroupRaw) ?? .other }
        set { muscleGroupRaw = newValue.rawValue }
    }

    var trackingType: TrackingType {
        get { TrackingType(rawValue: trackingTypeRaw) ?? .reps }
        set { trackingTypeRaw = newValue.rawValue }
    }
}
