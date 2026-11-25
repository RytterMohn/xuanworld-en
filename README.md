# xuanworld-en

English engineering blog for **RytterMohn**, deployed at [en.xuanworld.top](https://en.xuanworld.top) and cross-linked with the Chinese blog at [www.xuanworld.top](https://www.xuanworld.top/).

Built with [Astro](https://astro.build/), zero heavy client frameworks, dual light/dark themes, RSS, sitemap, and automatic GitHub Pages deployment.

## Writing a new post

Create a Markdown file in `src/content/blog/<slug>.md`:

```markdown
---
title: "Your Post Title"
description: "One-sentence summary for cards and SEO."
pubDate: 2026-11-25
tags: ["ai-security", "android"]
# Optional link to a matching Chinese post:
# zhUrl: "https://www.xuanworld.top/2026/..."
---

Write your post here...
```

## Local development

```bash
npm install
npm run dev
npm run build
```

## Custom domain DNS (`en.xuanworld.top`)

Add a DNS `CNAME` record at your domain registrar:

- **Type**: `CNAME`
- **Host / Name**: `en`
- **Target / Value**: `ryttermohn.github.io`
