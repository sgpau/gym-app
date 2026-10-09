import SwiftData
import SwiftUI

struct CalendarScreen: View {
    @Query(sort: \Workout.date) private var workouts: [Workout]
    @State private var selectedDay = Calendar.current.startOfDay(for: .now)
    @State private var showSettings = false
    @State private var flow: WorkoutFlow? = nil
    @State private var comparing: Workout? = nil

    private var workoutDays: Set<Date> {
        Set(workouts.map { Calendar.current.startOfDay(for: $0.date) })
    }

    private var dayWorkouts: [Workout] {
        workouts.filter { Calendar.current.isDate($0.date, inSameDayAs: selectedDay) }
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 28) {
                    MonthCalendarView(selectedDay: $selectedDay, workoutDays: workoutDays)
                    DayDetailView(
                        day: selectedDay,
                        workouts: dayWorkouts,
                        onAdd: { flow = .new(day: selectedDay) },
                        onOpen: { flow = .edit($0, isNew: false) },
                        onCompare: { comparing = $0 }
                    )
                }
                .padding()
            }
            .navigationTitle("Calendario")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Ajustes", systemImage: "gearshape") { showSettings = true }
                }
            }
            .sheet(isPresented: $showSettings) { SettingsView() }
            .sheet(item: $comparing) { workout in
                NavigationStack { WorkoutSummaryView(workout: workout) }
            }
            .fullScreenCover(item: $flow) { WorkoutFlowView(flow: $0) }
        }
    }
}

#Preview {
    CalendarScreen()
        .modelContainer(PreviewData.container)
}
