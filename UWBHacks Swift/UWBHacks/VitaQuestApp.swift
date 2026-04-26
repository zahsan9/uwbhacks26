import SwiftUI

@main
struct VitaQuestApp: App {
    @StateObject private var healthBridge = HealthBridgeCoordinator()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(healthBridge)
        }
    }
}
