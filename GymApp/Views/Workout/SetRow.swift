import SwiftData
import SwiftUI

/// Una fila de serie: reps + kg, o duración (con cronómetro) + kg opcional.
struct SetRow: View {
    @Bindable var set: WorkoutSet
    let number: Int
    let type: TrackingType

    var body: some View {
        HStack(spacing: 12) {
            Text("\(number)")
                .font(.subheadline.weight(.semibold))
                .monospacedDigit()
                .foregroundStyle(.secondary)
                .frame(width: 22)
                .accessibilityLabel("Serie \(number)")

            switch type {
            case .reps:
                NumberField(unit: "reps") {
                    TextField("0", value: $set.reps, format: .number)
                        .keyboardType(.numberPad)
                }
            case .time:
                DurationField(duration: $set.duration)
            }

            Spacer(minLength: 0)

            NumberField(unit: "kg") {
                TextField("—", value: $set.weight, format: .number.precision(.fractionLength(0...2)))
                    .keyboardType(.decimalPad)
            }
        }
    }
}

/// Campo numérico compacto con su unidad detrás.
private struct NumberField<Field: View>: View {
    let unit: LocalizedStringKey
    @ViewBuilder var field: Field

    var body: some View {
        HStack(spacing: 4) {
            field
                .multilineTextAlignment(.trailing)
                .monospacedDigit()
                .frame(width: 56)
                .padding(.vertical, 6)
                .padding(.horizontal, 8)
                .background(.fill.tertiary, in: .rect(cornerRadius: 8))
            Text(unit)
                .font(.subheadline)
                .foregroundStyle(.secondary)
        }
    }
}

/// Duración en min:seg. Se elige con una rueda o se cronometra con ▶︎.
struct DurationField: View {
    @Binding var duration: TimeInterval?
    @State private var showPicker = false
    @State private var stopwatchStart: Date? = nil

    private var durationDescription: String {
        duration.map { Format.duration($0) } ?? String(localized: "sin anotar")
    }

    var body: some View {
        HStack(spacing: 8) {
            if let start = stopwatchStart {
                TimelineView(.periodic(from: start, by: 1)) { context in
                    Text(Format.duration(context.date.timeIntervalSince(start)))
                        .font(.body.weight(.semibold))
                        .monospacedDigit()
                        .padding(.horizontal, 12)
                        .padding(.vertical, 6)
                        .glassEffect(.regular.tint(.red.opacity(0.25)), in: .capsule)
                }
                Button("Parar cronómetro", systemImage: "stop.fill") {
                    duration = Date.now.timeIntervalSince(start).rounded()
                    stopwatchStart = nil
                }
                .labelStyle(.iconOnly)
                .buttonStyle(.glass)
            } else {
                Button {
                    showPicker = true
                } label: {
                    Text(duration.map { Format.duration($0) } ?? "0:00")
                        .monospacedDigit()
                }
                .buttonStyle(.bordered)
                .accessibilityLabel("Duración \(durationDescription)")

                Button("Iniciar cronómetro", systemImage: "play.fill") {
                    stopwatchStart = .now
                }
                .labelStyle(.iconOnly)
                .buttonStyle(.glass)
            }
        }
        .sensoryFeedback(.impact(weight: .medium), trigger: stopwatchStart)
        .sheet(isPresented: $showPicker) {
            DurationPickerSheet(duration: $duration)
                .presentationDetents([.height(320)])
        }
    }
}

private struct DurationPickerSheet: View {
    @Binding var duration: TimeInterval?
    @Environment(\.dismiss) private var dismiss
    @State private var minutes = 0
    @State private var seconds = 0

    var body: some View {
        NavigationStack {
            HStack(spacing: 0) {
                Picker("Minutos", selection: $minutes) {
                    ForEach(0..<121, id: \.self) { Text("\($0) min").tag($0) }
                }
                Picker("Segundos", selection: $seconds) {
                    ForEach(0..<60, id: \.self) { Text("\($0) s").tag($0) }
                }
            }
            .pickerStyle(.wheel)
            .navigationTitle("Duración")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancelar") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("OK") {
                        duration = TimeInterval(minutes * 60 + seconds)
                        dismiss()
                    }
                }
            }
            .onAppear {
                let total = Int(duration ?? 0)
                minutes = min(total / 60, 120)
                seconds = total % 60
            }
        }
    }
}
