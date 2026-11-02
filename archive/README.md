# Archive

Original material from the legacy static site, kept for reference.

This folder is **not deployed** and **not linked** from the site. The deploy workflow publishes only `site/out/`. The repository is public, though, so everything here is visible to anyone browsing it on GitHub.

## Contents

| Path | What it is |
| --- | --- |
| `reports/ncr-work-term-report.pdf` | Co-op work terms 1-2 (NCR Corporation), from `ncr.html` |
| `reports/magnet1-work-term-report.pdf` | Co-op work term 3 (Magnet Forensics), from `magnet1.html` |
| `reports/magnet2-work-term-report.pdf` | Co-op work terms 4-5 (Magnet Forensics), from `magnet2.html` |
| `images/` | Full-resolution copy of the legacy `images/` folder |
| `transient/TRANSIENT-DISTRIBUTABLE.zip` | The original Transient game download (from `assets/`) |
| `legacy-site/` | The six legacy HTML pages plus `assets/css`, `assets/js` and `assets/webfonts` |

## Viewing the legacy site

Serve the `archive/` folder (not `legacy-site/` alone, since pages reach up into `../images/` and `../transient/`) and open `legacy-site/index.html`:

```bash
cd archive
python3 -m http.server 8000
# http://localhost:8000/legacy-site/index.html
```

Compared with the originals at the repo root, only relative paths were changed:

- `images/...` became `../images/...` in the HTML pages.
- `../../images/...` became `../../../images/...` in `assets/css/*.css`.
- The Transient download link points to `../transient/TRANSIENT-DISTRIBUTABLE.zip`.

The résumé link (`./documents/AustinVB-Resume.pdf`) was already broken on the original site and is left as is. The Pong page embeds Khan Academy and needs network access.

## How the PDFs were generated

The repo root was served with `python3 -m http.server`, and each page was printed with headless Chromium through Playwright 1.64.1:

1. Load the page with a 1280×900 viewport and screen media emulation (the template has no print stylesheet), then wait for network idle.
2. Remove the `is-preload` class from `<body>`, scroll through the whole page, and wait for every `<img>` to decode.
3. To keep file sizes reasonable, any photo larger than 1600 px on its longest side was redrawn on a canvas and replaced with a 1600 px JPEG (quality 0.85). PNG logos kept their format, and GIFs were left untouched. The full-resolution originals are in `images/`.
4. Disable CSS transitions and animations, then call `page.pdf()` with A4 paper, `printBackground: true` and zero margins.

| PDF | Pages | Size |
| --- | --- | --- |
| `ncr-work-term-report.pdf` | 16 | 2.8 MB |
| `magnet1-work-term-report.pdf` | 15 | 5.5 MB |
| `magnet2-work-term-report.pdf` | 16 | 8.8 MB |
