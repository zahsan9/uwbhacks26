import { CameraView, useCameraPermissions } from "expo-camera";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Blob from "./Blob";
import { BackButton, Body, H2, VQButton } from "./Components";
import { useHabitIdentification } from "./hooks/useHabitVerification";
import { VQ } from "./theme";

export interface VerifyResult {
    verified: boolean;
    habitId: string;
    habitName: string;
    confidence: number;
    isManual: boolean;
}

interface PhotoVerifyScreenProps {
    onComplete: (result: VerifyResult) => void | Promise<void>;
    habitIds?: string[];
}

type Stage = "camera" | "checking" | "verified" | "ambiguous" | "failed";

export default function PhotoVerifyScreen({ onComplete, habitIds }: PhotoVerifyScreenProps) {
    const router = useRouter();
    const [permission, requestPermission] = useCameraPermissions();
    const cameraRef = useRef<CameraView>(null);
    const { identify } = useHabitIdentification(habitIds);
    const [detectedHabit, setDetectedHabit] = useState<string>("");
    const [detectedHabitId, setDetectedHabitId] = useState<string>("");

    const [stage, setStage] = useState<Stage>("camera");
    const [frozenUri, setFrozenUri] = useState<string | null>(null);
    const [confidence, setConfidence] = useState(0);
    const [isCapturing, setIsCapturing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Animated values
    const pulseOpacity = useRef(new Animated.Value(0.5)).current;
    const dotScale = useRef(new Animated.Value(1)).current;
    const badgeScale = useRef(new Animated.Value(0)).current;
    const badgeOpa = useRef(new Animated.Value(0)).current;
    const xpOpa = useRef(new Animated.Value(0)).current;
    const xpTY = useRef(new Animated.Value(16)).current;
    const blobBounce = useRef(new Animated.Value(0)).current;
    const shakeX = useRef(new Animated.Value(0)).current;

    const startPulse = useCallback(() => {
        Animated.loop(Animated.sequence([
            Animated.timing(pulseOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
            Animated.timing(pulseOpacity, { toValue: 0.3, duration: 600, useNativeDriver: true }),
        ])).start();
        Animated.loop(Animated.sequence([
            Animated.timing(dotScale, { toValue: 1.4, duration: 500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            Animated.timing(dotScale, { toValue: 1, duration: 500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])).start();
    }, [pulseOpacity, dotScale]);

    const animateBadge = useCallback(() => {
        Animated.parallel([
            Animated.spring(badgeScale, { toValue: 1, friction: 4, tension: 40, useNativeDriver: true }),
            Animated.timing(badgeOpa, { toValue: 1, duration: 250, useNativeDriver: true }),
        ]).start(() => {
            Animated.parallel([
                Animated.timing(xpOpa, { toValue: 1, duration: 300, useNativeDriver: true }),
                Animated.timing(xpTY, { toValue: 0, duration: 300, easing: Easing.out(Easing.ease), useNativeDriver: true }),
            ]).start();
            Animated.loop(Animated.sequence([
                Animated.timing(blobBounce, { toValue: -10, duration: 280, useNativeDriver: true }),
                Animated.timing(blobBounce, { toValue: 0, duration: 280, useNativeDriver: true }),
            ]), { iterations: 4 }).start();
        });
    }, [badgeScale, badgeOpa, xpOpa, xpTY, blobBounce]);

    const animateShake = useCallback(() => {
        Animated.sequence([
            Animated.timing(shakeX, { toValue: 12, duration: 60, useNativeDriver: true }),
            Animated.timing(shakeX, { toValue: -12, duration: 60, useNativeDriver: true }),
            Animated.timing(shakeX, { toValue: 8, duration: 60, useNativeDriver: true }),
            Animated.timing(shakeX, { toValue: -8, duration: 60, useNativeDriver: true }),
            Animated.timing(shakeX, { toValue: 0, duration: 60, useNativeDriver: true }),
        ]).start();
    }, [shakeX]);

    const handleCapture = useCallback(async () => {
        if (!cameraRef.current || isCapturing) return;
        setIsCapturing(true);
        try {
            const photo = await cameraRef.current.takePictureAsync({ quality: 0.6, skipProcessing: true });
            if (!photo) return;
            setFrozenUri(photo.uri);
            setStage("checking");
            startPulse();
            const result = await identify(photo.uri);
            setConfidence(result.confidence);
            setDetectedHabit(result.habitName);
            setDetectedHabitId(result.habitId);
            if (result.verified === true) {
                setStage("verified");
                animateBadge();
            } else if (result.verified === null || result.timedOut) {
                setStage("ambiguous");
            } else {
                setStage("failed");
                animateShake();
            }
        } finally {
            setIsCapturing(false);
        }
    }, [animateBadge, animateShake, identify, isCapturing, startPulse]);

    const handleRetry = () => {
        badgeScale.setValue(0); badgeOpa.setValue(0); xpOpa.setValue(0);
        xpTY.setValue(16); blobBounce.setValue(0); shakeX.setValue(0);
        pulseOpacity.setValue(0.5); dotScale.setValue(1);
        setDetectedHabit("");
        setDetectedHabitId("");
        setFrozenUri(null);
        setConfidence(0);
        setIsSubmitting(false);
        setStage("camera");
    };

    const submitResult = useCallback(async (result: VerifyResult) => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            await Promise.resolve(onComplete(result));
        } finally {
            setIsSubmitting(false);
        }
    }, [isSubmitting, onComplete]);

    useEffect(() => {
        if (!permission?.granted) requestPermission();
    }, [permission, requestPermission]);

    // ── Permission gate ──────────────────────────────────────────────
    if (!permission?.granted) {
        return (
            <View style={{ flex: 1, backgroundColor: VQ.seashell, alignItems: "center", justifyContent: "center", padding: 32 }}>
                <Blob state="healthy" scale={5} />
                <H2 style={{ marginTop: 20, marginBottom: 8 }}>Camera access needed</H2>
                <Body style={{ textAlign: "center", marginBottom: 24 }}>
                    We need your camera to verify habit completion.
                </Body>
                <VQButton label="Grant permission" onPress={requestPermission} />
            </View>
        );
    }

    // ── Camera stage ─────────────────────────────────────────────────
    if (stage === "camera") {
        return (
            <View style={{ flex: 1, backgroundColor: "#000" }}>
                <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />

                {/* Top bar */}
                <SafeAreaView style={{ position: "absolute", top: 0, left: 0, right: 0 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingTop: 8 }}>
                        <BackButton onPress={() => router.back()} />
                        <View style={{ flex: 1 }}>
                            <Text style={s.camTitle}>Log a habit</Text>
                            <Text style={s.camHint}>Show your activity — we'll figure out the rest</Text>
                        </View>
                    </View>
                </SafeAreaView>

                {/* Corner frame guides */}
                {[
                    { top: "28%", left: "8%" }, { top: "28%", right: "8%" },
                    { top: "68%", left: "8%" }, { top: "68%", right: "8%" },
                ].map((pos, i) => (
                    <View key={i} style={[s.corner, pos as any,
                    i === 0 && { borderRightWidth: 0, borderBottomWidth: 0 },
                    i === 1 && { borderLeftWidth: 0, borderBottomWidth: 0 },
                    i === 2 && { borderRightWidth: 0, borderTopWidth: 0 },
                    i === 3 && { borderLeftWidth: 0, borderTopWidth: 0 },
                    ]} />
                ))}

                {/* Shutter */}
                <View style={{ position: "absolute", bottom: 48, left: 0, right: 0, alignItems: "center" }}>
                    <Pressable onPress={handleCapture} disabled={isCapturing} style={[s.shutterOuter, isCapturing && { opacity: 0.6 }]}>
                        <View style={s.shutterInner} />
                    </Pressable>
                    <Text style={s.shutterLabel}>tap to capture</Text>
                </View>
            </View>
        );
    }

    // ── Overlay stages (checking / verified / ambiguous / failed) ────
    return (
        <View style={{ flex: 1, backgroundColor: "#000" }}>
            {frozenUri && (
                <Image source={{ uri: frozenUri }} style={StyleSheet.absoluteFill} contentFit="cover" />
            )}
            {/* Dim scrim */}
            <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.6)" }} />

            <SafeAreaView style={{ flex: 1 }}>
                {stage === "checking" && (
                    <View style={s.center}>
                        <Animated.View style={{ opacity: pulseOpacity }}>
                            <Blob state="healthy" scale={6} />
                        </Animated.View>
                        <Text style={[s.overlayTitle, { marginTop: 20 }]}>Identifying your habit…</Text>
                        <View style={{ flexDirection: "row", gap: 10, marginTop: 16 }}>
                            {[0, 1, 2].map(i => (
                                <Animated.View key={i} style={[s.dot, { transform: [{ scale: dotScale }], opacity: pulseOpacity }]} />
                            ))}
                        </View>
                    </View>
                )}

                {stage === "verified" && (
                    <View style={s.center}>
                        <Animated.View style={{ transform: [{ translateY: blobBounce }] }}>
                            <Blob state="thriving" scale={6} />
                        </Animated.View>
                        <Animated.View style={[s.badge, s.badgeGreen, { transform: [{ scale: badgeScale }], opacity: badgeOpa }]}>
                            <Text style={s.badgeTitle}>{detectedHabit} logged!</Text>
                            <Text style={s.badgeSub}>{Math.round(confidence * 100)}% confidence</Text>
                        </Animated.View>
                        <Animated.Text style={[s.xpText, { opacity: xpOpa, transform: [{ translateY: xpTY }] }]}>
                            +50 XP
                        </Animated.Text>
                        <View style={{ marginTop: 8, width: "100%", paddingHorizontal: 32 }}>
                            <VQButton label={isSubmitting ? "Saving..." : "Continue"} disabled={isSubmitting} onPress={() => {
                                void submitResult({ verified: true, habitId: detectedHabitId, habitName: detectedHabit, confidence, isManual: false });
                            }} />
                        </View>
                    </View>
                )}

                {stage === "ambiguous" && (
                    <View style={s.center}>
                        <Blob state="sick" scale={6} />
                        <Text style={[s.overlayTitle, { marginTop: 20 }]}>
                            {detectedHabit ? `Looks like ${detectedHabit}?` : "Did you do it?"}
                        </Text>
                        <Text style={s.overlayBody}>Couldn't fully confirm. Trust your effort.</Text>
                        <View style={{ flexDirection: "row", gap: 12, marginTop: 24, paddingHorizontal: 32 }}>
                            <View style={{ flex: 1 }}>
                                <VQButton label={isSubmitting ? "Saving..." : "Yes, I did it"} disabled={isSubmitting} onPress={() => {
                                    void submitResult({ verified: true, habitId: detectedHabitId, habitName: detectedHabit, confidence, isManual: true });
                                }} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <VQButton label="No" style="ghost" disabled={isSubmitting} onPress={() => {
                                    void submitResult({ verified: false, habitId: detectedHabitId, habitName: detectedHabit, confidence, isManual: false });
                                }} />
                            </View>
                        </View>
                        <View style={{ marginTop: 12, width: "100%", paddingHorizontal: 32 }}>
                            <VQButton label="Log manually" style="ghost" disabled={isSubmitting} onPress={() => {
                                const dest = habitIds && habitIds.length > 0
                                    ? `/manual-log?habitIds=${habitIds.join(",")}`
                                    : "/manual-log";
                                router.push(dest as any);
                            }} />
                        </View>
                    </View>
                )}

                {stage === "failed" && (
                    <Animated.View style={[s.center, { transform: [{ translateX: shakeX }] }]}>
                        <Blob state="critical" scale={6} />
                        <View style={[s.badge, s.badgeRed]}>
                            <Text style={s.badgeTitle}>Couldn't identify</Text>
                            <Text style={s.badgeSub}>
                                Make sure your activity is clearly visible in frame.
                            </Text>
                        </View>
                        <View style={{ marginTop: 16, width: "100%", paddingHorizontal: 32, gap: 10 }}>
                            <VQButton label="Try again" onPress={handleRetry} />
                            <VQButton label="Log manually" style="ghost" disabled={isSubmitting} onPress={() => {
                                const dest = habitIds && habitIds.length > 0
                                    ? `/manual-log?habitIds=${habitIds.join(",")}`
                                    : "/manual-log";
                                router.push(dest as any);
                            }} />
                            <VQButton label="Skip" style="ghost" disabled={isSubmitting} onPress={() => {
                                void submitResult({ verified: false, habitId: "", habitName: "", confidence: 0, isManual: false });
                            }} />
                        </View>
                    </Animated.View>
                )}
            </SafeAreaView>
        </View>
    );
}

const s = StyleSheet.create({
    center: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 24,
    },
    // Camera
    camTitle: {
        fontFamily: "PixelifySans_600SemiBold",
        fontSize: 18,
        color: "#fff",
        textShadowColor: "rgba(0,0,0,0.8)",
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
    },
    camHint: {
        fontFamily: "PixelifySans_400Regular",
        fontSize: 13,
        color: "rgba(255,255,255,0.75)",
        marginTop: 2,
    },
    corner: {
        position: "absolute",
        width: 28,
        height: 28,
        borderWidth: 3,
        borderColor: "#fff",
        borderRadius: 3,
    },
    shutterOuter: {
        width: 76,
        height: 76,
        borderRadius: 38,
        borderWidth: 4,
        borderColor: "#fff",
        alignItems: "center",
        justifyContent: "center",
    },
    shutterInner: {
        width: 58,
        height: 58,
        borderRadius: 29,
        backgroundColor: "#fff",
    },
    shutterLabel: {
        fontFamily: "PixelifySans_400Regular",
        fontSize: 13,
        color: "rgba(255,255,255,0.6)",
        marginTop: 10,
    },
    // Overlay
    overlayTitle: {
        fontFamily: "PixelifySans_700Bold",
        fontSize: 24,
        color: "#fff",
        textAlign: "center",
    },
    overlayBody: {
        fontFamily: "PixelifySans_400Regular",
        fontSize: 15,
        color: "rgba(255,255,255,0.7)",
        textAlign: "center",
        marginTop: 8,
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: VQ.water2,
    },
    badge: {
        borderRadius: 16,
        paddingHorizontal: 28,
        paddingVertical: 18,
        alignItems: "center",
        marginTop: 20,
        borderWidth: 2,
    },
    badgeGreen: {
        backgroundColor: "rgba(36,94,85,0.25)",
        borderColor: VQ.tea,
    },
    badgeRed: {
        backgroundColor: "rgba(198,63,62,0.2)",
        borderColor: VQ.red,
    },
    badgeTitle: {
        fontFamily: "PixelifySans_700Bold",
        fontSize: 20,
        color: "#fff",
        marginBottom: 4,
    },
    badgeSub: {
        fontFamily: "PixelifySans_400Regular",
        fontSize: 14,
        color: "rgba(255,255,255,0.65)",
        textAlign: "center",
    },
    xpText: {
        fontFamily: "VT323_400Regular",
        fontSize: 36,
        color: VQ.mustard,
        marginTop: 12,
        letterSpacing: 2,
    },
});
