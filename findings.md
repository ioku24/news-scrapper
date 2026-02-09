# 🔍 Findings

> Research discoveries, constraints, and external resources.

---

## Discovery Answers ✅

> Completed 2026-02-08

| Question | Answer |
|----------|--------|
| **North Star** | Beautiful, interactive dashboard displaying the latest AI/tech articles from newsletters |
| **Integrations** | Phase 1: RSS feeds. Phase 2: Supabase for persistence |
| **Source of Truth** | Newsletter RSS feeds (Ben's Bites, The Rundown AI, TechCrunch AI) |
| **Delivery Payload** | Interactive web dashboard with 24-hour auto-refresh |
| **Behavioral Rules** | Run every 24 hours, persist saved articles, premium JG-branded design |

### Detailed Requirements
- **Sources:**
  - Ben's Bites (AI newsletter)
  - The Rundown AI (AI newsletter)
  - TechCrunch AI (tech news)
  - Reddit (future phase)
  
- **Features:**
  - Display articles from last 24 hours
  - Save/bookmark articles (LocalStorage)
  - Auto-refresh every 24 hours
  - Filter by source, new, saved
  
- **Design:**
  - JG brand (Charcoal #3a3a3c)
  - Light mode, soft shadows
  - Clean cards, animations

---

## Source Research ✅

### Ben's Bites (Substack)
| Field | Value |
|-------|-------|
| **URL** | https://www.bensbites.com |
| **RSS Feed** | `https://www.bensbites.com/feed` |
| **Platform** | Substack |
| **Status** | ✅ Verified working |
| **Data Available** | title, description, link, pubDate, enclosure (image), content:encoded |

### The Rundown AI (Beehiiv)
| Field | Value |
|-------|-------|
| **URL** | https://www.rundown.ai |
| **RSS Feed** | `https://rss.beehiiv.com/feeds/2R3C6B...` (partial - needs verification) |
| **Platform** | Beehiiv |
| **Status** | ⏳ Feed URL needs manual discovery |
| **Notes** | Website is content-rich with guides, tools, workshops. Newsletter hosted on Beehiiv. |

### TechCrunch AI
| Field | Value |
|-------|-------|
| **URL** | https://techcrunch.com/category/artificial-intelligence/ |
| **RSS Feed** | `https://techcrunch.com/category/artificial-intelligence/feed/` |
| **Platform** | WordPress |
| **Status** | ✅ Verified working |
| **Data Available** | title, description, link, pubDate |

---

## Brand & Design Analysis ✅

### Logo
- **File:** `logo.png` (JG monogram)
- **Primary Color:** Charcoal #3a3a3c

### Design Inspiration
- Light mode with soft shadows
- Clean card-based UI
- Subtle gradient accents (pink/orange)
- Modern typography (Inter, Space Grotesk)

---

## Technical Approach

1. **Data Source:** RSS feeds (no web scraping needed)
2. **Parsing:** Python `feedparser` library
3. **Storage:** LocalStorage (Phase 1), Supabase (Phase 2)
4. **Frontend:** HTML/CSS/JS with premium design
5. **Refresh:** Every 24 hours

---

## Constraints & Limitations

- The Rundown AI RSS feed URL not yet confirmed
- VentureBeat AI feed has XML parsing errors
- Some feeds don't include thumbnail images

---

## Useful Resources

- [Feedspot AI RSS Feeds](https://www.feedspot.com/infiniterss.php?q=ai)
- [Beehiiv RSS Documentation](https://support.beehiiv.com)
