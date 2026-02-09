# 📚 Supabase Sync SOP

> Standard Operating Procedure for syncing articles to Supabase

---

## Purpose

Sync fetched RSS articles to Supabase database for cloud persistence.

---

## Input

```json
{
  "id": "string - MD5 hash (12 chars)",
  "title": "string",
  "summary": "string (max 300 chars)",
  "url": "string",
  "thumbnail": "string",
  "source": "string",
  "source_id": "string",
  "source_icon": "string",
  "published_at": "ISO 8601",
  "is_new": "boolean"
}
```

---

## Output

- Articles upserted to `articles` table
- Duplicates handled via `id` primary key

---

## Logic

1. Transform camelCase → snake_case for DB
2. POST to Supabase REST API with `Prefer: resolution=merge-duplicates`
3. Log success or error

---

## Error Handling

| Error | Cause | Fix |
|-------|-------|-----|
| 401 Unauthorized | RLS policy missing | Add INSERT policy |
| 409 Conflict | Duplicate key | Already handled by upsert |

---

## Edge Cases

- If Supabase is down, local JSON is still saved
- Empty article list → skip sync
