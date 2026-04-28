# AELYN FINANCE

A modern multi-user accounting and financial management platform developed by Aelyn Technologies.

## Features

- Track income and expenses
- Debt tracking + status updates
- Stakeholder activity logging (audit trail)
- Report exports (CSV + PDF)
- Offline-first: Firestore persistence + PWA app-shell caching

## Run locally

Prerequisites: Node.js 20+

```bash
npm install
npm run dev
```

## Desktop (Windows/macOS installers)

This repo includes an Electron wrapper + `electron-builder` config.

```bash
# Windows (run on Windows)
npm run desktop:dist:win

# macOS (run on a Mac)
npm run desktop:dist:mac
```

GitHub Actions builds installers on every push to `main` (and via manual dispatch). Download them from the workflow artifacts.

