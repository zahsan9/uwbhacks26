import * as ImageManipulator from "expo-image-manipulator";
import { DEMO_SERVER_ENDPOINT, DEMO_TOKEN } from "@/constants/verifyConfig";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface VerificationResult {
    verified: boolean | null;
    detectedHabit: string | null; // which habit the AI identified (null = no match)
    confidence: number;
    inferenceMs: number;
    timedOut: boolean;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TIMEOUT_MS = 8000;
const TARGET_SIZE = 224;
const JPEG_QUALITY = 0.7;

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Maps app-side habit IDs (from STARTER_HABITS) → backend prototype filenames.
 * Only the photo-verifiable ones have prototypes.
 */
const APP_TO_PROTO_ID: Record<string, string> = {
    gym: "gym",
    read: "reading",
    meditate: "meditation",
    running: "running",
    cooking: "cooking",
};

/**
 * useHabitVerification
 *
 * @param habitIds  Array of the user's habit IDs (from STARTER_HABITS).
 *                  Only habits that have backend prototypes will be scanned.
 *                  If omitted, scans all loaded prototypes.
 */
export function useHabitVerification(habitIds?: string[]) {
    // Map app IDs → proto names, dropping any without a known prototype
    const protoIds = habitIds
        ? habitIds.map((id) => APP_TO_PROTO_ID[id]).filter(Boolean)
        : undefined;

    async function resizeToBase64(photoUri: string): Promise<string> {
        const result = await ImageManipulator.manipulateAsync(
            photoUri,
            [{ resize: { width: TARGET_SIZE, height: TARGET_SIZE } }],
            {
                compress: JPEG_QUALITY,
                format: ImageManipulator.SaveFormat.JPEG,
                base64: true,
            }
        );
        if (!result.base64) {
            throw new Error("ImageManipulator did not return base64 data.");
        }
        return result.base64;
    }

    async function postVerify(frameBase64: string): Promise<VerificationResult> {
        const url = `${DEMO_SERVER_ENDPOINT.replace(/\/$/, "")}/verify`;

        const body = JSON.stringify({
            frame_base64: frameBase64,
            demo_token: DEMO_TOKEN,
            ...(protoIds && protoIds.length > 0 ? { habit_ids: protoIds } : {}),
        });

        const fetchPromise = fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body,
        }).then(async (res) => {
            if (!res.ok) throw new Error(`Server responded with ${res.status}`);
            const json = await res.json();
            return {
                verified: json.verified as boolean | null,
                detectedHabit: (json.detected_habit as string) ?? null,
                confidence: (json.confidence as number) ?? 0,
                inferenceMs: (json.inference_ms as number) ?? 0,
                timedOut: false,
            } satisfies VerificationResult;
        });

        const timeoutPromise: Promise<VerificationResult> = new Promise(
            (resolve) =>
                setTimeout(
                    () =>
                        resolve({
                            verified: null,
                            detectedHabit: null,
                            confidence: 0,
                            inferenceMs: 0,
                            timedOut: true,
                        }),
                    TIMEOUT_MS
                )
        );

        return Promise.race([fetchPromise, timeoutPromise]);
    }

    async function verify(photoUri: string): Promise<VerificationResult> {
        try {
            const frameBase64 = await resizeToBase64(photoUri);
            return await postVerify(frameBase64);
        } catch (error) {
            console.warn("[useHabitVerification] Error during verification:", error);
            return {
                verified: null,
                detectedHabit: null,
                confidence: 0,
                inferenceMs: 0,
                timedOut: false,
            };
        }
    }

    return { verify };
}
