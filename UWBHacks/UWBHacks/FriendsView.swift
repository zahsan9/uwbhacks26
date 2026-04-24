import SwiftUI

struct FriendsView: View {
    @State private var nudged: Set<String> = []
    @State private var visiting: Friend? = nil

    var body: some View {
        if let friend = visiting {
            FriendVisitView(friend: friend, onBack: { visiting = nil })
        } else {
            friendsList
        }
    }

    private var friendsList: some View {
        WorldBg {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    Text("Friends")
                        .vqH1().foregroundColor(VQ.ink).padding(.bottom, 4)
                    Text("5 companions · 2 need a nudge")
                        .vqBody().padding(.bottom, 16)

                    VStack(spacing: 8) {
                        ForEach(sampleFriends) { friend in
                            friendCard(friend)
                        }
                    }
                }
                .padding(.horizontal, 16)
                .padding(.top, 60)
                .padding(.bottom, 40)
            }
        }
    }

    private func friendCard(_ f: Friend) -> some View {
        let did = nudged.contains(f.id)
        return HStack(spacing: 12) {
            // Avatar + mini island
            ZStack {
                IslandView(type: .walk,
                           state: f.state == .critical ? .critical : f.state == .sick ? .sick : .healthy,
                           scale: 1.3, bob: false)
                    .scaleEffect(0.7)
                    .offset(y: 8)
                BlobView(state: f.state, scale: 1.8)
                    .offset(y: -4)
            }
            .frame(width: 56, height: 56)

            VStack(alignment: .leading, spacing: 3) {
                HStack(spacing: 8) {
                    Text(f.name).vqH3().foregroundColor(VQ.ink)
                    Text("Lvl \(f.level)").vqSmall()
                }
                HStack(spacing: 8) {
                    HStack(spacing: 3) {
                        Image(systemName: "flame.fill")
                            .font(.system(size: 10))
                            .foregroundColor(Color(hex: "e56042"))
                        StreakNumber(value: f.streak)
                    }
                    StatePill(state: f.state)
                }
            }
            Spacer()

            Button {
                if f.needsNudge {
                    nudged.insert(f.id)
                } else {
                    visiting = f
                }
            } label: {
                Text(did ? "sent ✓" : f.needsNudge ? "nudge" : "visit")
                    .font(.pixel(13, weight: .semibold))
                    .foregroundColor(did ? Color(hex: "1a3a2a") : .white)
                    .padding(.horizontal, 14)
                    .padding(.vertical, 8)
                    .background(did ? Color(hex: "6ed4a3") : f.needsNudge ? VQ.coral : VQ.water2)
                    .clipShape(RoundedRectangle(cornerRadius: 4))
                    .shadow(color: did ? Color(hex: "4aa882") : f.needsNudge ? VQ.coralDeep : VQ.water3,
                            radius: 0, x: 0, y: 3)
            }
            .buttonStyle(PressablePrimaryButtonStyle())
        }
        .padding(12)
        .background(VQ.surface)
        .clipShape(RoundedRectangle(cornerRadius: 6))
        .overlay(
            RoundedRectangle(cornerRadius: 6)
                .stroke(f.needsNudge ? VQ.coral : .clear, lineWidth: 4)
                .clipShape(RoundedRectangle(cornerRadius: 6))
                .mask(alignment: .leading) {
                    Rectangle().frame(width: 4)
                }
        )
        .overlay(RoundedRectangle(cornerRadius: 6).stroke(VQ.border, lineWidth: 1.5))
    }
}

// MARK: - Friend Visit
struct FriendVisitView: View {
    let friend: Friend
    let onBack: () -> Void

    var body: some View {
        WorldBg {
            // Nav
            HStack(spacing: 10) {
                BackButton(action: onBack)
                VStack(alignment: .leading, spacing: 2) {
                    Text("\(friend.name)'s world").vqH3().foregroundColor(VQ.ink)
                    Text("Lvl \(friend.level) · \(friend.state.rawValue)").vqSmall()
                }
                Spacer()
            }
            .padding(.horizontal, 16)
            .padding(.top, 56)

            // Islands scattered
            GeometryReader { geo in
                ZStack {
                    IslandView(type: .sleep,
                               state: friend.state == .critical ? .critical : .healthy,
                               scale: 2.2)
                        .position(x: 90, y: 200)

                    IslandView(type: .walk,
                               state: friend.state == .critical ? .sick : .healthy,
                               scale: 2.2)
                        .position(x: geo.size.width - 70, y: 180)

                    VStack(spacing: -10) {
                        BlobView(state: friend.state, scale: 3)
                        IslandView(type: .quest,
                                   state: friend.state == .critical ? .critical : .sick,
                                   scale: 2.8)
                    }
                    .position(x: geo.size.width / 2, y: 370)

                    IslandView(type: .screen,
                               state: friend.state == .critical ? .critical : .sick,
                               scale: 2.0)
                        .position(x: 80, y: 510)

                    IslandView(type: .learn, state: .sick, scale: 2.0, locked: true)
                        .position(x: geo.size.width - 60, y: 490)
                }
                .frame(width: geo.size.width, height: geo.size.height)
            }

            // Bottom actions
            VStack(spacing: 10) {
                SpeechBubble {
                    Text(friendQuote)
                        .vqH3().foregroundColor(VQ.ink)
                }
                HStack(spacing: 8) {
                    VQButton(label: "Send nudge", style: .primary)
                    Button {
                        onBack()
                    } label: {
                        Text("Message")
                            .font(.pixel(14, weight: .semibold))
                            .foregroundColor(VQ.ink)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 13)
                            .background(.clear)
                            .overlay(RoundedRectangle(cornerRadius: 4).stroke(VQ.ink, lineWidth: 2))
                            .cornerRadius(4)
                            .shadow(color: VQ.ink.opacity(0.25), radius: 0, x: 3, y: 3)
                    }
                    .buttonStyle(PressablePrimaryButtonStyle())
                }
            }
            .padding(.horizontal, 16)
            .padding(.bottom, 44)
            .frame(maxHeight: .infinity, alignment: .bottom)
        }
    }

    private var friendQuote: String {
        switch friend.state {
        case .critical: return "\"i haven't done my habits in days...\""
        case .sick:     return "\"volcano has been rough this week.\""
        case .healthy:  return "\"doing okay — want to trade habits?\""
        case .thriving: return "\"everything feels great! you?\""
        }
    }
}
