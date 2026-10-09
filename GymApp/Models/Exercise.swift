import Foundation
import SwiftData

nonisolated enum MuscleGroup: String, Codable, CaseIterable, Identifiable {
    case chest, back, shoulders, biceps, triceps, legs, glutes, core, cardio, other

    var id: String { rawValue }

    var title: String {
        switch self {
        case .chest: "Pecho"
        case .back: "Espalda"
        case .shoulders: "Hombros"
        case .biceps: "Bíceps"
        case .triceps: "Tríceps"
        case .legs: "Piernas"
        case .glutes: "Glúteos"
        case .core: "Core"
        case .cardio: "Cardio"
        case .other: "Otros"
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
