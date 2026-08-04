# High-Speed Rail Defect Frontend

React frontend for a high-speed rail defect detection and visualization system.

This interface brings login, multilingual navigation, defect query workflows, and 2D/3D visualization pages into one portfolio-friendly repository.

![Login screen](./docs/login-screen.png)

## Features

- React + Vite frontend
- Chinese and English language switching
- Login page with remembered account support
- Defect query, detail, and export workflows
- 2D and 3D visualization pages connected to the backend API

## Getting Started

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm start
```

Open:

```text
http://localhost:3000/
```

Build for production:

```bash
npm run build
```

## Backend API

By default, the frontend connects to:

```text
http://localhost:8080/api
```

You can override it with:

```env
VITE_API_BASE=http://localhost:8080/api
```
