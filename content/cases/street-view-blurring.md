---
slug: street-view-blurring
title: "Street View Blurring (Faces & License Plates)"
difficulty: 3
prerequisites: [framing, metrics, data, model, serving, monitoring]
xp: 170
summary: "Privacy-by-default: every Street View image must have faces and license plates blurred BEFORE anyone sees it."
stages:
  - title: "Problem Framing"
    intro: "What does the model decide, and what gets done with that decision?"
    rubric: |
      Goal: protect user privacy by detecting and blurring faces and license plates in
      Street View imagery.
      ML task: object detection (find boxes around objects + classify them).
      Latency: NOT real-time. We can run offline before serving.
      Dataset: 1M annotated images with faces and plates labeled.
      Out of scope: fairness/bias work in this design pass.
    prompts:
      - type: mcq
        prompt: "What's the SYSTEM doing?"
        choices:
          - "Predicting if a Street View image is interesting"
          - "Finding faces and license plates in images and blurring them before display"
          - "Translating text in images"
        answer: 1
      - type: mcq
        prompt: "Is this a real-time problem?"
        choices:
          - "Yes — the user is waiting"
          - "No — we can detect and blur OFFLINE before serving images"
          - "Real-time is required for accuracy"
        answer: 1
        explanation: "Privacy is preserved by processing offline, then serving the blurred image."
      - type: mcq
        prompt: "Object detection actually has TWO sub-tasks. Which?"
        choices:
          - "Captioning + segmentation"
          - "Locating each object (regression on bounding-box coords) + classifying its type (face vs plate)"
          - "Encoding + decoding"
        answer: 1
      - type: match
        prompt: "Sort each item: in scope or OUT of scope."
        pairs:
          - { left: "Detect human faces", right: "In scope" }
          - { left: "Detect license plates", right: "In scope" }
          - { left: "Address dataset bias by race/age/gender", right: "Out of scope (this pass)" }
          - { left: "Blur images BEFORE display", right: "In scope" }
      - type: fill
        prompt: "We have ____ million manually annotated Street View images with bounding boxes."
        answers: ["1", "one"]
      - type: mcq
        prompt: "Why might dataset BIAS be a serious risk here, even if 'out of scope' for now?"
        choices:
          - "Models can underdetect faces from underrepresented groups → uneven privacy protection"
          - "It would slow training"
          - "It would change file size"
        answer: 0

  - title: "Metrics"
    intro: "Object detection quality has classic metrics. Pick recall-heavy thresholds for privacy."
    rubric: |
      Offline:
        • IoU (Intersection over Union) — how well predicted boxes overlap ground truth
        • Precision & Recall at IoU thresholds (e.g. 0.5)
        • mAP — average precision averaged across IoU thresholds and classes
      Privacy-tilt: prefer high RECALL — missing a face is worse than over-blurring
      something innocent.
      Online: user reports of un-blurred content; visual QA spot-checks.
    prompts:
      - type: mcq
        prompt: "What does IoU MEASURE?"
        choices:
          - "Inference speed"
          - "Overlap between the predicted bounding box and the ground-truth box (intersection ÷ union)"
          - "Loss value"
        answer: 1
      - type: mcq
        prompt: "Should we tilt the system toward higher PRECISION or higher RECALL?"
        choices:
          - "Precision — never blur something that isn't a face"
          - "Recall — missing a face is a privacy violation; over-blurring is just an inconvenience"
          - "Doesn't matter"
        answer: 1
        explanation: "Privacy product → asymmetric cost. False negatives are FAR worse than false positives."
      - type: match
        prompt: "Sort each metric into its bucket."
        pairs:
          - { left: "mAP @ IoU 0.5 on holdout", right: "Offline" }
          - { left: "User reports of un-blurred faces", right: "Online" }
          - { left: "Manual QA spot-check pass rate", right: "Online (operational)" }
          - { left: "Per-image inference latency in pipeline", right: "Operational" }
      - type: fill
        prompt: "mAP averages precision across multiple IoU ____ to summarize detection quality."
        answers: [thresholds, threshold]
      - type: mcq
        prompt: "What's a useful GUARDRAIL metric for this product?"
        choices:
          - "Number of GPUs in use"
          - "Rate of user reports of un-blurred content (tells us we MISSED faces or plates in the wild)"
          - "Cache hit rate"
        answer: 1
      - type: mcq
        prompt: "What's a downside of optimizing PURELY for recall?"
        choices:
          - "We'll over-blur — innocent objects get blurred, hurting image usefulness"
          - "Recall isn't a metric"
          - "Recall is illegal"
        answer: 0

  - title: "Data"
    intro: "Annotated boxes plus heavy augmentation. Synthetic variation is your friend."
    rubric: |
      Annotated dataset: 1M images, each with bounding boxes (x, y, w, h) and class label.
      Street View images: raw imagery to be processed.
      Preprocessing: resize, scale, normalize (and KEEP boxes consistent with transforms).
      Data augmentation: random crop, flip, rotation, brightness, noise.
        Crucially: when the image is rotated/flipped, the bounding boxes have to be
        transformed too.
      Offline vs online aug: offline pre-computes (faster training, more storage); online
      augments per batch (less storage, slower).
    prompts:
      - type: mcq
        prompt: "What does each LABEL look like in the training data?"
        choices:
          - "A class label per image"
          - "A list of bounding boxes (x, y, width, height) plus a class label per box"
          - "A heatmap"
        answer: 1
      - type: mcq
        prompt: "When you ROTATE the input image during augmentation, what must happen to the labels?"
        choices:
          - "Nothing"
          - "The bounding boxes also need to be rotated/transformed to match"
          - "Delete them"
        answer: 1
      - type: match
        prompt: "Sort each augmentation: 'safe (label unchanged)' vs 'requires box transform'."
        pairs:
          - { left: "Brightness change", right: "Safe — box unchanged" }
          - { left: "Horizontal flip", right: "Requires box transform" }
          - { left: "Rotation", right: "Requires box transform" }
          - { left: "Add Gaussian noise", right: "Safe — box unchanged" }
      - type: order
        prompt: "Order standard image preprocessing."
        items:
          - "Resize to a fixed input size"
          - "Scale pixel values to [0, 1]"
          - "Normalize (z-score)"
          - "Apply augmentations (with box transforms where needed)"
      - type: fill
        prompt: "Augmenting images BEFORE training and storing the result is called ____ augmentation."
        answers: [offline]
      - type: mcq
        prompt: "When would you choose ONLINE augmentation over offline?"
        choices:
          - "When you're short on STORAGE — no pre-computed augmented copies; pay the CPU cost during training"
          - "When you have unlimited storage"
          - "When you have no GPU"
        answer: 0
      - type: mcq
        prompt: "Why does augmentation help especially well here?"
        choices:
          - "Faces and plates appear at many angles, scales, and lighting conditions in the wild"
          - "It reduces label cost"
          - "It increases image resolution"
        answer: 0

  - title: "Model"
    intro: "Two-stage detectors are the workhorse — accuracy over speed, since we run offline."
    rubric: |
      Two-stage detector (Faster R-CNN family):
        Stage 1: Region Proposal Network (RPN) suggests candidate boxes.
        Stage 2: Classifier scores each candidate (face / plate / background) and refines
                 the box.
      Loss = regression loss (box coords) + classification loss.
      One-stage alternatives (YOLO, SSD): faster but less accurate. Pick later if needed.
      DETR (Transformer-based) is a newer alternative.
    prompts:
      - type: mcq
        prompt: "Why TWO-stage instead of one-stage here?"
        choices:
          - "Two-stage is usually MORE ACCURATE; we can afford it because inference is offline"
          - "Two-stage is faster"
          - "Single stage is illegal"
        answer: 0
      - type: order
        prompt: "Order the two-stage detection flow."
        items:
          - "Convolutional backbone produces a feature map from the image"
          - "Region Proposal Network suggests candidate boxes"
          - "For each candidate, classifier predicts the object class"
          - "Box regression refines the bounding-box coordinates"
      - type: mcq
        prompt: "What's the LOSS function trying to optimize?"
        choices:
          - "Just classification accuracy"
          - "Classification loss (face/plate/background) PLUS box regression loss (box coordinates)"
          - "Just IoU"
        answer: 1
      - type: match
        prompt: "Match the family to its CHARACTER."
        pairs:
          - { left: "Faster R-CNN (two-stage)", right: "More accurate, slower" }
          - { left: "YOLO / SSD (one-stage)", right: "Faster, slightly less accurate" }
          - { left: "DETR (Transformer)", right: "Newer; competitive on many benchmarks" }
      - type: fill
        prompt: "The component that suggests candidate boxes in stage 1 is the Region ____ Network."
        answers: [Proposal, proposal]
      - type: mcq
        prompt: "Why care about RECALL of the RPN specifically?"
        choices:
          - "If the RPN MISSES a face, no downstream stage can recover it — it's gone"
          - "RPNs are slow"
          - "Recall doesn't matter at stage 1"
        answer: 0
      - type: mcq
        prompt: "When might you switch to a ONE-stage model later?"
        choices:
          - "When training data jumps to billions or you need real-time latency"
          - "Whenever GPUs are cheaper"
          - "Never"
        answer: 0

  - title: "Serving"
    intro: "Batch pipeline: ingest raw images, detect, blur, store the safe version, serve."
    rubric: |
      Batch pipeline (offline, no real-time pressure):
        1. New Street View imagery lands in storage
        2. Detection job runs the model and outputs boxes + classes
        3. Blurring service applies pixel-level blur to the boxes
        4. Blurred image stored — original is locked away or destroyed
        5. Only blurred imagery is ever served to users
      User-report channel: users can flag images that still contain a face / plate.
      Reports flow into a re-processing queue and become labeled training data.
    prompts:
      - type: mcq
        prompt: "Should this be ONLINE or BATCH inference?"
        choices:
          - "Online — every page-view computes blur"
          - "Batch — process imagery offline, ship the blurred result"
          - "Doesn't matter"
        answer: 1
      - type: order
        prompt: "Order the batch processing pipeline."
        items:
          - "New raw images land in object storage"
          - "Detection job runs the model and outputs boxes + classes"
          - "Blurring service blurs each detected region"
          - "Blurred image stored; raw image locked or removed"
          - "Only the blurred image is served to users"
      - type: mcq
        prompt: "What happens when a user REPORTS an un-blurred face they spotted?"
        choices:
          - "Nothing"
          - "The image is queued for re-processing AND becomes a labeled training example for the next model version"
          - "The user gets banned"
        answer: 1
      - type: mcq
        prompt: "What guards against accidentally serving the RAW image?"
        choices:
          - "Faith in the pipeline"
          - "The serving system reads only from the BLURRED storage location; raw originals are locked away"
          - "Hope"
        answer: 1
      - type: fill
        prompt: "Reports from real users serve as a fast feedback loop and a source of new training ____."
        answers: [labels, data, examples]
      - type: mcq
        prompt: "Why batch is fine here but NOT for, say, fraud detection?"
        choices:
          - "Fraud needs a decision before checkout completes; Street View imagery has no live user waiting"
          - "Batch is faster"
          - "Both should be batch"
        answer: 0

  - title: "Monitoring & Iteration"
    intro: "Privacy regression > model regression. Monitor reports as a primary signal."
    rubric: |
      Track:
        • Detection counts per image — sudden drop may mean a model regression
        • User-report rate (KEY privacy signal)
        • Score distribution drift
        • Annotation backlog from reports
      Cadence: retrain when user-report volume spikes, when new geographies are added,
      or on a regular monthly cadence. Shadow → canary → ramp; KEEP the previous model
      reachable for fast rollback.
    prompts:
      - type: mcq
        prompt: "User-report rate spikes 3x this week. What's your FIRST move?"
        choices:
          - "Roll back blindly"
          - "Investigate: is it a regression in the new model, a new geography with different conditions, or a feature pipeline change?"
          - "Disable the model"
        answer: 1
      - type: mcq
        prompt: "Why should the OLD model stay reachable for a while after rollout?"
        choices:
          - "It's cheap"
          - "If a privacy regression is found, you need an instant rollback target"
          - "It's required by law"
        answer: 1
      - type: order
        prompt: "Order a SAFE rollout for a new detection model."
        items:
          - "Beat the current model on mAP and recall@IoU 0.5 offline"
          - "Shadow deploy: detect with both, compare boxes (especially missed faces)"
          - "Canary on 1% of new imagery; watch user-report rate"
          - "Ramp to 10% → 50% → 100%"
          - "Keep the previous model reachable for instant rollback"
      - type: fill
        prompt: "Sudden detection-count drops are usually a sign of feature ____ in the input pipeline."
        answers: [drift, distribution drift, breakage]
      - type: mcq
        prompt: "When is RETRAINING urgent rather than scheduled?"
        choices:
          - "When user-report rate climbs or when imagery from a new region/conditions starts coming in"
          - "Every Tuesday"
          - "Never"
        answer: 0
      - type: mcq
        prompt: "Why is SHADOW deployment especially valuable for privacy products?"
        choices:
          - "It saves money"
          - "It lets you compare detections without exposing real users to the new model's misses"
          - "It's faster"
        answer: 1
---
