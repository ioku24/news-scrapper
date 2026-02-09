#!/usr/bin/env python3
"""
Feed Parser Tool
Fetches and parses RSS feeds from AI newsletters.
Outputs to both local JSON and Supabase database.
"""

import feedparser
import hashlib
import json
import os
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Optional
import html
import re
import urllib.request
import urllib.error

# Feed Configuration
# Add new sources here - just add a new entry with url, name, and icon
FEEDS = {
    "bens-bites": {
        "url": "https://www.bensbites.com/feed",
        "name": "Ben's Bites",
        "icon": "🍪",
        "enabled": True
    },
    "techcrunch-ai": {
        "url": "https://techcrunch.com/category/artificial-intelligence/feed/",
        "name": "TechCrunch AI",
        "icon": "💚",
        "enabled": True
    },
    "rundown-ai": {
        "url": "https://rss.beehiiv.com/feeds/2R3C6Bt5wj.xml",
        "name": "The Rundown AI",
        "icon": "🏃",
        "enabled": True
    },
    # NOTE: Superhuman.ai and Exploding Topics don't have public RSS feeds
    # They use Beehiiv but RSS is not publicly exposed
}

# Supabase Configuration
SUPABASE_URL = "https://wllrysfrygkmbjxfqwhd.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsbHJ5c2ZyeWdrbWJqeGZxd2hkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1ODkxOTcsImV4cCI6MjA4NjE2NTE5N30.s5Frbz_NybxB8Ow4F7JOK9YjhB6psi75a_xNMXNx24o"

# Output paths
SCRIPT_DIR = Path(__file__).parent.parent
TMP_DIR = SCRIPT_DIR / ".tmp"
OUTPUT_FILE = TMP_DIR / "articles.json"


def generate_id(url: str) -> str:
    """Generate unique ID from URL hash."""
    return hashlib.md5(url.encode()).hexdigest()[:12]


def clean_html(text: str) -> str:
    """Remove HTML tags and decode entities."""
    if not text:
        return ""
    text = html.unescape(text)
    text = re.sub(r'<[^>]+>', '', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text


def parse_date(date_string: str) -> Optional[str]:
    """Parse date string to ISO 8601 format."""
    try:
        if hasattr(date_string, 'tm_year'):
            dt = datetime(*date_string[:6], tzinfo=timezone.utc)
            return dt.isoformat()
        for fmt in [
            "%a, %d %b %Y %H:%M:%S %z",
            "%a, %d %b %Y %H:%M:%S GMT",
            "%Y-%m-%dT%H:%M:%S%z",
        ]:
            try:
                dt = datetime.strptime(date_string, fmt)
                if dt.tzinfo is None:
                    dt = dt.replace(tzinfo=timezone.utc)
                return dt.isoformat()
            except ValueError:
                continue
        return None
    except Exception:
        return None


def is_within_24_hours(iso_date: str) -> bool:
    """Check if date is within last 24 hours."""
    try:
        dt = datetime.fromisoformat(iso_date.replace('Z', '+00:00'))
        now = datetime.now(timezone.utc)
        return (now - dt) <= timedelta(hours=24)
    except Exception:
        return False


def scrape_og_image(url: str) -> str:
    """Scrape og:image meta tag from article page."""
    try:
        req = urllib.request.Request(
            url,
            headers={'User-Agent': 'Mozilla/5.0 (compatible; AINewsDashboard/1.0)'}
        )
        with urllib.request.urlopen(req, timeout=5) as response:
            content = response.read().decode('utf-8', errors='ignore')
            # Look for og:image meta tag
            og_match = re.search(
                r'<meta[^>]*property=["\']og:image["\'][^>]*content=["\']([^"\']+)["\']',
                content, re.IGNORECASE
            )
            if og_match:
                return og_match.group(1)
            # Also try twitter:image
            tw_match = re.search(
                r'<meta[^>]*name=["\']twitter:image["\'][^>]*content=["\']([^"\']+)["\']',
                content, re.IGNORECASE
            )
            if tw_match:
                return tw_match.group(1)
    except Exception:
        pass
    return ""


def get_image_url(entry, article_url: str = "", source_id: str = "") -> str:
    """Extract image URL from feed entry, fallback to scraping."""
    # First try RSS enclosures
    if hasattr(entry, 'enclosures') and entry.enclosures:
        for enc in entry.enclosures:
            if enc.get('type', '').startswith('image'):
                return enc.get('url', '')
    if hasattr(entry, 'media_content') and entry.media_content:
        return entry.media_content[0].get('url', '')
    if hasattr(entry, 'media_thumbnail') and entry.media_thumbnail:
        return entry.media_thumbnail[0].get('url', '')
    
    # For TechCrunch, scrape OG image from the page
    if source_id == 'techcrunch-ai' and article_url:
        return scrape_og_image(article_url)
    
    return ""


def fetch_feed(source_id: str, config: dict) -> list[dict]:
    """Fetch and parse a single RSS feed."""
    articles = []
    
    try:
        print(f"  Fetching {config['name']}...")
        feed = feedparser.parse(config['url'])
        
        if feed.bozo and not feed.entries:
            print(f"  ⚠️  Error parsing {config['name']}: {feed.bozo_exception}")
            return []
        
        for entry in feed.entries:
            pub_date = None
            if hasattr(entry, 'published_parsed') and entry.published_parsed:
                pub_date = parse_date(entry.published_parsed)
            elif hasattr(entry, 'published'):
                pub_date = parse_date(entry.published)
            elif hasattr(entry, 'updated_parsed') and entry.updated_parsed:
                pub_date = parse_date(entry.updated_parsed)
            
            if not pub_date:
                pub_date = datetime.now(timezone.utc).isoformat()
            
            article = {
                "id": generate_id(entry.link),
                "title": clean_html(entry.get('title', 'Untitled')),
                "summary": clean_html(entry.get('summary', entry.get('description', '')))[:300],
                "url": entry.link,
                "thumbnail": get_image_url(entry, entry.link, source_id),
                "source": config['name'],
                "sourceId": source_id,
                "sourceIcon": config['icon'],
                "publishedAt": pub_date,
                "isNew": is_within_24_hours(pub_date),
                "isSaved": False
            }
            articles.append(article)
        
        print(f"  ✅ {config['name']}: {len(articles)} articles")
        
    except Exception as e:
        print(f"  ❌ Failed to fetch {config['name']}: {e}")
    
    return articles


def sync_to_supabase(articles: list[dict]) -> bool:
    """Sync articles to Supabase database."""
    print("\n☁️  Syncing to Supabase...")
    
    # Transform to snake_case for DB
    db_articles = []
    for a in articles:
        db_articles.append({
            "id": a["id"],
            "title": a["title"],
            "summary": a["summary"],
            "url": a["url"],
            "thumbnail": a["thumbnail"],
            "source": a["source"],
            "source_id": a["sourceId"],
            "source_icon": a["sourceIcon"],
            "published_at": a["publishedAt"],
            "is_new": a["isNew"]
        })
    
    # Upsert articles (insert or update on conflict)
    try:
        url = f"{SUPABASE_URL}/rest/v1/articles"
        headers = {
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates"
        }
        
        data = json.dumps(db_articles).encode('utf-8')
        req = urllib.request.Request(url, data=data, headers=headers, method='POST')
        
        with urllib.request.urlopen(req) as response:
            if response.status in [200, 201]:
                print(f"  ✅ Synced {len(db_articles)} articles to Supabase")
                return True
            else:
                print(f"  ⚠️  Unexpected response: {response.status}")
                return False
                
    except urllib.error.HTTPError as e:
        print(f"  ❌ Supabase sync failed: {e.code} - {e.read().decode()}")
        return False
    except Exception as e:
        print(f"  ❌ Supabase sync error: {e}")
        return False


def main():
    """Main entry point."""
    import sys
    
    sync_mode = "--sync" in sys.argv or "-s" in sys.argv
    
    print("🚀 AI News Feed Parser")
    print("=" * 40)
    
    # Ensure output directory exists
    TMP_DIR.mkdir(exist_ok=True)
    
    all_articles = []
    
    # Fetch all feeds
    for source_id, config in FEEDS.items():
        if config.get('enabled', True):
            articles = fetch_feed(source_id, config)
            all_articles.extend(articles)
    
    # Deduplicate by URL
    seen_urls = set()
    unique_articles = []
    for article in all_articles:
        if article['url'] not in seen_urls:
            seen_urls.add(article['url'])
            unique_articles.append(article)
    
    # Sort by date (newest first)
    unique_articles.sort(key=lambda x: x['publishedAt'], reverse=True)
    
    # Build output
    output = {
        "fetchedAt": datetime.now(timezone.utc).isoformat(),
        "totalArticles": len(unique_articles),
        "newArticles": sum(1 for a in unique_articles if a['isNew']),
        "sources": [k for k, v in FEEDS.items() if v.get('enabled', True)],
        "articles": unique_articles
    }
    
    # Write to local file (always, as backup)
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(output, f, indent=2, ensure_ascii=False)
    
    print("=" * 40)
    print(f"📊 Total: {output['totalArticles']} articles ({output['newArticles']} new)")
    print(f"💾 Saved to: {OUTPUT_FILE}")
    
    # Sync to Supabase (always sync now)
    sync_to_supabase(unique_articles)
    

if __name__ == "__main__":
    main()
