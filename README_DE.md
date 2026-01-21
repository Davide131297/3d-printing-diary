# 3D-Druck Tagebuch

Eine umfassende Anwendung zur Verfolgung deiner 3D-Druckprojekte, zur Verwaltung des Filament-Bestands und zur Organisation deines Druck-Workflows.

## Funktionen

- **Druckprojekt-Management**: Erfasse deine 3D-Drucke einfach mit detaillierter Nachverfolgung.
- **Automatische Metadaten**: Füge eine MakerWorld-URL ein, um Modelldetails, Bilder und Druckzeiten automatisch über einen integrierten Crawler abzurufen.
- **Inventar-System**:
  - Verfolgung des Filamentverbrauchs und des Restbestands.
  - Verwaltung von Druckern mit benutzerdefinierten Bildern.
  - Organisation nach Hersteller und Farben.
- **Moderne Oberfläche**: Eine responsive und ästhetische Benutzeroberfläche, erstellt mit modernen Webtechnologien.

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Datenbank**: [Supabase](https://supabase.com/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) & [Radix UI](https://www.radix-ui.com/)
- **Formulare**: React Hook Form & Zod
- **Automatisierung**: Puppeteer (für das Scraping von Modelldaten)

## Erste Schritte

1. **Repository klonen:**

   ```bash
   git clone <repository-url>
   cd 3d-druck-tagebuch
   ```

2. **Abhängigkeiten installieren:**

   ```bash
   yarn install
   ```

3. **Umgebungsvariablen einrichten:**

   Erstelle eine `.env.local` Datei und konfiguriere deine Supabase-Zugangsdaten und andere notwendige Secrets.

4. **Entwicklungsserver starten:**

   ```bash
   yarn dev
   ```

   Öffne [http://localhost:3000](http://localhost:3000) in deinem Browser, um das Ergebnis zu sehen.
