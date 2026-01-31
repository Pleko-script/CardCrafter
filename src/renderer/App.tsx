import React from 'react';
import {
  BookOpen,
  ChevronDown,
  FileText,
  FolderTree,
  Import,
  LayoutGrid,
  Plus,
  Settings,
  Sparkles,
  Star,
} from 'lucide-react';

import { Badge } from './components/ui/badge';
import { Button } from './components/ui/button';
import { Card } from './components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './components/ui/dialog';
import { Input } from './components/ui/input';
import { ScrollArea } from './components/ui/scroll-area';
import { Separator } from './components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Textarea } from './components/ui/textarea';
import { cn } from './lib/utils';

type DeckNode = {
  id: string;
  name: string;
  children?: DeckNode[];
};

const mockDecks: DeckNode[] = [
  {
    id: 'bio',
    name: 'Biologie',
    children: [
      { id: 'bio-cell', name: 'Zellbiologie' },
      { id: 'bio-gen', name: 'Genetik' },
    ],
  },
  {
    id: 'hist',
    name: 'Geschichte',
    children: [{ id: 'hist-renaissance', name: 'Renaissance' }],
  },
  {
    id: 'math',
    name: 'Mathe',
    children: [{ id: 'math-linalg', name: 'Lineare Algebra' }],
  },
];

const mockCards = [
  {
    id: 'card-1',
    front: 'Welche 3 Merkmale definieren Mitochondrien in eukaryotischen Zellen?',
    back: 'Doppelte Membran, eigene DNA, ATP-Produktion via Zellatmung.',
    tags: ['bio', 'organelle'],
    due: 'Heute',
  },
  {
    id: 'card-2',
    front: 'Was unterscheidet Mitose von Meiose in einem Satz?',
    back: 'Mitose erzeugt identische diploide Zellen, Meiose haploide Gameten mit Rekombination.',
    tags: ['bio', 'zellteilung'],
    due: 'Morgen',
  },
];

const mockReviewCard = {
  id: 'review-1',
  front: 'Nenne die 3 Schritte der Glykolyse-Startphase in Reihenfolge.',
  back: 'Glucose → Glucose-6-P → Fructose-6-P → Fructose-1,6-bisP.',
  tags: ['bio', 'stoffwechsel'],
};

function DeckTreeItem({
  node,
  level,
  selectedId,
  onSelect,
}: {
  node: DeckNode;
  level: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = React.useState(true);
  const hasChildren = Boolean(node.children?.length);

  return (
    <div>
      <button
        type="button"
        className={cn(
          'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition hover:bg-muted',
          selectedId === node.id && 'bg-secondary text-foreground',
        )}
        style={{ paddingLeft: 12 + level * 14 }}
        onClick={() => onSelect(node.id)}
        aria-current={selectedId === node.id ? 'page' : undefined}
      >
        {hasChildren && (
          <span
            className={cn(
              'text-muted-foreground transition',
              open ? 'rotate-90' : '',
            )}
            aria-hidden="true"
          >
            <ChevronDown size={16} />
          </span>
        )}
        <FolderTree size={16} className="text-muted-foreground" />
        <span className="flex-1">{node.name}</span>
        {hasChildren && (
          <button
            type="button"
            className="text-xs text-muted-foreground hover:text-foreground"
            onClick={(event) => {
              event.stopPropagation();
              setOpen((prev) => !prev);
            }}
            aria-label={open ? 'Unterdecks einklappen' : 'Unterdecks ausklappen'}
          >
            {open ? '–' : '+'}
          </button>
        )}
      </button>
      {hasChildren && open && (
        <div className="mt-1 space-y-1">
          {node.children?.map((child) => (
            <DeckTreeItem
              key={child.id}
              node={child}
              level={level + 1}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function App() {
  const [activeTab, setActiveTab] = React.useState('review');
  const [selectedDeckId, setSelectedDeckId] = React.useState<string | null>(
    mockDecks[0]?.id ?? null,
  );
  const [reviewFlipped, setReviewFlipped] = React.useState(false);

  return (
    <div className="flex h-screen w-screen overflow-hidden text-foreground">
      <aside className="flex h-full w-[280px] min-w-[220px] max-w-[420px] flex-shrink-0 resize-x flex-col gap-4 border-r border-border bg-background/70 p-4 backdrop-blur-xl">
        <div>
          <h1 className="font-display text-xl font-semibold tracking-tight">
            CardCrafter
          </h1>
          <p className="text-sm text-muted-foreground">
            Lernen mit System &amp; Sinn.
          </p>
        </div>

        <Input placeholder="Decks durchsuchen..." />

        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="secondary" className="flex-1">
                <Plus size={16} /> Deck
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Neues Deck</DialogTitle>
                <DialogDescription>
                  Erstelle ein neues Deck oder Unterdeck.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Input placeholder="Deck-Name" />
                <Input placeholder="Optional: Pfad (z.B. Biologie/Zellbiologie)" />
                <Button className="w-full">
                  <Plus size={16} /> Deck anlegen
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="outline" className="flex-1">
            <Plus size={16} /> Karte
          </Button>
        </div>

        <Separator />

        <ScrollArea className="flex-1">
          <nav aria-label="Deck-Tree" className="space-y-2 pr-2">
            {mockDecks.map((deck) => (
              <DeckTreeItem
                key={deck.id}
                node={deck}
                level={0}
                selectedId={selectedDeckId}
                onSelect={setSelectedDeckId}
              />
            ))}
          </nav>
        </ScrollArea>
      </aside>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex h-full flex-1 flex-col"
      >
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border bg-background/60 px-6 py-4 backdrop-blur-xl">
          <div>
            <h2 className="text-lg font-semibold">Deck: Zellbiologie</h2>
            <p className="text-sm text-muted-foreground">
              Nächste Fälligkeiten, Import &amp; Stats im Blick.
            </p>
          </div>
          <TabsList className="bg-secondary/70">
            <TabsTrigger value="review">
              <BookOpen size={16} className="mr-2" /> Review
            </TabsTrigger>
            <TabsTrigger value="browse">
              <LayoutGrid size={16} className="mr-2" /> Browse
            </TabsTrigger>
            <TabsTrigger value="editor">
              <FileText size={16} className="mr-2" /> Editor
            </TabsTrigger>
            <TabsTrigger value="import">
              <Import size={16} className="mr-2" /> Import
            </TabsTrigger>
            <TabsTrigger value="stats">
              <Star size={16} className="mr-2" /> Stats
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings size={16} className="mr-2" /> Settings
            </TabsTrigger>
          </TabsList>
        </header>

        <div className="flex-1 overflow-auto">
          <TabsContent value="review" className="h-full">
            <div className="grid h-full grid-cols-1 gap-6 p-6 lg:grid-cols-[2fr_1fr]">
              <Card className="flex flex-col justify-between gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-muted-foreground">
                      Nächste Karte
                    </span>
                    <Badge variant="secondary">Due jetzt</Badge>
                  </div>
                  <div
                    className={cn(
                      'rounded-lg border border-border bg-background/60 p-6 text-lg shadow-inner transition',
                      reviewFlipped ? 'text-muted-foreground' : 'text-foreground',
                    )}
                  >
                    {reviewFlipped ? mockReviewCard.back : mockReviewCard.front}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {mockReviewCard.tags.map((tag) => (
                      <Badge key={tag} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  <Button
                    variant="outline"
                    onClick={() => setReviewFlipped((prev) => !prev)}
                  >
                    Karte umdrehen (Space)
                  </Button>
                  <div className="grid grid-cols-3 gap-2 md:grid-cols-6">
                    {[0, 1, 2, 3, 4, 5].map((score) => (
                      <Button key={score} variant="secondary">
                        {score}
                      </Button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Shortcuts: Space = Flip, 0-5 = Bewertung, S = Skip
                  </p>
                </div>
              </Card>
              <Card className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground">
                    Heute fällig
                  </h3>
                  <p className="text-3xl font-semibold">18</p>
                </div>
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Streak
                    </span>
                    <span className="text-sm font-semibold">6 Tage</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Retention
                    </span>
                    <span className="text-sm font-semibold">84%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Fokus-Deck
                    </span>
                    <span className="text-sm font-semibold">Zellbiologie</span>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="browse" className="h-full">
            <div className="space-y-4 p-6">
              <Card className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <h3 className="text-lg font-semibold">Karten im Deck</h3>
                  <div className="flex flex-wrap gap-2">
                    <Input placeholder="Tag-Filter" className="w-40" />
                    <Input placeholder="Status" className="w-32" />
                    <Input placeholder="Fällig bis" className="w-32" />
                  </div>
                </div>
                <div className="space-y-3">
                  {mockCards.map((card) => (
                    <div
                      key={card.id}
                      className="rounded-lg border border-border bg-background/70 p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-medium">{card.front}</p>
                          <p className="text-sm text-muted-foreground">
                            {card.back}
                          </p>
                        </div>
                        <Badge variant="secondary">{card.due}</Badge>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {card.tags.map((tag) => (
                          <Badge key={tag} variant="outline">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="editor" className="h-full">
            <div className="grid gap-6 p-6 lg:grid-cols-[2fr_1fr]">
              <Card className="space-y-4">
                <h3 className="text-lg font-semibold">Neue Karte</h3>
                <div className="space-y-3">
                  <Input placeholder="Frage / Prompt" />
                  <Textarea placeholder="Antwort / Back" />
                  <Input placeholder="Tags (comma-separated)" />
                </div>
                <div className="flex gap-2">
                  <Button>
                    <Sparkles size={16} /> Speichern
                  </Button>
                  <Button variant="outline">Als Cloze</Button>
                </div>
              </Card>
              <Card className="space-y-3">
                <h4 className="text-sm font-semibold text-muted-foreground">
                  Qualitätsregeln
                </h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>Eine Karte = ein Fakt / Begriff / Schritt.</li>
                  <li>Aktive Erinnerung statt Wiedererkennen.</li>
                  <li>Kurze, präzise Antworten.</li>
                  <li>Listen aufteilen, Prozesse zerlegen.</li>
                  <li>Erst verstehen, dann speichern.</li>
                </ul>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="import" className="h-full">
            <div className="grid gap-6 p-6 lg:grid-cols-[2fr_1fr]">
              <Card className="space-y-4">
                <h3 className="text-lg font-semibold">Import</h3>
                <div className="rounded-lg border border-dashed border-border bg-secondary/40 p-6 text-center text-sm text-muted-foreground">
                  Dateien hier ablegen oder klicken, um PDF, Bild oder Text zu
                  importieren.
                </div>
                <div className="space-y-3">
                  <div className="rounded-lg border border-border bg-background/70 p-4">
                    <p className="text-sm font-medium">Zellbiologie.pdf</p>
                    <p className="text-xs text-muted-foreground">
                      12 Seiten erkannt, 3.2k Zeichen extrahiert.
                    </p>
                  </div>
                  <div className="rounded-lg border border-border bg-background/70 p-4">
                    <p className="text-sm font-medium">Mitochondrien.png</p>
                    <p className="text-xs text-muted-foreground">
                      Bildquelle als visuelles Prompt.
                    </p>
                  </div>
                </div>
                <Button>
                  <Sparkles size={16} /> Karten generieren
                </Button>
              </Card>
              <Card className="space-y-4">
                <h4 className="text-sm font-semibold text-muted-foreground">
                  Vorschau
                </h4>
                <div className="space-y-3">
                  <div className="rounded-lg border border-border bg-background/70 p-4">
                    <p className="text-sm font-medium">
                      Welche 2 Membranen umschließen Mitochondrien?
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Außen- und Innenmembran.
                    </p>
                  </div>
                  <div className="rounded-lg border border-border bg-background/70 p-4">
                    <p className="text-sm font-medium">
                      Cloze: ATP entsteht primär in der [ ... ] der inneren
                      Membran.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Atmungskette / oxidative Phosphorylierung.
                    </p>
                  </div>
                </div>
                <Button variant="outline">Akzeptieren &amp; speichern</Button>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="stats" className="h-full">
            <div className="grid gap-6 p-6 md:grid-cols-2 xl:grid-cols-3">
              <Card className="space-y-2">
                <p className="text-sm text-muted-foreground">Heute fällig</p>
                <p className="text-3xl font-semibold">18</p>
                <p className="text-xs text-muted-foreground">
                  6 neu, 12 Wiederholung
                </p>
              </Card>
              <Card className="space-y-2">
                <p className="text-sm text-muted-foreground">Reviews heute</p>
                <p className="text-3xl font-semibold">42</p>
                <p className="text-xs text-muted-foreground">
                  Retention 84%
                </p>
              </Card>
              <Card className="space-y-2">
                <p className="text-sm text-muted-foreground">Deck-Fortschritt</p>
                <p className="text-3xl font-semibold">62%</p>
                <p className="text-xs text-muted-foreground">
                  120/192 Karten stabil
                </p>
              </Card>
              <Card className="md:col-span-2 xl:col-span-3">
                <h4 className="text-sm font-semibold text-muted-foreground">
                  Reviews pro Tag
                </h4>
                <div className="mt-4 grid grid-cols-7 gap-2">
                  {[14, 22, 18, 26, 30, 20, 28].map((value, index) => (
                    <div
                      key={value}
                      className="flex flex-col items-center gap-2"
                    >
                      <div
                        className="w-full rounded-md bg-primary/20"
                        style={{ height: `${value * 2}px` }}
                        aria-hidden="true"
                      />
                      <span className="text-xs text-muted-foreground">
                        {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'][index]}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="h-full">
            <div className="grid gap-6 p-6 lg:grid-cols-[2fr_1fr]">
              <Card className="space-y-4">
                <h3 className="text-lg font-semibold">OpenRouter</h3>
                <div className="space-y-3">
                  <Input placeholder="API Key (wird lokal gespeichert)" />
                  <Input placeholder="Modell (z.B. moonshotai/kimi-k2.5)" />
                  <div className="grid grid-cols-2 gap-3">
                    <Input placeholder="Temperatur" />
                    <Input placeholder="Max Tokens" />
                  </div>
                </div>
                <Button variant="outline">Speichern</Button>
              </Card>
              <Card className="space-y-3">
                <h4 className="text-sm font-semibold text-muted-foreground">
                  Sicherheit
                </h4>
                <p className="text-sm text-muted-foreground">
                  API Keys werden lokal gespeichert. Keine Cloud-Speicherung
                  von Karten oder Quellen.
                </p>
              </Card>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
