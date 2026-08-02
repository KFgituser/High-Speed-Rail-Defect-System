# Frontend

React + Vite frontend application for login, defect queries, maintenance ledger views, detail inspection, data export, and 2D/3D visualization result pages.

## Requirements

- Node.js 18+
- npm

## Start The App

```bash
npm install
npm run dev
```

Default local URL:

```text
http://localhost:5173
```

## Backend API Configuration

The local development default is:

```text
http://localhost:8080/api
```

To customize it, create `frontend/.env.local`:

```env
VITE_API_BASE=http://localhost:8080/api
```

## Commands

| Command | Description |
| --- | --- |
| `npm run dev` | Starts the development server. |
| `npm run build` | Builds the production bundle. |
| `npm run preview` | Previews the production build locally. |

## Pages

- `/`: Login page.
- `/query`: Defect query and maintenance ledger page.
- `/visualization/2d`: 2D visualization result page.
- `/visualization/3d`: 3D visualization result page.
