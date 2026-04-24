import SwiftUI

struct MapView: View {
    var islandStates: [IslandType: AvatarState] = [
        .walk: .thriving, .sleep: .healthy, .screen: .sick
    ]
    let onIslandTap: (IslandType) -> Void

    @State private var swimmingTo: IslandType? = nil

    // Island positions for 360×740 canvas, scattered layout
    private let positions: [IslandType: (top: CGFloat, left: CGFloat, scale: CGFloat)] = [
        .walk:   (top: 180, left: 210, scale: 2.4),
        .sleep:  (top: 220, left: 20,  scale: 2.2),
        .screen: (top: 490, left: 215, scale: 2.1),
        .learn:  (top: 510, left: 25,  scale: 2.1),
        .quest:  (top: 100, left: 118, scale: 2.0),
    ]
    private let homePos: (top: CGFloat, left: CGFloat, scale: CGFloat) = (top: 330, left: 125, scale: 2.8)

    // Center point of an island for drawing lines
    private func center(of pos: (top: CGFloat, left: CGFloat, scale: CGFloat),
                        rows: [String]) -> CGPoint {
        let w = CGFloat(rows.first?.count ?? 32)
        let h = CGFloat(rows.count)
        return CGPoint(
            x: pos.left + pos.scale * w / 2,
            y: pos.top  + pos.scale * h / 2
        )
    }

    var body: some View {
        WaterBg {
            GeometryReader { geo in
                let homeCenter = center(of: homePos, rows: islandPalm)

                ZStack(alignment: .topLeading) {
                    // Connecting lines
                    Canvas { ctx, size in
                        for (type, pos) in positions {
                            let rows = islandRows[type] ?? islandPalm
                            let dest = center(of: pos, rows: rows)
                            var path = Path()
                            path.move(to: homeCenter)
                            path.addLine(to: dest)
                            ctx.stroke(path,
                                       with: .color(.white.opacity(0.22)),
                                       style: StrokeStyle(lineWidth: 1.5, dash: [6, 5], dashPhase: 0))
                        }
                    }
                    .frame(width: geo.size.width, height: geo.size.height)

                    // Satellite islands
                    ForEach(IslandType.allCases, id: \.self) { type in
                        if let pos = positions[type] {
                            let state = islandStates[type] ?? .sick
                            let locked = (type == .learn || type == .quest)
                            VStack(spacing: 4) {
                                IslandView(type: type, state: locked ? .sick : state,
                                           scale: pos.scale, locked: locked)
                                Text(type.rawValue)
                                    .font(.pixel(10, weight: .medium))
                                    .tracking(0.4)
                                    .textCase(.lowercase)
                                    .foregroundColor(locked ? .white.opacity(0.35) : .white.opacity(0.85))
                            }
                            .position(x: pos.left + pos.scale * 16,
                                      y: pos.top + pos.scale * 11)
                            .onTapGesture {
                                guard !locked else { return }
                                withAnimation(.easeInOut(duration: 0.4)) { swimmingTo = type }
                                DispatchQueue.main.asyncAfter(deadline: .now() + 0.6) {
                                    onIslandTap(type)
                                }
                            }
                        }
                    }

                    // Home island + avatar
                    VStack(spacing: 4) {
                        if swimmingTo == nil {
                            BlobView(state: .healthy, scale: 2.4)
                                .transition(.opacity)
                        }
                        IslandView(type: .walk, state: .thriving, scale: homePos.scale)
                        Text("home")
                            .font(.pixel(10, weight: .medium))
                            .tracking(0.4)
                            .foregroundColor(.white.opacity(0.85))
                    }
                    .position(x: homePos.left + homePos.scale * 16,
                              y: homePos.top + homePos.scale * 11)

                    // Swimming avatar
                    if let dest = swimmingTo, let pos = positions[dest] {
                        let destCenter = center(of: pos, rows: islandRows[dest] ?? islandPalm)
                        let midX = (homeCenter.x + destCenter.x) / 2
                        let midY = (homeCenter.y + destCenter.y) / 2
                        BlobView(state: .healthy, scale: 2.2)
                            .position(x: midX, y: midY)
                            .transition(.opacity)
                    }
                }
                .frame(width: geo.size.width, height: geo.size.height)
            }

            // Header overlay
            VStack {
                HStack(alignment: .center) {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Your world")
                            .font(.pixel(9, weight: .semibold))
                            .tracking(2)
                            .textCase(.uppercase)
                            .foregroundColor(.white.opacity(0.55))
                        Text("Archipelago")
                            .vqH2().foregroundColor(.white)
                    }
                    Spacer()
                    Button {
                    } label: {
                        Image(systemName: "person.2")
                            .font(.system(size: 16))
                            .foregroundColor(.white.opacity(0.9))
                            .frame(width: 36, height: 36)
                            .background(.white.opacity(0.12))
                            .clipShape(RoundedRectangle(cornerRadius: 4))
                            .overlay(RoundedRectangle(cornerRadius: 4).stroke(.white.opacity(0.25), lineWidth: 1.5))
                    }
                }
                .padding(.horizontal, 24)
                .padding(.top, 56)
                Spacer()
                HStack {
                    Text("Tap an island to visit")
                        .font(.pixel(11)).foregroundColor(.white.opacity(0.55))
                    Spacer()
                    Text("Health 78")
                        .font(.pixel(11)).foregroundColor(.white.opacity(0.55))
                }
                .padding(.horizontal, 24)
                .padding(.bottom, 40)
            }
        }
        .ignoresSafeArea()
    }
}
