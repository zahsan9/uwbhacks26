import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    Animated,
    Dimensions,
    Easing,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useHabitVerification } from "@/hooks/useHabitVerification";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PhotoVerifyScreenProps {
    habitIds?: string[];  // user's habit IDs — only these will be scanned
    onComplete: (verified: boolean) => void;
}

type Stage = "camera" | "checking" | "verified" | "ambiguous" | "failed";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PhotoVerifyScreen({ habitIds, onComplete }: PhotoVerifyScreenProps) {
    const router = useRouter();
    const [permission, requestPermission] = useCameraPermissions();
    const cameraRef = useRef<CameraView>(null);
    const { verify } = useHabitVerification(habitIds);

    // Stage state
    const [stage, setStage] = useState<Stage>("camera");
    const [frozenUri, setFrozenUri] = useState<string | null>(null);
    const [confidence, setConfidence] = useState(0);
    const [detectedHabit, setDetectedHabit] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // Animated values
    const dotScale = useRef(new Animated.Value(1)).current;
    const badgeScale = useRef(new Animated.Value(0)).current;
    const badgeOpacity = useRef(new Animated.Value(0)).current;
    const xpOpacity = useRef(new Animated.Value(0)).current;
    const xpTranslate = useRef(new Animated.Value(20)).current;
    const avatarBounce = useRef(new Animated.Value(0)).current;
    const pulseOpacity = useRef(new Animated.Value(0.4)).current;
    const shakeX = useRef(new Animated.Value(0)).current;

    // -------------------------------------------------------------------------
    // Animations
    // -------------------------------------------------------------------------

    /** Pulsing dots for "checking" state */
    const startPulse = useCallback(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseOpacity, {
                    toValue: 1,
                    duration: 600,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseOpacity, {
                    toValue: 0.3,
                    duration: 600,
                    useNativeDriver: true,
                }),
            ])
        ).start();

        Animated.loop(
            Animated.sequence([
                Animated.timing(dotScale, {
                    toValue: 1.3,
                    duration: 500,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(dotScale, {
                    toValue: 1,
                    duration: 500,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, [dotScale, pulseOpacity]);

    /** Green badge entrance */
    const animateBadge = useCallback(() => {
        Animated.parallel([
            Animated.spring(badgeScale, {
                toValue: 1,
                friction: 4,
                tension: 40,
                useNativeDriver: true,
            }),
            Animated.timing(badgeOpacity, {
                toValue: 1,
                duration: 250,
                useNativeDriver: true,
            }),
        ]).start(() => {
            // XP float-up
            Animated.parallel([
                Animated.timing(xpOpacity, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(xpTranslate, {
                    toValue: 0,
                    duration: 300,
                    easing: Easing.out(Easing.ease),
                    useNativeDriver: true,
                }),
            ]).start();

            // Avatar bounce
            Animated.loop(
                Animated.sequence([
                    Animated.timing(avatarBounce, {
                        toValue: -8,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                    Animated.timing(avatarBounce, {
                        toValue: 0,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                ]),
                { iterations: 3 }
            ).start();
        });
    }, [badgeScale, badgeOpacity, xpOpacity, xpTranslate, avatarBounce]);

    /** Shake for failure */
    const animateShake = useCallback(() => {
        Animated.sequence([
            Animated.timing(shakeX, { toValue: 10, duration: 60, useNativeDriver: true }),
            Animated.timing(shakeX, { toValue: -10, duration: 60, useNativeDriver: true }),
            Animated.timing(shakeX, { toValue: 8, duration: 60, useNativeDriver: true }),
            Animated.timing(shakeX, { toValue: -8, duration: 60, useNativeDriver: true }),
            Animated.timing(shakeX, { toValue: 0, duration: 60, useNativeDriver: true }),
        ]).start();
    }, [shakeX]);

    // -------------------------------------------------------------------------
    // Capture
    // -------------------------------------------------------------------------

    const handleCapture = useCallback(async () => {
        if (!cameraRef.current) return;

        const photo = await cameraRef.current.takePictureAsync({ quality: 1 });
        if (!photo) return;

        setFrozenUri(photo.uri);
        setStage("checking");
        startPulse(); // optimistic animation immediately — no awaiting server

        const result = await verify(photo.uri);
        setConfidence(result.confidence);
        setDetectedHabit(result.detectedHabit);

        if (result.error) {
            // Hard failure — network or server error, not a genuine unrecognised image
            setErrorMsg(result.error);
            setStage("failed");
            animateShake();
        } else if (result.verified === true) {
            setStage("verified");
            animateBadge();
        } else if (result.verified === null || result.timedOut) {
            setStage("ambiguous");
        } else {
            setStage("failed");
            animateShake();
        }
    }, [verify, startPulse, animateBadge, animateShake]);

    // -------------------------------------------------------------------------
    // Completion handlers
    // -------------------------------------------------------------------------

    const handleYes = () => {
        onComplete(true);
        router.back();
    };

    const handleNo = () => {
        onComplete(false);
        router.back();
    };

    const handleRetry = () => {
        // Reset all animated values
        badgeScale.setValue(0);
        badgeOpacity.setValue(0);
        xpOpacity.setValue(0);
        xpTranslate.setValue(20);
        avatarBounce.setValue(0);
        shakeX.setValue(0);
        pulseOpacity.setValue(0.4);
        dotScale.setValue(1);

        setFrozenUri(null);
        setConfidence(0);
        setDetectedHabit(null);
        setErrorMsg(null);
        setStage("camera");
    };

    // -------------------------------------------------------------------------
    // Permission gate
    // -------------------------------------------------------------------------

    useEffect(() => {
        if (!permission?.granted) {
            requestPermission();
        }
    }, [permission, requestPermission]);

    if (!permission?.granted) {
        return (
            <View style={styles.center}>
                <Text style={styles.permText}>Camera permission is required.</Text>
                <TouchableOpacity style={styles.btn} onPress={requestPermission}>
                    <Text style={styles.btnText}>Grant Permission</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // -------------------------------------------------------------------------
    // Render helpers
    // -------------------------------------------------------------------------

    const renderCamera = () => (
        <View style={StyleSheet.absoluteFill}>
            <CameraView
                ref={cameraRef}
                style={StyleSheet.absoluteFill}
                facing="back"
            />
            {/* Habit label */}
            <View style={styles.topOverlay}>
                <Text style={styles.habitLabel}>Take a photo to verify a habit</Text>
            </View>
            {/* Shutter */}
            <View style={styles.shutterRow}>
                <TouchableOpacity style={styles.shutterOuter} onPress={handleCapture}>
                    <View style={styles.shutterInner} />
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderChecking = () => (
        <View style={styles.overlayContainer}>
            {frozenUri && (
                <Image source={{ uri: frozenUri }} style={StyleSheet.absoluteFill} contentFit="cover" />
            )}
            <View style={styles.dimOverlay} />
            <View style={styles.centerContent}>
                <Animated.Text style={[styles.checkingText, { opacity: pulseOpacity }]}>
                    Your avatar is checking…
                </Animated.Text>
                <View style={styles.dotsRow}>
                    {[0, 150, 300].map((delay, i) => (
                        <Animated.View
                            key={i}
                            style={[
                                styles.dot,
                                {
                                    transform: [{ scale: dotScale }],
                                    opacity: pulseOpacity,
                                },
                            ]}
                        />
                    ))}
                </View>
            </View>
        </View>
    );

    const renderVerified = () => (
        <View style={styles.overlayContainer}>
            {frozenUri && (
                <Image source={{ uri: frozenUri }} style={StyleSheet.absoluteFill} contentFit="cover" />
            )}
            <View style={styles.dimOverlay} />
            <View style={styles.centerContent}>
                {/* Avatar */}
                <Animated.Text
                    style={[styles.avatar, { transform: [{ translateY: avatarBounce }] }]}
                >
                    🏆
                </Animated.Text>

                {/* Badge */}
                <Animated.View
                    style={[
                        styles.badgeContainer,
                        { transform: [{ scale: badgeScale }], opacity: badgeOpacity },
                    ]}
                >
                    <Text style={styles.badgeIcon}>✅</Text>
                    <Text style={styles.badgeText}>
                        {detectedHabit
                            ? `${detectedHabit.charAt(0).toUpperCase() + detectedHabit.slice(1)} verified!`
                            : "Habit verified!"}
                    </Text>
                    <Text style={styles.confText}>
                        {Math.round(confidence * 100)}% match
                    </Text>
                </Animated.View>

                {/* +50 XP float */}
                <Animated.Text
                    style={[
                        styles.xpText,
                        { opacity: xpOpacity, transform: [{ translateY: xpTranslate }] },
                    ]}
                >
                    +50 XP
                </Animated.Text>

                <TouchableOpacity
                    style={[styles.btn, styles.btnGreen]}
                    onPress={() => { onComplete(true); router.back(); }}
                >
                    <Text style={styles.btnText}>Continue</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderAmbiguous = () => (
        <View style={styles.overlayContainer}>
            {frozenUri && (
                <Image source={{ uri: frozenUri }} style={StyleSheet.absoluteFill} contentFit="cover" />
            )}
            <View style={styles.dimOverlay} />
            <View style={styles.centerContent}>
                <Text style={styles.ambiguousIcon}>🤔</Text>
                <Text style={styles.ambiguousTitle}>Did you do it?</Text>
                <Text style={styles.ambiguousSub}>
                    We couldn't fully confirm. Trust your effort.
                </Text>
                <View style={styles.rowBtns}>
                    <TouchableOpacity style={[styles.btn, styles.btnGreen]} onPress={handleYes}>
                        <Text style={styles.btnText}>Yes 👍</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.btn, styles.btnRed]} onPress={handleNo}>
                        <Text style={styles.btnText}>No 👎</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

    const renderFailed = () => (
        <View style={styles.overlayContainer}>
            {frozenUri && (
                <Image source={{ uri: frozenUri }} style={StyleSheet.absoluteFill} contentFit="cover" />
            )}
            <View style={styles.dimOverlay} />
            <Animated.View
                style={[styles.centerContent, { transform: [{ translateX: shakeX }] }]}
            >
                <Text style={styles.failIcon}>❌</Text>
                <Text style={styles.failTitle}>Couldn't verify</Text>
                <Text style={styles.failSub}>
                    {errorMsg
                        ? `Server error: ${errorMsg}`
                        : "No habit was detected. Try again with the activity clearly in frame."}
                </Text>
                <TouchableOpacity style={[styles.btn, styles.btnGray]} onPress={handleRetry}>
                    <Text style={styles.btnText}>Try Again</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleNo} style={styles.skipBtn}>
                    <Text style={styles.skipText}>Skip</Text>
                </TouchableOpacity>
            </Animated.View>
        </View>
    );

    // -------------------------------------------------------------------------
    // Root render
    // -------------------------------------------------------------------------

    return (
        <View style={styles.root}>
            {stage === "camera" && renderCamera()}
            {stage === "checking" && renderChecking()}
            {stage === "verified" && renderVerified()}
            {stage === "ambiguous" && renderAmbiguous()}
            {stage === "failed" && renderFailed()}
        </View>
    );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: "#000",
    },
    center: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#111",
        padding: 24,
    },
    permText: {
        color: "#fff",
        fontSize: 16,
        marginBottom: 16,
        textAlign: "center",
    },

    // Camera stage
    topOverlay: {
        position: "absolute",
        top: 64,
        left: 0,
        right: 0,
        alignItems: "center",
    },
    habitLabel: {
        color: "#fff",
        fontSize: 20,
        fontWeight: "700",
        textShadowColor: "rgba(0,0,0,0.8)",
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
    },
    shutterRow: {
        position: "absolute",
        bottom: 48,
        left: 0,
        right: 0,
        alignItems: "center",
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
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: "#fff",
    },

    // Overlays
    overlayContainer: {
        flex: 1,
    },
    dimOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(0,0,0,0.55)",
    },
    centerContent: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 32,
    },

    // Checking
    checkingText: {
        color: "#fff",
        fontSize: 22,
        fontWeight: "600",
        marginBottom: 20,
        textAlign: "center",
    },
    dotsRow: {
        flexDirection: "row",
        gap: 10,
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: "#4ADE80",
    },

    // Verified
    avatar: {
        fontSize: 56,
        marginBottom: 12,
    },
    badgeContainer: {
        backgroundColor: "rgba(34,197,94,0.15)",
        borderWidth: 2,
        borderColor: "#22C55E",
        borderRadius: 20,
        paddingHorizontal: 28,
        paddingVertical: 20,
        alignItems: "center",
        marginBottom: 16,
    },
    badgeIcon: {
        fontSize: 40,
        marginBottom: 6,
    },
    badgeText: {
        color: "#4ADE80",
        fontSize: 20,
        fontWeight: "700",
    },
    confText: {
        color: "rgba(255,255,255,0.6)",
        fontSize: 13,
        marginTop: 4,
    },
    xpText: {
        color: "#FACC15",
        fontSize: 28,
        fontWeight: "800",
        marginBottom: 24,
        letterSpacing: 1,
    },

    // Ambiguous
    ambiguousIcon: {
        fontSize: 56,
        marginBottom: 12,
    },
    ambiguousTitle: {
        color: "#fff",
        fontSize: 26,
        fontWeight: "700",
        marginBottom: 8,
    },
    ambiguousSub: {
        color: "rgba(255,255,255,0.65)",
        fontSize: 14,
        textAlign: "center",
        marginBottom: 28,
    },
    rowBtns: {
        flexDirection: "row",
        gap: 12,
    },

    // Failed
    failIcon: {
        fontSize: 56,
        marginBottom: 12,
    },
    failTitle: {
        color: "#fff",
        fontSize: 26,
        fontWeight: "700",
        marginBottom: 8,
    },
    failSub: {
        color: "rgba(255,255,255,0.65)",
        fontSize: 14,
        textAlign: "center",
        marginBottom: 28,
    },
    skipBtn: {
        marginTop: 12,
        padding: 8,
    },
    skipText: {
        color: "rgba(255,255,255,0.45)",
        fontSize: 14,
    },

    // Buttons
    btn: {
        paddingHorizontal: 28,
        paddingVertical: 14,
        borderRadius: 14,
        alignItems: "center",
        minWidth: 110,
    },
    btnGreen: {
        backgroundColor: "#22C55E",
    },
    btnRed: {
        backgroundColor: "#EF4444",
    },
    btnGray: {
        backgroundColor: "rgba(255,255,255,0.15)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.3)",
    },
    btnText: {
        color: "#fff",
        fontWeight: "700",
        fontSize: 16,
    },
});
