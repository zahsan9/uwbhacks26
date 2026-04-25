# 🎮 VitaQuest — Demo Day Guide
> UWBHACKS 2026 · Two phones, one laptop hotspot, no cloud dependency

---

## ⚡ Setup (T-minus ~15 minutes)

| Step | Action |
|------|--------|
| **1** | On the demo laptop, create a **Personal Hotspot** and note the IP shown in `start_demo.sh` output. |
| **2** | Connect **both phones** to the laptop hotspot. |
| **3** | In `vitaquest-backend/`, run: `bash start_demo.sh` — it prints the local IP. |
| **4** | If the IP differs from `192.168.1.5`, update `react expo/src/constants/verifyConfig.ts` → `DEMO_SERVER_ENDPOINT` and reload Expo Go. |
| **5** | Seed **Phone A** (thriving): call `seedPhoneA()` from the app → reload. |
| **6** | Seed **Phone B** (sick): call `seedPhoneB()` from the app → reload. |

---

## 🎤 5-Minute Demo Script

**Stage setup:** Presenter holds **Phone A**. Second team member holds **Phone B**. Both phones visible to judges at all times.

---

### [0:00 – 0:30] The Contrast — No Words Needed
Hold both phones up side by side.

> *"Same app. Two different people. One has been showing up every day — one hasn't. You can see it immediately."*

Phone A: thriving avatar, level 8, streak 12.
Phone B: sick avatar, level 3, streak 3, wilted islands.

---

### [0:30 – 1:15] The Living World
Presenter walks through **Phone A**:

> *"This is Mochi. Every habit you complete grows an island in her world. Miss a few days and the volcano erupts — she gets sick. Your lifestyle is literally visible."*

Navigate to the **World Map** on Phone A. Pan the islands.

---

### [1:15 – 2:00] The Problem with Other Habit Apps
Second team member shows **Phone B**:

> *"Most apps just ask you to tap a checkbox. Nobody actually checks. VitaQuest makes you prove it — with a photo, verified by AI — before your avatar gets the XP."*

---

### [2:00 – 3:00] Live Verification — Phone A
Presenter opens the gym habit verify flow on **Phone A**:

> *"I'll verify my workout right now. One photo."*

- Open camera → take photo
- Show the **"Your avatar is checking…"** animation (instant, no waiting)
- Result appears: ✅ **Gym verified · +50 XP**

> *"That request went to our FastAPI backend running on this laptop — ONNX inference on a quantized MobileCLIP model — in under 400ms."*

---

### [3:00 – 3:45] Friends Tab
Navigate to Friends on Phone A:

> *"You can see your friends' avatar health in real time. Not a step count — their actual state. That social pressure is the retention mechanism."*

---

### [3:45 – 4:30] Tech Stack (30 seconds, confident)

> *"React Native Expo frontend. FastAPI + ONNX Runtime backend. CLIP text embeddings as habit prototypes — adding a new habit is one .npy file. Full stack built in one hackathon."*

---

### [4:30 – 5:00] Close
Hold both phones up again — thriving vs sick.

> *"VitaQuest makes accountability something you feel, not something you track. Thank you."*

---

## 🌲 Fallback Plan

```
Server dies mid-demo?
    │
    └──► DON'T PANIC.
         Phone A (thriving) and Phone B (sick) are already seeded.
         The emotional contrast between the two avatars IS the demo.

         Skip the live verify step. Say:
         "The AI verification normally happens right here —
          the backend's on our laptop. Let me show you
          what the result looks like."
         
         Navigate to a pre-captured screenshot, or simply
         describe the flow while showing the avatar states.
         The judges will remember the side-by-side contrast, not the API call.
```

---

## ✅ Pre-Demo Checklist (5 items)

- [ ] `bash start_demo.sh` running in terminal — shows local IP
- [ ] Both phones on laptop hotspot and `verifyConfig.ts` IP matches
- [ ] Phone A seeded (`seedPhoneA`) — thriving avatar visible on home screen
- [ ] Phone B seeded (`seedPhoneB`) — sick avatar visible on home screen
- [ ] Camera permission granted on Phone A (open verify screen once, confirm camera loads)
