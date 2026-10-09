import SwiftUI

/// Cuadrícula mensual: hoy en el color principal, el día elegido relleno
/// y un punto bajo los días con entreno. Se cambia de mes con las flechas o deslizando.
struct MonthCalendarView: View {
    @Binding var selectedDay: Date
    let workoutDays: Set<Date>

    @State private var month = MonthGrid(containing: .now)
    @State private var direction = 1
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    private let columns = Array(repeating: GridItem(.flexible(), spacing: 0), count: 7)
    private var calendar: Calendar { month.calendar }

    var body: some View {
        VStack(spacing: 16) {
            header

            LazyVGrid(columns: columns, spacing: 6) {
                ForEach(Array(month.weekdaySymbols.enumerated()), id: \.offset) { _, symbol in
                    Text(symbol)
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(.secondary)
                        .frame(maxWidth: .infinity)
                        .accessibilityHidden(true)
                }

                ForEach(Array(month.days.enumerated()), id: \.offset) { _, day in
                    if let day {
                        DayCell(
                            day: day,
                            isSelected: calendar.isDate(day, inSameDayAs: selectedDay),
                            isToday: calendar.isDateInToday(day),
                            hasWorkout: workoutDays.contains(calendar.startOfDay(for: day))
                        ) {
                            selectedDay = calendar.startOfDay(for: day)
                        }
                    } else {
                        Color.clear.frame(height: 44)
                    }
                }
            }
            .id(month.monthStart)
            .transition(reduceMotion ? AnyTransition.opacity : AnyTransition.asymmetric(
                insertion: .move(edge: direction > 0 ? .trailing : .leading).combined(with: .opacity),
                removal: .move(edge: direction > 0 ? .leading : .trailing).combined(with: .opacity)
            ))
        }
        .clipped()
        .contentShape(.rect)
        .gesture(
            DragGesture(minimumDistance: 30)
                .onEnded { value in
                    if value.translation.width < -50 { move(by: 1) }
                    if value.translation.width > 50 { move(by: -1) }
                }
        )
        .sensoryFeedback(.selection, trigger: selectedDay)
    }

    private var header: some View {
        GlassEffectContainer(spacing: 12) {
            HStack {
                Button("Mes anterior", systemImage: "chevron.left") { move(by: -1) }
                    .labelStyle(.iconOnly)
                    .buttonStyle(.glass)

                Spacer()

                Button {
                    goToToday()
                } label: {
                    Text(month.monthStart.formatted(.dateTime.month(.wide).year()).capitalized)
                        .font(.headline)
                        .foregroundStyle(.primary)
                        .contentTransition(.numericText(countsDown: direction < 0))
                }
                .buttonStyle(.plain)
                .accessibilityHint("Vuelve al mes actual")

                Spacer()

                Button("Mes siguiente", systemImage: "chevron.right") { move(by: 1) }
                    .labelStyle(.iconOnly)
                    .buttonStyle(.glass)
            }
        }
    }

    private func move(by months: Int) {
        direction = months
        withAnimation(reduceMotion ? nil : .snappy(duration: 0.3)) {
            month = month.adding(months: months)
        }
    }

    private func goToToday() {
        let today = MonthGrid(containing: .now, calendar: calendar)
        direction = today.monthStart > month.monthStart ? 1 : -1
        withAnimation(reduceMotion ? nil : .snappy(duration: 0.3)) {
            month = today
            selectedDay = calendar.startOfDay(for: .now)
        }
    }
}

private struct DayCell: View {
    let day: Date
    let isSelected: Bool
    let isToday: Bool
    let hasWorkout: Bool
    let action: () -> Void

    @AppStorage(AccentChoice.storageKey) private var accent: AccentChoice = .blue

    var body: some View {
        Button(action: action) {
            VStack(spacing: 3) {
                Text(day.formatted(.dateTime.day()))
                    .font(.body.monospacedDigit())
                    .fontWeight(isSelected || isToday ? .bold : .regular)
                    .foregroundStyle(isSelected ? .white : isToday ? accent.color : .primary)
                    .frame(width: 38, height: 38)
                    .background {
                        if isSelected {
                            Circle().fill(accent.color)
                        }
                    }
                Circle()
                    .fill(hasWorkout ? accent.color : .clear)
                    .frame(width: 5, height: 5)
            }
            .frame(maxWidth: .infinity)
            .contentShape(.rect)
        }
        .buttonStyle(.plain)
        .animation(.snappy(duration: 0.2), value: isSelected)
        .accessibilityLabel(day.dayTitle)
        .accessibilityValue(hasWorkout ? "Con entreno" : "")
        .accessibilityAddTraits(isSelected ? .isSelected : [])
    }
}

#Preview {
    @Previewable @State var day = Date.now
    MonthCalendarView(selectedDay: $day, workoutDays: [Calendar.current.startOfDay(for: .now)])
        .padding()
}
