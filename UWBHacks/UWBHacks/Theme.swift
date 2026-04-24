import SwiftUI

// MARK: - Color Palette
extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let r, g, b: UInt64
        (r, g, b) = (int >> 16, int >> 8 & 0xFF, int & 0xFF)
        self.init(.sRGB, red: Double(r)/255, green: Double(g)/255, blue: Double(b)/255)
    }
}

enum VQ {
    static let seashell      = Color(hex: "EAE4DA")
    static let seashellDeep  = Color(hex: "ded6c6")
    static let seashellSoft  = Color(hex: "f4efe6")
    static let ink           = Color(hex: "1D1D1B")
    static let inkSoft       = Color(hex: "4a4a46")
    static let inkDim        = Color(hex: "8a8880")

    static let lavender      = Color(hex: "808BC5")
    static let lavenderSoft  = Color(hex: "c9cee4")
    static let tea           = Color(hex: "245E55")
    static let teaSoft       = Color(hex: "8eb2aa")
    static let pink          = Color(hex: "EAA7C7")
    static let mustard       = Color(hex: "EAC119")
    static let tangerine     = Color(hex: "ED773C")
    static let tangerineSoft = Color(hex: "f4b494")
    static let sky           = Color(hex: "9ED6DF")
    static let skySoft       = Color(hex: "d3ebef")
    static let red           = Color(hex: "C63F3E")
    static let redSoft       = Color(hex: "e79b9a")
    static let coral         = Color(hex: "ED773C")
    static let coralDeep     = Color(hex: "c85b22")

    static let surface       = Color.white
    static let border        = Color(hex: "1D1D1B").opacity(0.10)
    static let borderStrong  = Color(hex: "1D1D1B").opacity(0.18)

    static let water2        = Color(hex: "6ac0cb")
    static let water3        = Color(hex: "3d8c96")

    static func stateColor(_ state: AvatarState) -> Color {
        switch state {
        case .thriving: return tea
        case .healthy:  return lavender
        case .sick:     return tangerine
        case .critical: return red
        }
    }

    static func stateSoftColor(_ state: AvatarState) -> Color {
        switch state {
        case .thriving: return teaSoft
        case .healthy:  return lavenderSoft
        case .sick:     return tangerineSoft
        case .critical: return redSoft
        }
    }
}

// MARK: - Typography helpers
extension Font {
    static func pixel(_ size: CGFloat, weight: Font.Weight = .regular) -> Font {
        .custom("Pixelify Sans", size: size).weight(weight)
    }
    static func vt323(_ size: CGFloat) -> Font {
        .custom("VT323", size: size)
    }
}

extension View {
    func vqH1() -> some View { self.font(.pixel(28, weight: .semibold)).tracking(0.5) }
    func vqH2() -> some View { self.font(.pixel(20, weight: .semibold)).tracking(0.3) }
    func vqH3() -> some View { self.font(.pixel(14, weight: .medium)).tracking(0.2) }
    func vqBody() -> some View { self.font(.pixel(13)).foregroundColor(VQ.inkSoft) }
    func vqSmall() -> some View { self.font(.pixel(11)).foregroundColor(VQ.inkDim) }
    func vqEyebrow() -> some View {
        self.font(.pixel(9, weight: .semibold))
            .tracking(2)
            .textCase(.uppercase)
            .foregroundColor(VQ.inkDim)
    }
}
