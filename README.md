# Chores Planner PWA

A modern, feature-rich Progressive Web App for managing household chores and tasks.

## Features

- 📅 **Multiple Views** — Today, Week, Month views with smart scheduling
- 🔄 **Recurring Chores** — Flexible recurrence patterns (daily, weekly, monthly, custom)
- 🏷️ **Categories** — Organize chores by custom categories with colors and icons
- 📱 **Responsive Design** — Works seamlessly on mobile, tablet, and desktop
- 🌐 **Offline First** — Full PWA support with Workbox service worker
- ☁️ **Cloud Sync** — Firebase Auth + Firestore for cloud backup across devices
- 🔔 **Notifications** — Web Notifications API for task reminders
- 📊 **History Tracking** — Review completed chores and track patterns
- 🎨 **Beautiful UI** — Vuetify 3 components with custom design tokens

## Tech Stack

- **Frontend** — Vue 3 (Composition API) + Vite 5
- **Templates** — Pug
- **UI Components** — Vuetify 3
- **State Management** — Pinia
- **Routing** — Vue Router 4
- **Local Storage** — Dexie.js (IndexedDB)
- **Cloud Backend** — Firebase (Auth + Firestore)
- **Icons** — MDI + Lucide Vue Next
- **Styling** — SCSS with CSS custom properties
- **PWA** — Workbox via vite-plugin-pwa

## Getting Started

### Prerequisites

- Node 18.x or higher
- npm/yarn/pnpm

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open http://localhost:5173 in your browser.

### Build

```bash
npm run build
```

Production files are in `dist/`.

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
src/
├── components/
│   ├── chores/          — Chore-related components
│   ├── layout/          — App shell, navigation
│   ├── shared/          — Reusable components
│   └── views/           — Page components
├── composables/         — Vue composables
├── db/                  — Dexie schema and initialization
├── plugins/             — Vuetify, Firebase config
├── router/              — Vue Router setup
├── stores/              — Pinia stores
└── styles/              — Global styles and design tokens
```

## Configuration

Create a `.env` file with Firebase credentials (Firebase setup is optional for local development):

```env
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## License

MIT
