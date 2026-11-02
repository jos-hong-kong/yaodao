# Yao Dao Project (瑤道)

Migration and redesign of [yaodao.hku.hk](https://yaodao.hku.hk). Static site, no build step, no framework.

## Status

Draft. The site is public in GitHub but hidden from search engines (see "Staying unlisted").

## Features

- Expandable site tree as the main menu. Branches open and close; selecting a node loads that page in place. The current page lists its own sections as leaves and highlights the one being read. Keyboard support follows the WAI-ARIA tree pattern (arrow keys, Home, End, Space).
- Light and dark themes (first visit follows the system setting; the choice is remembered).
- English and Simplified Chinese (Mandarin, 简体中文). The choice is remembered and is part of the address, so a link carries its language.
- Videos load only when played. Large masters stay in Google Drive; small clips and YouTube links are embedded directly.
- Addresses look like `#/en/research` or `#/zh/team/team-leaders`.

## Structure

```
index.html                 shell (top bar, tree, content area)
assets/css/style.css       tokens for both themes, layout
assets/js/app.js          router, tree, renderer, language, theme, lightbox
content/pages.json        the site tree (edit here to add, move or rename pages)
content/ui.json           interface strings, EN and ZH
content/en/<page>.json    page content as blocks (html, image, gallery, video, blurb)
content/zh/<page>.json    Chinese text keyed by block number; pages listed in pages.json "translated"
media/img/                images migrated from the old site
media/video/              small clips only (under 100 MB)
media/videos.json         video registry: Drive id, YouTube id or local file
```

### Add a page
1. Add a node to `content/pages.json` (nest it under a parent to make a branch).
2. Create `content/en/<id>.json` with blocks.
3. Optional: create `content/zh/<id>.json` and add the id to `translated.zh` in `pages.json`. Untranslated pages show English with a notice.

### Add a video
Add an entry to `media/videos.json` and reference its key from a `{"t":"video","id":"..."}` block.

## Large videos

GitHub rejects files above 100 MB and Git history keeps every version, so the masters stay in Google Drive.

| Key | Drive file | Size |
|---|---|---|
| `rae-impact-case` | YAO DAO PROJECT IMPACT CASE_2025-10.mp4 | 0.7 GB |
| `museum-9min` | Lanten_LNT Museum_with ITV_9min_FINAL_HD 1920.mp4 | 1.3 GB |
| `anthro-short` | Lanten_Short Anthro Film_19mins_FINAL_HD 1920.mp4 | 2.7 GB |

The embeds play only if each file is shared as "Anyone with the link: Viewer". For the public launch, consider a streaming host (YouTube unlisted, Vimeo, Mux or Cloudflare Stream) so playback does not depend on Drive limits.

## Staying unlisted

Three layers keep the draft out of search results: the `robots` meta tags in `index.html`, `robots.txt`, and the `X-Robots-Tag` header in `vercel.json`. A public GitHub repository can still be found through GitHub search, so keep sensitive drafts out of it.

### Going fully public
1. Remove the `robots` and `googlebot` meta tags from `index.html`.
2. Replace `robots.txt` with `User-agent: *` and `Allow: /`.
3. Remove the `X-Robots-Tag` header from `vercel.json`.
4. Hash addresses (`#/en/research`) are not indexed as separate pages by search engines. Before launch, move to path-based routes with pre-rendered pages, or add a sitemap, so each page can be found.

## Editorial notes from the migration

See `EDITORIAL-NOTES.md`.
