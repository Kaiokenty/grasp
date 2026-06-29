# GRASP — AI-Powered Voice-First Note & Task Organizer

## Vision

GRASP is a mobile-first note-taking and task-tracking app that removes friction from organization. Users dump ideas via voice or text; the AI categorizes, prioritizes, and surfaces actionable tasks with smart reminders. For people who think faster than they can organize, GRASP is the external brain that keeps up.

---

## Target User & Problem

**User:** Busy professionals, creatives, and multi-taskers who don't have time to manually organize notes and tasks. They think by talking.

**Problem:** Capture is easy (phone always nearby), but organizing, categorizing, and acting on captured ideas is tedious and gets deferred. Manual tagging, sorting, and priority-setting create friction that prevents ideas from becoming action.

**Solution:** Voice/text dump → AI does the heavy lifting (categorization, urgency assessment, task extraction) → user sees organized, actionable results → reminders keep them on track.

---

## MVP Scope (v1 — Web)

### Features

1. **Voice & Text Input**
   - Record voice note or type text
   - Transcribe voice to text (Google Speech-to-Text API or Whisper)
   - Store raw input

2. **AI Organization**
   - Pass transcribed text to LLM (Claude)
   - Extract: category (Work, Personal, Shopping, etc.), urgency (High/Medium/Low), actionable tasks, any groupable items
   - Store structured metadata

3. **Task View**
   - List of organized notes with category, urgency, extracted tasks
   - Ability to edit categorization if AI got it wrong
   - Mark tasks complete (checkbox)

4. **Reminders & Notifications**
   - Set deadline for tasks (optional)
   - Web browser notifications when task is due or overdue
   - In-app reminder history

5. **Search & Filter**
   - Filter by category, urgency, completion status
   - Basic search by text

### Out of Scope for v1

- Advanced grouping/deduplication of similar notes
- Actionability extraction (converting voice rambling into crisp next-steps)
- Offline voice transcription (web requires network anyway)
- Android app (see migration plan below)
- Collaboration/sharing

---

## Technical Architecture (Web MVP)

### Stack

- **Frontend:** React (web-first, porting to React Native for Android after validation)
- **Backend:** Node.js + Express
- **Database:** PostgreSQL (persistent storage for notes, tasks, user data)
- **Voice Transcription:** OpenAI Whisper API (~$0.006/min; 2.7x cheaper than Google Cloud, same quality, portable)
- **LLM Integration:** Claude Haiku 4.5 with prompt caching (cost-effective, proven reliability, ~$0.026/month effective cost with caching)
- **Hosting:** Vercel (frontend), Railway or Render (backend)
- **Auth:** Email/password (v1); OAuth in v1.1 if needed

### Data Model (Rough)

```
User
  ├─ id
  ├─ email
  └─ created_at

Note
  ├─ id
  ├─ user_id
  ├─ raw_text (transcribed or typed)
  ├─ category (extracted by AI)
  ├─ urgency (High/Medium/Low)
  ├─ extracted_tasks (JSON array)
  ├─ is_complete
  ├─ created_at
  └─ updated_at

Task
  ├─ id
  ├─ note_id
  ├─ description
  ├─ deadline (optional)
  ├─ is_complete
  └─ created_at
```

### AI Organization Flow

1. User records voice or types text → stored as `raw_text`
2. If voice: transcribe via Whisper API
3. Send to Claude Haiku 4.5 with cached prompt:
   ```
   [SYSTEM PROMPT — CACHED]
   You are a note organizer. Extract:
   - Category (Work/Personal/Shopping/Health/Ideas/Other)
   - Urgency (High/Medium/Low)
   - List of actionable tasks (if any)
   
   Return valid JSON only.
   
   [USER INPUT]
   {raw_text}
   ```
4. Parse response JSON, store extracted metadata
5. Surface categorized note in UI with edit option
6. Prompt caching reduces effective LLM cost to ~$0.026/month (90% cache discount on repeated system prompt)

---

## Voice Transcription Strategy

### v1: OpenAI Whisper API

**Why:** Cost-effective (~$0.006/min vs. Google's $0.016/min), proven quality, portable (can self-host later if needed).

**Trade-off:** Requires internet connection. Not ideal for offline, but web MVP requires network anyway. API dependency on OpenAI.

**Estimated cost (10 notes/day, 3 min avg):** ~$5.40/month

**Implementation:**
- Record audio in browser (Web Audio API)
- Send to backend
- Backend calls OpenAI Whisper API
- Return transcript to frontend

### v1.1/v2: Self-Hosted Whisper (Optional)

**When:** After MVP validation, if costs grow or offline capability becomes critical.

**Why:** No per-minute API cost, full control, can handle higher volume without cost scaling.

**How:** Download Whisper model, run on backend with GPU acceleration (or CPU with latency tradeoff).

---

## Android Migration Plan (Post-MVP)

### Timeline

1. **Q4 2026:** Web MVP validates concept with beta users
2. **Q1 2027:** Incorporate feedback, stabilize web API
3. **Q2 2027:** Port to Android (leverage existing backend, rebuild frontend)

### Android Build Path

- **Frontend:** React Native (shares code with web, faster porting)
- **Or:** Kotlin + Jetpack Compose (native, better performance)
- **Voice input:** Android native APIs (easier than web)
- **Sync:** Same backend API, seamless data sync

### Why This Order?

- Web is faster to ship (no app store review, instant updates)
- Proves AI organization logic works before investing in Android native code
- Backend is identical for web and Android (less duplicated work)
- Early user feedback shapes Android feature prioritization

---

## Timeline & Milestones

| Milestone | Target | What's Done |
|-----------|--------|------------|
| **Research & Setup** | Oct 2026 (1 month) | Backend scaffolding, LLM integration, speech-to-text API keys, database schema |
| **Web MVP** | Dec 2026 (2 months) | Voice/text input, AI categorization, reminders, basic task UI |
| **Beta Launch** | Jan 2027 (1 month) | 10–20 beta users, collect feedback, fix bugs |
| **Polish & Iterate** | Feb 2027 (1 month) | User feedback incorporated, edge cases fixed, onboarding flow |
| **Android Port** | Apr 2027 (2 months) | React Native or Kotlin build, testing, app store submission |
| **Production Launch** | Q2 2027 (Jun) | Full release, monitored rollout |

---

## Validation & Success Metrics

### v1 Success = Users find value in AI organization

**Metrics to track:**

- **Daily Active Users (DAU):** Users creating ≥1 note per day
- **Capture velocity:** Avg notes per user per day
- **Engagement:** % of captured notes that are organized (categorized) and acted on
- **Task completion rate:** % of extracted tasks marked complete
- **Reminder adoption:** % of tasks with deadlines; reminder click-through rate
- **Retention:** % of users active 1 week, 1 month after signup
- **User feedback:** NPS, interviews on pain points and delights

### Validation Plan

1. **Personal dogfooding:** Use Grasp for your own notes for 4 weeks. Does it stick?
2. **Beta cohort:** 10–20 early users (friends, target users, etc.)
3. **Weekly check-ins:** Ask what worked, what broke, what surprised them
4. **Pivot decision:** If <50% of extracted tasks are acted on, rethink AI categorization logic

---

## Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|-----------|
| **AI categorization is wrong or low-confidence** | Users don't trust the AI, adoption stalls | Start with simple categories (3–5). Test with beta users early. Manual override always available. |
| **Voice transcription latency/errors** | Frustration with capture experience | Use Google Speech-to-Text (proven). Test with common accents/speech patterns. Offer text fallback. |
| **Burnout from learning Android + AI + web** | Incomplete MVP, exhaustion | Ship web first (simpler stack). Take 3-month sprints, not continuous push. |
| **User churn after capture (they don't return)** | Low retention, product never proves value | Aggressive reminders. Push notifications. Email digest of upcoming tasks. |
| **LLM costs scale badly** | Unexpected AWS/API bill | Monitor usage early. Set hard limits. Cache common prompts. Consider batch processing. |
| **Scope creep (beta users want X, Y, Z)** | Miss deadline, ship half-baked | Have a clear v1 boundary. Say "v1.1" to feature requests. |

---

## Not in This Doc (Future)

- Monetization strategy (freemium? Subscription? When?)
- Offline sync architecture (for Android port)
- Analytics & crash reporting setup
- Security model (encryption, data privacy)
- Collaboration/sharing features
- Export/integration (Todoist, Slack, etc.)

These are v1.1 or v2 decisions. Focus on proving the core value first.

---

## Implementation Plan (Detailed)

### Week 1: Foundation & API Setup

**Backend Scaffolding**
- [ ] Initialize Node.js + Express project
- [ ] Set up PostgreSQL connection pool
- [ ] Schema: `users`, `notes`, `tasks` (see Data Model section)
- [ ] Initialize git repo, CI/CD skeleton (GitHub Actions)

**API Keys & Authentication**
- [ ] Generate OpenAI API key (for Whisper + Claude models)
- [ ] Generate Anthropic API key (Claude Haiku 4.5)
- [ ] Set up `.env` for secrets; add to `.gitignore`
- [ ] Test Whisper API with sample audio file
- [ ] Test Claude Haiku API with sample categorization prompt

**Auth Infrastructure**
- [ ] Email/password signup endpoint
- [ ] Login endpoint with JWT tokens
- [ ] Middleware to protect routes

**Frontend Setup**
- [ ] Initialize React app (Vite or Create React App)
- [ ] Set up routing (react-router)
- [ ] Basic layout: header, sidebar, main content area

---

### Week 2–3: Voice Capture & Transcription

**Frontend: Voice Recording**
- [ ] Web Audio API recorder (record → WAV/MP3)
- [ ] Play back recorded audio before submit
- [ ] UI: "Record" button, timer, "Submit" button
- [ ] Fallback text input for accessibility

**Backend: Transcription Pipeline**
- [ ] POST `/api/notes/transcribe` endpoint
- [ ] Accept audio file (multipart/form-data)
- [ ] Call Whisper API, handle retries
- [ ] Store raw transcript in `notes.raw_text`
- [ ] Return transcript to frontend

**Frontend: Display Transcript**
- [ ] Show transcribed text to user
- [ ] "Sounds good?" confirmation before organizing
- [ ] Allow user to edit transcript before sending to AI

**Testing**
- [ ] Record 5–10 test notes with different audio quality
- [ ] Verify transcription accuracy
- [ ] Check latency (should be <5s for 2-min audio)

---

### Week 4–6: AI Categorization & Task Extraction

**Backend: Claude Integration**
- [ ] Initialize Claude Haiku 4.5 client with prompt caching
- [ ] System prompt (cached, stable):
  ```
  You are a note organizer. Extract from the user's note:
  - Category: one of [Work, Personal, Shopping, Health, Ideas, Other]
  - Urgency: one of [High, Medium, Low]
  - Tasks: array of actionable items (strings, or empty array)
  
  Return valid JSON ONLY: {"category": "...", "urgency": "...", "tasks": [...]}
  ```
- [ ] POST `/api/notes/organize` endpoint
- [ ] Accept `raw_text`, call Claude with cached prompt
- [ ] Parse JSON response, validate schema
- [ ] Store in `notes.category`, `notes.urgency`, `notes.extracted_tasks`

**Frontend: Display Organized Note**
- [ ] Show category, urgency, extracted tasks
- [ ] Allow manual overrides (user can change category, add/remove tasks)
- [ ] Save edited note back to backend

**Database & Data Storage**
- [ ] Create `tasks` table from extracted tasks
- [ ] Link tasks to notes via `note_id`
- [ ] Implement soft-delete for tasks (is_deleted flag)

**Testing**
- [ ] Test 20 diverse notes (ambiguous, multi-category, simple)
- [ ] Verify JSON parsing robustness
- [ ] Check for parsing errors; log malformed responses
- [ ] Measure latency (should be 2–8s for categorization)

---

### Week 7–8: Task View, Filtering & Reminders

**Frontend: Task Dashboard**
- [ ] List all notes with category, urgency badges
- [ ] Filter by: category, urgency, completion status
- [ ] Search by text (basic substring match for now)
- [ ] Mark tasks complete (checkbox, visual feedback)
- [ ] Delete/archive notes

**Backend: Filter & Search**
- [ ] GET `/api/notes` with query params: `?category=Work&urgency=High&status=incomplete`
- [ ] GET `/api/notes?search=call%20sarah`
- [ ] Pagination for long lists (limit 50 per page)

**Reminders & Notifications**
- [ ] Optional deadline field on tasks (datetime picker)
- [ ] Background job: check for due/overdue tasks every 5 min
- [ ] Web notification when task is due (Notification API)
- [ ] In-app notification history (list of fired reminders)

**Polish UI**
- [ ] Mobile-responsive design
- [ ] Dark mode (optional, nice-to-have)
- [ ] Onboarding flow: "Welcome to GRASP, record your first note"
- [ ] Error states: "Network error", "Transcription failed", "Try again"

---

### Week 9: Beta Launch & Monitoring

**Deployment**
- [ ] Deploy frontend to Vercel
- [ ] Deploy backend to Railway/Render
- [ ] Set up error logging (Sentry or similar)
- [ ] Monitor API usage (OpenAI/Anthropic dashboards)

**Beta Testing**
- [ ] Personal dogfooding for 1 week (use GRASP for your own notes)
- [ ] Invite 10–20 beta users
- [ ] Collect feedback via survey or weekly check-in
- [ ] Track: daily active users, notes/user/day, task completion rate

**Iteration**
- [ ] Fix critical bugs weekly
- [ ] Adjust categorization prompt based on failures
- [ ] Add requested features if quick wins (v1.1 candidates)

---

## API Contracts (Reference)

### Authentication
```
POST /api/auth/signup
body: { email, password }
response: { userId, token }

POST /api/auth/login
body: { email, password }
response: { userId, token }
```

### Notes
```
POST /api/notes/transcribe
headers: { Authorization: Bearer <token> }
body: FormData { audio: File }
response: { transcript: string }

POST /api/notes/organize
headers: { Authorization: Bearer <token> }
body: { raw_text: string }
response: { category, urgency, tasks: [...], note_id }

GET /api/notes?category=Work&urgency=High&search=...
response: { notes: [...], total: N, page: 1 }

PATCH /api/notes/:id
body: { category?, urgency?, is_complete? }
response: { note: {...} }
```

---

## Next Steps

1. **Review this plan** — does the sequence make sense? Any blockers?
2. **Create GitHub project** — track tasks with issues/PRs
3. **Set up development environment** — Node, PostgreSQL, Vercel CLI
4. **Start Week 1** — scaffold backend and auth

Ready to build.
