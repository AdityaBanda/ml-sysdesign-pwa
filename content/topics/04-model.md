---
slug: model
title: "Model Development"
order: 4
prereq_slugs: [data]
intro: "The model turns features into predictions. Start with the simplest baseline that could possibly work — upgrade only when it pays off in metrics that matter."
mental_map:
  summary: "Pick the simplest model that could work as a baseline, then choose an architecture family that fits the task. Match the loss to the task. Mitigate overfitting. Add stages (candidate-gen → scoring) only when latency or recall demands it."
  diagram: |
    flowchart TD
      T[Task framed] --> B[Baseline]
      B --> B1[Linear / Logistic]
      B --> B2[GBDT]
      B --> B3[Most-popular / BM25]
      B --> NEXT[Does fancy beat baseline?]
      NEXT --> AR[Architecture]
      AR --> AR1[Two-encoder representation<br/>visual / video search]
      AR --> AR2[Two-tower NN<br/>user × item recsys]
      AR --> AR3[Multi-task DNN<br/>shared layers + heads]
      AR --> AR4[Two-stage detector<br/>faces, plates]
      AR --> AR5[Matrix factorization<br/>collab filtering]
      AR --> AR6[Pre-trained backbone<br/>BERT / ResNet / CLIP]
      AR --> L[Loss]
      L --> L1[Binary cross-entropy<br/>classification]
      L --> L2[Cross-entropy<br/>multi-class]
      L --> L3[MAE/MSE/Huber<br/>regression]
      L --> L4[Contrastive<br/>representation]
      L --> L5[Box + cls<br/>detection]
      L --> TRN[Training]
      TRN --> TRN1[Train / val / test split]
      TRN --> TRN2[Mitigate overfitting]
      TRN --> TRN3[Gradient blending<br/>for multi-task]
      TRN --> PIPE[Need multi-stage?]
      PIPE -->|Yes — huge pool| MS[Candidate gen → scoring → re-rank]
      PIPE -->|No — small pool| SS[Single model]
  concepts:
    - title: "Always start with a baseline"
      body: "A baseline tells you whether the problem is solvable, exposes leaks, and sets the bar your fancy model must clear. Skip it and you'll waste time building something that doesn't help."
    - title: "Multi-task DNN"
      body: "Shared layers + per-head outputs. Train one model to predict click + like + comment + hide + dwell-time. Rare reactions (block, friendship) borrow signal from common ones."
    - title: "Two-tower vs matrix factorization"
      body: "MF learns embeddings only from interactions — bad for cold start. Two-tower NN consumes user + item features directly, so a new user has an embedding from day 1."
    - title: "Loss must match the task"
      body: "Cross-entropy for classification, MAE/MSE for regression, contrastive for representation, box+cls for detection. Picking the wrong loss makes the metric drift even if accuracy looks fine."
    - title: "Two-stage retrieval"
      body: "When the pool is billions, no single model can score every item. Stage 1: cheap recall (ANN, matrix factorization). Stage 2: expensive precision (multi-task DNN with many features)."
    - title: "Negative transfer"
      body: "In multi-task, one head's gradient can hurt another. Mitigate with gradient blending, separate heads, or task-specific layers."
lessons:
  - order: 1
    title: "Baselines, architectures, and tradeoffs"
    prompts:
      - type: mcq
        prompt: "Why ALWAYS start with a baseline?"
        choices:
          - "It's required by law"
          - "It tells you whether the problem is solvable, exposes data leaks, and sets the bar your fancy model must clear"
          - "Tradition"
        answer: 1
      - type: match
        prompt: "Match each problem to a sensible BASELINE."
        pairs:
          - { left: "Visual search ranking", right: "Pre-trained CNN features + nearest-neighbor" }
          - { left: "Video search", right: "BM25 / Elasticsearch over titles + tags" }
          - { left: "Recommendation", right: "Most-popular list" }
          - { left: "Fraud / harmful classification", right: "Logistic regression or gradient-boosted trees" }
          - { left: "Predicting a number", right: "Linear regression" }
      - type: match
        prompt: "Match each architecture FAMILY to its TASK."
        pairs:
          - { left: "Two-encoder representation model", right: "Visual / video search via embedding similarity" }
          - { left: "Two-tower neural network", right: "Recommendations using user features + item features" }
          - { left: "Multi-task DNN (shared layers + heads)", right: "Predict multiple reactions in one model (feed, harmful)" }
          - { left: "Two-stage detector (Faster R-CNN)", right: "Object detection (faces, plates)" }
          - { left: "Matrix factorization", right: "Lightweight collaborative filtering" }
      - type: mcq
        prompt: "Why prefer MULTI-TASK over N independent DNNs for a feed?"
        choices:
          - "Cheaper to train and serve; rare reactions (block, friendship-request) borrow signal from common ones via shared layers"
          - "Multi-task is always more accurate"
          - "It's free"
        answer: 0
      - type: mcq
        prompt: "Two-tower NN vs. matrix factorization: which handles NEW USERS better?"
        choices:
          - "Matrix factorization"
          - "Two-tower NN — it can encode a new user from demographic features alone (no interactions needed)"
          - "Both equally"
        answer: 1
      - type: fill
        prompt: "Training a model on multiple tasks at once, where some heads share representations, is called ____ learning."
        answers: [multi-task, multitask]
      - type: mcq
        prompt: "What's a downside of multi-task models we should monitor?"
        choices:
          - "Negative transfer — one head's training degrades another head's performance"
          - "Multi-task is illegal"
          - "They're always slower"
        answer: 0
      - type: mcq
        prompt: "Why use a PRE-TRAINED backbone (BERT, ResNet, CLIP)?"
        choices:
          - "It's free RAM"
          - "It already learned strong general features — saves training time and improves quality, especially with limited labels"
          - "It avoids feature engineering"
        answer: 1

  - order: 2
    title: "Loss functions, training, and overfitting"
    prompts:
      - type: match
        prompt: "Match each task to its TYPICAL loss."
        pairs:
          - { left: "Binary classification (click, like, hide)", right: "Binary cross-entropy" }
          - { left: "Multi-class classification", right: "Cross-entropy" }
          - { left: "Regression (dwell-time)", right: "MAE / MSE / Huber" }
          - { left: "Representation learning (visual / text-video)", right: "Contrastive loss" }
          - { left: "Object detection", right: "Box regression loss + classification loss" }
      - type: order
        prompt: "Order a CONTRASTIVE loss computation (visual search)."
        items:
          - "Encode query, positive, and negatives"
          - "Compute similarity (dot product) between query and each"
          - "Apply softmax over similarities"
          - "Cross-entropy with the positive index as the label"
      - type: mcq
        prompt: "What's OVERFITTING?"
        choices:
          - "Model is too small"
          - "Model memorized training data and fails on new examples — big train/val gap"
          - "Training loss is high"
        answer: 1
      - type: mcq
        prompt: "Two-stage recommender: BILLION videos. Why TWO stages?"
        choices:
          - "Diagrams look better"
          - "Stage 1 (candidate gen) is FAST and high-recall; stage 2 (scoring) is SLOWER but high-precision — meets latency"
          - "Required by Kafka"
        answer: 1
      - type: match
        prompt: "Two-stage rec: which property belongs to which STAGE?"
        pairs:
          - { left: "Must be FAST over a huge pool", right: "Candidate generation" }
          - { left: "Optimizes for RECALL — don't miss good options", right: "Candidate generation" }
          - { left: "Uses lots of features per item", right: "Scoring" }
          - { left: "Optimizes for ORDER QUALITY", right: "Scoring" }
      - type: fill
        prompt: "When tasks have very different gradients, gradient ____ rebalances them so no head dominates training."
        answers: [blending, balancing, normalization]
      - type: mcq
        prompt: "For matrix factorization, why is the COMBINED loss (observed + weighted unobserved) better than observed-only?"
        choices:
          - "Faster"
          - "Observed-only ignores negatives — embeddings can collapse to 'all 1s' with zero loss"
          - "Required by Postgres"
        answer: 1
      - type: mcq
        prompt: "Why is WALS preferred over SGD for matrix factorization?"
        choices:
          - "It's newer"
          - "It alternates fixing one matrix and exactly solving the other — closed-form steps + parallelizable → faster convergence"
          - "Less memory"
        answer: 1
---
