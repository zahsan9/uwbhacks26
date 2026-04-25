import * as ImageManipulator from "expo-image-manipulator";
import { DEMO_SERVER_ENDPOINT, DEMO_TOKEN } from "@/constants/verifyConfig";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface VerificationResult {
    verified: boolean | null;
    confidence: number;
    inferenceMs: number;
    timedOut: boolean;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

// 8s timeout — we control the local hotspot network so slow responses are a real failure
const TIMEOUT_MS = 8000;
const TARGET_SIZE = 224;
const JPEG_QUALITY = 0.7;

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * useHabitVerification
 *
 * Returns a `verify` function that:
 *   1. Resizes the captured photo to 224×224 JPEG at 70% quality
 *   2. POSTs to DEMO_SERVER_ENDPOINT/verify with an 8000ms timeout
 *   3. Never throws — all errors return a safe fallback result
 *
 * @param habitId  The habit slug (e.g. "gym", "running")
 */
export function useHabitVerification(habitId: string) {
    /**
     * Resize the image to 224×224 and return a base64 JPEG string.
     */
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

    /**
     * POST to /verify with a race-based timeout.
     */
    async function postVerify(frameBase64: string): Promise<VerificationResult> {
        const url = `${DEMO_SERVER_ENDPOINT.replace(/\/$/, "")}/verify`;

        const body = JSON.stringify({
            habit_id: habitId,
            frame_base64: frameBase64,
            demo_token: DEMO_TOKEN,
        });

        const fetchPromise = fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body,
        }).then(async (res) => {
            if (!res.ok) {
                throw new Error(`Server responded with ${res.status}`);
            }
            const json = await res.json();
            return {
                verified: json.verified as boolean | null,
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
                            confidence: 0,
                            inferenceMs: 0,
                            timedOut: true,
                        }),
                    TIMEOUT_MS
                )
        );

        return Promise.race([fetchPromise, timeoutPromise]);
    }

    /**
     * Main entrypoint: resize → encode → verify.
     * Never throws; errors produce a safe null/timedOut result.
     */
    async function verify(photoUri: string): Promise<VerificationResult> {
        try {
            const frameBase64 = await resizeToBase64(photoUri);
            return await postVerify(frameBase64);
        } catch (error) {
            console.warn("[useHabitVerification] Error during verification:", error);
            return {
                verified: null,
                confidence: 0,
                inferenceMs: 0,
                timedOut: false,
            };
        }
    }

    return { verify };
}
