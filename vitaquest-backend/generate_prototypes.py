"""
generate_prototypes.py
======================
Generate prototype embeddings for VitaQuest habit verification.

Uses openai/clip-vit-base-patch32 (CLIP text encoder) to embed 5 descriptive
prompts per habit, averages + normalises them, and saves each to
prototypes/{habit_id}.npy.

Prints a full inter-habit cosine-similarity matrix and recommends a threshold.

Usage:
    pip install transformers torch
    python generate_prototypes.py
"""

import os
from itertools import combinations

import numpy as np
import torch
from transformers import CLIPModel, CLIPProcessor

# ---------------------------------------------------------------------------
# Habit prompts
# ---------------------------------------------------------------------------

HABIT_PROMPTS: dict[str, list[str]] = {
    "gym": [
        "person lifting weights at a gym",
        "dumbbell workout at fitness center",
        "person doing bench press",
        "gym equipment and weights",
        "person exercising at indoor gym",
    ],
    "running": [
        "person running outdoors",
        "runner on a trail or road",
        "person jogging in athletic wear",
        "running shoes on pavement",
        "athlete running in a park",
    ],
    "reading": [
        "person reading a book",
        "open book being held by hands",
        "person sitting with a book",
        "someone reading at a desk",
        "close up of book pages being read",
    ],
    "cooking": [
        "person cooking in a kitchen",
        "food being prepared on a stove",
        "hands chopping vegetables",
        "cooking meal in a pan",
        "person at kitchen counter preparing food",
    ],
    "meditation": [
        "person meditating with eyes closed",
        "person sitting cross legged in meditation",
        "mindfulness meditation pose",
        "person in lotus position meditating",
        "calm person meditating indoors",
    ],
}

MODEL_NAME = "openai/clip-vit-base-patch32"
PROTOTYPES_DIR = "prototypes"

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def l2_normalize(v: np.ndarray) -> np.ndarray:
    """L2-normalise a 1-D vector."""
    norm = np.linalg.norm(v)
    return v / norm if norm > 0 else v


def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    return float(np.dot(a, b))  # both already L2-normalised


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


def main() -> None:
    os.makedirs(PROTOTYPES_DIR, exist_ok=True)

    print(f"Loading model: {MODEL_NAME} …")
    device = "cuda" if torch.cuda.is_available() else "cpu"
    processor = CLIPProcessor.from_pretrained(MODEL_NAME)
    model = CLIPModel.from_pretrained(MODEL_NAME).to(device)
    model.eval()
    print(f"Model loaded on {device}.\n")

    prototypes: dict[str, np.ndarray] = {}

    # -----------------------------------------------------------------------
    # Encode prompts and build prototype vectors
    # -----------------------------------------------------------------------
    for habit_id, prompts in HABIT_PROMPTS.items():
        print(f"[{habit_id}] Encoding {len(prompts)} prompts …")
        embeddings: list[np.ndarray] = []

        for prompt in prompts:
            inputs = processor(text=[prompt], return_tensors="pt", padding=True).to(device)
            with torch.no_grad():
                out = model.get_text_features(**inputs)
            # transformers ≥5.0 may return a dataclass; unwrap to tensor
            if isinstance(out, torch.Tensor):
                emb = out.cpu().numpy().squeeze()
            else:
                # BaseModelOutputWithPooling or similar — grab pooler_output
                emb = out.pooler_output.cpu().numpy().squeeze()
            emb = l2_normalize(emb)
            embeddings.append(emb)
            print(f"  ✓ \"{prompt}\"")

        # Save all prompt embeddings as an (N, D) matrix.
        # Keeping individual vectors preserves intra-class variation so that
        # main.py's np.max(sims) can match against whichever prompt is closest
        # to the incoming image, rather than a single averaged centroid.
        proto_matrix = np.stack(embeddings, axis=0)  # (N, D)

        out_path = os.path.join(PROTOTYPES_DIR, f"{habit_id}.npy")
        np.save(out_path, proto_matrix)
        prototypes[habit_id] = proto_matrix
        print(f"  → Saved to {out_path}  (shape: {proto_matrix.shape})\n")

    # -----------------------------------------------------------------------
    # Inter-habit cosine similarity matrix (using per-habit mean vector)
    # -----------------------------------------------------------------------
    habits = list(prototypes.keys())
    # Compute mean vector per habit for display purposes only
    mean_vecs = {h: l2_normalize(prototypes[h].mean(axis=0)) for h in habits}

    print("=" * 60)
    print("Inter-habit cosine similarity matrix (mean vectors)")
    print("=" * 60)

    # Header row
    col_w = 12
    header = " " * col_w + "".join(f"{h:>{col_w}}" for h in habits)
    print(header)

    sim_matrix: dict[tuple[str, str], float] = {}
    for h1 in habits:
        row = f"{h1:<{col_w}}"
        for h2 in habits:
            sim = cosine_similarity(mean_vecs[h1], mean_vecs[h2])
            sim_matrix[(h1, h2)] = sim
            row += f"{sim:>{col_w}.4f}"
        print(row)

    # Off-diagonal similarities (inter-habit)
    off_diag = [
        sim_matrix[(h1, h2)]
        for h1, h2 in combinations(habits, 2)
    ]
    max_inter = max(off_diag)
    mean_inter = float(np.mean(off_diag))
    min_inter = min(off_diag)

    print()
    print(f"Off-diagonal  min={min_inter:.4f}  mean={mean_inter:.4f}  max={max_inter:.4f}")

    # -----------------------------------------------------------------------
    # Notes on thresholds
    # -----------------------------------------------------------------------
    print()
    print("=" * 60)
    print("Threshold notes")
    print("=" * 60)
    print(
        f"  Highest inter-habit similarity : {max_inter:.4f}  "
        f"(most confusable pair, mean-vector basis)"
    )
    print()
    print(
        "  main.py now uses softmax probabilities (LOGIT_SCALE=100) rather than\n"
        "  raw cosine thresholds, so these values are for reference only.\n"
        "  Tune PROB_VERIFIED / PROB_NULL in main.py against real test images."
    )
    print("=" * 60)


if __name__ == "__main__":
    main()
