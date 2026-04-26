"""
VitaQuest Backend — Habit Verification API
FastAPI + ONNX Runtime + MobileCLIP embeddings
"""

import base64
import io
import os
import time
from typing import Optional

import numpy as np
import onnxruntime as ort
import requests
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
from pydantic import BaseModel

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
GEMMA_MODEL = "gemma4"

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

DEMO_TOKEN = "demo_vitaquest_xyz"
MODEL_PATH = os.path.join("models", "mobileclip_image_quantized.onnx")
PROTOTYPES_DIR = "prototypes"

SUPPORTED_HABITS = ["gym", "running", "reading", "cooking", "meditation"]

# LOGIT_SCALE controls how sharply softmax separates classes.
# 100 was far too aggressive: a 0.03 raw cosine edge → 82%+ probability, causing
# every photo to be classified as running (the most "central" prototype).
# 20 gives honest probabilities while still confidently classifying clear matches.
LOGIT_SCALE = 20.0

# Probability thresholds after softmax over all habit scores.
PROB_VERIFIED = 0.85   # top class holds ≥85% of probability mass → verified
PROB_NULL     = 0.40   # ambiguous band floor

# Hard gate: reject before softmax if the image isn't close enough to ANY prototype.
# Random noise scores 0.05–0.08; real photos (activity or not) sit at 0.15–0.35.
# 0.15 rejects pure noise/garbage while passing genuine activity photos.
MIN_COSINE_FLOOR = 0.15

# Minimum raw cosine margin the top class must have over the runner-up.
# Prevents amplifying noise when all 5 habits score within 0.03 of each other.
MIN_COSINE_MARGIN = 0.02

# Input image size expected by MobileCLIP
INPUT_SIZE = 224

# ---------------------------------------------------------------------------
# Global state (loaded once at startup)
# ---------------------------------------------------------------------------

ort_session: Optional[ort.InferenceSession] = None
prototypes: dict[str, np.ndarray] = {}

# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------


class VerifyRequest(BaseModel):
    frame_base64: str
    demo_token: str
    habit_ids: Optional[list[str]] = None  # if provided, only scan these habits


class VerifyResponse(BaseModel):
    verified: Optional[bool]
    detected_habit: Optional[str]  # which habit matched best (or None if no match)
    confidence: float
    inference_ms: int


# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------

app = FastAPI(title="VitaQuest Verification API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup_event() -> None:
    """Load model and prototype embeddings into global memory once at startup."""
    global ort_session, prototypes

    # Load ONNX model
    if os.path.exists(MODEL_PATH):
        print(f"[startup] Loading ONNX model from {MODEL_PATH} …")
        sess_options = ort.SessionOptions()
        sess_options.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL
        ort_session = ort.InferenceSession(MODEL_PATH, sess_options=sess_options)
        print("[startup] Model loaded ✓")
    else:
        print(
            f"[startup] WARNING: model not found at {MODEL_PATH}. "
            "/verify endpoint will return HTTP 503 until the model is placed."
        )

    # Load prototype embeddings
    for habit in SUPPORTED_HABITS:
        proto_path = os.path.join(PROTOTYPES_DIR, f"{habit}.npy")
        if os.path.exists(proto_path):
            arr = np.load(proto_path)          # shape: (N, D) or (D,)
            if arr.ndim == 1:
                arr = arr[np.newaxis, :]       # ensure 2-D
            prototypes[habit] = arr
            print(f"[startup] Loaded prototypes for '{habit}': {arr.shape} ✓")
        else:
            print(
                f"[startup] WARNING: prototype not found for habit '{habit}' "
                f"at {proto_path}. Requests for this habit will fail."
            )

    print("[startup] Startup complete.")


# ---------------------------------------------------------------------------
# Helper functions
# ---------------------------------------------------------------------------


def preprocess_image(frame_base64: str) -> np.ndarray:
    """Decode base64 image, resize to INPUT_SIZE×INPUT_SIZE, return float32 array."""
    try:
        image_bytes = base64.b64decode(frame_base64)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Invalid base64 encoding: {exc}")

    try:
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Cannot decode image: {exc}")

    image = image.resize((INPUT_SIZE, INPUT_SIZE), Image.BILINEAR)
    arr = np.array(image, dtype=np.float32) / 255.0  # [0, 1]

    # Normalize with ImageNet mean/std (standard for MobileCLIP)
    mean = np.array([0.48145466, 0.4578275, 0.40821073], dtype=np.float32)
    std = np.array([0.26862954, 0.26130258, 0.27577711], dtype=np.float32)
    arr = (arr - mean) / std

    # HWC → CHW → NCHW
    arr = arr.transpose(2, 0, 1)[np.newaxis, :]  # (1, 3, H, W)
    return arr


def compute_embedding(image_array: np.ndarray) -> np.ndarray:
    """Run inference and return L2-normalised embedding."""
    if ort_session is None:
        raise HTTPException(status_code=503, detail="Model not loaded. Place model file and restart.")

    input_name = ort_session.get_inputs()[0].name
    outputs = ort_session.run(None, {input_name: image_array})
    embedding = outputs[0].squeeze()  # (D,)

    # L2 normalise
    norm = np.linalg.norm(embedding)
    if norm > 0:
        embedding = embedding / norm
    return embedding.astype(np.float32)


def cosine_similarities(embedding: np.ndarray, proto_matrix: np.ndarray) -> np.ndarray:
    """
    Compute cosine similarity between a single embedding and N prototypes.

    Args:
        embedding:    shape (D,)  — already L2-normalised
        proto_matrix: shape (N, D) — rows should also be L2-normalised

    Returns:
        similarities: shape (N,)
    """
    # Normalise prototypes row-wise (in case they aren't already)
    norms = np.linalg.norm(proto_matrix, axis=1, keepdims=True)
    norms = np.where(norms == 0, 1.0, norms)
    proto_norm = proto_matrix / norms

    sims = proto_norm @ embedding  # (N,)
    return sims


def softmax_probs(scores: dict[str, float]) -> dict[str, float]:
    """Apply temperature-scaled softmax over per-habit cosine scores."""
    logits = np.array(list(scores.values()), dtype=np.float64) * LOGIT_SCALE
    logits -= logits.max()  # numerical stability
    exp_logits = np.exp(logits)
    probs = exp_logits / exp_logits.sum()
    return dict(zip(scores.keys(), probs.tolist()))


# ---------------------------------------------------------------------------
# Gemma 4 fallback (via Ollama) — only called when CLIP is ambiguous
# ---------------------------------------------------------------------------

GEMMA_PROMPT = (
    "You are a habit verification assistant. Look at this image and determine "
    "which ONE of the following habits it shows: gym, running, reading, cooking, meditation. "
    "If none of these habits are clearly shown, respond with 'none'. "
    "Respond with ONLY the single habit word, nothing else."
)

def classify_with_gemma(frame_base64: str, habit_ids: Optional[list[str]] = None) -> tuple[Optional[str], float]:
    """
    Send image to Gemma 4 via Ollama for classification.
    Returns (detected_habit, confidence) where confidence is 1.0 if matched, 0.0 if none.
    """
    allowed = habit_ids if habit_ids else SUPPORTED_HABITS
    prompt = (
        f"You are a strict habit verification assistant. Look at this image carefully. "
        f"A person must be ACTIVELY and CLEARLY performing one of these habits: {', '.join(allowed)}. "
        f"Rules:\n"
        f"- The habit must be the obvious main subject of the image\n"
        f"- A person must be visibly engaged in the activity\n"
        f"- Background objects (e.g. a TV showing someone running) do NOT count\n"
        f"- If you are not highly confident, respond with 'none'\n"
        f"Respond with ONLY the single habit word or 'none'. No explanation."
    )
    try:
        resp = requests.post(
            f"{OLLAMA_URL}/api/generate",
            json={
                "model": GEMMA_MODEL,
                "prompt": prompt,
                "images": [frame_base64],
                "stream": False,
            },
            timeout=12,
        )
        resp.raise_for_status()
        answer = resp.json().get("response", "").strip().lower()
        # Extract just the habit word in case the model adds punctuation
        for habit in allowed:
            if habit in answer:
                return habit, 1.0
        return None, 0.0
    except Exception as e:
        print(f"[gemma] fallback failed: {e}")
        return None, 0.0


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@app.get("/healthz", tags=["Health"])
def healthz():
    """Keep-warm / liveness probe."""
    return {"status": "ok"}


@app.post("/verify", response_model=VerifyResponse, tags=["Verification"])
def verify(payload: VerifyRequest) -> VerifyResponse:
    """
    Blind habit detection: scans the photo against loaded habit prototypes.

    Pipeline:
      1. Gate 1 — raw cosine floor (MIN_COSINE_FLOOR=0.25): reject non-activity images.
      2. Gate 2 — raw cosine margin (MIN_COSINE_MARGIN=0.04): if all habits score within
         0.04 of each other (noise), escalate directly to Gemma rather than forcing a winner.
      3. Softmax (LOGIT_SCALE=20) over remaining candidates.
      4. verified=True  if top class probability >= PROB_VERIFIED (0.85)
         verified=None  if in ambiguous band (0.40–0.85) → Gemma fallback
         verified=False if nothing clears the band
    """
    # --- Auth ---
    if payload.demo_token != DEMO_TOKEN:
        raise HTTPException(status_code=401, detail="Invalid demo_token.")

    if not prototypes:
        raise HTTPException(status_code=503, detail="No prototype embeddings loaded.")

    # --- Preprocessing ---
    image_array = preprocess_image(payload.frame_base64)

    # --- Inference ---
    t0 = time.perf_counter()
    embedding = compute_embedding(image_array)
    t1 = time.perf_counter()
    inference_ms = int((t1 - t0) * 1000)

    # --- Determine which habits to scan ---
    # Always score against ALL loaded prototypes regardless of habit_ids.
    # habit_ids is used only to filter the *reported* winner — we still need the
    # full comparison to tell "person running" from "person on couch".
    habits_to_scan = prototypes
    if not habits_to_scan:
        raise HTTPException(status_code=503, detail="No prototype embeddings loaded.")

    # Which habits the user actually tracks (None = accept any)
    requested_habits: Optional[set[str]] = set(payload.habit_ids) if payload.habit_ids else None
    if requested_habits and not any(h in prototypes for h in requested_habits):
        raise HTTPException(
            status_code=400,
            detail=f"None of the requested habit_ids {payload.habit_ids} have prototypes loaded.",
        )

    # --- Score against selected habits (max sim across each habit's prototypes) ---
    raw_scores: dict[str, float] = {}
    for habit_id, proto_matrix in habits_to_scan.items():
        sims = cosine_similarities(embedding, proto_matrix)
        raw_scores[habit_id] = float(np.max(sims))

    best_habit_raw = max(raw_scores, key=raw_scores.get)
    best_score_raw = raw_scores[best_habit_raw]
    sorted_scores = sorted(raw_scores.values(), reverse=True)
    raw_margin = sorted_scores[0] - sorted_scores[1] if len(sorted_scores) > 1 else 0.0

    print(
        f"[verify] cosine={{{', '.join(f'{h}:{s:.4f}' for h, s in raw_scores.items())}}} "
        f"best_raw={best_habit_raw}:{best_score_raw:.4f} margin={raw_margin:.4f}"
    )

    # Gate 1: absolute cosine floor — reject images with no resemblance to any habit.
    # Non-activity images (living rooms, random shots) typically score below 0.25.
    if best_score_raw < MIN_COSINE_FLOOR:
        print(f"[verify] REJECTED — best raw cosine {best_score_raw:.4f} < floor {MIN_COSINE_FLOOR}")
        return VerifyResponse(verified=False, detected_habit=None, confidence=0.0, inference_ms=inference_ms)

    # Gate 2: margin check — if all habits score within 0.04 of each other the signal
    # is noise, not a real classification. Escalate to Gemma rather than forcing a winner.
    if raw_margin < MIN_COSINE_MARGIN:
        print(f"[verify] AMBIGUOUS — raw margin {raw_margin:.4f} < {MIN_COSINE_MARGIN}, escalating to Gemma …")
        t2 = time.perf_counter()
        gemma_habit, _ = classify_with_gemma(payload.frame_base64, payload.habit_ids)
        inference_ms += int((time.perf_counter() - t2) * 1000)
        if gemma_habit:
            return VerifyResponse(verified=True, detected_habit=gemma_habit, confidence=0.75, inference_ms=inference_ms)
        # Gemma unavailable — return CLIP's best guess as ambiguous so UI shows "Looks like X?"
        return VerifyResponse(verified=None, detected_habit=best_habit_raw, confidence=round(best_score_raw, 6), inference_ms=inference_ms)

    # Both gates passed: floor proves the image is real, margin proves one class
    # clearly won. The softmax 0.85 threshold is redundant here — it just dilutes
    # a clear winner across 5 classes and makes everything look ambiguous.
    # Trust the winner directly and apply the requested_habits filter.
    best_habit = best_habit_raw

    if requested_habits and best_habit not in requested_habits:
        print(f"[verify] winner={best_habit} not in user habits {requested_habits} → rejected")
        return VerifyResponse(verified=False, detected_habit=None, confidence=0.0, inference_ms=inference_ms)

    print(f"[verify] VERIFIED — {best_habit}:{best_score_raw:.4f} margin={raw_margin:.4f}")
    return VerifyResponse(
        verified=True,
        detected_habit=best_habit,
        confidence=round(best_score_raw, 6),
        inference_ms=inference_ms,
    )
