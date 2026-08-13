# Field note content source

Add a new `.mdx` file in this directory, then run:

```text
node build-field-notes.js
```

Required frontmatter:

```yaml
---
title: Your article title
slug: your-article-slug
author: Brianna Bates
datePublished: 2026-08-12
dateModified: 2026-08-12
summary: A distinct search-result summary.
---
```

The generator writes the standalone route, updates the field-notes index, adds two related articles, and refreshes `sitemap.xml`.

The three migrated articles intentionally retain their original short-answer format. Before publishing them as expertise content, expand each one to approximately 400-800 words of real operational detail. That is a writing task for the human author, not content to fabricate in the migration.
