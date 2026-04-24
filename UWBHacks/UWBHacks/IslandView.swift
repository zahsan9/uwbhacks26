import SwiftUI

struct IslandView: View {
    let type: IslandType
    let state: AvatarState
    let scale: CGFloat
    var locked: Bool = false
    var bob: Bool = true

    @State private var bobOffset: CGFloat = 0
    @State private var twinkleOpacity: Double = 1

    private var rows: [String] { islandRows[type] ?? islandPalm }
    private var palette: IslandPalette { islandPalettes[state] ?? islandPalettes[.healthy]! }

    private var bobDuration: Double {
        let base = 3.0
        let extra = Double(type.rawValue.first?.asciiValue ?? 0).truncatingRemainder(dividingBy: 4) * 0.3
        return base + extra
    }

    var body: some View {
        ZStack(alignment: .bottom) {
            // Water ripple shadow
            Ellipse()
                .fill(Color(hex: "1D1D1B").opacity(0.18))
                .frame(
                    width:  CGFloat(rows.first?.count ?? 32) * scale * 0.65,
                    height: 6
                )
                .offset(y: 2)

            PixelGridView(rows: rows, palette: palette, scale: scale)

            if state == .thriving {
                thrivingDecor
            }

            if locked {
                lockedOverlay
            }
        }
        .offset(y: bobOffset)
        .onAppear {
            guard bob else { return }
            withAnimation(
                .easeInOut(duration: bobDuration)
                .repeatForever(autoreverses: true)
            ) {
                bobOffset = -5
            }
            if state == .thriving {
                withAnimation(.easeInOut(duration: 2).repeatForever(autoreverses: true)) {
                    twinkleOpacity = 0.3
                }
            }
        }
    }

    private var thrivingDecor: some View {
        ZStack {
            PixelGridView(
                rows: [".f.", "fFf", ".f."],
                palette: ["f": Color(hex: "EAA7C7"), "F": Color(hex: "EAE4DA")],
                scale: 2
            )
            .opacity(twinkleOpacity)
            .offset(x: -CGFloat(rows.first?.count ?? 32) * scale * 0.3,
                    y: CGFloat(rows.count) * scale * -0.15)

            PixelGridView(
                rows: [".f.", "fFf", ".f."],
                palette: ["f": Color(hex: "EAC119"), "F": Color(hex: "EAE4DA")],
                scale: 2
            )
            .opacity(1.3 - twinkleOpacity)
            .offset(x: CGFloat(rows.first?.count ?? 32) * scale * 0.28,
                    y: CGFloat(rows.count) * scale * -0.18)
        }
    }

    private var lockedOverlay: some View {
        Text("locked")
            .font(.pixel(10, weight: .medium))
            .tracking(1.2)
            .textCase(.uppercase)
            .foregroundColor(Color(hex: "EAE4DA"))
            .padding(.horizontal, 11)
            .padding(.vertical, 5)
            .background(Color(hex: "1D1D1B").opacity(0.82))
            .clipShape(Capsule())
            .offset(y: -CGFloat(rows.count) * scale * 0.35)
    }
}
