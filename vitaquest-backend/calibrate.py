"""
calibrate.py
============
Run real photos through the CLIP pipeline to calibrate MIN_COSINE_FLOOR
and MIN_COSINE_MARGIN before demo day.

Usage:
    python calibrate.py path/to/image.jpg [path/to/another.jpg ...]
    python calibrate.py test_images/          # entire folder

Output: raw cosine scores, margin, and what the current thresholds would decide.

Tune MIN_COSINE_FLOOR in main.py so that:
  - Non-activity photos (living room, selfie, random) score BELOW the floor
  - Genuine habit photos score ABOVE the floor
"""

import glob
import os
import sys

import numpy as np
import onnxruntime as ort
from PIL import Image

# ── keep in sync with main.py ─────────────────────────────────────────────────
MODEL_PATH        = os.path.join("models", "mobileclip_image_quantized.onnx")
PROTOTYPES_DIR    = "prototypes"
INPUT_SIZE        = 224
MEAN = np.array([0.48145466, 0.4578275,  0.40821073], dtype=np.float32)
STD  = np.array([0.26862954, 0.26130258, 0.27577711], dtype=np.float32)
LOGIT_SCALE       = 20.0
PROB_VERIFIED     = 0.85
PROB_NULL         = 0.40
MIN_COSINE_FLOOR  = 0.15
MIN_COSINE_MARGIN = 0.02
# ─────────────────────────────────────────────────────────────────────────────


def preprocess(path: str) -> np.ndarray:
    img = Image.open(path).convert("RGB").resize((INPUT_SIZE, INPUT_SIZE), Image.BILINEAR)
    arr = (np.array(img, dtype=np.float32) / 255.0 - MEAN) / STD
    return arr.transpose(2, 0, 1)[np.newaxis, :]


def embed(session: ort.InferenceSession, arr: np.ndarray) -> np.ndarray:
    name = session.get_inputs()[0].name
    out = session.run(None, {name: arr})[0].squeeze()
    norm = np.linalg.norm(out)
    return (out / norm).astype(np.float32) if norm > 0 else out


def softmax(scores: dict, scale: float) -> dict:
    logits = np.array(list(scores.values()), dtype=np.float64) * scale
    logits -= logits.max()
    probs = np.exp(logits) / np.exp(logits).sum()
    return dict(zip(scores.keys(), probs.tolist()))


def classify(raw: dict) -> str:
    best = max(raw, key=raw.get)
    best_val = raw[best]
    second = sorted(raw.values(), reverse=True)[1]
    margin = best_val - second

    if best_val < MIN_COSINE_FLOOR:
        return f"REJECTED  (floor: {best_val:.3f} < {MIN_COSINE_FLOOR})"
    if margin < MIN_COSINE_MARGIN:
        return f"-> Gemma  (margin: {margin:.3f} < {MIN_COSINE_MARGIN})"

    probs = softmax(raw, LOGIT_SCALE)
    p = probs[best]
    if p >= PROB_VERIFIED:
        return f"VERIFIED  {best} ({p:.1%})"
    if p >= PROB_NULL:
        return f"-> Gemma  {best} ({p:.1%})"
    return f"FAILED    {best} ({p:.1%})"


def main() -> None:
    if len(sys.argv) < 2:
        print("Usage: python calibrate.py <image_or_folder> [...]")
        sys.exit(1)

    # Collect image paths
    paths: list[str] = []
    for arg in sys.argv[1:]:
        if os.path.isdir(arg):
            for ext in ("jpg", "jpeg", "png", "webp"):
                paths += glob.glob(os.path.join(arg, f"*.{ext}"))
                paths += glob.glob(os.path.join(arg, f"**/*.{ext}"), recursive=True)
        else:
            paths.append(arg)
    paths = sorted(set(paths))

    if not paths:
        print("No images found.")
        sys.exit(1)

    # Load model
    if not os.path.exists(MODEL_PATH):
        print(f"Model not found at {MODEL_PATH}")
        sys.exit(1)
    session = ort.InferenceSession(MODEL_PATH)

    # Load prototypes
    habits = [f[:-4] for f in os.listdir(PROTOTYPES_DIR) if f.endswith(".npy")]
    if not habits:
        print(f"No .npy prototypes found in {PROTOTYPES_DIR}/")
        sys.exit(1)
    protos: dict[str, np.ndarray] = {}
    for h in habits:
        arr = np.load(os.path.join(PROTOTYPES_DIR, f"{h}.npy"))
        if arr.ndim == 1:
            arr = arr[np.newaxis, :]
        protos[h] = arr

    col = max(len(h) for h in habits) + 2
    header = f"{'FILE':<40}" + "".join(f"{h:>{col}}" for h in sorted(habits)) + f"{'MARGIN':>8}  DECISION"
    print(header)
    print("-" * len(header))

    for path in paths:
        try:
            arr = preprocess(path)
            emb = embed(session, arr)
        except Exception as e:
            print(f"  ERROR reading {os.path.basename(path)}: {e}")
            continue

        raw: dict[str, float] = {}
        for h, proto in protos.items():
            norms = np.linalg.norm(proto, axis=1, keepdims=True)
            pn = proto / np.where(norms == 0, 1.0, norms)
            raw[h] = float(np.max(pn @ emb))

        sorted_vals = sorted(raw.values(), reverse=True)
        margin = sorted_vals[0] - sorted_vals[1]
        decision = classify(raw)
        name = os.path.basename(path)[:38]

        row = f"{name:<40}"
        for h in sorted(habits):
            v = raw[h]
            row += f"{v:>{col}.3f}"
        row += f"{margin:>8.3f}  {decision}"
        print(row)

    print()
    print(f"Thresholds in effect:  floor={MIN_COSINE_FLOOR}  margin={MIN_COSINE_MARGIN}  logit_scale={LOGIT_SCALE}")
    print("Edit MIN_COSINE_FLOOR in main.py (and here) if non-activity photos are passing or activity photos are failing.")


if __name__ == "__main__":
    main()
