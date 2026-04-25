# VitaQuest — Implementation TODO

Model file confirmed present at `vitaquest-backend/models/mobileclip_image_quantized.onnx`.  
Prototypes confirmed present: cooking, gym, meditation, reading, running.  
Backend `/verify` endpoint is fully complete. CORS is done.

Items are ordered by demo-day priority. P0 must work. P1 makes it compelling. P2 is polish.

---

## P0 — App breaks without these

---

### 1. ~~Add CORS middleware to backend~~ ✅ DONE

- `CORSMiddleware` added to `vitaquest-backend/main.py` with `allow_origins=["*"]`

---

### 2. Fix server IP in frontend config — ⚠️ DEMO DAY ACTION REQUIRED

All 5 habits confirmed present in `HABIT_DISPLAY_NAME`. IP must be updated on demo day.

- [ ] Update `DEMO_SERVER_ENDPOINT` in `react expo/src/constants/verifyConfig.ts` to match IP printed by `start_demo.sh`
- [ ] Test the full round-trip: open camera, take a photo, confirm result comes back

---

### 3. ~~Set up Supabase project and run schema~~ ✅ DONE

- Supabase project live at `sfgkcrbasdqqoegbystu.supabase.co`
- All tables created with RLS: `users`, `habits`, `habit_logs`, `friendships`, `nudges`
- `react expo/lib/supabase.ts` created, credentials in `react expo/.env`
- Connection verified (`users` table returns count with no error)

---

### 4. ~~Implement Google OAuth sign-in~~ ✅ DONE

- Google Web OAuth client created, client ID + secret in Supabase Auth → Providers → Google
- `Onboarding.tsx` Google button triggers real OAuth via `WebBrowser.openAuthSessionAsync` (implicit flow)
- New users auto-inserted into `users` table on first sign-in
- Session persists via AsyncStorage; `_layout.tsx` skips onboarding if valid session exists
- Logout in `profile.tsx` calls `supabase.auth.signOut()` + clears AsyncStorage
- Use `npx expo start --tunnel` on demo day if phone and laptop are on different networks

---

### 5. Save habit log after photo verification

`verify.tsx` `onComplete` currently just calls `console.log`. The photo verification works end-to-end but nothing gets written. This is the most critical feature gap.

- [ ] Open `react expo/app/verify.tsx`
- [ ] Replace the `onComplete` stub with a real handler:
  - Get the current user ID from Supabase session
  - Look up the user's active habits from the `habits` table
  - Match the `detected_habit` ID returned from the backend to the user's habit rows
  - Insert a row into `habit_logs`: `{ habit_id, user_id, verified_by: 'photo', confidence: Math.round(confidence * 100), xp_awarded: 50 }`
  - If verified is null (ambiguous and user confirmed manually): set `verified_by: 'manual'` and `xp_awarded: 25`
  - After insert, update `users.total_xp` by adding the awarded XP (use a Supabase RPC or read-then-write)
- [ ] Navigate to home tab after saving, not just `router.back()`
- [ ] Pass the detected habit name through to the route so `PhotoVerifyScreen` can use the user's actual active habits list when calling `identify()` — currently `identify()` is called without `habitIds` so it scans all 5 prototypes; it should only scan the habits the user has set up

---

### 6. Wire home screen to real data

The home screen shows hardcoded "Hi, Zainab", Day 12, 78/100, streak 12. None of it is real.

- [ ] Create `react expo/lib/scoreEngine.ts` implementing the score logic from the PRD:
  ```typescript
  // Get logs for one habit for the last 3 days
  async function getHabitScore(habitId: string, userId: string): Promise<number>
  // Average across all user habits
  async function getCompositeScore(userId: string): Promise<number>
  // Map score to avatar state
  function getAvatarState(score: number): AvatarState
  ```
  - Query `habit_logs` for logs in the last 3 days grouped by habit
  - Walking and sleep habits: check for a log that day (HealthKit will insert these)
  - Photo habits: check `habit_logs` with `verified_by` in ('photo', 'manual')
- [ ] Open `react expo/app/(tabs)/index.tsx`
- [ ] On mount, fetch from Supabase:
  - `users` row for the current user (username, total_xp, avatar_id)
  - User's active habits from `habits` table
  - Call `getCompositeScore()` to get the real health score
  - Call `getAvatarState()` to get the correct blob state
  - Calculate streak: count consecutive days where at least one habit was logged
- [ ] Replace hardcoded `AVATAR_STATE = 'healthy'` with computed state
- [ ] Replace hardcoded "Hi, Zainab" with real username
- [ ] Replace hardcoded "Day 12" with days since account creation
- [ ] Replace hardcoded "78/100" with computed composite score
- [ ] Replace hardcoded streak "12 🔥" with computed streak
- [ ] Replace hardcoded "Lv 4 / 320 of 440 xp" with computed values from `total_xp` using `getLevel()` and `getLevelProgress()` from PRD
- [ ] Replace `sampleHabits` import with real habits fetched from Supabase — each with their computed state from `getHabitScore()`

---

## P1 — Demo feels real without these

---

### 7. Implement HealthKit step and sleep reading

Steps and sleep are the two auto-tracked habits. Without this, the walking island and sleep island never get any data and their avatars stay static.

- [ ] Confirm `react-native-health` is in `package.json` — if not, run `npm install react-native-health`
- [ ] Create `react expo/lib/healthkit.ts`:
  - `requestHealthKitPermissions()` — request read access for steps and sleep
  - `getTodaySteps()` — query `HKQuantityTypeIdentifierStepCount` for today, return total
  - `getLastNightSleep()` — query `HKCategoryTypeIdentifierSleepAnalysis` for last night, return hours as number
- [ ] Open `react expo/src/Onboarding.tsx` — find the `HealthScreen` "Allow" button handler
- [ ] Replace stub with `requestHealthKitPermissions()` call — on success advance to screen 2
- [ ] Create a background sync function `syncHealthKitToSupabase(userId)`:
  - Call `getTodaySteps()` and `getLastNightSleep()`
  - Look up the user's walking habit row in `habits` (where `is_healthkit = true` and `healthkit_type = 'steps'`)
  - If today's step count exceeds 8000, check if there's already a log today — if not, insert a `habit_logs` row with `verified_by: 'healthkit'`, `xp_awarded: 30`
  - Do the same for sleep: if last night ≥ 7 hours, log the sleep habit
- [ ] Call `syncHealthKitToSupabase()` on app foreground (in `_layout.tsx` using `AppState` listener)
- [ ] Seed the user's habits table with walking and sleep entries on onboarding completion:
  - `{ name: 'Walking', is_healthkit: true, healthkit_type: 'steps', habit_id_key: 'walk' }`
  - `{ name: 'Sleep', is_healthkit: true, healthkit_type: 'sleep', habit_id_key: 'sleep' }`

---

### 8. Seed starter habits during onboarding

The habits screen in onboarding lets users pick habits but never saves them. The app has no idea what habits the user has.

- [ ] Open `react expo/src/Onboarding.tsx` — find the `HabitsScreen` "Begin quest" button handler
- [ ] On press, for each selected habit:
  - Insert a row into `habits` table with `{ user_id, name, habit_id_key, is_healthkit: false, tier: 1 }`
  - Walking and sleep are always inserted as HealthKit habits regardless of selection
- [ ] Walking and sleep should be pre-inserted and locked (PRD says "Auto-tracked" badge, locked) — don't allow deselecting them
- [ ] After inserting habits, navigate to the main tabs

---

### 9. Wire map screen to real habit data

The world map shows hardcoded island states (walk=thriving, sleep=healthy, screen=sick). Island states should come from real habit scores.

- [ ] Open `react expo/app/map.tsx`
- [ ] On mount, fetch the user's habits and compute per-habit scores using `getHabitScore()`
- [ ] Map `habit_id_key` values to island types (walk → 'walk', sleep → 'sleep', gym/running/etc → 'screen' island or whichever island they're assigned)
- [ ] Pass the computed states into the island components and the `IslandDetail` overlay
- [ ] In `IslandDetail`, replace hardcoded stat values (e.g. "8,240 steps today") with real values:
  - For walk island: call `getTodaySteps()` and display the result
  - For sleep island: call `getLastNightSleep()` and display the result
  - For photo habits: show count of logs this week
- [ ] Replace the hardcoded 30-day habit grid with real data — query `habit_logs` for the last 30 days and mark days as hit/missed

---

### 10. Fix photo verify route to pass active habits

Currently the camera button on the home screen goes to `/verify` which calls `identify()` with no `habitIds` filter — the backend scans all 5 prototypes. It should only scan the user's actual photo habits.

- [ ] When navigating to `/verify` from the camera FAB in `index.tsx`, pass the user's active photo habit keys as route params
- [ ] In `verify.tsx`, read those params and pass them into `PhotoVerifyScreen`
- [ ] Update `PhotoVerifyScreen` props to accept `habitIds?: string[]`
- [ ] Pass `habitIds` into the `useHabitIdentification(habitIds)` call — the hook already supports this parameter

---

## P2 — Polish and extra features

---

### 11. Friends — nudge and visit with real data

Friends screen is fully built as UI with 5 hardcoded friends. The nudge button toggles state locally only.

- [ ] Add a `search users` flow — input field to find users by username and send a friend request
- [ ] On app load, fetch the user's confirmed friendships from Supabase:
  - Query `friendships` where `(requester_id = userId OR addressee_id = userId) AND status = 'pending'` for pending requests
  - Query for `status = 'accepted'` for the friends list
- [ ] For each friend, fetch their `users` row (avatar_id, total_xp) and compute their composite score to show their avatar state on the card
- [ ] Implement nudge:
  - On "Nudge" button press, insert a row in `nudges` table
  - Check nudge was not sent in last 24 hours (query `nudges` where `sender_id` and `receiver_id` and `sent_at > now() - interval '24 hours'`)
  - Disable button for 24 hours if already nudged (store timestamp in AsyncStorage as local fallback)
  - Use Supabase Realtime to subscribe on the receiver's device and show a toast when a nudge arrives
- [ ] "Visit" button: navigate to a read-only version of the map screen, passing the friend's userId as a param — fetch and display their island states

---

### 12. ElevenLabs companion voice

The PRD calls for an emotionally reactive companion voice. Not critical for demo but memorable.

- [ ] Sign up for ElevenLabs and get an API key
- [ ] Create `react expo/lib/elevenlabs.ts`:
  - `speakLine(text: string)` — POST to ElevenLabs `/v1/text-to-speech/{voice_id}` with the line, play audio with `expo-av`
- [ ] Pick one voice ID that fits the avatar character
- [ ] Trigger voice lines on key moments:
  - On app open when avatar is critical: e.g. "I really miss going on walks with you..."
  - On successful habit verification: e.g. "You actually did it. I'm so proud."
  - On 7-day streak reached: special line
- [ ] Add `expo-av` if not present: `npm install expo-av`
- [ ] Keep this behind a feature flag (`ELEVENLABS_ENABLED = true/false` in a config) so it can be disabled if the API is slow on demo day

---

### 13. Pre-seed demo accounts for demo day

Both demo phones need to show compelling avatar states without relying on the live verification working perfectly.

- [ ] Create a seed script `vitaquest-backend/seed_demo.py` (or run SQL directly):
  - Phone A account: username "Zainab", avatar in thriving state
    - Insert user row
    - Insert walking and sleep habits plus one photo habit (gym)
    - Insert 7 days of `habit_logs` for all 3 habits — all completed — so composite score is 100
  - Phone B account: username "Flop", avatar in critical state
    - Insert user row
    - Insert same habits
    - Insert 0 logs for the last 3 days so composite score is 0
- [ ] Set up a friendship between Phone A and Phone B accounts (insert a row in `friendships` with status='accepted')
- [ ] Confirm Phone A shows thriving avatar and Phone B shows critical avatar before heading to the venue
- [ ] Write down both account credentials somewhere accessible on demo day

---

### 14. Demo day network and server checklist

- [ ] Update `DEMO_SERVER_ENDPOINT` in `verifyConfig.ts` with the IP from `start_demo.sh` after connecting to hotspot
- [ ] Confirm `vitaquest-backend/models/mobileclip_image_quantized.onnx` is present (it is locally — do not delete)
- [ ] Confirm all 5 prototype files are in `vitaquest-backend/prototypes/` (cooking, gym, meditation, reading, running — all confirmed present)
- [ ] Run `bash start_demo.sh` from inside `vitaquest-backend/` — confirm it prints the laptop IP and the server starts
- [ ] Hit `http://<IP>:8000/healthz` from a phone browser on the hotspot — should return `{"status":"ok"}`
- [ ] Do one full verification test — take a photo, confirm the response comes back within 3 seconds
- [ ] Record a 30-second backup video of the happy path in case the server goes down mid-demo

---

## What is already complete (do not re-implement)

- `vitaquest-backend/main.py` — full `/verify` endpoint with blind habit detection, thresholds, ONNX inference
- `vitaquest-backend/generate_prototypes_images.py` — image-based prototype generation (use this one, not the text-based one)
- `vitaquest-backend/export_onnx.py` — ONNX export script
- `vitaquest-backend/start_demo.sh` — demo startup with IP detection
- `vitaquest-backend/models/mobileclip_image_quantized.onnx` — model file present locally
- `vitaquest-backend/prototypes/*.npy` — all 5 prototype files present locally (cooking, gym, meditation, reading, running)
- All frontend screens and animations (map, onboarding, friends, profile, home, island)
- `PhotoVerifyScreen.tsx` — full camera + analysis + result UI
- `useHabitVerification.ts` — image resize + POST to backend + response parsing
- `Blob.tsx`, `Island.tsx`, `PixelGrid.tsx` — all avatar and island art
- Full component library and theme system
