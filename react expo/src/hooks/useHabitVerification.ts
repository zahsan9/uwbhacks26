import * as ImageManipulator from "expo-image-manipulator";
import { DEMO_SERVER_ENDPOINT, DEMO_TOKEN } from "@/constants/verifyConfig";

export interface IdentifyResult {
    habitId: string;    // e.g. "gym", "running" — empty string if nothing matched
    habitName: string;  // capitalised display name — empty string if nothing matched
    verified: boolean | null;
    confidence: number;
    timedOut: boolean;
}

// 20s covers CLIP inference (~400ms) + Gemma 4 fallback via Ollama (~5–15s on CPU)
const TIMEOUT_MS = 20000;
const TARGET_SIZE = 224; // CLIP ViT-B/32 input resolution
const JPEG_QUALITY = 0.92; // raised from 0.7 — low JPEG quality introduced artifacts that corrupt embeddings

/** Maps backend habit IDs to display names */
const HABIT_DISPLAY_NAME: Record<string, string> = {
    gym: "Gym",
    running: "Running",
    reading: "Reading",
    cooking: "Cooking",
    meditation: "Meditation",
};

async function resizeToBase64(photoUri: string): Promise<string> {
    const result = await ImageManipulator.manipulateAsync(
        photoUri,
        [{ resize: { width: TARGET_SIZE, height: TARGET_SIZE } }],
        { compress: JPEG_QUALITY, format: ImageManipulator.SaveFormat.JPEG, base64: true }
    );
    if (!result.base64) throw new Error("ImageManipulator did not return base64 data.");
    return result.base64;
}

/**
 * Sends a single POST /verify request.
 * Optionally pass `habitIds` to restrict scanning to the user's active habits.
 * Backend returns the best-matching habit automatically.
 */
export function useHabitIdentification(habitIds?: string[]) {
    async function identify(photoUri: string): Promise<IdentifyResult> {
        try {
            const frameBase64 = await resizeToBase64(photoUri);

            const url = `${DEMO_SERVER_ENDPOINT.replace(/\/$/, "")}/verify`;
            const body: Record<string, unknown> = {
                frame_base64: frameBase64,
                demo_token: DEMO_TOKEN,
            };
            if (habitIds && habitIds.length > 0) {
                body.habit_ids = habitIds;
            }

            const fetchPromise = fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            }).then(async (res) => {
                if (!res.ok) throw new Error(`Server responded with ${res.status}`);
                const json = await res.json();
                console.log("[verify] server response:", JSON.stringify(json));

                const detectedId: string = json.detected_habit ?? "";
                return {
                    habitId: detectedId,
                    habitName: HABIT_DISPLAY_NAME[detectedId] ?? detectedId,
                    verified: json.verified as boolean | null,
                    confidence: (json.confidence as number) ?? 0,
                    timedOut: false,
                } satisfies IdentifyResult;
            });

            const timeoutPromise: Promise<IdentifyResult> = new Promise((resolve) =>
                setTimeout(
                    () => resolve({ habitId: "", habitName: "", verified: null, confidence: 0, timedOut: true }),
                    TIMEOUT_MS
                )
            );

            return Promise.race([fetchPromise, timeoutPromise]);
        } catch (error) {
            console.warn("[useHabitIdentification] Error:", error);
            return { habitId: "", habitName: "", verified: null, confidence: 0, timedOut: false };
        }
    }

    return { identify };
}
