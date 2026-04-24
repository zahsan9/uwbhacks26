import SwiftUI

// MARK: - WorldBg
struct WorldBg<Content: View>: View {
    let content: () -> Content
    init(@ViewBuilder content: @escaping () -> Content) { self.content = content }

    var body: some View {
        ZStack {
            VQ.seashell.ignoresSafeArea()
            RadialGradient(
                colors: [VQ.skySoft, .clear],
                center: .init(x: 0.5, y: 1.4),
                startRadius: 0, endRadius: 320
            )
            .ignoresSafeArea()
            content()
        }
    }
}

// MARK: - WaterBg (map screen)
struct WaterBg<Content: View>: View {
    let content: () -> Content
    init(@ViewBuilder content: @escaping () -> Content) { self.content = content }

    @State private var waveOffset: CGFloat = 0

    var body: some View {
        ZStack {
            LinearGradient(
                colors: [Color(hex: "1e5a68"), Color(hex: "2b7485"), Color(hex: "3d8c96"), Color(hex: "4ea3ad")],
                startPoint: .top, endPoint: .bottom
            )
            .ignoresSafeArea()

            // Animated wave stripe
            Canvas { ctx, size in
                let w = size.width, h = size.height
                let step: CGFloat = 90, wh: CGFloat = 22
                var x: CGFloat = waveOffset.truncatingRemainder(dividingBy: step) - step
                while x < w + step {
                    var path = Path()
                    path.move(to: CGPoint(x: x, y: h * 0.5 + 11))
                    for i in 0..<8 {
                        let px = x + CGFloat(i) * 15
                        let py = h * 0.5 + (i % 2 == 0 ? 11 : 5)
                        path.addLine(to: CGPoint(x: px, y: py))
                    }
                    ctx.stroke(path, with: .color(.white.opacity(0.15)), lineWidth: 2)
                    x += step
                }
                _ = wh // suppress warning
            }
            .ignoresSafeArea()
            .onAppear {
                withAnimation(.linear(duration: 9).repeatForever(autoreverses: false)) {
                    waveOffset = 120
                }
            }

            content()
        }
    }
}

// MARK: - VQButton
struct VQButton: View {
    let label: String
    let style: ButtonStyle
    var action: () -> Void = {}

    enum ButtonStyle { case primary, ghost, oauthApple, oauthGoogle, water }

    var body: some View {
        Button(action: action) {
            Text(label)
                .font(.pixel(14, weight: .semibold))
                .tracking(0.5)
                .foregroundColor(fgColor)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 13)
                .padding(.horizontal, 22)
                .background(bgColor)
                .overlay(RoundedRectangle(cornerRadius: 4).stroke(borderColor, lineWidth: 2))
                .cornerRadius(4)
                .shadow(color: shadowColor, radius: 0, x: 3, y: 3)
        }
        .buttonStyle(PressablePrimaryButtonStyle())
    }

    private var bgColor: Color {
        switch style {
        case .primary:    return VQ.ink
        case .ghost:      return .clear
        case .oauthApple: return VQ.ink
        case .oauthGoogle: return .white
        case .water:      return VQ.tea
        }
    }
    private var fgColor: Color {
        switch style {
        case .oauthGoogle: return VQ.ink
        default:           return VQ.seashell
        }
    }
    private var borderColor: Color {
        switch style {
        case .ghost:       return VQ.ink
        case .oauthGoogle: return VQ.borderStrong
        default:           return .clear
        }
    }
    private var shadowColor: Color {
        switch style {
        case .ghost:       return VQ.ink.opacity(0.25)
        case .oauthGoogle: return VQ.ink.opacity(0.15)
        case .water:       return Color(hex: "143a33").opacity(0.8)
        default:           return VQ.ink.opacity(0.55)
        }
    }
}

struct PressablePrimaryButtonStyle: SwiftUI.ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .offset(configuration.isPressed ? CGSize(width: 3, height: 3) : .zero)
            .shadow(
                color: configuration.isPressed ? .clear : .black.opacity(0.35),
                radius: 0, x: configuration.isPressed ? 0 : 3, y: configuration.isPressed ? 0 : 3
            )
            .animation(.easeOut(duration: 0.06), value: configuration.isPressed)
    }
}

// MARK: - VQCard
struct VQCard<Content: View>: View {
    var warm: Bool = false
    var soft: Bool = false
    let content: () -> Content
    init(warm: Bool = false, soft: Bool = false, @ViewBuilder content: @escaping () -> Content) {
        self.warm = warm; self.soft = soft; self.content = content
    }

    var body: some View {
        content()
            .padding(14)
            .background(soft ? VQ.skySoft : warm ? VQ.seashellSoft : VQ.surface)
            .clipShape(RoundedRectangle(cornerRadius: 6))
            .overlay(RoundedRectangle(cornerRadius: 6).stroke(soft ? .clear : VQ.border, lineWidth: 1.5))
    }
}

// MARK: - StatePill
struct StatePill: View {
    let state: AvatarState

    var body: some View {
        HStack(spacing: 5) {
            RoundedRectangle(cornerRadius: 1)
                .fill(VQ.stateColor(state))
                .frame(width: 5, height: 5)
            Text(state.rawValue)
                .font(.pixel(9, weight: .semibold))
                .tracking(1)
                .textCase(.uppercase)
                .foregroundColor(VQ.stateColor(state))
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 3)
        .overlay(RoundedRectangle(cornerRadius: 3).stroke(VQ.stateSoftColor(state), lineWidth: 1.5))
    }
}

// MARK: - BackButton
struct BackButton: View {
    let action: () -> Void
    var body: some View {
        Button(action: action) {
            Image(systemName: "chevron.left")
                .font(.system(size: 16, weight: .semibold))
                .foregroundColor(Color(hex: "1f3a4a"))
                .frame(width: 34, height: 34)
                .background(VQ.surface)
                .clipShape(RoundedRectangle(cornerRadius: 4))
                .overlay(RoundedRectangle(cornerRadius: 4).stroke(VQ.borderStrong, lineWidth: 2))
                .shadow(color: Color(hex: "1D1D1B").opacity(0.2), radius: 0, x: 2, y: 2)
        }
    }
}

// MARK: - Weekly Dashes
struct WeekDashes: View {
    let state: AvatarState
    var body: some View {
        HStack(spacing: 3) {
            ForEach(0..<7) { i in
                let cls = dashClass(i: i)
                Rectangle()
                    .fill(cls == "on" ? VQ.tea : cls == "partial" ? VQ.mustard : cls == "miss" ? VQ.red.opacity(0.7) : VQ.borderStrong)
                    .frame(height: 4)
            }
        }
        .frame(width: 70)
    }

    private func dashClass(i: Int) -> String {
        switch state {
        case .thriving: return "on"
        case .healthy:  return i < 5 ? "on" : ""
        case .sick:     return i < 2 ? "partial" : ""
        case .critical: return i < 1 ? "miss" : ""
        }
    }
}

// MARK: - Speech Bubble
struct SpeechBubble<Content: View>: View {
    let content: () -> Content
    init(@ViewBuilder content: @escaping () -> Content) { self.content = content }

    var body: some View {
        ZStack(alignment: .bottomLeading) {
            content()
                .padding(16)
                .background(VQ.surface)
                .clipShape(RoundedRectangle(cornerRadius: 5))
                .overlay(RoundedRectangle(cornerRadius: 5).stroke(VQ.borderStrong, lineWidth: 2))

            // Tail
            Image(systemName: "triangle.fill")
                .font(.system(size: 10))
                .foregroundColor(VQ.surface)
                .rotationEffect(.degrees(180))
                .offset(x: 20, y: 8)
        }
    }
}

// MARK: - Streak Number
struct StreakNumber: View {
    let value: Int
    var body: some View {
        Text("\(value)")
            .font(.vt323(24))
            .foregroundColor(VQ.tangerine)
    }
}
