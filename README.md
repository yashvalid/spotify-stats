# STATIFY

> **Your Spotify listening history, decoded.**

A client-side Spotify analytics dashboard and roast generator. Statify transforms your streaming data into visual breakdowns and musical insights.

---

## 🎨 Features

- **⚡ Live Spotify Synchronization**
  - Instant 1-click authentication using **Spotify OAuth 2.0 PKCE** (Proof Key for Code Exchange).
  - No client secret required, running entirely in your browser.
  - Explore your listening profile across multiple time horizons:
    - **Short Term** (Last 4 Weeks)
    - **Medium Term** (Last 6 Months)
    - **Long Term / All-Time** (Last 12+ Months)

- **📁 Extended History Archive Parser**
  - Drop in your official Spotify GDPR data download (`endsong.json` or `.zip`).
  - Processes millions of milliseconds of streaming history locally using **IndexedDB**.
  - Accurately tracks exact minutes played, skip rates, and historical trends dating back years.

- **📊 Comprehensive Breakdown**
  - **Top Tracks & Albums**: Ranked by total stream time or play count with aggregated album stats.
  - **Top Artists & Genres**: Visual distribution of your most-played creators and niche genres.
  - **Circadian Clock & Heatmap**: Discover your peak listening hours (morning routine vs. 2 AM loops) and monthly trends.

- **🔥 Roast My Spotify**
  - A brutally honest, witty algorithmic critique of your music taste, obsessive track repeats, and questionable late-night listening habits.

- **🖼️ Shareable Wrapped Cards**
  - Generate exportable summary cards featuring your top artists and tracks.

- **🔒 100% Private & Serverless**
  - Zero listening data or Spotify tokens ever leave your browser.
  - No backend database, tracking scripts, or analytics middleman.

---


## 🛠️ Tech Stack

- **Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite 6](https://vitejs.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Storage**: Browser IndexedDB & LocalStorage
- **Deployment**: [Vercel](https://vercel.com/) (configured via `vercel.json`)

---

## 🚀 Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/) or [pnpm](https://pnpm.io/)
- A Spotify account (Free or Premium)

### 2. Clone the Repository
```bash
git clone https://github.com/yashvalid/spotify-stats.git
cd spotify-stats
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Configure Spotify Developer Application
1. Go to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) and create a new App.
2. In the app settings, set the **Redirect URI** to:
   - For local development: `http://127.0.0.1:5173/`
   - For production: `https://your-domain.vercel.app/`
3. Copy your **Client ID**.
4. Create a `.env` file in the project root:
   ```bash
   cp .env.example .env
   ```
5. Add your Client ID to `.env`:
   ```env
   VITE_SPOTIFY_CLIENT_ID=your_spotify_client_id_here
   ```
   *(Note: If no `.env` is supplied, users can also input their Client ID directly within the app's settings dialog).*

### 5. Run the Development Server
```bash
npm run dev
```

Open [http://127.0.0.1:5173](http://127.0.0.1:5173) in your browser.

> **Note:** Spotify OAuth requires `127.0.0.1` rather than `localhost` for strict URI loopback validation. Vite is pre-configured to bind to `127.0.0.1`.

---

## 📦 Production Build

To create an optimized production build:

```bash
npm run build
```

To preview the production build locally:

```bash
npm run preview
```

---

## 📜 Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the Vite development server on `http://127.0.0.1:5173` |
| `npm run build` | Type-checks with `tsc` and builds the production bundle |
| `npm run preview` | Locally serves the production build |

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
