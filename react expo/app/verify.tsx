import PhotoVerifyScreen from "@/PhotoVerifyScreen";

export default function VerifyRoute() {
  return (
    <PhotoVerifyScreen
      onComplete={(verified) => {
        console.log("[verify] result:", verified);
      }}
    />
  );
}
