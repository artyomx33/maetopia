# Maetopia 🏙️✨  
A kid-friendly city-builder created for **Maelyn (age 9)**. Maetopia lets children craft their own bustling town on a single 1920×1080 canvas with simple drag-and-drop controls, big friendly icons, and almost no text.

---

## Table of Contents
1. What is Maetopia?
2. Core Features
3. Tech Stack
4. Getting Started
5. Available npm Scripts
6. Project Structure
7. Supabase Schema (high-level)
8. Roadmap
9. Contributing
10. License & Assets

---

## 1  What is Maetopia?
Maetopia is a browser-based game where kids build a city by placing buildings, animals and items onto a fixed PixiJS canvas. It prioritises usability for young players through:
* **Icon-only UI** – minimal reading required, hover tool-tips for clarity.  
* **Responsive scaling** – always stays 16:9 but shrinks neatly on smaller screens (≥ 800 px).  
* **Auto-save** – progress is written to Supabase every few seconds so nothing is lost.  

The project is split into bite-sized phases so that new features can be generated and tested quickly with Factory.ai.

---

## 2  Core Features
| Phase | Feature Highlights |
|-------|--------------------|
| 0 | GitHub & local environment bootstrap |
| 1 | React + Vite shell, Tailwind styling, 1920×1080 PixiJS canvas |
| 2 | Predefined maps, placeholder CC0/MIT SVG assets, drag-and-drop placement, scrollable storage bar |
| 3 | Supabase integration (auth, projects, uploads), undo/redo, PNG export |
| 4 | Analytics, testing, CI/CD, Storybook, 3-D viewer, polish & deployment |

_Planned extras_: Upgradable element versions, cost calculator, mini-game tasks for learning.

---

## 3  Tech Stack
| Layer | Library / Service |
|-------|-------------------|
| Front-end | React 18, Vite, TypeScript, Tailwind CSS, Font Awesome |
| Rendering | PixiJS (WebGL2) |
| State | Zustand |
| Back-end | Supabase (PostgreSQL, Row-Level Security, Edge Functions, Storage) |
| 3-D | `@google/model-viewer` (lazy-loaded) |
| Tooling | Jest, Playwright, Percy, ESLint, Prettier, Husky |
| Hosting / CI | Vercel (web) • Supabase (API) • GitHub Actions |

---

## 4  Getting Started

Prerequisites: **Node ≥ 18**, **npm ≥ 9** and a Supabase project.

```bash
# 1. Clone
git clone https://github.com/<your-username>/maetopia.git
cd maetopia

# 2. Install deps
npm install

# 3. Configure environment
cp .env.example .env
# → Fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY

# 4. Run Dev Server
npm run dev
# open http://localhost:5173
```

Production build:

```bash
npm run build    # Vite build
npm run preview  # Serve built files locally
```

---

## 5  Available npm Scripts
| Script | Description |
|--------|-------------|
| `dev` | Start Vite dev server with hot reload |
| `build` | Create production bundle |
| `preview` | Preview production bundle locally |
| `lint` | Run ESLint |
| `format` | Format with Prettier |
| `test` | Unit tests via Jest |
| `e2e` | Playwright end-to-end tests |
| `prepare` | Husky git hooks install |

---

## 6  Project Structure (early phase)

```
maetopia/
├─ public/
│  ├─ assets/backgrounds/
│  └─ assets/placeholders/
├─ src/
│  ├─ components/    # React components (Canvas, AssetPicker, etc.)
│  ├─ hooks/         # Reusable hooks (useCanvas, useDrag)
│  ├─ store/         # Zustand global state
│  ├─ utils/         # Helpers (assetLoader, pngExporter)
│  ├─ types/         # Shared TypeScript types
│  └─ main.tsx
├─ .env.example
├─ tailwind.config.js
└─ ...
```

---

## 7  Supabase Schema (overview)

| Table | Purpose |
|-------|---------|
| `users` | Auth users (email, OAuth) |
| `projects` | Saved cities – title, layers JSON, storage bar JSON, snapshot, undo history |
| `uploads` | User-uploaded assets – path, metadata (type, version, anchor, etc.) |
| `materials` | Cost catalogue for future calculator |

Detailed SQL migrations live under `supabase/migrations/`.

---

## 8  Roadmap
- [x] Repository & Vite + React + Tailwind bootstrap  
- [ ] Build PixiJS `CityCanvas` with responsive wrapper  
- [ ] Asset loading & placeholder icons  
- [ ] Drag-and-drop placement & layer manager  
- [ ] Scrollable storage bar  
- [ ] Supabase persistence & authentication  
- [ ] PNG export button  
- [ ] Testing, Storybook docs, CI/CD pipeline  
- [ ] Public launch on Vercel ✨  

Follow the GitHub Issues board for granular tasks.

---

## 9  Contributing
1. Fork the repo & create a feature branch (`feat/my-feature`).
2. Run `npm run lint && npm run test` before committing.
3. Open a Pull Request – all CI checks must pass.
4. Be kind & keep code kid-safe.

---

## 10  License & Assets
Code is **MIT** licensed.  
Placeholder graphics are **CC0 or MIT** – see `LICENSES.md` for individual attributions.

---

Happy building – let’s create a magical city for Maelyn! 🧱🌳🏦
