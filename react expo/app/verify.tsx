import PhotoVerifyScreen from "@/PhotoVerifyScreen";
import { useRouter } from "expo-router";

export default function VerifyRoute() {
    const router = useRouter();
    return (
        <PhotoVerifyScreen
            habitId="gym"
            habitName="Gym"
            onComplete={(verified) => {
                console.log("[verify] result:", verified);
                router.back();
            }}
        />
    );
}
