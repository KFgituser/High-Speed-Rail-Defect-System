# API Reference

Default backend base URL:

```text
http://localhost:8080/api
```

## Authentication

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/login` | Authenticates a user and returns login credentials or token information. |

## Metadata

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/lines` | Returns the available railway lines. |
| `GET` | `/disease-types` | Returns the available defect or disease types. |

## Defect And Ledger Data

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/detections` | Queries defect detection results. |
| `GET` | `/ledgers` | Queries maintenance ledger records. |
| `GET` | `/details/{id}` | Returns detail data for a detection or ledger item. |

Common query parameters:

| Parameter | Description |
| --- | --- |
| `line` | Railway line name. |
| `type` | Optional single type selected in one result table. |
| `types` | Comma-separated types selected in the main query form. When `type` is also set, both filters apply. |
| `minMileage`, `maxMileage` | Inclusive numeric mileage bounds in metres; `K500+123` is `500123`. |
| `severity` | One of `轻微`, `一般`, or `严重`. |
| `start`, `end` | Inclusive ISO dates (`YYYY-MM-DD`). |
| `q` | Optional description or location text search. |
| `page`, `size` | Zero-based page number and page size (1–100). |
| `sortDir` | `asc` or `desc` by record date. |

Both list endpoints apply filters in the database before pagination and return a page object with `content`, `page`, `size`, `totalElements`, and `totalPages`.

## Export

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/export-detection` | Exports defect detection results as an Excel file. |
| `GET` | `/export-ledger` | Exports maintenance ledger records as an Excel file. |
| `GET` | `/export-all` | Exports the combined dataset as an Excel file. |
| `GET` | `/export-detail/{id}` | Exports the selected detection or ledger detail. |

Exports accept `line`, `types`, `minMileage`, `maxMileage`, `start`, `end`, and `q`. Use `detectionType` / `detectionSeverity` for the detection sheet and `ledgerType` / `ledgerSeverity` for the ledger sheet. These match the two table filters on the query page.

## Visualization

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/viz/run2d` | Starts a 2D visualization task. |
| `GET` | `/viz/run2d/stream` | Streams 2D visualization task output. |
| `POST` | `/viz3d/run` | Starts a 3D visualization task. |
| `GET` | `/viz3d/status/{uuid}` | Returns the status of a 3D visualization task. |
| `GET` | `/slots` | Lists visualization slots. |
| `POST` | `/slots/{slotId}` | Saves a visualization slot. |
| `DELETE` | `/slots/{slotId}` | Deletes a visualization slot. |
| `POST` | `/slots/{slotId}/snapshot` | Saves a snapshot for a visualization slot. |

## Notes

Detailed request and response fields can be expanded from the controller implementations in:

```text
backend/src/main/java/com/bjtu/raillinebackend/controller
```
