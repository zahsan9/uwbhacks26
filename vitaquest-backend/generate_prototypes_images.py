"""
generate_prototypes_images.py
==============================
Generate prototype embeddings from REFERENCE IMAGES using the SAME
MobileCLIP ONNX image encoder that main.py uses at inference time.

The old generate_prototypes.py used CLIP *text* embeddings, which live in a
completely different vector space from MobileCLIP *image* embeddings.  That
mismatch caused cosine similarities to be random noise and is the root cause
of all photos always failing verification.

This script:
  1. Reads one or more reference images per habit from  reference_images/<habit>/
  2. Runs each image through the exact same preprocessing and ONNX inference
     pipeline as main.py
  3. Averages the resulting embeddings and L2-normalises → saves to
     prototypes/<habit>.npy

Usage:
    # 1. Put reference images in reference_images/<habit>/
    #    e.g. reference_images/gym/img1.jpg, reference_images/gym/img2.jpg, …
    #    For "gym" this might be photos of dumbbells, a squat rack, a bench
    #    press, etc.  More diverse images → more robust prototype.
    #    You need at least 1 image per habit; 5–10 is recommended.
    #
    # 2. Run:
    #    pip install onnxruntime pillow numpy
    #    python generate_prototypes_images.py
    #
    # 3. Restart the FastAPI backend so it reloads the new prototypes.

"""

import glob
import os

import numpy as np
import onnxruntime as ort
from PIL import Image

# ---------------------------------------------------------------------------
# Configuration — keep these in sync with main.py
# ---------------------------------------------------------------------------

MODEL_PATH = os.path.join("models", "mobileclip_image_quantized.onnx")
PROTOTYPES_DIR = "prototypes"
REFERENCE_DIR = "reference_images"  # put your source JPEGs/PNGs here
INPUT_SIZE = 224  # MobileCLIP expected input

SUPPORTED_HABITS = ["gym", "running", "reading", "cooking", "meditation"]

# ImageNet normalisation — MUST match main.py exactly
MEAN = np.array([0.48145466, 0.4578275, 0.40821073], dtype=np.float32)
STD  = np.array([0.26862954, 0.26130258, 0.27577711], dtype=np.float32)

# ---------------------------------------------------------------------------
# Helpers (mirrors preprocess_image / compute_embedding from main.py)
# ---------------------------------------------------------------------------


def preprocess_image(path: str) -> np.ndarray:
    """Load an image from disk and return the (1, 3, 224, 224) float32 array."""
    image = Image.open(path).convert("RGB")
    image = image.resize((INPUT_SIZE, INPUT_SIZE), Image.BILINEAR)
    arr = np.array(image, dtype=np.float32) / 255.0        # [0, 1]
    arr = (arr - MEAN) / STD                                # ImageNet normalise
    arr = arr.transpose(2, 0, 1)[np.newaxis, :]            # HWC → NCHW
    return arr


def compute_embedding(session: ort.InferenceSession, image_array: np.ndarray) -> np.ndarray:
    """Run ONNX inference and return an L2-normalised embedding vector."""
    input_name = session.get_inputs()[0].name
    outputs = session.run(None, {input_name: image_array})
    embedding = outputs[0].squeeze()                        # (D,)
    norm = np.linalg.norm(embedding)
    if norm > 0:
        embedding = embedding / norm
    return embedding.astype(np.float32)


def l2_normalize(v: np.ndarray) -> np.ndarray:
    norm = np.linalg.norm(v)
    return v / norm if norm > 0 else v


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


def main() -> None:
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(
            f"ONNX model not found at '{MODEL_PATH}'. "
            "Place mobileclip_image_quantized.onnx in the models/ directory first."
        )

    print(f"[setup] Loading ONNX model from {MODEL_PATH} …")
    sess_options = ort.SessionOptions()
    sess_options.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL
    session = ort.InferenceSession(MODEL_PATH, sess_options=sess_options)
    print("[setup] Model loaded ✓\n")

    os.makedirs(PROTOTYPES_DIR, exist_ok=True)
    os.makedirs(REFERENCE_DIR, exist_ok=True)

    prototypes: dict[str, np.ndarray] = {}

    for habit in SUPPORTED_HABITS:
        habit_dir = os.path.join(REFERENCE_DIR, habit)

        if not os.path.isdir(habit_dir):
            print(f"[{habit}] ⚠  No reference directory found at '{habit_dir}'. Skipping.")
            print(f"           Create the directory and add at least one image (JPG/PNG).")
            continue

        # Collect all images in this habit's folder
        image_paths = sorted(
            glob.glob(os.path.join(habit_dir, "*.jpg"))
            + glob.glob(os.path.join(habit_dir, "*.jpeg"))
            + glob.glob(os.path.join(habit_dir, "*.png"))
            + glob.glob(os.path.join(habit_dir, "*.webp"))
        )

        if not image_paths:
            print(f"[{habit}] ⚠  No images found in '{habit_dir}'. Skipping.")
            continue

        print(f"[{habit}] Encoding {len(image_paths)} reference image(s) …")
        embeddings: list[np.ndarray] = []

        for path in image_paths:
            try:
                arr = preprocess_image(path)
                emb = compute_embedding(session, arr)
                embeddings.append(emb)
                print(f"  ✓ {os.path.basename(path)}")
            except Exception as exc:
                print(f"  ✗ {os.path.basename(path)} — error: {exc}")

        if not embeddings:
            print(f"[{habit}] ⚠  All images failed. No prototype saved.")
            continue

        # Average then re-normalise → single robust prototype vector
        mean_emb = np.mean(np.stack(embeddings, axis=0), axis=0)
        prototype = l2_normalize(mean_emb)

        out_path = os.path.join(PROTOTYPES_DIR, f"{habit}.npy")
        np.save(out_path, prototype)
        prototypes[habit] = prototype
        print(f"  → Saved prototype ({prototype.shape}) to {out_path}\n")

    if len(prototypes) < 2:
        print("\n⚠  Need at least 2 prototypes to compute a similarity matrix. Done.")
        return

    # -----------------------------------------------------------------------
    # Print inter-habit cosine-similarity matrix so you can calibrate
    # THRESHOLD_VERIFIED and THRESHOLD_NULL in main.py
    # -----------------------------------------------------------------------
    habits = list(prototypes.keys())
    col_w = 12
    print("=" * 60)
    print("Inter-habit cosine similarity matrix (image space)")
    print("=" * 60)
    print(" " * col_w + "".join(f"{h:>{col_w}}" for h in habits))

    all_off_diag: list[float] = []
    for h1 in habits:
        row = f"{h1:<{col_w}}"
        for h2 in habits:
            sim = float(np.dot(prototypes[h1], prototypes[h2]))
            if h1 != h2:
                all_off_diag.append(sim)
            row += f"{sim:>{col_w}.4f}"
        print(row)

    max_inter = max(all_off_diag)
    mean_inter = float(np.mean(all_off_diag))
    print(f"\nOff-diagonal  mean={mean_inter:.4f}  max={max_inter:.4f}")

    # Recommended thresholds: sit midway between confusion pair and 1.0
    recommended_verified = round((max_inter + 1.0) / 2, 2)
    recommended_null = round(recommended_verified - 0.25, 2)

    print("\n" + "=" * 60)
    print("Threshold recommendation  (update main.py if needed)")
    print("=" * 60)
    print(f"  Highest inter-habit similarity : {max_inter:.4f}")
    print(f"  Recommended THRESHOLD_VERIFIED : {recommended_verified:.2f}")
    print(f"  Recommended THRESHOLD_NULL     : {recommended_null:.2f}")
    print("=" * 60)
    print("\nPrototype generation complete. Restart the FastAPI server to reload.")


if __name__ == "__main__":
    main()
