import SwiftUI

struct IslandDetailView: View {
    let islandKey: IslandType
    let state: AvatarState
    let onBack: () -> Void

    private var meta: (stat: String, unit: String, goal: String, streak: Int) {
        switch islandKey {
        case .walk:   return ("8,240",  "steps today",  "10,000",   12)
        case .sleep:  return ("7h 42m", "last night",   "8h",        7)
        case .screen: return ("4h 18m", "today",        "under 3h",  2)
        default:      return ("—",      "",             "—",         0)
        }
    }

    // 30-day streak grid pattern
    private var pattern: [String] {
        let today = 25, total = 30
        return (0..<total).map { i in
            if i > today { return "future" }
            if i == today { return "today" }
            switch islandKey {
            case .walk:   return (i % 7 == 3 && i < 15) ? "missed" : "hit"
            case .sleep:  return (i < 18 && i % 5 == 2) ? "partial" : "hit"
            default:      return (i < 20 && i % 3 != 0) ? "missed" : "hit"
            }
        }
    }

    private func dayColor(_ p: String) -> Color {
        switch p {
        case "hit":     return Color(hex: "6ed4a3")
        case "partial": return Color(hex: "ffc260")
        case "missed":  return Color(hex: "d76060")
        case "today":   return Color(hex: "ff8b6a")
        default:        return VQ.ink.opacity(0.1)
        }
    }

    var body: some View {
        WorldBg {
            VStack(spacing: 0) {
                // Nav bar
                HStack(spacing: 8) {
                    BackButton(action: onBack)
                    Text(islandKey.islandName).vqH3().foregroundColor(VQ.ink).frame(maxWidth: .infinity, alignment: .leading)
                    StatePill(state: state)
                }
                .padding(.horizontal, 14)
                .padding(.top, 54)
                .padding(.bottom, 8)

                // Island hero
                HStack {
                    Spacer()
                    IslandView(type: islandKey, state: state, scale: 4)
                    Spacer()
                }
                .frame(height: 180)

                // Scrollable sheet
                ScrollView {
                    VStack(spacing: 10) {
                        // Big stat
                        VQCard(warm: true) {
                            VStack(spacing: 4) {
                                Text(meta.stat)
                                    .font(.pixel(34, weight: .bold))
                                    .foregroundColor(VQ.ink)
                                Text("\(meta.unit) · goal \(meta.goal)").vqSmall()
                            }
                            .frame(maxWidth: .infinity)
                        }

                        // Streak grid
                        VQCard {
                            VStack(alignment: .leading, spacing: 10) {
                                HStack {
                                    Image(systemName: "flame.fill")
                                        .font(.system(size: 16))
                                        .foregroundColor(Color(hex: "e56042"))
                                    Text("\(meta.streak) day streak").vqH3().foregroundColor(VQ.ink).frame(maxWidth: .infinity, alignment: .leading)
                                    Text("last 30 days").vqSmall()
                                }

                                LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 4), count: 10), spacing: 4) {
                                    ForEach(Array(pattern.enumerated()), id: \.offset) { i, p in
                                        Rectangle()
                                            .fill(dayColor(p))
                                            .aspectRatio(1, contentMode: .fit)
                                            .cornerRadius(1)
                                            .overlay(
                                                p == "today" ?
                                                RoundedRectangle(cornerRadius: 1)
                                                    .stroke(Color(hex: "ff8b6a"), lineWidth: 2) : nil
                                            )
                                    }
                                }

                                HStack(spacing: 14) {
                                    ForEach([("hit", "6ed4a3"), ("partial", "ffc260"), ("missed", "d76060")], id: \.0) { label, hex in
                                        HStack(spacing: 4) {
                                            Rectangle().fill(Color(hex: hex))
                                                .frame(width: 10, height: 10)
                                            Text(label).vqSmall()
                                        }
                                    }
                                }
                            }
                        }

                        // Today's log
                        VQCard(soft: true) {
                            VStack(alignment: .leading, spacing: 6) {
                                Text("today's log").vqEyebrow()
                                Text(todayLog).vqH3().foregroundColor(VQ.ink)
                            }
                            .frame(maxWidth: .infinity, alignment: .leading)
                        }

                        // XP / Level / Health row
                        HStack(spacing: 8) {
                            statMini(icon: "star.fill", color: Color(hex: "ffc260"), value: "+24 xp", label: "today")
                            statMini(icon: "trophy.fill", color: Color(hex: "ffc260"), value: "Lvl 4", label: "next: 120 xp")
                            statMini(icon: "heart.fill", color: Color(hex: "ff5a8a"), value: "78/100", label: "health")
                        }
                    }
                    .padding(.horizontal, 16)
                    .padding(.top, 10)
                    .padding(.bottom, 44)
                }
            }
        }
        .navigationBarHidden(true)
    }

    private var todayLog: String {
        switch state {
        case .thriving: return "✓ pulled from HealthKit · 82% of goal"
        case .healthy:  return "pulled from HealthKit · 68% of goal"
        case .sick:     return "missed yesterday — a short walk recovers you"
        case .critical: return "3 days missed — your island is wilting"
        }
    }

    private func statMini(icon: String, color: Color, value: String, label: String) -> some View {
        VQCard {
            VStack(spacing: 4) {
                Image(systemName: icon).font(.system(size: 16)).foregroundColor(color)
                Text(value).vqH3().foregroundColor(VQ.ink)
                Text(label).vqSmall()
            }
            .frame(maxWidth: .infinity)
        }
    }
}
