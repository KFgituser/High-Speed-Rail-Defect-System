# Visualization Scripts

This directory contains the Python entry scripts that are called by the web system's visualization workflow. Large model checkpoints, raw DAS datasets, generated `.npy` files, and runtime output folders are intentionally excluded from Git.

## Script Mapping

| Workflow | Script | Backend entry | Frontend trigger |
| --- | --- | --- | --- |
| 2D defect visualization | `front_side_2D.py` | `Viz2DStreamController` | `Visualization2DPage.jsx` calls `/api/viz/run2d/stream` |
| 3D scatter visualization | `front_side_3D.py` | `Run3DService` / 3D visualization backend flow | `Visualization2DPage.jsx` calls `/api/viz/run3d` |
| 3D amplitude visualization | `front_side_3Damps_server.py` | `VizRun3DAmpService` / 3D amplitude backend flow | `Visualization3DPage.jsx` calls `/api/viz/run3damp/start` |

## Runtime Configuration

The backend reads script paths from `backend/src/main/resources/application.yml`.

```env
VIZ_SCRIPT_2D=./scripts/front_side_2D.py
VIZ_SCRIPT_3D=./scripts/front_side_3D.py
VIZ_SCRIPT_3D_AMP=./scripts/front_side_3Damps_server.py
VIZ_OUTPUT_DIR=./output
VIZ_WORK_DIR=./runs
VIZ_NPY_DIR=./data
VIZ_LANG=en
```

## Required Local Artifacts

The scripts are kept in the repository as integration entry points for portfolio review. A full local run may still require environment-specific artifacts:

- model checkpoints under `backend/scripts/check_point/`
- raw DAS `.npy` data files
- generated intermediate files such as `amps_stack.npy`, `x_labels.npy`, and `total_time_seconds.npy`
- local Python packages such as `numpy`, `matplotlib`, and, for the 2D model pipeline, `torch` and related model modules

These files are excluded to keep the repository lightweight and safe for GitHub.
