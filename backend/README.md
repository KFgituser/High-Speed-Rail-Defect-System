# Backend

Spring Boot backend service for authentication, defect queries, maintenance ledger queries, Excel export, and 2D/3D visualization task APIs.

## Requirements

- Java 17
- MySQL 8.x
- Maven Wrapper, included in this directory

## Start The Service

```bash
./mvnw spring-boot:run
```

On Windows:

```powershell
.\mvnw.cmd spring-boot:run
```

## Environment Variables

| Variable | Default | Description |
| --- | --- | --- |
| `SERVER_PORT` | `8080` | Backend service port. |
| `DB_URL` | `jdbc:mysql://localhost:3306/railline?...` | MySQL connection URL. |
| `DB_USERNAME` | Required | Database username. |
| `DB_PASSWORD` | Required | Database password. |
| `APP_JWT_SECRET` | Required | JWT signing secret, at least 32 characters. |
| `INIT_ADMIN_ENABLED` | `false` | Create an initial administrator when enabled. |
| `INIT_ADMIN_USERNAME` / `INIT_ADMIN_PASSWORD` | Empty | Initial administrator credentials. |
| `PYTHON_EXE` | Local path | Python executable path. |
| `JH_CODEBASE_DIR` | Local path | Visualization scripts and output directory. |
| `NPY_DIR` | Local path | DAS `.npy` data directory. |

## Main Modules

- `controller`: REST API controllers.
- `service`: Business logic, query handling, visualization task handling, and result processing.
- `repository`: Spring Data JPA repositories.
- `security`: JWT authentication and request filtering.
- `viz`: Python script execution wrapper.
The full Python analysis environment and raw DAS datasets are external; set `JH_CODEBASE_DIR` and `NPY_DIR` to use them. The public `python-analysis/` module contains examples for repository review.
