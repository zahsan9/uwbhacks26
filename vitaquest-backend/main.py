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
from fastapi import FastAPI, HTTPException
from PIL import Image
from pydantic import BaseModel

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

DEMO_TOKEN = "demo_vitaquest_xyz"
MODEL_PATH = os.path.join("models", "mobileclip_image_quantized.onnx")
PROTOTYPES_DIR = "prototypes"

SUPPORTED_HABITS = ["gym", "running", "reading", "cooking", "meditation"]

# Thresholds (calibrated from generate_prototypes.py similarity matrix)
# Max inter-habit similarity observed: 0.844 (reading vs cooking)
# Recommended verified threshold: 0.92 | ambiguous band: 0.67 – 0.92
THRESHOLD_VERIFIED = 0.92
THRESHOLD_NULL = 0.67

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
    habit_id: str
    frame_base64: str
    demo_token: str


class VerifyResponse(BaseModel):
    verified: Optional[bool]
    confidence: float
    proto_idx: int
    inference_ms: int


# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------

app = FastAPI(title="VitaQuest Verification API", version="1.0.0")


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


def similarity_to_verified(similarity: float) -> Optional[bool]:
    """Map cosine similarity to verified / null / false."""
    if similarity >= THRESHOLD_VERIFIED:
        return True
    if similarity >= THRESHOLD_NULL:
        return None  # ambiguous
    return False


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
    Verify a habit completion frame against stored prototype embeddings.

    - Validates demo_token
    - Decodes and preprocesses the image
    - Runs ONNX inference
    - Computes cosine similarity against prototype embeddings
    - Returns verification result with confidence and timing
    """
    # --- Auth ---
    if payload.demo_token != DEMO_TOKEN:
        raise HTTPException(status_code=401, detail="Invalid demo_token.")

    # --- Habit lookup ---
    habit_id = payload.habit_id.lower().strip()
    if habit_id not in prototypes:
        if habit_id not in SUPPORTED_HABITS:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported habit_id '{habit_id}'. "
                       f"Supported: {SUPPORTED_HABITS}",
            )
        raise HTTPException(
            status_code=503,
            detail=f"Prototype embeddings for '{habit_id}' not loaded. "
                   "Place the .npy file and restart.",
        )

    # --- Preprocessing ---
    image_array = preprocess_image(payload.frame_base64)

    # --- Inference (synchronous for lowest latency) ---
    t0 = time.perf_counter()
    embedding = compute_embedding(image_array)
    t1 = time.perf_counter()
    inference_ms = int((t1 - t0) * 1000)

    # --- Similarity ---
    proto_matrix = prototypes[habit_id]
    sims = cosine_similarities(embedding, proto_matrix)

    best_idx = int(np.argmax(sims))
    best_sim = float(sims[best_idx])

    verified = similarity_to_verified(best_sim)

    return VerifyResponse(
        verified=verified,
        confidence=round(best_sim, 6),
        proto_idx=best_idx,
        inference_ms=inference_ms,
    )
