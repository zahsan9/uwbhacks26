import SwiftUI

// MARK: - Onboarding Flow
struct OnboardingView: View {
    @Binding var onboardingComplete: Bool
    @State private var step = 0
    @State private var selectedAvatar = 0
    @State private var selectedHabits: Set<String> = ["sleep", "steps", "screen"]

    var body: some View {
        switch step {
        case 0: SignupScreen(onNext: { step = 1 })
        case 1: HealthKitScreen(onNext: { step = 2 })
        case 2: AvatarScreen(selected: $selectedAvatar, onNext: { step = 3 })
        case 3: HabitsScreen(selected: $selectedHabits, onDone: { onboardingComplete = true })
        default: SignupScreen(onNext: { step = 1 })
        }
    }
}

// MARK: - Signup
private struct SignupScreen: View {
    let onNext: () -> Void

    var body: some View {
        WorldBg {
            VStack(spacing: 0) {
                Spacer()
                VStack(spacing: 20) {
                    BlobView(state: .thriving, scale: 5, glow: true, sparkle: true)
                    Text("VitaQuest")
                        .font(.pixel(32, weight: .bold))
                        .tracking(1)
                        .foregroundColor(VQ.ink)
                    Text("one world. every habit.")
                        .vqBody()
                }
                Spacer()
                VStack(spacing: 8) {
                    VQButton(label: "Continue with Apple", style: .oauthApple, action: onNext)
                    VQButton(label: "Continue with Google", style: .oauthGoogle, action: onNext)
                    VQButton(label: "Sign up with email", style: .ghost, action: onNext)
                }
                .padding(.horizontal, 28)
                .padding(.bottom, 36)
            }
        }
    }
}

// MARK: - HealthKit
private struct HealthKitScreen: View {
    let onNext: () -> Void

    let dataTypes: [(icon: String, label: String)] = [
        ("figure.walk", "Steps & walks"),
        ("moon.zzz", "Sleep"),
        ("heart", "Activity"),
    ]

    var body: some View {
        WorldBg {
            VStack(alignment: .leading, spacing: 0) {
                Text("02 / 04").vqEyebrow().padding(.bottom, 12)
                Text("Connect Apple Health")
                    .vqH1().foregroundColor(VQ.ink).padding(.bottom, 10)
                Text("We read health data silently — no logging.")
                    .vqBody().padding(.bottom, 28)

                VStack(spacing: 0) {
                    ForEach(dataTypes, id: \.label) { row in
                        HStack(spacing: 14) {
                            Image(systemName: row.icon)
                                .font(.system(size: 20))
                                .foregroundColor(VQ.ink)
                                .frame(width: 24)
                            Text(row.label).vqH3().foregroundColor(VQ.ink).frame(maxWidth: .infinity, alignment: .leading)
                            Image(systemName: "checkmark")
                                .font(.system(size: 16, weight: .semibold))
                                .foregroundColor(VQ.tea)
                        }
                        .padding(.vertical, 16)
                        Divider().background(VQ.border)
                    }
                }
                .padding(.bottom, 32)

                VQButton(label: "Allow HealthKit access", style: .primary, action: onNext)
                    .padding(.bottom, 8)
                VQButton(label: "Maybe later", style: .ghost, action: onNext)
            }
            .padding(.horizontal, 28)
            .padding(.top, 76)
        }
    }
}

// MARK: - Avatar Selection
private struct AvatarScreen: View {
    @Binding var selected: Int
    let onNext: () -> Void

    let states: [AvatarState] = [.thriving, .healthy, .healthy, .healthy]

    var body: some View {
        WorldBg {
            VStack(alignment: .leading, spacing: 0) {
                Text("03 / 04").vqEyebrow().padding(.bottom, 12)
                Text("Meet your companion")
                    .vqH1().foregroundColor(VQ.ink).padding(.bottom, 28)

                HStack {
                    Spacer()
                    VStack(spacing: 18) {
                        BlobView(state: states[selected], scale: 6,
                                 glow: selected == 0, sparkle: selected == 0)
                        Text(avatarNames[selected])
                            .vqH2().foregroundColor(VQ.ink)
                    }
                    Spacer()
                }
                .padding(.vertical, 20)

                LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 10), count: 4), spacing: 10) {
                    ForEach(0..<4) { i in
                        ZStack {
                            RoundedRectangle(cornerRadius: 4)
                                .fill(i == selected ? VQ.ink : Color.clear)
                                .overlay(RoundedRectangle(cornerRadius: 4)
                                    .stroke(i == selected ? VQ.ink : VQ.borderStrong, lineWidth: 2))
                            BlobView(state: states[i], scale: 2.5)
                                .scaleEffect(0.42)
                        }
                        .aspectRatio(1, contentMode: .fit)
                        .onTapGesture { selected = i }
                    }
                }
                .padding(.bottom, 32)

                VQButton(label: "Continue", style: .primary, action: onNext)
            }
            .padding(.horizontal, 28)
            .padding(.top, 76)
        }
    }
}

// MARK: - Habit Selection
private struct HabitsScreen: View {
    @Binding var selected: Set<String>
    let onDone: () -> Void

    var body: some View {
        WorldBg {
            VStack(alignment: .leading, spacing: 0) {
                Text("04 / 04").vqEyebrow().padding(.bottom, 12)
                Text("Pick your islands")
                    .vqH1().foregroundColor(VQ.ink).padding(.bottom, 10)
                Text("Each habit grows its own island.")
                    .vqBody().padding(.bottom, 24)

                VStack(spacing: 0) {
                    ForEach(starterHabits, id: \.id) { h in
                        let isSel = selected.contains(h.id)
                        HStack(spacing: 14) {
                            Image(systemName: habitIcon(h.id))
                                .font(.system(size: 20))
                                .foregroundColor(isSel ? VQ.ink : VQ.inkDim)
                                .frame(width: 24)
                            VStack(alignment: .leading, spacing: 2) {
                                Text(h.label)
                                    .vqH3()
                                    .foregroundColor(isSel ? VQ.ink : VQ.inkSoft)
                                Text(h.hint).vqSmall()
                            }
                            Spacer()
                            ZStack {
                                RoundedRectangle(cornerRadius: 3)
                                    .fill(isSel ? VQ.ink : .clear)
                                    .overlay(RoundedRectangle(cornerRadius: 3)
                                        .stroke(isSel ? VQ.ink : VQ.borderStrong, lineWidth: 2))
                                    .frame(width: 20, height: 20)
                                if isSel {
                                    Image(systemName: "checkmark")
                                        .font(.system(size: 11, weight: .bold))
                                        .foregroundColor(VQ.seashell)
                                }
                            }
                        }
                        .padding(.vertical, 14)
                        .contentShape(Rectangle())
                        .onTapGesture {
                            if selected.contains(h.id) { selected.remove(h.id) }
                            else { selected.insert(h.id) }
                        }
                        Divider().background(VQ.border)
                    }
                }
                .padding(.bottom, 28)

                VQButton(label: "Begin quest · \(selected.count)", style: .primary, action: onDone)
            }
            .padding(.horizontal, 28)
            .padding(.top, 76)
        }
    }

    private func habitIcon(_ id: String) -> String {
        switch id {
        case "sleep":    return "moon.zzz"
        case "steps":    return "figure.walk"
        case "screen":   return "desktopcomputer"
        case "gym":      return "heart"
        case "read":     return "book"
        case "meditate": return "sparkles"
        default:         return "circle"
        }
    }
}
