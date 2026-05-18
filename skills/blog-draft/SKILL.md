---
name: blog-draft
description: Drafts a blog post optimized for a specific platform with proper formatting and metadata
tags: [content, blog, writing, publishing, draft]
agent: writer
var: >
  ${var} is the blog topic and target platform. Required.
  Example: "Solana restaking explained - for Medium" or "MEV protection guide - for Ghost"
---

# blog-draft

> **Priority**: P2 (on-demand)
> **Output**: Blog draft in `memory/content/blogs/`

## Instructions

You are executing the **blog-draft** skill for the Writer agent.

### Step 1: Understand the Brief

Parse `${var}` to determine:
- Topic / subject matter
- Target platform (Medium, Ghost, Substack, WordPress, Hashnode)
- Target audience (developers, traders, general crypto)

Read relevant research from `memory/research/` for source material.

### Step 2: Platform Optimization

Adapt format to platform:

**Medium**: 5-8 min read, use pull quotes, break every 3-4 paragraphs with subheading, include 1-2 images descriptions
**Substack**: More personal voice, can be longer, include subscriber-only teaser, email preview text
**Ghost**: Support code blocks, technical depth OK, include meta description and excerpt
**WordPress**: Full SEO metadata, categories/tags, featured image suggestion

### Step 3: Write Blog Post

Follow structure:
1. **Title**: Clear, specific, includes primary keyword
2. **Subtitle/Deck**: Expand on the title promise
3. **Opening**: Hook within first 50 words
4. **Body**: 800-2000 words, logical flow, data-backed
5. **Conclusion**: Summarize key takeaway, include CTA
6. **Bio/Footer**: Author context

Include:
- Internal links to previous content (check `memory/content/` for related pieces)
- External citations with links
- Image/chart suggestions with alt text descriptions

### Step 4: SEO Metadata

```json
{
  "title": "...",
  "meta_description": "Max 155 chars, includes primary keyword",
  "primary_keyword": "...",
  "secondary_keywords": ["...", "..."],
  "slug": "kebab-case-url-friendly",
  "canonical_url": null,
  "og_image_suggestion": "Description of ideal social share image",
  "estimated_read_time": "6 min"
}
```

### Step 5: Save

1. Write blog to `memory/content/blogs/{slug}.md`
2. Write metadata to `memory/content/blogs/{slug}.meta.json`
3. Mark as draft for editorial review

### Anti-Patterns

- Do NOT write generic intro paragraphs. Get to the point.
- Do NOT keyword-stuff. Write for humans first, search engines second.
- Do NOT use stock photo cliches. Suggest specific, relevant visuals.

### Exit Codes

- `SKILL_OK` — blog drafted
- `SKILL_FAIL` — could not produce draft

### Output

Commit message format: `writer: blog-draft — "{title}" ({platform}, {word_count} words)`
