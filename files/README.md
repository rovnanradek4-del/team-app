# TEAM APP — MVP Level 1

Datová páteř sportovního klubu. SaaS-ready PWA pro správu hráčů, akcí, docházky, statistik a více.

## Funkce (MVP Level 1)

- ✅ Registrace klubu + přihlášení
- ✅ Hierarchie: Klub → Sezóna → Kategorie → Tým
- ✅ Hráčské profily s interními poznámkami
- ✅ Kalendář akcí (trénink, zápas, turnaj)
- ✅ Docházka s rychlým zadáváním
- ✅ Statistiky: góly, asistence, minuty, hodnocení
- ✅ Kanadské bodování
- ✅ Domácí úkoly
- ✅ Finance a platby
- ✅ Reporty hráčů
- ✅ PWA — instalovatelné na mobil

## Technologie

- **Frontend**: React 18
- **Databáze**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Hosting**: Vercel
- **Cena**: $0/měsíc (Free tier)

---

## Nasazení — krok po kroku

### 1. Supabase — databáze

1. Jděte na [supabase.com](https://supabase.com) → otevřete váš projekt FCVP
2. SQL Editor → Nový dotaz
3. Zkopírujte celý obsah souboru `schema.sql` a spusťte ho
4. Databáze je připravena

### 2. GitHub — nahrání kódu

```bash
# V Terminálu přejděte do složky s aplikací
cd ~/Downloads/team-app

# Inicializujte Git a nahrajte na GitHub
git init
git add .
git commit -m "TEAM APP MVP Level 1"
```

Pak jděte na **github.com** → **New repository** → pojmenujte `team-app` → zkopírujte příkazy pro push:

```bash
git remote add origin https://github.com/VAS-USERNAME/team-app.git
git push -u origin main
```

### 3. Vercel — nasazení

1. Jděte na [vercel.com](https://vercel.com) → přihlaste se přes GitHub
2. **New Project** → Import `team-app`
3. Framework: **Create React App** (auto-detekce)
4. **Deploy** — za 2 minuty máte živou URL

### 4. Hotovo!

Výsledek: `team-app.vercel.app` nebo vlastní URL

---

## Struktura souborů

```
src/
  contexts/
    AuthContext.js    — Auth stav (přihlášení, uživatel, profil)
    AppContext.js     — Aplikační stav (klub, sezóna, tým)
  components/
    Sidebar.js        — Boční navigace
    Header.js         — Hlavička
    UI.js             — Sdílené komponenty (Button, Modal, Card...)
  pages/
    LoginPage.js      — Přihlášení + registrace klubu
    Dashboard.js      — Hlavní přehled
    PlayersPage.js    — Hráči a soupiska
    EventsPage.js     — Kalendář a akce
    AttendancePage.js — Docházka
    StatsPage.js      — Statistiky a kanadské bodování
    HomeworkPage.js   — Domácí úkoly
    FinancePage.js    — Finance
    ReportsPage.js    — Reporty hráčů
    SettingsPage.js   — Nastavení (klub, sezóna, kategorie, tým)
  App.js              — Hlavní komponenta s routingem
  supabase.js         — Supabase klient
  styles.js           — Design tokeny a sdílené styly
schema.sql            — Kompletní databázové schéma
```

---

## Level 2 (plánováno)

- Automatické měsíční/podzimní/jarní agregace
- PDF export reportů
- Modul výstroj
- Scouting databáze
- Notifikace (push)
- Role: Šéftrenér, Asistent, Hráč, Rodič

## Level 3 (plánováno)

- AI generování textů pro reporty
- Detekce trendů (pokles docházky, výkonu)
- Super Admin dashboard
- SaaS billing a plány
