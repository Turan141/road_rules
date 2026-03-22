# RoadChange - Azerbaijan

A modern, minimalistic web application that informs users about recent changes in road rules on specific streets in Azerbaijan (e.g., streets becoming one-way, turn restrictions, etc.).

## Core Goal

- **What changed**
- **Where it changed**
- **How it affects them right now**

## Key UX Principle

"Show the problem before the user makes a mistake."

## Features

- **Live Location Awareness**: Mocked geolocation to show nearby changes.
- **Before / After Mode**: Click on map markers to see how rules shifted.
- **Interactive Map**: Built with Mapbox GL JS.
- **Smart Feed**: List of recent changes sorted by time/proximity.

## Tech Stack

- Frontend: React (Vite), TypeScript, Tailwind CSS
- Map: MapLibre GL
- Icons: Lucide React

## Folder Structure

- `/src/components` - Shared UI logic
- `/src/features/map` - Map and marker visualizations
- `/src/features/alerts` - Warning systems
- `/src/features/feed` - Feed layout
- `/src/data` - Mock road change data for Baku, Azerbaijan

## How to Run

1. **Install Dependencies**
   ```bash
   npm install
   ```
2. **Configure Environment Variables**
   Copy `.env.example` to `.env` and set the required values:
   - `DATABASE_URL` for Neon/Postgres
   - `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `ADMIN_SECRET` for reviewer login
   - `AUTH_SECRET` is also supported as a backward-compatible alias for `ADMIN_SECRET`
   - `VITE_API_URL` only if frontend and API are served from different origins
3. **Initialize the Database**
   Run the SQL from `database/schema.sql` in your Neon/Postgres database before the first deploy.
4. **Run the App**
   ```bash
   npm run dev
   ```
5. **Build for Production**
   ```bash
   npm run build
   ```

## Production Notes

- Reviewer moderation now uses server-side session cookies. Admin actions require valid auth on the API.
- Report uploads are validated for type and size before submission.
- Free abuse protections are enabled on report submission: profanity/spam filtering, link/contact blocking, honeypot detection, and duplicate-report rejection.
- API requests for moderation expect the env variables listed above to be configured in Vercel.
