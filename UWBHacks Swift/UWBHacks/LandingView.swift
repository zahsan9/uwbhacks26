import SwiftUI

struct LandingView: View {
    var avatarState: AvatarState = .healthy
    let onOpenMap: () -> Void

    let habits = sampleHabits

    var body: some View {
        WorldBg {
            VStack(spacing: 0) {
                // Header
                HStack(alignment: .lastTextBaseline) {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Day 12").vqEyebrow()
                        Text("Hi, Zainab").vqH2().foregroundColor(VQ.ink)
                    }
                    Spacer()
                    Text("Lv 4").vqSmall()
                }
                .padding(.horizontal, 24)
                .padding(.top, 60)
                .padding(.bottom, 24)

                // Avatar
                Spacer()
                BlobView(state: avatarState, scale: 6,
                         glow: avatarState == .thriving,
                         sparkle: avatarState == .thriving)

                Text("\u{201C}\(avatarState.message)\u{201D}")
                    .font(.pixel(16))
                    .tracking(0.2)
                    .lineSpacing(5)
                    .multilineTextAlignment(.center)
                    .foregroundColor(VQ.ink)
                    .padding(.horizontal, 40)
                    .padding(.top, 16)
                Spacer()

                // Habit rows
                VStack(spacing: 0) {
                    HStack {
                        Text("Your world").vqEyebrow()
                        Spacer()
                        Text("3 islands").vqSmall()
                    }
                    .padding(.bottom, 10)

                    Divider().background(VQ.border)

                    ForEach(habits) { h in
                        HStack(spacing: 12) {
                            Image(systemName: islandIcon(h.type))
                                .font(.system(size: 16))
                                .foregroundColor(VQ.ink)
                                .frame(width: 22)
                            Text(h.type.habitName).vqH3().foregroundColor(VQ.ink).frame(maxWidth: .infinity, alignment: .leading)
                            WeekDashes(state: h.state)
                            HStack(spacing: 3) {
                                StreakNumber(value: h.streak)
                            }
                        }
                        .padding(.vertical, 12)
                        Divider().background(VQ.border)
                    }
                }
                .padding(.horizontal, 24)
                .padding(.bottom, 16)

                VQButton(label: "Open world map", style: .primary, action: onOpenMap)
                    .padding(.horizontal, 24)
                    .padding(.bottom, 36)
            }
        }
    }

    private func islandIcon(_ type: IslandType) -> String {
        switch type {
        case .walk:   return "figure.walk"
        case .sleep:  return "moon.zzz"
        case .screen: return "desktopcomputer"
        case .learn:  return "book"
        case .quest:  return "sparkles"
        }
    }
}
