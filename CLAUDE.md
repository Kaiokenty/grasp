# CLAUDE.md — Coding Rules for GRASP

This document defines behavioral rules for Claude when developing GRASP. Follow these strictly.

---

## Core Principles

### 1. Think Before Coding
- State all assumptions explicitly before implementing
- Identify trade-offs (speed vs. accuracy, cost vs. latency, simplicity vs. flexibility)
- Ask clarifying questions when task scope is ambiguous
- Never silently guess on design decisions

### 2. Minimal Solution Only
- Build exactly what the task requires—no speculative features
- Avoid abstractions for hypothetical future use
- If it feels over-engineered, simplify it
- Three duplicate lines is better than a premature helper function

### 3. Surgical Changes
- Change only what is necessary for the task
- Do not refactor adjacent code unless explicitly asked
- Match existing style exactly
- Do not "clean up" unrelated files

### 4. Read Before Writing
- Inspect nearby implementations, exports, call sites before adding code
- Do not duplicate existing functionality
- Check for shared utilities or patterns in the codebase
- Search for similar code before writing new code

### 5. Tests Validate Intent
- Tests must verify business logic, not just "something happened"
- For GRASP: test the end-to-end flow (voice → transcription → categorization → storage)
- If a bug breaks logic, tests must fail clearly
- Mock external APIs (Whisper, Claude) when testing local logic

---

## GRASP-Specific Rules

### 6. Prompt Caching Is Immutable in v1
- The Claude system prompt (for categorization) is cached and expensive to change
- **Changes to the prompt require:**
  - Revalidation against 20+ test notes
  - Documentation of why the change was needed
  - User notification if it affects category/urgency mappings
- Do not tweak prompts on a whim; validate thoroughly first

### 7. JSON Parsing From LLMs Is Failure-Prone
- Claude Haiku returns JSON for categorization, but parsing can fail
- **Always validate:**
  - Response is valid JSON (use `JSON.parse()` with try-catch)
  - Required fields exist: `category`, `urgency`, `tasks`
  - `category` is one of: `Work`, `Personal`, `Shopping`, `Health`, `Ideas`, `Other`
  - `urgency` is one of: `High`, `Medium`, `Low`
  - `tasks` is an array of strings
- Log all parsing errors; never silently skip
- Return a user-facing error: "Couldn't organize this note. Try again or edit manually."

### 8. API Costs Are Real
- Whisper: ~$0.006/min; monitor monthly usage
- Claude Haiku: ~$0.026/month (with caching); track token counts
- Set up cost alerts before shipping (e.g., notify if Whisper usage spikes 5x)
- Batch processing in v1.1+ if volume grows
- Never add new AI calls without estimating monthly impact

### 9. Category/Urgency Enums Have One Source of Truth
- Define enums in: `backend/src/constants/categories.ts`
  ```ts
  export const CATEGORIES = ['Work', 'Personal', 'Shopping', 'Health', 'Ideas', 'Other'] as const;
  export const URGENCIES = ['High', 'Medium', 'Low'] as const;
  export type Category = typeof CATEGORIES[number];
  export type Urgency = typeof URGENCIES[number];
  ```
- Use these in:
  - Database schema (CHECK constraints)
  - Frontend dropdowns
  - Claude prompt validation
  - API request/response schemas
- Do not hardcode strings like `'Work'` elsewhere

### 10. External API Failures Must Be Handled Gracefully
- Whisper API timeout → fallback to text input, user sees: "Recording failed. Try typing instead."
- Claude API rate limit → queue the note, retry in 60s, notify user after 3 retries
- Network offline → local queue, sync when online (v1.1 feature)
- Log all API errors with: timestamp, API, error code, user_id (for debugging)

### 11. Mobile-Responsive Design From Day 1
- Record button, input field, task list must work on iPhone 12 and up
- Test on 375px viewport width minimum
- No horizontal scroll; touch-friendly (min 44px tap targets)
- React: use responsive grid/flexbox; avoid fixed widths

### 12. Database Changes Require Migration Scripts
- Schema change? Create a migration file: `migrations/001_create_notes_table.sql`
- Never run `ALTER TABLE` by hand; version control all changes
- Include rollback logic in migration
- Test migrations against a copy of prod schema before deployment

### 13. End-to-End Flow Is the North Star
- Success = voice recording → transcribed → categorized → visible in dashboard → testable
- When adding a feature, verify the full flow works first
- Do not merge partial implementations
- If unsure about a step, test it manually before committing

### 14. Fail Loudly
- If parsing fails, categorization fails, or transcription times out, **surface the error clearly**
- Never silently fall back to defaults or skip steps
- User sees: error message + "retry" or "edit manually" option
- Developer sees: full error log with context
- "Done" is invalid if any step was skipped or uncertain

---

## Code Conventions

### Style
- Follow existing patterns in the codebase
- Node.js: use async/await, not callbacks; use `const` not `var`
- React: functional components + hooks only; no class components
- TypeScript: strict mode; no `any` unless unavoidable
- SQL: uppercase keywords (SELECT, WHERE); semicolons at end

### Error Handling
- Every API call wrapped in try-catch
- Every Promise includes `.catch()` or error boundary
- Log errors with context: `logger.error('Whisper transcription failed', { userId, audioSize, error })`

### Comments
- No comments stating what code does (code should be clear)
- Only comment the WHY: edge cases, non-obvious constraints, workarounds
- Document prompt changes: "Changed urgency from 4-level to 3-level per user feedback (Jan 2027)"

### Testing
- Unit tests for: JSON parsing, category validation, urgency mapping
- Integration tests for: voice upload → transcription → categorization → storage
- Do not test external APIs directly; mock them
- Aim for >80% coverage on core logic paths

---

## When in Doubt

1. Check GRASP.md for context and decisions already made
2. Ask one clarifying question rather than guessing
3. Implement the simplest version that passes the test
4. If blocking other work, surface the blocker explicitly
5. Prefer failing fast over silently partial success

---

## Release Discipline

- Before merging to `main`: verify end-to-end flow works
- Before deploying to production: test with a real audio sample
- Monitor first 24h: watch for parsing errors, API rate limits, cost spikes
- If a bug emerges post-ship, rollback is faster than patch
