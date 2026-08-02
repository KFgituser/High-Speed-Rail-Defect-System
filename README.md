# High-Speed Rail Defect Detection System

A full-stack web system for high-speed railway defect detection, inspection record management, and 2D/3D visualization. The project combines a React frontend, a Spring Boot backend, MySQL data storage, Excel export, and Python-based visualization scripts into one portfolio-friendly repository.

![Defect validation overview](docs/screenshots/defect-validation-overview.png)

## Project Highlights

- Full-stack project structure with separate `frontend/` and `backend/` modules.
- Defect query workflow based on railway line, mileage range, inspection date, severity, and defect type.
- Side-by-side comparison between detection results and maintenance ledger records.
- Detail modal for defect history, suggestions, and inspection metadata.
- Excel export for detection results, ledger records, and combined datasets.
- 2D/3D visualization workflow with generated analysis images and downloadable results.
- Environment-variable-based backend configuration to avoid committing local passwords, script paths, or secrets.


## Repository Structure

```text
High-Speed-Rail-Defect-System/
├─ backend/              # Spring Boot backend service
├─ frontend/             # React + Vite frontend application
├─ docs/                 # Architecture notes, API docs, and screenshots
├─ deploy/               # Local dependency setup
└─ README.md             # Project overview and setup guide
```

## Tech Stack

| Layer | Technologies |
| --- | --- |
| Frontend | React, Vite, Axios, React Router, i18next, Bootstrap |
| Backend | Java 17, Spring Boot, Spring Security, Spring Data JPA, JWT |
| Database | MySQL |
| Visualization | Python scripts for 2D/3D defect analysis outputs |
| Export | Apache POI |

## Features

- User login and JWT-based authentication
- Railway line and defect type metadata APIs
- Defect detection result query, filtering, sorting, and pagination
- Maintenance ledger query, filtering, sorting, and pagination
- Defect detail view with history and maintenance suggestion
- Excel export for detection, ledger, and combined data
- 2D visualization generation and result display
- 3D scatter and amplitude visualization generation, display, and download
- Chinese/English UI language support

## Local Setup

### 1. Start MySQL

```bash
cd deploy
docker compose up -d
```

The default database is `railline`. The default local credentials are defined in [deploy/docker-compose.yml](deploy/docker-compose.yml).

For a custom database, configure:

```text
DB_URL
DB_USERNAME
DB_PASSWORD
```

### 2. Start the Backend

```bash
cd backend
./mvnw spring-boot:run
```

On Windows:

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

The backend runs at:

```text
http://localhost:8080
```

### 3. Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend runs at:

```text
http://localhost:5173
```

By default, the frontend calls:

```text
http://localhost:8080/api
```

To change the backend API address, create `frontend/.env.local`:

```env
VITE_API_BASE=http://localhost:8080/api
```

## Backend Configuration

The backend configuration is stored in `backend/src/main/resources/application.yml` and supports environment variables.

Common variables:

| Variable | Description |
| --- | --- |
| `SERVER_PORT` | Backend service port |
| `DB_URL` | MySQL JDBC URL |
| `DB_USERNAME` | MySQL username |
| `DB_PASSWORD` | MySQL password |
| `JWT_SECRET` | JWT signing secret |
| `PYTHON_EXE` | Python executable path |
| `ANALYZE_SCRIPT` | NPY analysis script path |
| `VIZ_SCRIPT_2D` | 2D visualization script path |
| `VIZ_SCRIPT_3D` | 3D visualization script path |

## Documentation

- [System Architecture](docs/architecture.md)
- [API Reference](docs/api.md)
- [Backend Guide](backend/README.md)
- [Frontend Guide](frontend/README.md)

## Screenshots

| Defect Validation | 3D Scatter |
| --- | --- |
| ![Defect validation](docs/screenshots/defect-validation-overview.png) | ![3D scatter](docs/screenshots/visualization-3d-scatter.png) |

| 3D Amplitude |
| --- |
| ![3D amplitude](docs/screenshots/visualization-3d-amplitude.png) |

## Portfolio Summary

This project demonstrates full-stack engineering ability across frontend UI development, backend API design, authentication, data querying, export workflows, and visualization integration.

Suggested resume entry:

```text
High-Speed Rail Defect Detection System
Full-stack web system built with React, Spring Boot, MySQL, JWT authentication, Excel export, and Python-based 2D/3D visualization.
https://github.com/KFgituser/High-Speed-Rail-Defect-System
```
