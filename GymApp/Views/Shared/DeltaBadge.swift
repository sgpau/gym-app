import SwiftUI

/// ▲ +2,5 kg en verde, ▼ en rojo, = en gris. El icono y el texto de accesibilidad
/// transmiten la tendencia sin depender solo del color.
struct DeltaBadge: View {
    let delta: Delta
    let metric: ProgressMetric
    var showsPercent = false

    var body: some View {
        Label {
            Text(text)
        } icon: {
            Image(systemName: icon)
                .imageScale(.small)
        }
        .labelStyle(.titleAndIcon)
        .font(.caption.weight(.semibold))
        .monospacedDigit()
        .foregroundStyle(color)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(accessibilityText)
    }

    private var text: String {
        var text = Format.change(delta, for: metric)
        if showsPercent, let percent = delta.percent, delta.trend != .same {
            text += " (\(Format.percent(percent)))"
        }
        return text
    }

    private var icon: String {
        switch delta.trend {
        case .up: "arrowtriangle.up.fill"
        case .down: "arrowtriangle.down.fill"
        case .same: "equal"
        case .new: "sparkle"
        }
    }

    private var color: Color {
        switch delta.trend {
        case .up: .green
        case .down: .red
        case .same, .new: .secondary
        }
    }

    private var accessibilityText: String {
        switch delta.trend {
        case .up: String(localized: "Sube \(Format.change(delta, for: metric))")
        case .down: String(localized: "Baja \(Format.change(delta, for: metric))")
        case .same: String(localized: "Igual que la vez anterior")
        case .new: String(localized: "Sin datos anteriores")
        }
    }
}

#Preview {
    VStack(alignment: .leading, spacing: 8) {
        DeltaBadge(delta: Delta(current: 62.5, previous: 60), metric: .maxWeight, showsPercent: true)
        DeltaBadge(delta: Delta(current: 45, previous: 60), metric: .maxDuration)
        DeltaBadge(delta: Delta(current: 8, previous: 8), metric: .totalReps)
        DeltaBadge(delta: Delta(current: 8, previous: nil), metric: .totalReps)
    }
}
