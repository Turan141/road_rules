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
- Map: Mapbox GL JS
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
2. **Setup Mapbox Token**
   Open `src/features/map/MapboxMap.tsx` and replace `MAPBOX_TOKEN` with your Mapbox access token if needed. (A public default provides limited access).
3. **Run the App**
   ```bash
   npm run dev
   ```
4. **Build for Production**
   ```bash
   npm run build
   ```

## Next Steps for Production

- Create Node/Express backend to fetch live road data.
- Connect live GPS coordinates inside `useEffect` in `App.tsx`.
- Connect to Waze or Google Maps APIs for real-time routing issues.
