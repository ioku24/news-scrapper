# 📋 Task Plan (B.L.A.S.T. Protocol)

> **Current Phase:** `Phase 3 — Architect`  
> **Status:** 🟡 In Progress

---

## Phase 0: Protocol Initialization ✅

- [x] Create `gemini.md` (Project Constitution)
- [x] Create `task_plan.md` (This file)
- [x] Create `findings.md` (Research log)
- [x] Create `progress.md` (Activity log)
- [x] Define data schemas in `gemini.md`

---

## Phase 1: Blueprint ✅

- [x] Answer 5 discovery questions
- [x] Research RSS feed sources
- [x] Define input/output JSON schemas
- [x] Get blueprint approval from user

---

## Phase 2: Link (Connectivity) ✅

- [x] Verify Ben's Bites RSS feed
- [x] Verify TechCrunch AI RSS feed
- [x] Verify The Rundown AI RSS feed
- [x] Create Supabase tables (`articles`, `saved_articles`)
- [x] Configure RLS policies
- [x] Test feed parser → Supabase sync (60 articles ✅)
- [x] Test frontend → Supabase fetch ✅

---

## Phase 3: Architect (3-Layer Build) 🟡

### Layer 1: Architecture SOPs
- [x] `architecture/feed_parser_sop.md`
- [ ] `architecture/supabase_sync_sop.md`
- [ ] `architecture/frontend_app_sop.md`

### Layer 2: Navigation
- [x] Feed parser fetches and normalizes data
- [x] Frontend fetches from Supabase API

### Layer 3: Tools
- [x] `tools/fetch_feeds.py` — RSS parser + Supabase sync

---

## Phase 4: Stylize ✅

- [x] Apply JG brand guidelines (charcoal #3a3a3c)
- [x] Implement light mode design
- [x] Add premium animations and shadows
- [x] Card-based article layout
- [x] Filter navigation (All, New, Saved)

---

## Phase 5: Trigger (Deployment) ⏳

- [ ] Create `.env` file with Supabase credentials
- [ ] Set up 24h automation (cron or Edge Function)
- [ ] Finalize maintenance log in `gemini.md`
- [ ] Deploy to production hosting

---

## Future Enhancements

- [ ] Add user authentication
- [ ] Find Superhuman.ai RSS (if possible)
- [ ] Add Exploding Topics (no RSS available)
- [ ] Add Reddit AI subreddit
