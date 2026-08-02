# Database Setup

This directory contains MySQL schema and demo seed data for the high-speed rail defect detection system.

The scripts are cleaned for portfolio use. They contain table definitions and small demo records only. Raw DAS datasets, generated `.npy` files, model checkpoints, and private production data are not included.

## Files

| File | Description |
| --- | --- |
| `schema.sql` | Creates the `railline` database and application tables. |
| `seed-demo.sql` | Inserts small demo records for lines, defect types, detections, ledgers, visualization slots, and analysis results. |
| `load-data-example.sql` | Shows how CSV import can be performed with `LOAD DATA LOCAL INFILE`. It is an example only. |

## Import Order

```bash
mysql -u root -p < schema.sql
mysql -u root -p < seed-demo.sql
```

The backend defaults to:

```text
jdbc:mysql://localhost:3306/railline
```

Configure custom database access through backend environment variables:

```env
DB_URL=jdbc:mysql://localhost:3306/railline?sslMode=DISABLED&allowPublicKeyRetrieval=true&serverTimezone=UTC&characterEncoding=utf8
DB_USERNAME=root
DB_PASSWORD=your_password
```

