# 🖨️ 3D-Druck Tagebuch

Eine Web-App, mit der du deine 3D-Drucke dokumentierst, deinen Filament-Bestand verwaltest und den Überblick über Drucker, Kosten und Materialverbrauch behältst.

Statt Notizzettel und Excel-Tabellen: Ein MakerWorld-Link reicht, und die App holt sich Modellname, Bild, Druckzeit und Filamentbedarf automatisch.

![Druck-Tagebuch in der Kartenansicht](assets/images/example-diary-card-view.png)

---

## ✨ Funktionen

### 📒 Druck-Tagebuch
- Drucke erfassen mit Datum, Drucker, verwendeten Filamenten, Druckzeit und Notizen
- **MakerWorld-Import:** URL einfügen → Titel, Vorschaubild, Druckprofile, Druckzeit und Filamentgewichte pro Farbe werden automatisch übernommen
- Karten- und Tabellenansicht
- CSV-Export aller Drucke

### 🧵 Filament-Lager
- Filamente mit Hersteller, Material, Farbe (Color-Picker) und Restgewicht verwalten
- Das Restgewicht berechnet sich automatisch aus den eingetragenen Drucken

### 🖨️ Drucker
- Eigene Drucker anlegen und auswählen
- **Bambu Lab Live-Status** (optional): Verbindung per MQTT (IP, Access Code, Seriennummer) für Druckfortschritt, Restzeit und AMS-Belegung. Der Access Code wird verschlüsselt gespeichert.

### 🧮 Filament-Rechner
- Mehrere MakerWorld-Links einfügen und den gesamten Filamentbedarf inkl. Farbverteilung berechnen
- Öffentlich unter `/calculator` nutzbar, **auch ohne Login**
- Eingeloggt: Abgleich mit dem eigenen Lager und Berechnungen speichern

### 🤖 KI-Assistent
- Chat-Widget, das Fragen zu deinen eigenen Daten beantwortet („Wie viel PLA Schwarz habe ich noch?“, „Was hat mein letzter Druck gekostet?“)
- Basiert auf Google Gemini mit einer Wissensdatenbank aus deinen Druckern, Filamenten und Drucken (RAG mit Vektor-Embeddings) sowie live abgefragtem Lagerbestand

### ⚙️ Einstellungen
- Strompreis (ct/kWh) für die Kostenberechnung
- Wissensdatenbank für den KI-Assistenten aktualisieren
- Account löschen (außer beim Demo-Account)

---

## 🏗️ Aufbau

Alles liegt in einer einzigen Next.js-App im Repository-Root:

```
3d-printing-diary/
├── app/          # Seiten und API-Routen (App Router)
├── components/   # UI-Komponenten
├── lib/          # Auth, Datenbank, MakerWorld-Scraper
└── ...
```

| Teil | Technik | Hosting |
|------|---------|---------|
| **App** | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Radix UI / shadcn, React Hook Form + Zod | Vercel |
| **Datenbank** | MongoDB (Collections u. a. `users`, `sessions`, `prints`, `filaments`, `printers`, `documents`) | MongoDB Atlas |
| **Auth** | Eigene Session-Auth (bcrypt + HTTP-Cookie) | – |
| **KI** | Google Gemini (`@google/genai`) für Chat und Embeddings | – |
| **Scraper** | ScrapingBee + Cheerio in `/api/scrape` | Vercel Function |

**MakerWorld-Scraper:** MakerWorld blockt Anfragen von Server-IPs per Cloudflare. Die Route `POST /api/scrape` (`lib/scraper-server.ts`) holt die Seite deshalb über ScrapingBee (zuerst die günstigste Einstellung mit 1 Credit, teurere nur bei Blockade) und liest die Modelldaten aus dem eingebetteten `__NEXT_DATA__`-JSON.

---

## 🚀 Lokal starten

### Voraussetzungen
- Node.js 20+
- Yarn 4
- Eine MongoDB-Instanz (lokal oder Atlas)
- Ein ScrapingBee-API-Key (für den MakerWorld-Import)
- Optional: Google-AI-API-Key für den KI-Assistenten

```bash
yarn install
```

`.env.local` anlegen:

```env
MONGODB_URI_STRING=mongodb+srv://...
NEXTAUTH_SECRET=<zufälliger String, mind. 32 Zeichen – wird zum Verschlüsseln der Drucker-Access-Codes genutzt>
GOOGLE_AI_KEY=<Google AI API Key>          # optional, für den KI-Chat
SCRAPINGBEE_API_KEY=<ScrapingBee API Key>   # für den MakerWorld-Import
```

```bash
yarn dev
```

Die App läuft dann unter [http://localhost:3000](http://localhost:3000).

---

## 📦 Deployment

Das Projekt wird auf Vercel deployt (Konfiguration in `vercel.json`). Es braucht keine weitere Infrastruktur: Der Scraper läuft als Vercel Function.

---

## 🛠️ Nützliche Befehle 

| Befehl | Beschreibung |
|--------|--------------|
| `yarn dev` | Entwicklungsserver starten |
| `yarn build` | Produktions-Build erstellen |
| `yarn start` | Produktions-Build starten |
| `yarn lint` | ESLint ausführen |
| `yarn test` | TypeScript-Check + ESLint (läuft auch als Pre-Commit-Hook via Husky) |

---

## 📸 Screenshots

| Tabellenansicht | Filament-Lager | Druckerauswahl |
|---|---|---|
| ![Tabelle](assets/images/example-diary-table-view.png) | ![Filamente](assets/images/example-filament-storage.png) | ![Drucker](assets/images/example-choose-printer.png) |
