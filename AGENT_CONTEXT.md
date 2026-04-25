# VitaQuest — Agent Context

## What This Project Is
VitaQuest is a habit-tracking mobile app with an AI photo-verification backend. Users take a photo of themselves doing a habit (gym, reading, meditating, etc.), the backend identifies what habit is shown via CLIP embeddings, and awards XP. The avatar's health state visibly degrades when habits are missed.

**Hackathon project — demo-first, not production.**

---

## Repo Structure
```
uwbhacks26/
├── react expo/          # React Native Expo (TypeScript, expo-router)
├── vitaquest-backend/   # FastAPI + ONNX inference server
├── DEMO_DAY.md          # Demo operations guide
└── AGENT_CONTEXT.md     # This file
```

---

## Backend — `vitaquest-backend/`

| File | Purpose |
|---|---|
| `main.py` | FastAPI app. Two endpoints: `GET /healthz`, `POST /verify` |
| `start_demo.sh` | Auto-detects LAN IP, starts `python -m uvicorn main:app --host 0.0.0.0 --port 8000` |
| `generate_prototypes.py` | One-time script: generates `prototypes/{habit}.npy` via CLIP text encoder |
| `export_onnx.py` | One-time script: exports CLIP image encoder to `models/mobileclip_image_quantized.onnx` |
| `requirements.txt` | fastapi, uvicorn, Pillow, numpy, onnxruntime, pydantic, python-multipart |
| `models/` | Contains the ONNX model (not in git — run `export_onnx.py` to generate) |
| `prototypes/` | `.npy` files for gym, running, reading, cooking, meditation (512-dim CLIP text embeddings) |

### `/verify` endpoint
- **Input:** `{ frame_base64: str, demo_token: str, habit_ids?: str[] }`
- **Output:** `{ verified: bool|null, detected_habit: str|null, confidence: float, inference_ms: int }`
- **Logic:** Decodes base64 image → ONNX inference → cosine similarity vs prototypes → returns best match
- **`habit_ids`:** If provided, only scans those habits. If omitted, scans all.
- **Thresholds:** `THRESHOLD_VERIFIED = 0.92`, `THRESHOLD_NULL = 0.67` (calibrated from prototype matrix)
- **Auth:** `demo_token` must equal `"demo_vitaquest_xyz"`

### Key gotchas
- Always use `python -m uvicorn`, NOT the bare `uvicorn` binary (Homebrew Python 3.13 vs Conda Python 3.12 conflict)
- The `--reload` flag causes a race condition if `export_onnx.py` runs simultaneously — don't use `--reload` in production mode
- ONNX model must be exported with `dynamo=False` (torch 2.11 dynamo exporter creates duplicate output names)

---

## Frontend — `react expo/`

**Stack:** TypeScript · Expo SDK 54 · `expo-router` (file-based routing) · AsyncStorage for state

### Key source files
| File | Purpose |
|---|---|
| `src/constants/verifyConfig.ts` | `DEMO_SERVER_ENDPOINT` (LAN IP) and `DEMO_TOKEN` — update IP here before demo |
| `src/hooks/useHabitVerification.ts` | Resizes photo → base64 → POST /verify → returns result. Accepts `habitIds?: string[]` |
| `src/PhotoVerifyScreen.tsx` | Full-screen camera → 4 stages: camera / checking / verified / ambiguous / failed |
| `src/seedDemoState.ts` | `seedPhoneA()` / `seedPhoneB()` — writes thriving/sick demo state to AsyncStorage |
| `app/verify.tsx` | **Dev-only test route** — navigate to `/verify` via Expo shake menu to test the camera |

### Habit ID mapping
App-side IDs (from `STARTER_HABITS` in `src/models.ts`) map to backend prototype names:
```
gym      → gym
read     → reading
meditate → meditation
running  → running
cooking  → cooking
sleep / steps / screen → no prototype (auto-tracked, not photo-verified)
```
This mapping lives in `useHabitVerification.ts` as `APP_TO_PROTO_ID`.

### State shape (AsyncStorage)
- Key `'onboarded'`: `"true"` — controls routing to onboarding vs home
- Key `'vq_state'`: JSON-serialised `VQAppState` (streak, habitHistory, healthScore, avatarState, xp, level)
- `seedPhoneA()` writes thriving state (streak 12, health 94, xp 2400, level 8)
- `seedPhoneB()` writes sick state (streak 3, health 31, xp 800, level 3)

### What is NOT yet wired up
- The home/profile screens still render **hardcoded** data from `src/models.ts` — they do not read from AsyncStorage
- There is no in-app button navigating to the camera screen from habit rows
- `seedPhoneA/B` have no UI trigger — must be called programmatically

### Install notes
```bash
# Frontend
npm install --legacy-peer-deps   # required due to @types/react version conflict
npx expo install expo-camera expo-image-manipulator -- --legacy-peer-deps

# Backend
pip install -r requirements.txt
pip install torch transformers onnx onnxscript
python generate_prototypes.py    # generates .npy files
python export_onnx.py            # generates .onnx model
```

---

## Demo Setup (quick version)
1. `bash vitaquest-backend/start_demo.sh` — prints LAN IP, starts server
2. Check IP matches `DEMO_SERVER_ENDPOINT` in `verifyConfig.ts`
3. `npm start` inside `react expo/`
4. Scan QR in Expo Go — shake phone → "Go to route" → `/verify` to test camera

Full guide: `DEMO_DAY.md`

---

## Branch
Active dev branch: `ayaan` on `github.com/zahsan9/uwbhacks26`
