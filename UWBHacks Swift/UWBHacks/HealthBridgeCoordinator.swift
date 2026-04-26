import Combine
import Foundation
import HealthKit

@MainActor
final class HealthBridgeCoordinator: ObservableObject {
    @Published var isProcessing = false
    @Published var statusMessage = "Enter the same email you use in VitaQuest, then sync Apple Health."
    @Published var lastSteps: Int?
    @Published var lastSleepHours: Double?
    @Published var targetEmail: String {
        didSet {
            UserDefaults.standard.set(targetEmail, forKey: Self.emailDefaultsKey)
        }
    }

    private let store = HKHealthStore()
    private static let emailDefaultsKey = "healthbridge.target.email"
    private let supabaseURL = URL(string: "https://sfgkcrbasdqqoegbystu.supabase.co")!
    private let supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmZ2tjcmJhc2RxcW9lZ2J5c3R1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxMTQ3NzEsImV4cCI6MjA5MjY5MDc3MX0.tT8_xX3hMQCygWH3wq7xNzfRP2S-Jd2X4z5Cylp5k7U"

    init() {
        self.targetEmail = UserDefaults.standard.string(forKey: Self.emailDefaultsKey) ?? ""
    }

    func connectAndSync() async {
        guard HKHealthStore.isHealthDataAvailable() else {
            statusMessage = "Health data is not available on this device."
            return
        }

        let normalizedEmail = targetEmail.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        guard !normalizedEmail.isEmpty else {
            statusMessage = "Add your VitaQuest email first so we know which account to sync."
            return
        }

        isProcessing = true
        defer { isProcessing = false }

        do {
            try await requestAuthorization()
            let steps = try await fetchStepsToday()
            let sleepHours = try await fetchSleepHoursLastNight()

            lastSteps = steps
            lastSleepHours = sleepHours
            try await uploadSnapshot(email: normalizedEmail, steps: steps, sleepHours: sleepHours)
            statusMessage = "Synced \(steps) steps and \(String(format: "%.1f", sleepHours)) hours of sleep to \(normalizedEmail)."
        } catch {
            statusMessage = "Sync failed: \(error.localizedDescription)"
        }
    }

    private func requestAuthorization() async throws {
        var readTypes = Set<HKObjectType>()
        if let stepType = HKObjectType.quantityType(forIdentifier: .stepCount) {
            readTypes.insert(stepType)
        }
        if let sleepType = HKObjectType.categoryType(forIdentifier: .sleepAnalysis) {
            readTypes.insert(sleepType)
        }

        try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<Void, Error>) in
            store.requestAuthorization(toShare: [], read: readTypes) { success, error in
                if let error {
                    continuation.resume(throwing: error)
                    return
                }

                if success {
                    continuation.resume()
                } else {
                    continuation.resume(throwing: NSError(
                        domain: "HealthBridge",
                        code: 1,
                        userInfo: [NSLocalizedDescriptionKey: "Apple Health permission was not granted."]
                    ))
                }
            }
        }
    }

    private func fetchStepsToday() async throws -> Int {
        guard let stepType = HKQuantityType.quantityType(forIdentifier: .stepCount) else {
            return 0
        }

        let calendar = Calendar.current
        let startOfDay = calendar.startOfDay(for: Date())
        let predicate = HKQuery.predicateForSamples(withStart: startOfDay, end: Date())

        return try await withCheckedThrowingContinuation { continuation in
            let query = HKStatisticsQuery(
                quantityType: stepType,
                quantitySamplePredicate: predicate,
                options: .cumulativeSum
            ) { _, result, error in
                if let error {
                    continuation.resume(throwing: error)
                    return
                }

                let value = result?.sumQuantity()?.doubleValue(for: .count()) ?? 0
                continuation.resume(returning: Int(value.rounded()))
            }

            store.execute(query)
        }
    }

    private func fetchSleepHoursLastNight() async throws -> Double {
        guard let sleepType = HKObjectType.categoryType(forIdentifier: .sleepAnalysis) else {
            return 0
        }

        let end = Date()
        let start = Calendar.current.date(byAdding: .hour, value: -36, to: end) ?? end
        let predicate = HKQuery.predicateForSamples(withStart: start, end: end)
        let sort = NSSortDescriptor(key: HKSampleSortIdentifierEndDate, ascending: false)

        let samples: [HKCategorySample] = try await withCheckedThrowingContinuation { continuation in
            let query = HKSampleQuery(
                sampleType: sleepType,
                predicate: predicate,
                limit: HKObjectQueryNoLimit,
                sortDescriptors: [sort]
            ) { _, results, error in
                if let error {
                    continuation.resume(throwing: error)
                    return
                }

                continuation.resume(returning: results as? [HKCategorySample] ?? [])
            }

            store.execute(query)
        }

        let asleepSamples = samples.filter { sample in
            if #available(iOS 16.0, *) {
                return sample.value == HKCategoryValueSleepAnalysis.asleepUnspecified.rawValue
                    || sample.value == HKCategoryValueSleepAnalysis.asleepCore.rawValue
                    || sample.value == HKCategoryValueSleepAnalysis.asleepDeep.rawValue
                    || sample.value == HKCategoryValueSleepAnalysis.asleepREM.rawValue
            } else {
                return sample.value == HKCategoryValueSleepAnalysis.asleep.rawValue
            }
        }

        let grouped = Dictionary(grouping: asleepSamples) { sample in
            Calendar.current.startOfDay(for: sample.endDate)
        }

        let latestDuration = grouped
            .sorted { $0.key > $1.key }
            .first?
            .value
            .reduce(0.0) { partial, sample in
                partial + sample.endDate.timeIntervalSince(sample.startDate)
            } ?? 0

        return (latestDuration / 3600.0 * 10).rounded() / 10
    }

    private func uploadSnapshot(email: String, steps: Int, sleepHours: Double) async throws {
        let endpoint = supabaseURL
            .appendingPathComponent("rest")
            .appendingPathComponent("v1")
            .appendingPathComponent("healthkit_snapshots")

        var components = URLComponents(url: endpoint, resolvingAgainstBaseURL: false)
        components?.queryItems = [URLQueryItem(name: "on_conflict", value: "email")]
        guard let url = components?.url else {
            throw NSError(domain: "HealthBridge", code: 2, userInfo: [NSLocalizedDescriptionKey: "Invalid snapshot upload URL."])
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue(supabaseAnonKey, forHTTPHeaderField: "apikey")
        request.setValue("Bearer \(supabaseAnonKey)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("resolution=merge-duplicates,return=representation", forHTTPHeaderField: "Prefer")

        let payload: [[String: Any]] = [[
            "email": email,
            "steps_today": steps,
            "sleep_hours_last_night": sleepHours,
            "synced_at": ISO8601DateFormatter().string(from: Date()),
            "updated_at": ISO8601DateFormatter().string(from: Date()),
        ]]
        request.httpBody = try JSONSerialization.data(withJSONObject: payload)

        let (_, response) = try await URLSession.shared.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse, (200...299).contains(httpResponse.statusCode) else {
            throw NSError(domain: "HealthBridge", code: 3, userInfo: [NSLocalizedDescriptionKey: "Supabase snapshot upload failed."])
        }
    }
}
