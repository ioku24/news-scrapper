# 🧠 Gemini.md — Project Constitution

> **Status:** `PHASE_2_COMPLETE`  
> **Last Updated:** 2026-02-08 T20:00

---

## 📋 Project Overview

| Field | Value |
|-------|-------|
| **Project Name** | AI News Dashboard |
| **North Star** | Beautiful, interactive dashboard displaying latest AI articles from newsletters |
| **Source of Truth** | RSS Feeds + Supabase Database |
| **Delivery Payload** | Web dashboard with cloud persistence (Supabase) |

---

## 📐 Data Schema

> ✅ **DEFINED:** Schemas confirmed and implemented.

### Input Schema (RSS Feed Item)
```json
{
  "title": "string - Article headline",
  "description": "string - Brief summary",
  "link": "string - Full article URL",
  "pubDate": "string - RFC 2822 date format",
  "enclosure": "string - Featured image URL",
  "source": "string - bens-bites | rundown-ai | techcrunch-ai"
}
```

### Output Schema (Database Article)
```json
{
  "id": "string - MD5 hash of URL (12 chars)",
  "title": "string - Article title",
  "summary": "string - Brief description (max 300 chars)",
  "url": "string - Full article URL",
  "thumbnail": "string - Image URL",
  "source": "string - Human-readable source name",
  "source_id": "string - Feed identifier",
  "source_icon": "string - Emoji icon",
  "published_at": "string - ISO 8601 timestamp",
  "is_new": "boolean - Published within last 24h"
}
```

---

## 🔒 Behavioral Rules

1. **24-Hour Window:** Display articles with `is_new` badge if published within 24h
2. **Cloud Persistence:** All articles stored in Supabase, saved bookmarks synced
3. **No Duplicates:** Deduplicate by URL hash before insert
4. **Graceful Fallback:** If Supabase fails, fall back to local `.tmp/articles.json`
5. **Premium Design:** JG brand (charcoal #3a3a3c), light mode, soft shadows

---

## 🏛️ Architectural Invariants

1. All API credentials stored in `.env`
2. Temporary files written to `.tmp/`
3. Tools are atomic, deterministic Python scripts
4. SOPs updated before code changes
5. **gemini.md is law**

---

## 🔗 Integrations

| Service | Status | Endpoint |
|---------|--------|----------|
| Ben's Bites RSS | ✅ Verified | `https://www.bensbites.com/feed` |
| TechCrunch AI | ✅ Verified | `https://techcrunch.com/category/artificial-intelligence/feed/` |
| The Rundown AI | ✅ Verified | `https://rss.beehiiv.com/feeds/2R3C6Bt5wj.xml` |
| Supabase DB | ✅ Connected | `wllrysfrygkmbjxfqwhd.supabase.co` |

---

## 📝 Maintenance Log

| Date | Change | Author |
|------|--------|--------|
| 2026-02-08 | Project initialized, Phase 0 complete | System Pilot |
| 2026-02-08 | Phase 1 complete - 2 feeds verified | System Pilot |
| 2026-02-08 | Phase 2 complete - Supabase integrated | System Pilot |
| 2026-02-08 | Added The Rundown AI (3rd source) | System Pilot |
