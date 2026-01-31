# CardCrafter

CardCrafter is a Windows-first, offline flashcard app that turns your study materials into high-quality cards and schedules reviews with SM-2. The focus is on learning science (active recall + spacing), privacy (local-first), and security (contextIsolation + strict IPC).

## Status

Early MVP. Decks, cards, reviews, and SM-2 scheduling are already functional. Import and AI generation are planned and in progress.

## Features (current)

- Decks with nested structure (tree)
- Card editor (basic cards)
- Review mode with flip + 0-5 rating
- SM-2 scheduler with review logs
- Local SQLite persistence (no cloud)

## Planned

- Import pipeline (PDF, images, text, paste)
- OpenRouter AI generation with strict JSON schema
- Image-based cards, cloze cards, and previews
- Stats dashboard and advanced filtering
- Keychain-based API key storage (fallback: encrypted local config)

## Tech Stack

- Electron Forge (Windows target)
- React + TypeScript (renderer)
- Tailwind CSS + shadcn/ui + lucide-react
- SQLite (better-sqlite3)
- Secure IPC via preload (contextIsolation = true, nodeIntegration = false)

## Getting Started

### Prerequisites

- Node.js (LTS recommended)
- npm
- Windows build tools for native modules (required by better-sqlite3)
  - Visual Studio Build Tools
  - Python 3

### Install

```bash
npm install
```

### Run (dev)

```bash
npm start
```

### Package (Windows)

```bash
npm run make
```

## Project Structure

```
src/
  index.ts             # Electron main process
  preload.ts           # Secure IPC bridge
  main/
    db.ts              # SQLite layer + schema
    scheduler.ts       # SM-2 scheduling logic
  renderer/
    App.tsx            # UI shell
    components/ui/     # shadcn-style components
    lib/               # helpers
  shared/
    types.ts           # shared types
    ipc.ts             # IPC channel names
```

## Data & Privacy

- All data is stored locally (SQLite).
- No cloud sync.
- API keys will be stored locally (keychain planned).

## Security

- contextIsolation enabled
- nodeIntegration disabled
- IPC only via preload bridge

## Contributing

Contributions are welcome. If you want to help:

1. Fork the repo
2. Create a feature branch
3. Submit a PR

Please keep changes focused and include a short description and screenshots for UI changes.

## Roadmap

- [ ] Import pipeline (PDF/text/image)
- [ ] AI generation via OpenRouter
- [ ] Cloze + image cards
- [ ] Stats dashboard
- [ ] Export / backup

## License

MIT (see `package.json`).
