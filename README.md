# CardCrafter

CardCrafter ist eine Windows-first, Offline-Karteikarten-App, die Lernmaterialien in hochwertige Karten verwandelt und Wiederholungen mit SM-2 plant. Der Fokus liegt auf Lernwissenschaft (Active Recall + Spacing), Datenschutz (lokal-first) und Sicherheit (contextIsolation + strict IPC).

## Status

Frühe MVP-Phase. Decks, Karten, Reviews und SM-2-Scheduling sind funktionsfähig. Import und KI-Generierung sind geplant.

## Features (aktuell)

- **Decks mit verschachtelter Struktur** (Baumansicht mit Drag & Drop)
- **Rich-Text-Editor** mit TipTap
  - Formatierung (fett, kursiv, Listen)
  - Bilder per Drag & Drop oder Strg+V einfügen
  - Bildgrößenänderung (Resize-Handles + Buttons)
- **Review-Modus** mit Flip + 0-3 Bewertung
- **SM-2 Scheduler** mit Review-Logs
- **Freie Übungs-Sessions** (auch ohne fällige Karten)
- **Lokale SQLite-Speicherung** (keine Cloud)
- **Deutsche Benutzeroberfläche**

## Geplant

- Import-Pipeline (PDF, Bilder, Text, Paste)
- OpenRouter KI-Generierung mit striktem JSON-Schema
- Lückentextkarten (Cloze)
- Statistik-Dashboard und erweiterte Filter
- Keychain-basierte API-Key-Speicherung

## Tech Stack

- Electron Forge (Windows-Ziel)
- React + TypeScript (Renderer)
- Tailwind CSS + shadcn/ui + lucide-react
- TipTap (Rich-Text-Editor)
- @dnd-kit (Drag & Drop)
- DOMPurify (XSS-Schutz)
- SQLite (better-sqlite3)
- Secure IPC via Preload (contextIsolation = true, nodeIntegration = false)

## Erste Schritte

### Voraussetzungen

- Node.js (LTS empfohlen)
- npm
- Windows Build Tools für Native Module (benötigt von better-sqlite3)
  - Visual Studio Build Tools
  - Python 3

### Installation

```bash
npm install
```

### Starten (Entwicklung)

```bash
npm start
```

### Paketieren (Windows)

```bash
npm run make
```

## Projektstruktur

```
src/
  index.ts             # Electron Main-Prozess
  preload.ts           # Secure IPC Bridge
  main/
    db.ts              # SQLite Layer + Schema
    scheduler.ts       # SM-2 Scheduling-Logik
  renderer/
    App.tsx            # UI Shell
    components/
      ui/              # shadcn-style Komponenten
      tabs/            # Tab-Inhalte (Review, Editor, Browse, etc.)
      dialogs/         # Dialog-Komponenten
      decks/           # Deck-Tree mit Drag & Drop
    lib/               # Helpers
  shared/
    types.ts           # Shared Types
    ipc.ts             # IPC Channel Names
```

## Daten & Datenschutz

- Alle Daten werden lokal gespeichert (SQLite)
- Keine Cloud-Synchronisation
- API-Keys werden lokal gespeichert (Keychain geplant)
- Bilder werden als Base64 in den Karten gespeichert

## Sicherheit

- contextIsolation aktiviert
- nodeIntegration deaktiviert
- IPC nur via Preload Bridge
- DOMPurify für HTML-Sanitization (XSS-Schutz)

## Mitwirken

Beiträge sind willkommen. So kannst du helfen:

1. Fork das Repo
2. Erstelle einen Feature-Branch
3. Reiche einen PR ein

Bitte halte Änderungen fokussiert und füge eine kurze Beschreibung sowie Screenshots für UI-Änderungen bei.

## Roadmap

- [ ] Import-Pipeline (PDF/Text/Bild)
- [ ] KI-Generierung via OpenRouter
- [ ] Lückentextkarten (Cloze)
- [ ] Statistik-Dashboard
- [ ] Export / Backup
- [x] Rich-Text-Editor mit Bildunterstützung
- [x] Deck Drag & Drop
- [x] Deutsche Lokalisierung

## Lizenz

MIT (siehe `package.json`).
