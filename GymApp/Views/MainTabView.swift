import SwiftData
import SwiftUI

enum AppTab: Hashable {
    case calendar, routines, exercises, progress
}

struct MainTabView: View {
    @Environment(\.modelContext) private var context
    @AppStorage("didSeedExercises") private var didSeed = false
    @State private var selection: AppTab = .calendar

    var body: some View {
        TabView(selection: $selection) {
            Tab("Calendario", systemImage: "calendar", value: AppTab.calendar) {
                CalendarScreen()
            }
            Tab("Rutinas", systemImage: "list.bullet.rectangle.portrait", value: AppTab.routines) {
                RoutineListView()
            }
            Tab("Ejercicios", systemImage: "dumbbell", value: AppTab.exercises) {
                ExerciseListView()
            }
            Tab("Progreso", systemImage: "chart.line.uptrend.xyaxis", value: AppTab.progress) {
                ProgressListView()
            }
        }
        .tabBarMinimizeBehavior(.onScrollDown)
        .task {
            guard !didSeed else { return }
            SeedData.insertIfEmpty(into: context)
            didSeed = true
        }
    }
}

#Preview("Claro") {
    MainTabView()
        .modelContainer(PreviewData.container)
}

#Preview("Oscuro") {
    MainTabView()
        .modelContainer(PreviewData.container)
        .preferredColorScheme(.dark)
}
