import Foundation

// MARK: - State Enums
enum AvatarState: String, CaseIterable, Codable {
    case thriving, healthy, sick, critical

    var message: String {
        switch self {
        case .thriving: return "All my islands are thriving."
        case .healthy:  return "Doing okay — volcano runs warm."
        case .sick:     return "My volcano needs help…"
        case .critical: return "I don't feel so good."
        }
    }

    var bobDuration: Double {
        switch self {
        case .thriving: return 1.6
        case .healthy:  return 2.2
        case .sick:     return 2.2
        case .critical: return 3.5
        }
    }

    var bobAmount: CGFloat {
        switch self {
        case .thriving: return 6
        case .critical: return 3
        default:        return 5
        }
    }
}

enum IslandType: String, CaseIterable {
    case walk, sleep, screen, learn, quest

    var displayName: String { rawValue }

    var habitName: String {
        switch self {
        case .walk:   return "Walk"
        case .sleep:  return "Sleep"
        case .screen: return "Screen"
        case .learn:  return "Learn"
        case .quest:  return "Quest"
        }
    }

    var islandName: String {
        switch self {
        case .walk:   return "Palm Cove"
        case .sleep:  return "Mountain"
        case .screen: return "Volcano"
        case .learn:  return "Bamboo"
        case .quest:  return "Shrine"
        }
    }

    var stat: String {
        switch self {
        case .walk:   return "8,240"
        case .sleep:  return "7h 42m"
        case .screen: return "4h 18m"
        default:      return "—"
        }
    }

    var unit: String {
        switch self {
        case .walk:   return "steps today"
        case .sleep:  return "last night"
        case .screen: return "today"
        default:      return ""
        }
    }

    var goal: String {
        switch self {
        case .walk:   return "10,000"
        case .sleep:  return "8h"
        case .screen: return "under 3h"
        default:      return "—"
        }
    }
}

// MARK: - Data Models
struct HabitRow: Identifiable {
    let id = UUID()
    let type: IslandType
    let streak: Int
    let state: AvatarState
}

struct Friend: Identifiable {
    let id: String
    let name: String
    let level: Int
    let state: AvatarState
    let streak: Int

    var needsNudge: Bool { state == .sick || state == .critical }
}

// MARK: - Sample Data
let sampleHabits: [HabitRow] = [
    HabitRow(type: .walk,   streak: 12, state: .thriving),
    HabitRow(type: .sleep,  streak: 7,  state: .healthy),
    HabitRow(type: .screen, streak: 2,  state: .sick),
]

let sampleFriends: [Friend] = [
    Friend(id: "a", name: "Ayaan",    level: 6, state: .thriving, streak: 18),
    Friend(id: "f", name: "Flop",     level: 4, state: .healthy,  streak: 9),
    Friend(id: "y", name: "Yatharth", level: 3, state: .sick,     streak: 1),
    Friend(id: "m", name: "Mira",     level: 8, state: .thriving, streak: 24),
    Friend(id: "k", name: "Kai",      level: 2, state: .critical, streak: 0),
]

let starterHabits: [(id: String, label: String, hint: String)] = [
    ("sleep",   "Sleep",        "Auto · HealthKit"),
    ("steps",   "Steps",        "Auto · HealthKit"),
    ("screen",  "Screen time",  "Auto · Screen Time"),
    ("gym",     "Workout",      "Photo verified"),
    ("read",    "Read",         "Photo verified"),
    ("meditate","Meditate",     "Photo verified"),
]

let avatarNames = ["Mochi", "Pebble", "Puff", "Dew"]
