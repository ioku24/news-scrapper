#!/usr/bin/env python3
"""
Modal Scheduled Scraper
Runs the feed parser every 24 hours on Modal's infrastructure.
"""

import modal

# Create the Modal app
app = modal.App("ai-news-scraper")

# Define the image with dependencies
image = modal.Image.debian_slim(python_version="3.11").pip_install(
    "feedparser",
    "requests",
)

# Supabase Configuration
SUPABASE_URL = "https://wllrysfrygkmbjxfqwhd.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsbHJ5c2ZyeWdrbWJqeGZxd2hkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1ODkxOTcsImV4cCI6MjA4NjE2NTE5N30.s5Frbz_NybxB8Ow4F7JOK9YjhB6psi75a_xNMXNx24o"

# Feed Configuration
FEEDS = {
    "bens-bites": {
        "url": "https://www.bensbites.com/feed",
        "name": "Ben's Bites",
        "icon": "🍪",
    },
    "techcrunch-ai": {
        "url": "https://techcrunch.com/category/artificial-intelligence/feed/",
        "name": "TechCrunch AI",
        "icon": "💚",
    },
    "rundown-ai": {
        "url": "https://rss.beehiiv.com/feeds/2R3C6Bt5wj.xml",
        "name": "The Rundown AI",
        "icon": "🏃",
    },
}


@app.function(image=image, schedule=modal.Cron("0 8 * * *"))  # Runs daily at 8 AM UTC
def fetch_and_sync_feeds():
    """
    Scheduled function that runs every 24 hours.
    Fetches RSS feeds and syncs to Supabase.
    """
    import feedparser
    import hashlib
    import html
    import re
    import requests
    from datetime import datetime, timedelta, timezone

    def generate_id(url: str) -> str:
        return hashlib.md5(url.encode()).hexdigest()[:12]

    def clean_html(text: str) -> str:
        if not text:
            return ""
        text = html.unescape(text)
        text = re.sub(r'<[^>]+>', '', text)
        text = re.sub(r'\s+', ' ', text).strip()
        return text

    def parse_date(entry) -> str:
        try:
            if hasattr(entry, 'published_parsed') and entry.published_parsed:
                dt = datetime(*entry.published_parsed[:6], tzinfo=timezone.utc)
                return dt.isoformat()
            elif hasattr(entry, 'updated_parsed') and entry.updated_parsed:
                dt = datetime(*entry.updated_parsed[:6], tzinfo=timezone.utc)
                return dt.isoformat()
        except Exception:
            pass
        return datetime.now(timezone.utc).isoformat()

    def is_within_24_hours(iso_date: str) -> bool:
        try:
            dt = datetime.fromisoformat(iso_date.replace('Z', '+00:00'))
            now = datetime.now(timezone.utc)
            return (now - dt) <= timedelta(hours=24)
        except Exception:
            return False

    def get_image_url(entry, article_url: str = "") -> str:
        if hasattr(entry, 'enclosures') and entry.enclosures:
            for enc in entry.enclosures:
                if enc.get('type', '').startswith('image'):
                    return enc.get('url', '')
        if hasattr(entry, 'media_content') and entry.media_content:
            return entry.media_content[0].get('url', '')
        if hasattr(entry, 'media_thumbnail') and entry.media_thumbnail:
            return entry.media_thumbnail[0].get('url', '')
        
        # Try scraping OG image
        if article_url:
            try:
                resp = requests.get(article_url, timeout=5, headers={
                    'User-Agent': 'Mozilla/5.0 (compatible; AINewsDashboard/1.0)'
                })
                og_match = re.search(
                    r'<meta[^>]*property=["\']og:image["\'][^>]*content=["\']([^"\']+)["\']',
                    resp.text, re.IGNORECASE
                )
                if og_match:
                    return og_match.group(1)
            except Exception:
                pass
        return ""

    print("🚀 AI News Feed Parser (Modal Scheduled)")
    print("=" * 50)

    all_articles = []

    for source_id, config in FEEDS.items():
        try:
            print(f"  Fetching {config['name']}...")
            feed = feedparser.parse(config['url'])

            for entry in feed.entries:
                pub_date = parse_date(entry)
                article = {
                    "id": generate_id(entry.link),
                    "title": clean_html(entry.get('title', 'Untitled')),
                    "summary": clean_html(entry.get('summary', ''))[:300],
                    "url": entry.link,
                    "thumbnail": get_image_url(entry, entry.link),
                    "source": config['name'],
                    "source_id": source_id,
                    "source_icon": config['icon'],
                    "published_at": pub_date,
                    "is_new": is_within_24_hours(pub_date),
                }
                all_articles.append(article)

            print(f"  ✅ {config['name']}: {len(feed.entries)} articles")
        except Exception as e:
            print(f"  ❌ Failed to fetch {config['name']}: {e}")

    # Deduplicate
    seen_urls = set()
    unique_articles = []
    for article in all_articles:
        if article['url'] not in seen_urls:
            seen_urls.add(article['url'])
            unique_articles.append(article)

    # Sort by date
    unique_articles.sort(key=lambda x: x['published_at'], reverse=True)

    print("=" * 50)
    print(f"📊 Total: {len(unique_articles)} articles")

    # Sync to Supabase
    print("\n☁️  Syncing to Supabase...")
    try:
        resp = requests.post(
            f"{SUPABASE_URL}/rest/v1/articles",
            json=unique_articles,
            headers={
                "apikey": SUPABASE_ANON_KEY,
                "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
                "Content-Type": "application/json",
                "Prefer": "resolution=merge-duplicates"
            }
        )
        if resp.status_code in [200, 201]:
            print(f"  ✅ Synced {len(unique_articles)} articles to Supabase")
        else:
            print(f"  ⚠️  Supabase response: {resp.status_code} - {resp.text}")
    except Exception as e:
        print(f"  ❌ Supabase sync error: {e}")

    return {"articles_synced": len(unique_articles)}


@app.local_entrypoint()
def main():
    """Run the scraper manually for testing."""
    result = fetch_and_sync_feeds.remote()
    print(f"\n✅ Completed: {result}")
