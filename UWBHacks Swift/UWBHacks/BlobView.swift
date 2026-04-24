import SwiftUI

// Maps avatar states to the panda GIF filenames in the assets folder.
private let avatarGIF: [AvatarState: String] = [
    .thriving: "cute_chubby_fat_blue_panda_round_roly-poly_body_si_happy_south",
    .healthy:  "cute_chubby_fat_blue_panda_round_roly-poly_body_si_standing_south",
    .sick:     "cute_chubby_fat_blue_panda_round_roly-poly_body_si_sleepy_south",
    .critical: "cute_chubby_fat_blue_panda_round_roly-poly_body_si_crying_south",
]

struct BlobView: View {
    let state: AvatarState
    let scale: CGFloat
    var glow: Bool = false
    var sparkle: Bool = false

    @State private var bobOffset: CGFloat = 0
    @State private var twinkleOpacity: Double = 1

    // Same sizing formula as before: pixel blob was 22px wide × scale = frame width
    private var size: CGFloat { scale * 22 }

    var body: some View {
        ZStack {
            if glow && state == .thriving {
                RadialGradient(
                    colors: [Color(hex: "EAC119").opacity(0.28), Color(hex: "245E55").opacity(0.12), .clear],
                    center: .center, startRadius: 0, endRadius: scale * 14
                )
                .frame(width: scale * 28, height: scale * 28)
                .opacity(twinkleOpacity)
            }

            GIFView(filename: avatarGIF[state] ?? avatarGIF[.healthy]!)
                .frame(width: size, height: size)

            if sparkle && state == .thriving {
                Text("✦").font(.system(size: 14)).foregroundColor(VQ.mustard)
                    .opacity(twinkleOpacity)
                    .offset(x: scale * -8, y: scale * -11)
                Text("✦").font(.system(size: 10)).foregroundColor(VQ.tea)
                    .opacity(1.3 - twinkleOpacity)
                    .offset(x: scale * 12, y: scale * -4)
            }
        }
        .offset(y: bobOffset)
        .onAppear {
            withAnimation(
                .easeInOut(duration: state.bobDuration)
                .repeatForever(autoreverses: true)
            ) {
                bobOffset = -state.bobAmount
            }
            if glow || sparkle {
                withAnimation(.easeInOut(duration: 2).repeatForever(autoreverses: true)) {
                    twinkleOpacity = 0.3
                }
            }
        }
    }
}
