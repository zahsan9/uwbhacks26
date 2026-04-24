import SwiftUI

struct ContentView: View {
    @AppStorage("onboardingComplete") private var onboardingComplete = false
    @State private var selectedTab = 0
    @State private var showingMap = false
    @State private var selectedIsland: IslandType? = nil
    @State private var showingIslandDetail = false

    let avatarState: AvatarState = .healthy
    let islandStates: [IslandType: AvatarState] = [
        .walk: .thriving, .sleep: .healthy, .screen: .sick
    ]

    var body: some View {
        if !onboardingComplete {
            OnboardingView(onboardingComplete: $onboardingComplete)
        } else {
            mainApp
        }
    }

    @ViewBuilder
    private var mainApp: some View {
        if showingIslandDetail, let island = selectedIsland {
            IslandDetailView(
                islandKey: island,
                state: islandStates[island] ?? .healthy,
                onBack: {
                    showingIslandDetail = false
                    showingMap = true
                }
            )
            .transition(.move(edge: .trailing))
        } else if showingMap {
            MapView(islandStates: islandStates) { island in
                selectedIsland = island
                withAnimation(.easeInOut(duration: 0.35)) {
                    showingMap = false
                    showingIslandDetail = true
                }
            }
            .transition(.move(edge: .trailing))
            .overlay(alignment: .topLeading) {
                Button {
                    withAnimation(.easeInOut(duration: 0.35)) { showingMap = false }
                } label: {
                    Image(systemName: "chevron.left")
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundColor(.white)
                        .frame(width: 36, height: 36)
                        .background(.white.opacity(0.15))
                        .clipShape(RoundedRectangle(cornerRadius: 4))
                        .overlay(RoundedRectangle(cornerRadius: 4).stroke(.white.opacity(0.3), lineWidth: 1.5))
                }
                .padding(.leading, 16)
                .padding(.top, 56)
            }
        } else {
            TabView(selection: $selectedTab) {
                LandingView(avatarState: avatarState) {
                    withAnimation(.easeInOut(duration: 0.35)) { showingMap = true }
                }
                .tabItem {
                    Label("Home", systemImage: "globe")
                }
                .tag(0)

                FriendsView()
                    .tabItem {
                        Label("Friends", systemImage: "person.2")
                    }
                    .tag(1)
            }
            .tint(VQ.ink)
        }
    }
}
