# Model Conversion: SSD MobileNet v1 → ONNX

## Overview
The melon detection model is a TF1 SSD MobileNet v1 frozen graph from the Object Detection API.
It is converted to ONNX once (offline) and served as a static file.

## Prerequisites (Python 3.11 venv)

```bash
cd /path/to/Melon-Ripeness-Detector
python3.11 -m venv .venv
source .venv/bin/activate
pip install "tf2onnx>=1.17" "tensorflow-macos" "onnx==1.16.0" "onnxruntime==1.19.2" numpy networkx
```

## Conversion command

```bash
source .venv/bin/activate

python -m tf2onnx.convert \
  --graphdef ssd_melon_model_18853/frozen_inference_graph.pb \
  --output web/public/model/melon_ssd.onnx \
  --inputs "image_tensor:0[1,360,480,3]" \
  --outputs "detection_boxes:0,detection_scores:0,detection_classes:0,num_detections:0" \
  --opset 13
```

## Output model specification

| Property | Value |
|----------|-------|
| File | `web/public/model/melon_ssd.onnx` |
| Size | ~21 MB |
| Input tensor | `image_tensor:0` — `uint8[1, 360, 480, 3]` (RGB, channels-last) |
| Output: boxes | `detection_boxes:0` — `float32[1, N, 4]` — `[ymin, xmin, ymax, xmax]` normalized 0–1 |
| Output: scores | `detection_scores:0` — `float32[1, N]` — confidence per detection |
| Output: classes | `detection_classes:0` — `float32[1, N]` — class ID (1=Melon, 2=not) |
| Output: count | `num_detections:0` — `float32[1]` — number of valid detections |
| Score threshold | 0.7 (applied in detector.ts) |

**Important: input is RGB uint8.** The original Python code used OpenCV BGR and `swapRB=True`
in `cv2.dnn.blobFromImage`, which converts to RGB internally. Browser canvas ImageData is
already in RGBA order — after dropping alpha, channel order is RGB, which is what the model expects.

## Verify conversion

```bash
source .venv/bin/activate
python3 - << 'EOF'
import onnxruntime as ort
import numpy as np

session = ort.InferenceSession('web/public/model/melon_ssd.onnx')
print("Inputs:", [(i.name, i.shape, i.type) for i in session.get_inputs()])
print("Outputs:", [(o.name, o.shape, o.type) for o in session.get_outputs()])

dummy = np.random.randint(0, 255, (1, 360, 480, 3), dtype=np.uint8)
outputs = session.run(None, {'image_tensor:0': dummy})
print("Output shapes:", [o.shape for o in outputs])
EOF
```

## TF.js fallback (not needed — ONNX conversion succeeded)

If ONNX conversion ever fails on a new platform:
```bash
pip install tensorflowjs
tensorflowjs_converter \
  --input_format=tf_saved_model \
  --output_format=tfjs_graph_model \
  ./ssd_melon_model_18853/saved_model/ \
  ./web/public/model/tfjs/
```
Then replace `onnxruntime-web` with `@tensorflow/tfjs` in runtime.ts and update detector.ts
to use `tf.loadGraphModel()` and the TF.js inference API.
