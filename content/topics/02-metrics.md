---
slug: metrics
title: "Evaluation & Metrics"
order: 2
prereq_slugs: [framing]
intro: "If you can't measure it, you can't ship it. Pick OFFLINE metrics that move with your business goal — and ONLINE metrics + guardrails to keep you honest."
mental_map:
  summary: "Pick metrics in two layers. Offline metrics gate releases on a frozen dataset. Online metrics measure real users. Guardrails prevent regressions on the things you don't want to lose."
  diagram: |
    flowchart TD
      G[Business goal] --> ON[Online metric<br/>tied to real users]
      G --> OFF[Offline metric<br/>on a frozen dataset]
      OFF --> OFFa[Classification<br/>imbalanced → PR-AUC]
      OFF --> OFFb[Ranking → nDCG@K, mAP]
      OFF --> OFFc[Detection → mAP / IoU]
      OFF --> OFFd[Regression → MAE/MSE/Huber]
      OFF --> OFFe[Representation → contrastive acc]
      ON --> ONa[CTR, watch-time,<br/>dwell-time]
      ON --> ONb[Conversion / revenue]
      ON --> ONc[Cohort metrics<br/>by lang/region/device]
      G --> GR[Guardrails<br/>must NOT regress]
      GR --> GRa[Latency P99]
      GR --> GRb[Harmful exposure]
      GR --> GRc[Fairness]
      GR --> GRd[Valid-appeal rate]
      OFFa & ONa & GRa --> SHIP{Ship?}
      SHIP -->|all bars met| Y[Ship + A/B test]
      SHIP -->|any bar miss| N[Iterate]
  concepts:
    - title: "Offline vs online"
      body: "Offline = lab. Computed on held-out data before deployment. Online = production. Measured on real user behavior."
    - title: "Alignment"
      body: "A good offline metric moves in the same direction as the online metric you care about. If they diverge, your offline metric (or labels) is wrong."
    - title: "Accuracy is usually the wrong metric"
      body: "Imbalanced binary problems (fraud, harmful, churn) hide behind accuracy. Use PR-AUC, recall@precision, F-beta — metrics that focus on the rare class."
    - title: "Asymmetric costs"
      body: "Missing a face in Street View blurring is a privacy violation. Over-blurring is mild inconvenience. Tilt toward recall when the cost of a miss is much higher than the cost of a false alarm."
    - title: "Guardrails"
      body: "Latency, fairness, abuse rate, harmful-content exposure, valid-appeal rate. Set hard bars. Even a model that wins on the headline metric should not ship if a guardrail regresses."
    - title: "Diversity & dwell-time partners"
      body: "Plain CTR rewards clickbait. Pair it with dwell-time or completion. Plain relevance rewards homogeneity. Pair it with a diversity metric."
lessons:
  - order: 1
    title: "Offline vs online metrics"
    prompts:
      - type: mcq
        prompt: "What's an OFFLINE metric?"
        choices:
          - "A number computed on a frozen dataset (test/val) before shipping"
          - "A number measured on real users in production"
          - "A number you don't care about"
        answer: 0
        explanation: "Offline = lab. Online = real users."
      - type: mcq
        prompt: "Why are OFFLINE metrics never enough on their own?"
        choices:
          - "They're cheap"
          - "Real users behave differently than your training distribution — only production proves it"
          - "Offline data is illegal"
        answer: 1
      - type: match
        prompt: "Sort each metric: OFFLINE or ONLINE."
        pairs:
          - { left: "ROC-AUC on validation", right: "Offline" }
          - { left: "Click-through rate this week", right: "Online" }
          - { left: "nDCG@10 on labeled queries", right: "Offline" }
          - { left: "Total watch time per user", right: "Online" }
          - { left: "PR-AUC on holdout", right: "Offline" }
      - type: fill
        prompt: "A good offline metric should move in the SAME direction as the ____ metric you actually care about."
        answers: [online, business, north-star]
      - type: mcq
        prompt: "Offline nDCG goes UP. Online watch-time goes DOWN. What's wrong?"
        choices:
          - "Random noise"
          - "Your offline metric is misaligned with the real goal — fix the offline metric or the labels"
          - "Latency"
        answer: 1
      - type: mcq
        prompt: "Why is plain ACCURACY a bad metric for harmful-content detection?"
        choices:
          - "Hard to compute"
          - "Harmful posts are ~0.1% — a 'never flag' model gets 99.9% accuracy and catches nothing"
          - "Accuracy is illegal"
        answer: 1

  - order: 2
    title: "Picking the right metric for the task"
    prompts:
      - type: match
        prompt: "Match each task to a SUITABLE offline metric."
        pairs:
          - { left: "Imbalanced binary classification (fraud, harmful)", right: "PR-AUC" }
          - { left: "Ranking with graded relevance", right: "nDCG@K" }
          - { left: "Object detection", right: "mAP / IoU" }
          - { left: "Recommendation top-K", right: "Precision@K, mAP" }
          - { left: "Continuous prediction (dwell time)", right: "MAE / MSE / Huber" }
      - type: mcq
        prompt: "Why is plain CLICK-THROUGH RATE a flawed online metric for a feed?"
        choices:
          - "CTR rewards CLICKBAIT — high CTR can mean lower satisfaction"
          - "CTR is hard to compute"
          - "Clicks aren't measurable"
        answer: 0
      - type: mcq
        prompt: "What's a useful PARTNER metric to CTR for a feed?"
        choices:
          - "Disk space"
          - "Watch time / dwell time / total time-spent — captures whether the click was worth it"
          - "Server temperature"
        answer: 1
      - type: fill
        prompt: "A guardrail metric is one we MUST keep stable, like P99 ____ or harmful-content rate in top-K."
        answers: [latency, response time]
      - type: mcq
        prompt: "Why is RECALL more important than precision for Street View blurring?"
        choices:
          - "Missing a face is a privacy violation; over-blurring is just an inconvenience — asymmetric costs"
          - "Recall is faster to compute"
          - "Precision doesn't apply"
        answer: 0
      - type: mcq
        prompt: "Why is the VALID-APPEAL rate a key online metric for content takedowns?"
        choices:
          - "It tracks load"
          - "It's a direct signal of FALSE POSITIVES — the user successfully overturned the takedown"
          - "Required by law"
        answer: 1
      - type: order
        prompt: "Order this metric-design checklist."
        items:
          - "Pick a north-star ONLINE metric tied to business value"
          - "Pick OFFLINE metrics that move with it"
          - "Add GUARDRAILS (latency, fairness, abuse, harm)"
          - "Decide a minimum acceptable bar for each"
      - type: mcq
        prompt: "Why is DIVERSITY in recommendations worth a metric?"
        choices:
          - "Disk usage"
          - "Users disengage from 10 near-identical items in a row — relevance alone misses this"
          - "Tradition"
        answer: 1
---
