# Landingpage — deutsche Fassung (Copy-Vorlage)

Jeder Block unten entspricht 1:1 einer Stelle in `website/index.html`.
Links steht, wo es hingehört, rechts der deutsche Text zum Einsetzen.
Reihenfolge = Reihenfolge der Datei. Alles andere (Layout, CSS, Bilder) bleibt unangetastet.

Tonalität nach Brand-Guideline: direkt, coach-artig, datenbewusst. Kein Hype
("Entfessle die Bestie"), keine Wellness-Floskeln, keine Emojis, kein Denglisch
außer bei etablierten Begriffen (App Store, KI-Coach, Tracking).

---

## 0 · Kopf der Seite

| Stelle | Alt | Neu |
|---|---|---|
| `<html lang="en">` (Zeile 2) | `en` | **`de`** |
| `<title>` (Zeile 7) | Lihas: Your AI Fitness Coach | **Lihas: Dein KI-Fitnesscoach** |
| `<meta name="description">` (Zeile 6) | — | **Lihas — KI-gestützter Fitnesscoach: personalisierte Trainingspläne, Ernährungs-Tracking und Fortschrittsanalyse. Kostenlos im App Store.** |

---

## 1 · Navigation (Pill-Menü)

| Alt | Neu |
|---|---|
| Features | **Funktionen** |
| The App | **Die App** |
| How it Works | **So funktioniert's** |
| Pricing | **Preise** |
| Download | **Download** |

---

## 2 · Hero

**Überschrift** (das Wort im Farbverlauf bleibt im Verlauf):

> Trainiere **schlauer.**
> Nicht härter.

**Unterzeile:**

> Personalisierte Pläne, Ernährungs-Tracking und ein Coach, der dein Training kennt. Gebaut für Leute, die es ernst meinen.

**Buttons:**

- `Download Free` → **Kostenlos laden**
- `See Features` → **Funktionen ansehen**

**Bild-Alt-Text:** `Lihas AI Coach screen on iPhone` → **KI-Coach von Lihas auf dem iPhone**

---

## 3 · Statistik-Leiste

| Alt | Neu |
|---|---|
| 4.9 ★ / App Store Rating | **4,9 ★** / **App-Store-Bewertung** |
| Free / To Download | **Gratis** / **zum Download** |

Hinweis: im Deutschen Komma statt Punkt — **4,9**.

---

## 4 · „Backed by"

| Alt | Neu |
|---|---|
| Backed by | **Unterstützt von** |

---

## 5 · Funktionen (Abschnitt `#features`)

**Tag:** Features → **Funktionen**

**Überschrift:**

> Alles, was du brauchst,
> um dein Maximum zu erreichen.

**Unterzeile:**

> Fünf Module, ein Gehirn. Alles, was du erfasst, fließt in denselben Coach.

### Die 5 Orbit-Karten (im `<script>`, ca. Zeile 2877–2881)

**1 — KI-Coach**
> Sprich jederzeit mit deinem KI-Coach. Er kennt deine Trainingshistorie, passt seine Empfehlungen an deinen Ermüdungsgrad an und beantwortet jede Frage zu Technik, Nährstoff-Timing und Regeneration.

**2 — Trainingspläne**
> Programme, die sich Woche für Woche weiterentwickeln — automatisch kalibriert auf deinen Fortschritt und deine Leistungsdaten.

**3 — Ernährung**
> Makros mühelos tracken: Barcode scannen, Mahlzeit in normalen Worten beschreiben oder die KI vom Foto schätzen lassen.

**4 — Analyse**
> Klar visualisierte Kraftkurven, Körperzusammensetzung im Verlauf und wöchentliche Zusammenfassungen deiner Trainingsbelastung.

**5 — Regeneration**
> Intelligente Planung auf Basis von HRV, Schlafqualität und Muskelermüdung — damit du immer weißt, wann du Gas geben und wann du ruhen solltest.

Die Kurztitel in der App-Vorschau (ca. Zeile 3036–3038) heißen entsprechend:
**KI-Coach · Trainingspläne · Analyse**

---

## 6 · So funktioniert's (Abschnitt `#how`)

**Überschrift:**

> In 3 Minuten
> startklar.

**Unterzeile:**

> Kein kompliziertes Onboarding. Laden, ein paar Fragen beantworten — und deine KI baut sofort deine erste Trainingswoche.

### Die 3 Schritte (im `<script>`, ca. Zeile 3113–3118)

Die großen Geister-Wörter im Hintergrund (`GET`, `LOGIN`, `READY`) würde ich
so lassen — sie sind grafische Elemente, keine Sätze. Falls du sie doch
übersetzt: **LOS · LOGIN · FERTIG**.

**01 — App laden**
> Hol dir Lihas kostenlos im App Store. Ein Tipp, und du bist Sekunden von deinem persönlichen KI-Coach entfernt.

**02 — Mit Apple anmelden**
> Ein Tipp mit deiner Apple-ID. Keine Passwörter, keine Formulare — und deine Daten bleiben auf jedem Gerät privat.

**03 — Einrichten & loslegen**
> Beantworte ein paar kurze Fragen, und die KI erstellt sofort dein Profil, deinen Kraft-Rang und deinen ersten Trainingsplan.

**Bild-Alt-Texte:**
- App Store listing → **Lihas im App Store**
- Sign in with Apple, login screen → **Anmeldung mit Apple bei Lihas**
- Your profile and strength rank set up → **Fertig eingerichtetes Profil mit Kraft-Rang**

---

## 7 · Bewertungen

**Überschrift:**

> Echte Menschen.
> Echter Fortschritt.

**Unterzeile:**

> Athletinnen und Athleten trainieren mit Lihas bereits schlauer.

> ⚠️ **Die vier Rezensionen selbst NICHT übersetzen.** Das sind echte, wörtliche
> App-Store-Reviews. Zwei davon (Soheylee, Dayanimaus) sind ohnehin schon deutsch.
> Die zwei englischen (Lisa, R00yaa) bleiben im Original stehen — ein übersetztes
> Zitat wäre kein Zitat mehr, und genau darauf schaut eine Kasse oder ein
> HR-Team, wenn es die Seriosität prüft. Nur die Zeile `App Store Review` in der
> Autorenzeile darf zu **App-Store-Rezension** werden.

---

## 8 · Preise (Abschnitt `#pricing`)

**Tag:** Pricing → **Preise**

**Überschrift:**

> Einfach und
> ehrlich.

**Unterzeile:**

> Gratis starten. Upgraden, wenn du so weit bist. Jederzeit kündbar.

### Karte 1 — Wochenabo

| Alt | Neu |
|---|---|
| Flexible | **Flexibel** |
| Per week | **pro Woche** |
| / week | **/ Woche** |
| Weekly Plan | **Wochenabo** |
| Choose Weekly | **Wochenabo wählen** |

### Karte 2 — Jahresabo

| Alt | Neu |
|---|---|
| Most popular | **Am beliebtesten** |
| Best Value | **Bestes Angebot** |
| / year | **/ Jahr** |
| Annual Plan | **Jahresabo** |
| Save 85% vs weekly | **85 % günstiger als wöchentlich** |
| Choose Annual | **Jahresabo wählen** |

### Leistungen (in beiden Karten identisch)

- Full AI Coach access → **Voller Zugriff auf den KI-Coach**
- Unlimited workout plans → **Unbegrenzte Trainingspläne**
- Nutrition tracking → **Ernährungs-Tracking**
- Progress analytics → **Fortschrittsanalyse**

> Preise (5 € / Woche, 40 € / Jahr) bleiben unverändert. Im Deutschen steht das
> Eurozeichen nach der Zahl mit schmalem Leerzeichen — falls du das Markup dafür
> nicht umbauen willst, ist „€ 40" ebenfalls korrekt und völlig üblich.

---

## 9 · Download-CTA (Abschnitt `#download`)

**Überschrift** (zweite Zeile im Farbverlauf):

> Deine stärkste Version
> **beginnt heute.**

**Unterzeile:**

> Lade Lihas kostenlos. Ein paar Fragen — und deine erste KI-erstellte Trainingswoche steht in wenigen Minuten.

**Store-Buttons:**

| Alt | Neu |
|---|---|
| Download on the / App Store | **Laden im** / **App Store** |
| Get it on / Google Play | **Jetzt bei** / **Google Play** |
| Coming Soon | **Demnächst** |

---

## 10 · Footer

**Tagline:**

> Der KI-Fitnesstracker, der mit dir trainiert — nicht nur für dich.

**Spalten:**

| Alt | Neu |
|---|---|
| Product | **Produkt** |
| Features | **Funktionen** |
| How it Works | **So funktioniert's** |
| The App | **Die App** |
| Download | **Download** |
| Company | **Unternehmen** |
| App Store | **App Store** |
| Contact | **Kontakt** |
| Legal | **Rechtliches** |
| Privacy Policy | **Datenschutzerklärung** |
| Terms of Service | **Nutzungsbedingungen** |
| Impressum | **Impressum** |

**Fußzeile:**

| Alt | Neu |
|---|---|
| © 2026 Lihas. All rights reserved. | **© 2026 Lihas. Alle Rechte vorbehalten.** |
| Made with care for athletes everywhere | **Mit Sorgfalt gebaut — für alle, die trainieren.** |

---

## 11 · Zwei Dinge, die du beim Einsetzen im Blick behalten solltest

1. **Deutsche Wörter sind länger.** „So funktioniert's" ist deutlich breiter als
   „How it Works", „Fortschrittsanalyse" breiter als „Progress analytics". Sieh dir
   nach dem Einsetzen vor allem das Pill-Menü, die Feature-Listen in den Preiskarten
   und die Statistik-Leiste auf dem Handy an — dort ist am wenigsten Platz.
2. **Wenn beide Sprachen parallel leben sollen** (englische Seite behalten,
   deutsche zusätzlich), leg die Übersetzung als eigene Datei an — z. B.
   `website/de/index.html` — und setz in beide Seiten je ein
   `<link rel="alternate" hreflang="de" href="…">` bzw. `hreflang="en"`.
   Sag Bescheid, dann baue ich dir die zweite Datei fertig, statt dass du
   von Hand kopierst.
