# Melon Ripeness Detector

A pure client-side web app that detects melons in a camera feed and estimates ripeness in real time. All inference runs in the browser — no backend, no server round-trips. The pipeline combines SSD MobileNet object detection, HSV color segmentation, Mamdani fuzzy logic, and blob-based sick detection.

## Quick start (development)

```bash
cd web
npm install
npm run dev
```

The ONNX model must be present at `public/model/melon_ssd.onnx` before starting. It is converted from the frozen TensorFlow graph — see `../scripts/convert_model.md` for the exact command.

## Production build

```bash
npm run build
# Static output is written to dist/
```

## Docker

```bash
docker build -t melon-ripeness-detector .
docker run -p 8080:80 melon-ripeness-detector
# Open http://localhost:8080
```

The included `nginx.conf` sets the correct WASM MIME type and COOP/COEP headers automatically.

## Model conversion (one-time)

The ONNX model is converted from `ssd_melon_model_18853/frozen_inference_graph.pb`. The exact conversion command and environment requirements are documented in `../scripts/convert_model.md`.

## Architecture

- **Object detection**: SSD MobileNet v1 via ONNX Runtime Web (WASM backend)
- **Color segmentation**: HSV masking via OpenCV.js
- **Ripeness inference**: Mamdani fuzzy logic (pure TypeScript, no external library)
- **Sick detection**: blob counting via OpenCV.js

## Why COOP/COEP headers

`Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp` are required to enable `SharedArrayBuffer`, which ONNX Runtime Web uses for multi-threaded WASM execution.
