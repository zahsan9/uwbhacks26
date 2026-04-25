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

### 5. ~~Save habit log after photo verification~~ ✅ DONE

`verify.tsx` now has a real `handleComplete` that:
- Gets the current user from Supabase session
- Looks up the user's `habits` rows and matches `detected_habit` to `habit_id_key`
- Inserts into `habit_logs`: `{ habit_id, user_id, verified_by: 'photo'|'manual', confidence, xp_awarded: 50|25 }`
- Reads + updates `users.total_xp`
- Navigates to the home tab via `router.replace('/(tabs)')`
- `PhotoVerifyScreen` now accepts `habitIds` prop and passes it into `useHabitIdentification`
- Camera FAB in `index.tsx` passes active photo habit keys as route param `habitIds`

- [x] Open `react expo/app/verify.tsx`
- [x] Replace the `onComplete` stub with a real handler
- [x] Navigate to home tab after saving
- [x] Pass the detected habit name through to the route so `PhotoVerifyScreen` can use the user's actual active habits list when calling `identify()` — `habitIds` passed as route param from index.tsx

---

### 6. ~~Wire home screen to real data~~ ✅ DONE

- Created `react expo/lib/scoreEngine.ts`: `getHabitScore`, `getCompositeScore`, `getAvatarState`, `getHabitStreak`, `getOverallStreak`, `getLevel`, `getLevelXpCurrent`, `getDaySince`
- Home screen fetches `users` row (username, total_xp, created_at), all habits with per-habit scores/streaks, composite score, overall streak
- Avatar state, health score, streak, level/XP, username, day count — all real
- Habit list shows real habits with correct icons and computed states (not sampleHabits)
- Camera FAB passes real photo habit keys to /verify
- Profile screen also updated with real data (username, email, XP, streak, health)
- Shows ActivityIndicator spinner while loading

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

### 8. ~~Seed starter habits during onboarding~~ ✅ DONE

- "Begin quest" button now inserts all selected habits into the `habits` table
- Walking + Sleep are always seeded as HealthKit habits (`is_healthkit: true`) and are locked (not toggleable)
- `habit_id_key` values are correctly mapped to backend prototype names (`read` → `reading`, `meditate` → `meditation`, `steps` → `walk`)
- Existing habits are deleted first (idempotent — safe to re-run through onboarding)
- Button shows "Saving…" while inserting, shows an Alert on error

- [x] Open `react expo/src/Onboarding.tsx`
- [x] Insert habits rows for each selected habit
- [x] Walking and sleep locked and always inserted as HealthKit habits
- [x] After inserting habits, navigate to main tabs

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
