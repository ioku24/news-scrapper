# Feed Parser SOP

## Purpose
Parse RSS feeds from AI newsletters and normalize data into a consistent JSON format.

## Inputs
- RSS Feed URLs (Ben's Bites, The Rundown AI, fallbacks)

## Outputs
- `.tmp/articles.json` - Normalized article data

## Logic Flow

1. **Fetch Feeds**
   - Use `feedparser` to retrieve RSS/XML
   - Set timeout of 10 seconds per feed
   - Log any connection failures

2. **Parse Entries**
   - Extract: title, description, link, pubDate, enclosure (image)
   - Tag each entry with source identifier

3. **Filter by Date**
   - Only include articles from last 24 hours
   - Use UTC for consistency

4. **Normalize Data**
   - Convert pubDate to ISO 8601
   - Generate unique ID from URL hash
   - Clean HTML from descriptions

5. **Deduplicate**
   - Remove duplicates by URL hash

6. **Output**
   - Write to `.tmp/articles.json`
   - Include metadata: fetchedAt, sourceCount, articleCount

## Error Handling

| Error | Action |
|-------|--------|
| Feed timeout | Log warning, continue with other feeds |
| Malformed XML | Skip feed, log error |
| Missing fields | Use defaults (empty string, no image) |

## Rate Limits
- Max 1 request per feed per hour
- Respect robots.txt (RSS feeds are typically allowed)
