import SwiftUI

struct HealthBridgeView: View {
    @EnvironmentObject private var bridge: HealthBridgeCoordinator

    var body: some View {
        WorldBg {
            VStack(alignment: .leading, spacing: 0) {
                Text("VitaQuest Health").vqEyebrow().padding(.bottom, 12)
                Text("Sync Apple Health")
                    .vqH1().foregroundColor(VQ.ink).padding(.bottom, 10)
                Text("This helper reads steps and sleep from Apple Health, then uploads them to your VitaQuest account for Expo Go to read.")
                    .vqBody().padding(.bottom, 28)

                VStack(alignment: .leading, spacing: 10) {
                    Text("VitaQuest email").vqEyebrow()
                    TextField("name@example.com", text: $bridge.targetEmail)
                        .textInputAutocapitalization(.never)
                        .keyboardType(.emailAddress)
                        .autocorrectionDisabled()
                        .padding(.horizontal, 14)
                        .padding(.vertical, 14)
                        .background(VQ.surface)
                        .overlay(
                            RoundedRectangle(cornerRadius: 10)
                                .stroke(VQ.border, lineWidth: 1)
                        )
                        .clipShape(RoundedRectangle(cornerRadius: 10))
                }
                .padding(.bottom, 24)

                VStack(spacing: 0) {
                    bridgeRow(icon: "figure.walk", label: "Steps & walks")
                    bridgeRow(icon: "moon.zzz", label: "Sleep")
                    bridgeRow(icon: "icloud.and.arrow.up", label: "Upload to VitaQuest")
                }
                .padding(.bottom, 28)

                if let steps = bridge.lastSteps, let sleep = bridge.lastSleepHours {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Latest sync").vqEyebrow()
                        Text("\(steps.formatted()) steps").vqH3().foregroundColor(VQ.ink)
                        Text("\(String(format: "%.1f", sleep))h sleep").vqBody()
                    }
                    .padding(.bottom, 18)
                }

                Text(bridge.statusMessage)
                    .vqBody()
                    .padding(.bottom, 24)

                VQButton(
                    label: bridge.isProcessing ? "Syncing..." : "Sync Apple Health",
                    style: .primary
                ) {
                    Task { await bridge.connectAndSync() }
                }
            }
            .padding(.horizontal, 28)
            .padding(.top, 76)
        }
    }

    private func bridgeRow(icon: String, label: String) -> some View {
        HStack(spacing: 14) {
            Image(systemName: icon)
                .font(.system(size: 20))
                .foregroundColor(VQ.ink)
                .frame(width: 24)
            Text(label).vqH3().foregroundColor(VQ.ink).frame(maxWidth: .infinity, alignment: .leading)
            Image(systemName: "checkmark")
                .font(.system(size: 16, weight: .semibold))
                .foregroundColor(VQ.tea)
        }
        .padding(.vertical, 16)
        .overlay(alignment: .bottom) {
            Divider().background(VQ.border)
        }
    }
}
