# Unifyo 2.0

> **Mantra:** _"Staviame temné, dynamické, futuristické a centrálne riadené Unifyo 2.0. Jedna zmena v jadre zmení celý systém. Kód je nový, dizajn je lepší, ale duša a texty ostávajú."_

---

## 🏛️ Identita projektu

### 1. Architektúra (Naša Pevnosť)
- **Infrastructure:** Len my, GitHub a náš Hetzner (`204.168.212.58`). Žiadne API tretích strán na správu dát.
- **Database:** Prisma + PostgreSQL (beží výlučne na našom serveri)
- **Deployment:** Každý push → GitHub → Hetzner server

### 2. Vizuálna identita (Dark & Futuristický Minimalizmus)
- **Štýl:** Dark Mode First — tmavé polnočné pozadie (`#080b12`), žiadna sterilná biela
- **Akcenty:** Elektrická indigo/fialová (`#6366f1`, `#8b5cf6`), mesh gradienty, glow efekty
- **Feeling:** High-tech futuristická aplikácia — Apple × Linear × Vercel
- **Efekty:** Glassmorphism, framer-motion animácie, noise textura, border-glow na kartách
- **UI:** Tailwind CSS + Shadcn/ui — každý prvok musí pôsobiť prémiovo

### 3. Obsahová integrita
- **Texty:** Prebraté zo starého projektu 1:1 — sú sväté
- **Jazyk:** Celá aplikácia v slovenčine (pokiaľ nie je určené inak)
- **CMS:** Všetky texty, ceny, linky a nastavenia sú výlučne v `src/config/site-settings.ts`

### 4. Technické piliere
- **Branding Core:** Farby a fonty centrálne v `site-settings.ts`, nie roztrúsené v Tailwind
- **Graceful Failures:** Ak DB na Hetzneri neodpovedá → loading stavy + error toast správy
- **SEO Dynamic:** Všetky meta tagy pre Google sa ťahajú zo System Core
- **Data Integrity:** Zod validácia všetkých vstupov, pravidlá z `site-settings.ts`
- **Visual Stability:** `next-themes` (žiadny hydration flicker), Skeleton loaders
- **Security:** Bezpečnostné hlavičky v `next.config.ts` (XSS, clickjacking, CSP)
- **Smart Caching:** `React.cache()` pre server-side načítavanie site-settings

---

## 🗺️ Mapa projektu

| Vrstva | Súbor | Stav |
|---|---|---|
| System Core | `src/config/site-settings.ts` | ✅ |
| Dark Global Layout | `src/app/layout.tsx` | ✅ |
| Navbar | `src/components/layout/Navbar.tsx` | ✅ |
| Footer | `src/components/layout/Footer.tsx` | ✅ |
| Hero sekcia | `src/components/home/HeroSection.tsx` | ✅ |
| Cenník | `src/components/home/PricingSection.tsx` | ✅ |
| Prisma schéma | `prisma/schema.prisma` | ✅ |
| Security headers | `next.config.ts` | ✅ |
| Auth — Register | `src/app/register/` | 🔄 |
| Auth — Login | `src/app/login/` | 🔄 |

---

## 🛠️ Tech Stack

- **Framework:** Next.js 16 (App Router, TypeScript)
- **Styling:** Tailwind CSS v4 + Shadcn/ui
- **Animácie:** Framer Motion
- **Dark Mode:** next-themes
- **Database:** PostgreSQL na Hetzner
- **ORM:** Prisma
- **Validácia:** Zod
- **Auth:** Vlastné riešenie (bcrypt + JWT) — žiadny Clerk, žiadny Supabase

---

## ⚡ Spustenie lokálne

```bash
npm install
npm run dev
```

Databáza: `.env` → `DATABASE_URL` (PostgreSQL na Hetzner `204.168.212.58:5432`)
