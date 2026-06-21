---
slug: serving
title: "Deployment & Serving"
order: 5
prereq_slugs: [model]
intro: "A trained model is just code on disk until it answers requests at user latency. Serving is the part where the model meets reality."
mental_map:
  summary: "Decide online vs batch vs hybrid. Design the request flow with feature lookup, candidate generation, scoring, and re-ranking. Engineer for latency, cold start, and failure."
  diagram: |
    flowchart TD
      Q[Request comes in] --> M{Mode}
      M -->|Latency matters| ON[Online inference]
      M -->|Heavy + non-urgent| BA[Batch inference]
      M -->|Indexing + query| HY[Hybrid<br/>batch + online]
      ON --> FLOW[Request flow]
      FLOW --> F1[Feature store lookup]
      F1 --> F2[Candidate generation<br/>ANN / inverted index]
      F2 --> F3[Scoring<br/>heavy model on hundreds]
      F3 --> F4[Re-ranking<br/>policy, freshness, dedup, fairness]
      F4 --> TOPK[Top-K to user]
      BA --> JOBS[Nightly job → results table]
      HY --> IDX[Batch: index embeddings]
      HY --> QRY[Online: query embedding + ANN]
      FLOW --> COLD[Cold start]
      COLD --> COLD1[Popular / rule-based fallback]
      COLD --> COLD2[Feature defaults]
      FLOW --> FAIL[Fallback path]
      FAIL --> FAIL1[Cached top-K]
      FAIL --> FAIL2[Lightweight backup model]
      Q -.event-driven.-> STR[Kafka stream]
      STR --> CSV[Detection / enforcement / review consumers]
  concepts:
    - title: "Online vs batch"
      body: "Online: predict at request time. Use when freshness or per-user context matters (feed, search, fraud). Batch: predict ahead of time, store. Use when latency doesn't matter (nightly recommendations, indexing)."
    - title: "Hybrid pattern"
      body: "Visual / video search pre-computes item embeddings in batch (heavy) and computes the query embedding online (fast). Same for recsys: train + index nightly, score at request time."
    - title: "Feature store"
      body: "Heavy aggregations (last-5-min reaction velocity, author history) can't run inline at request time. Pre-compute offline, write to a key-value store, look up in milliseconds at serving."
    - title: "ANN vs inverted index"
      body: "ANN (FAISS, ScaNN) → nearest-neighbor in embedding space, for semantic search and recsys. Inverted index (Elasticsearch) → keyword/tag match, for text search."
    - title: "Re-ranking is separate from the model"
      body: "Policy / fairness / freshness rules change often. Keeping re-ranking out of the model lets you tweak rules without retraining."
    - title: "Fallbacks"
      body: "The model service will fail. Always have a safe default — cached top-K, popular items, rule-based — so users don't see a broken screen."
    - title: "Event-driven for streams"
      body: "Posts and uploads arrive as a stream. Kafka feeds a detection consumer, which routes to enforcement, demotion, and human review pipelines."
lessons:
  - order: 1
    title: "Online vs batch — when do we predict?"
    prompts:
      - type: mcq
        prompt: "What's ONLINE inference?"
        choices:
          - "Predicting only when WiFi is up"
          - "Making a prediction at the moment a user is waiting (search, feed refresh, checkout)"
          - "Training on a server"
        answer: 1
      - type: mcq
        prompt: "What's BATCH inference?"
        choices:
          - "Computing predictions for many items ahead of time, on a schedule, and storing the results"
          - "Predicting on bad data"
          - "Training many models"
        answer: 0
      - type: match
        prompt: "Match each system to its inference MODE."
        pairs:
          - { left: "Personalized news feed (live)", right: "Online" }
          - { left: "Street View blurring of new imagery", right: "Batch" }
          - { left: "YouTube video search", right: "Online" }
          - { left: "Visual search (query)", right: "Online" }
          - { left: "Visual search (indexing of new uploads)", right: "Batch" }
          - { left: "Harmful content scoring at post-creation", right: "Online (event-driven)" }
      - type: fill
        prompt: "When user-facing latency doesn't matter (e.g. nightly jobs), prefer ____ inference for cost and simplicity."
        answers: [batch]
      - type: mcq
        prompt: "Personalized feed: 200ms budget, 2B daily-active users. Online or batch?"
        choices:
          - "Batch — pre-compute everything"
          - "Online — feed must reflect freshness and the live user"
          - "Doesn't matter"
        answer: 1
      - type: mcq
        prompt: "Why use BOTH batch (indexing pipeline) AND online (prediction pipeline) in visual / video search?"
        choices:
          - "Pre-compute item embeddings offline (heavy work); compute the query embedding + ANN lookup online (fast work)"
          - "Tradition"
          - "GPUs"
        answer: 0

  - order: 2
    title: "Multi-stage retrieval, feature stores, fallbacks"
    prompts:
      - type: order
        prompt: "Order a TYPICAL multi-stage recommendation request flow."
        items:
          - "User loads page → request hits prediction service"
          - "Feature lookup from online feature store"
          - "Candidate generation: ANN over indexed item embeddings → thousands"
          - "Scoring: heavier model ranks the candidates → hundreds"
          - "Re-ranking applies policy (region, freshness, dedup, fairness)"
          - "Top-K returned to user"
      - type: mcq
        prompt: "Why pre-compute features into a FEATURE STORE?"
        choices:
          - "Looks fancy on diagrams"
          - "Heavy aggregations (last-5-min reaction velocity, author history) need to be read in milliseconds — pre-compute → key-value lookup"
          - "Storage is expensive"
        answer: 1
      - type: match
        prompt: "Match each component to its JOB."
        pairs:
          - { left: "Online feature store", right: "Fast feature reads at request time" }
          - { left: "Offline feature store", right: "Historical features for training" }
          - { left: "Model server", right: "Runs the trained model on incoming requests" }
          - { left: "ANN index (FAISS / ScaNN)", right: "Nearest-neighbor lookup over indexed embeddings" }
          - { left: "Inverted index (Elasticsearch)", right: "Fast keyword match for text search" }
          - { left: "Re-ranking service", right: "Apply business rules / dedup / fairness on the final list" }
      - type: fill
        prompt: "Two well-known ANN libraries are FAISS and ____."
        answers: [ScaNN, scann]
      - type: mcq
        prompt: "What's a FALLBACK and why does serving need one?"
        choices:
          - "An old model kept around for fun"
          - "A safe default (popular items, rule-based) used when the main model is slow or down — keeps the user experience working"
          - "A backup database"
        answer: 1
      - type: mcq
        prompt: "Why is the model service for harmful content often EVENT-DRIVEN (Kafka)?"
        choices:
          - "Tradition"
          - "Posts arrive as a stream; consumers (detection service) score them as they happen, then route to enforcement / demote / review"
          - "Required by Postgres"
        answer: 1
      - type: fill
        prompt: "P99 latency means the slowest 1% of requests — we monitor it because the worst case matters more than the ____."
        answers: [average, mean, median]
      - type: mcq
        prompt: "Caching predictions can BACKFIRE when..."
        choices:
          - "Predictions are expensive"
          - "User-specific or time-sensitive predictions get reused incorrectly"
          - "Memory is plentiful"
        answer: 1
      - type: mcq
        prompt: "Why are RE-RANKING rules kept SEPARATE from the model?"
        choices:
          - "Tradition"
          - "Policy / fairness / freshness rules change OFTEN — easier to tweak rules than retrain a model each time"
          - "Latency"
        answer: 1
---
