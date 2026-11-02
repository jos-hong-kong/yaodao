# Yao Dao Project website (draft)

This repository holds the Yao Dao Project site migrated from yaodao.hku.hk (WordPress with the Divi theme). The pages keep the original design, layout, menu, text and images. The additions are:

- a language switch, English and Simplified Chinese (简体中文), with Chinese pages under `/zh/`;
- a light/dark switch (dark is the original look), in the slim bar above the menu;
- large videos streamed from Google Drive instead of the old server;
- Team: Martin Tse moved from Team Leaders to the first place under Collaborators.

## Structure
- `index.html`, `research/`, `manuscripts/`, `oral-stories/`, `films/`, `films/ethnofilms/`, `ethnohistory/`, `ethnohistory/maps/`, `team/`, `publications/`, `events/`, `genesis/`, `daoism-among-the-yao/`: English pages.
- `zh/…`: the same pages in Chinese. Home, Research, Ethnohistory, Maps and Events are translated (draft, for specialist review); the other Chinese pages show the English text with a notice.
- `site-assets/`: the original theme CSS, scripts, fonts and images, copied from the old server.
- `content/en`, `content/zh`: text extracted from the old site and the Chinese translations used by the build.
- `tools/`: `mirror.py` (copies the live pages and assets), `build.py` (adds the controls, Chinese pages, Drive videos and team change), `yd.css`, `yd.js`.

## Videos
The three large films stay in Google Drive (link access: Viewer) and play through Drive's player. The 26 MB festival clip is in `site-assets/`. GitHub refuses files over 100 MB.

## Unlisted until launch
Three layers keep the draft out of search engines: `<meta name="robots" content="noindex, nofollow">` on every page, `robots.txt` (Disallow: /), and the `X-Robots-Tag` header in `vercel.json`. To go public, remove all three and add a sitemap.

## Deploy
Static files, no build step on Vercel. Framework preset: Other; output directory: repository root.
