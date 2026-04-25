import PhotoVerifyScreen from "@/PhotoVerifyScreen";
<<<<<<< HEAD
import { useRouter } from "expo-router";

// The 3 photo-verifiable habits in the demo seed state
const DEMO_HABIT_IDS = ["gym", "read", "meditate"];

export default function VerifyRoute() {
    const router = useRouter();
    return (
        <PhotoVerifyScreen
            habitIds={DEMO_HABIT_IDS}
            onComplete={(verified) => {
                console.log("[verify] result:", verified);
                router.back();
            }}
        />
    );
=======

export default function VerifyRoute() {
  return (
    <PhotoVerifyScreen
      onComplete={(verified) => {
        console.log("[verify] result:", verified);
      }}
    />
  );
>>>>>>> origin/archit
}
