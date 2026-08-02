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
| `type` | Defect type. |
| `start` | Start date. |
| `end` | End date. |

## Export

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/export-detection` | Exports defect detection results as an Excel file. |
| `GET` | `/export-ledger` | Exports maintenance ledger records as an Excel file. |
| `GET` | `/export-all` | Exports the combined dataset as an Excel file. |

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
