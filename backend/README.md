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
| `DB_USERNAME` | `root` | Database username. |
| `DB_PASSWORD` | Empty | Database password. |
| `JWT_SECRET` | Example value | JWT signing secret. Replace it before deployment. |
| `PYTHON_EXE` | `C:/Python313/python.exe` | Python executable path. |
| `ANALYZE_SCRIPT` | `../python-analysis/scripts/plot_npy.py` | NPY analysis script path. |
| `VIZ_SCRIPT_2D` | `../python-analysis/scripts/front_side_2D.py` | 2D visualization script path. |
| `VIZ_SCRIPT_3D` | `../python-analysis/scripts/front_side_3D.py` | 3D visualization script path. |
| `VIZ_SCRIPT_3D_AMP` | `../python-analysis/scripts/front_side_3Damps_server.py` | 3D amplitude visualization script path. |

## Main Modules

- `controller`: REST API controllers.
- `service`: Business logic, query handling, visualization task handling, and result processing.
- `repository`: Spring Data JPA repositories.
- `security`: JWT authentication and request filtering.
- `viz`: Python script execution wrapper.
The Python analysis and visualization scripts are kept in the top-level `python-analysis/` module and are referenced by backend configuration.
