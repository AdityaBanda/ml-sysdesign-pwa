---
slug: monitoring
title: "Monitoring & Iteration"
order: 6
prereq_slugs: [serving]
intro: "ML systems decay quietly. Users change, the world changes, adversaries adapt. This stage is how we notice — and how we ship updates without breaking production."
mental_map:
  summary: "Notice decay early, retrain on the right cadence, and ship updates safely. Monitoring is detection; safe rollout is response. Per-cohort visibility prevents hidden regressions inside global averages."
  diagram: |
    flowchart TD
      MON[Monitoring] --> DR[Drift]
      DR --> DR1[Input drift<br/>feature distributions shift]
      DR --> DR2[Output drift<br/>prediction mix shifts]
      DR --> DR3[Concept drift<br/>input → label relation shifts]
      MON --> BIZ[Business metrics]
      BIZ --> BIZ1[CTR / watch time]
      BIZ --> BIZ2[Hide / block / skip<br/>direct dissatisfaction]
      MON --> INF[Infra metrics]
      INF --> INF1[Latency P50 / P99]
      INF --> INF2[Time-to-index]
      INF --> INF3[Error rates]
      MON --> COH[Per-cohort]
      COH --> COH1[By language / region / device]
      MON --> RT{Retrain?}
      RT -->|Drift / business regress| TRAIN[Retrain on fresh data]
      TRAIN --> ROLL[Safe rollout]
      ROLL --> R1[Beat offline metrics]
      R1 --> R2[Shadow: score in parallel]
      R2 --> R3[Canary: 1% traffic]
      R3 --> R4[Ramp: 10% → 50% → 100%]
      R4 --> R5[Holdout slice on old model]
      ROLL --> RB[Rollback path<br/>guardrail breach → revert]
      TRAIN --> RE[Re-embed / re-index<br/>if encoder changed]
  concepts:
    - title: "Three drift types"
      body: "Input drift = features shift (new languages, new devices). Output drift = prediction mix shifts. Concept drift = same input means a different label now (adversarial spam, new slang)."
    - title: "Adversarial domains retrain faster"
      body: "Spam, fraud, harmful content evolve weekly. Detection appearances (faces, plates) are more stationary. Adjust retraining cadence to the speed of the world."
    - title: "Hide / block / skip are gold"
      body: "Direct dissatisfaction signals outrank a small CTR gain. A regression here means the user experience got worse even if the headline metric looks fine."
    - title: "Re-embedding when the encoder changes"
      body: "If the encoder changes, all existing item embeddings live in the wrong vector space. Re-embed everything before serving the new model, or accept a quality cliff."
    - title: "Shadow → canary → ramp"
      body: "Shadow scores in parallel without exposing users. Canary sends 1% of traffic. Ramp goes 10% → 50% → 100% if guardrails hold. Always keep a tiny holdout on the old model for ongoing comparison."
    - title: "Per-cohort visibility"
      body: "A regression on a single language, region, or device can hide inside a stable global average. Monitor per cohort, not just on the whole."
    - title: "Investigate before retraining"
      body: "Drift alert? First check the upstream pipeline and feature store. A broken upstream looks like model decay. Retraining on bad inputs makes it worse."
lessons:
  - order: 1
    title: "Drift, retraining cadence, and adversarial signals"
    prompts:
      - type: mcq
        prompt: "Why might a model that worked GREAT last quarter be bad today?"
        choices:
          - "Code rots"
          - "Inputs and the world keep changing — the new data doesn't match what the model trained on"
          - "Disk fills up"
        answer: 1
      - type: match
        prompt: "Match the type of DRIFT to its meaning."
        pairs:
          - { left: "Input drift", right: "Feature distributions shift (new content, new languages, new devices)" }
          - { left: "Output drift", right: "The mix of predictions changes" }
          - { left: "Concept drift", right: "The relationship between inputs and the right answer changes" }
      - type: mcq
        prompt: "A spam / hate-speech filter starts MISSING bad content because adversaries invented new tricks. What kind of drift?"
        choices:
          - "Input drift"
          - "Concept drift — same content used to mean bad, now means something else (or vice versa)"
          - "Output drift"
        answer: 1
      - type: mcq
        prompt: "Why retrain MORE OFTEN for harmful-content detection than for Street View blurring?"
        choices:
          - "Adversarial domains shift fast (new slang, new evasion); object appearances are more stationary"
          - "Tradition"
          - "It's cheaper"
        answer: 0
      - type: mcq
        prompt: "Recommendation CTR drops 30% overnight. Model didn't change. FIRST hypothesis?"
        choices:
          - "Retrain immediately"
          - "Upstream pipeline broke or feature store changed — investigate inputs before the model"
          - "Switch to a bigger model"
        answer: 1
      - type: fill
        prompt: "When the encoder model changes, all existing embeddings must be ____ so they live in the same vector space."
        answers: [recomputed, re-embedded, re-encoded]
      - type: mcq
        prompt: "Why monitor TIME-TO-INDEX for new uploads (videos, posts)?"
        choices:
          - "Disk usage"
          - "If new items take hours to enter the index, the cold-start workaround stalls — creators see slow distribution"
          - "Latency only"
        answer: 1
      - type: mcq
        prompt: "Why watch HIDE / BLOCK / SKIP rates as guardrails on a feed model?"
        choices:
          - "They're free"
          - "They're DIRECT signals of user dissatisfaction — a regression here outranks a small CTR gain"
          - "Required by Kafka"
        answer: 1

  - order: 2
    title: "Shipping updates safely"
    prompts:
      - type: mcq
        prompt: "What's an A/B test in ML?"
        choices:
          - "Naming the model 'A' vs 'B'"
          - "Sending some users to the new model, others to the old, and comparing outcomes on online metrics"
          - "Unit testing"
        answer: 1
      - type: mcq
        prompt: "What's a SHADOW deploy?"
        choices:
          - "Run the new model in parallel; compute its predictions but DON'T show them to users — compare against current"
          - "Deploy at night"
          - "Backup server"
        answer: 0
      - type: mcq
        prompt: "What's a CANARY rollout?"
        choices:
          - "Sending only 1% of traffic to the new model and watching for problems before ramping"
          - "Email to canary@team"
          - "Running on a tiny VM"
        answer: 0
      - type: order
        prompt: "Order a SAFE rollout from FIRST to LAST step."
        items:
          - "Beat the current model on offline metrics"
          - "Re-embed / re-index items if the encoder changed"
          - "Shadow deploy: score in parallel, compare disagreements"
          - "Canary 1% of traffic; watch online + guardrails"
          - "Ramp to 10% → 50% → 100%"
          - "Keep a holdout slice on the old model for ongoing comparison"
      - type: fill
        prompt: "Periodically retraining a model on fresh data is called the retraining ____."
        answers: [cadence, schedule, frequency]
      - type: mcq
        prompt: "Why keep a tiny percentage of users on the OLD model AFTER full launch?"
        choices:
          - "Cheap"
          - "It gives an ongoing comparison to confirm the new model is STILL winning, not just looked good once"
          - "Required by law"
        answer: 1
      - type: mcq
        prompt: "Why is shadow deploy especially valuable for PRIVACY products (Street View blurring)?"
        choices:
          - "Saves money"
          - "It lets you compare detections WITHOUT exposing users to the new model's misses"
          - "It's faster"
        answer: 1
      - type: mcq
        prompt: "Drift monitoring screams ALERT. Online business metrics look fine. What now?"
        choices:
          - "Retrain immediately"
          - "Investigate WHY drift happened — sometimes the world changed and the model still works; sometimes drift is the early warning"
          - "Disable the model"
        answer: 1
      - type: mcq
        prompt: "Per-cohort vs global metrics: why measure both?"
        choices:
          - "Tradition"
          - "A regression on a single language, age group, or geography can hide INSIDE a stable global average"
          - "Disk space"
        answer: 1
---
