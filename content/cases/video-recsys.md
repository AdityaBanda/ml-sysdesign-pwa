---
slug: video-recsys
title: "Video Recommendation System (YouTube-style)"
difficulty: 4
prerequisites: [framing, metrics, data, model, serving, monitoring]
xp: 200
summary: "User opens the homepage — out of 10 BILLION videos, which dozen do we show? Two-stage pipeline + hybrid filtering."
stages:
  - title: "Problem Framing"
    intro: "Personalized homepage feed. Pin down the objective, the I/O, and the scale."
    rubric: |
      Goal: maximize user engagement on the homepage feed.
      Input: a user (with profile + history).
      Output: a ranked list of videos.
      Scope: homepage feed (NOT 'similar videos' next to a current video).
      Volume: ~10B videos, multi-language, global.
      Latency: < 200ms end-to-end.
      ML objective: predict RELEVANCE — defined as combination of explicit (likes, shares)
      and implicit (watch fraction) signals — instead of pure CTR or pure completion rate.
    prompts:
      - type: mcq
        prompt: "What's the SYSTEM doing?"
        choices:
          - "Search a video by name"
          - "Pick a personalized ranked list of videos to show on the user's homepage"
          - "Recommend friends"
        answer: 1
      - type: match
        prompt: "Match each candidate ML objective to its FLAW."
        pairs:
          - { left: "Maximize clicks", right: "Encourages CLICKBAIT" }
          - { left: "Maximize completed videos", right: "Biases toward SHORT videos" }
          - { left: "Maximize watch time", right: "Misses explicit signals like likes" }
          - { left: "Maximize relevance score (mix of explicit + implicit)", right: "Best — most controllable" }
      - type: mcq
        prompt: "Why NOT just optimize click-through rate?"
        choices:
          - "It encourages clickbait — high CTR ≠ user satisfaction"
          - "It's expensive"
          - "It's hard to measure"
        answer: 0
      - type: fill
        prompt: "We have roughly ____ billion videos on the platform."
        answers: ["10", "ten"]
      - type: mcq
        prompt: "Why does latency push the design toward MULTIPLE stages?"
        choices:
          - "We can't run a heavy model over 10B videos in 200ms — we need a fast filter first"
          - "Single-stage is illegal"
          - "GPUs require it"
        answer: 0
      - type: mcq
        prompt: "Search vs. recommendation here?"
        choices:
          - "Recommendation — no explicit query; we predict what the user wants"
          - "Search"
          - "Both at once"
        answer: 0

  - title: "Metrics"
    intro: "Ranking metrics offline; engagement metrics online; survey for ground truth."
    rubric: |
      Offline:
        • Precision@K (relevant in top-K)
        • mAP (binary relevance)
        • Diversity (avg pairwise similarity in result list)
      Online:
        • CTR (with caveats — clickbait risk)
        • Number of completed videos
        • Total watch time
        • Explicit feedback (likes/dislikes)
      Diversity matters: a list of 10 near-identical videos rarely engages users.
    prompts:
      - type: mcq
        prompt: "Which OFFLINE metric measures whether top-K recommendations are relevant?"
        choices:
          - "BLEU"
          - "Precision@K"
          - "Inception score"
        answer: 1
      - type: mcq
        prompt: "Why ALSO measure DIVERSITY?"
        choices:
          - "Users get bored of 10 near-duplicate videos in a row"
          - "It's required by law"
          - "It's faster"
        answer: 0
      - type: match
        prompt: "Sort each metric into its bucket."
        pairs:
          - { left: "Precision@10 on holdout", right: "Offline" }
          - { left: "mAP on labeled relevance", right: "Offline" }
          - { left: "Total watch time", right: "Online" }
          - { left: "Explicit likes/dislikes", right: "Online" }
      - type: mcq
        prompt: "Why is DIVERSITY alone a misleading metric?"
        choices:
          - "A diverse-but-irrelevant list isn't actually engaging — pair it with relevance metrics"
          - "Diversity has no formula"
          - "It's deprecated"
        answer: 0
      - type: fill
        prompt: "A common diversity measure is the AVERAGE pairwise ____ between videos in the recommended list (lower = more diverse)."
        answers: [similarity, cosine, distance]
      - type: mcq
        prompt: "When offline mAP rises but online watch time falls, what's wrong?"
        choices:
          - "Offline metric is misaligned with the online business goal — fix it"
          - "GPU heat"
          - "User error"
        answer: 0

  - title: "Data"
    intro: "Three sources: videos, users, user-video interactions. Engineer features for each."
    rubric: |
      Sources:
        • Videos (id, length, title, tags, language, likes, views)
        • Users (age, gender, language, location, time zone)
        • User-video interactions (clicks, likes, watch time, search history)
      Video features:
        - ID → embedding layer
        - Title → BERT
        - Tags → CBOW or similar
        - Duration, language → numeric / embedding
      User features:
        - Demographics (age bucketed, gender one-hot, language/city embeddings)
        - Context (time of day, device, day of week)
        - Historical interactions: aggregated embeddings of liked/watched/searched videos
    prompts:
      - type: mcq
        prompt: "Why use a PRE-TRAINED text model (BERT) for video TITLES?"
        choices:
          - "It already understands language; we get strong semantic features without training from scratch"
          - "It's free"
          - "Tradition"
        answer: 0
      - type: match
        prompt: "Match each input to its TYPICAL encoding."
        pairs:
          - { left: "Video ID", right: "Embedding layer (learned)" }
          - { left: "Video title", right: "BERT" }
          - { left: "Video tags", right: "CBOW / lightweight word embedding" }
          - { left: "User age", right: "Bucketize → one-hot" }
          - { left: "User country", right: "Embedding layer" }
      - type: mcq
        prompt: "Search history is variable-length. How do we get a FIXED-size feature?"
        choices:
          - "Take the first query"
          - "Encode each query and AVERAGE the embeddings"
          - "Pad with zeros to 1000"
        answer: 1
      - type: fill
        prompt: "Time of day, device, and day of week are ____ features that capture session context."
        answers: [contextual, context]
      - type: mcq
        prompt: "Why might time-of-day matter?"
        choices:
          - "User intent shifts: educational by day, entertainment at night, etc."
          - "GPU clocks"
          - "Disk I/O"
        answer: 0
      - type: mcq
        prompt: "Should we use IMPLICIT, EXPLICIT, or BOTH signals to construct relevance labels?"
        choices:
          - "Only explicit (likes, shares) — but data is sparse"
          - "Only implicit (watch time, clicks) — but it's noisy"
          - "BOTH, weighted into a relevance score — best of each"
        answer: 2
      - type: mcq
        prompt: "Why do we BUCKETIZE numeric features like age?"
        choices:
          - "Smooth out outliers and let the model treat groups (kids/teens/adults/seniors) differently"
          - "Required by Postgres"
          - "It's faster I/O"
        answer: 0

  - title: "Model"
    intro: "Hybrid filtering: collaborative (matrix factorization) + content-based (two-tower NN)."
    rubric: |
      Personalized recommenders fall in three buckets:
        • Content-based — uses video features (handles new videos, struggles to surprise)
        • Collaborative filtering — uses user-video interactions (great discovery, cold-start
          on new users/videos)
        • Hybrid — combines both (industry default)

      Two embedding models:
        • Matrix factorization: decompose feedback matrix → user embeddings × video
          embeddings. Trained with WALS (faster, parallelizable). Fast to serve.
          Limitation: ignores user/video features, struggles with new users.
        • Two-tower NN: separate user encoder and video encoder, trained with
          cross-entropy on positive/negative ⟨user, video⟩ pairs. Handles new users via
          features.
    prompts:
      - type: mcq
        prompt: "Pure CONTENT-based filtering. Strength?"
        choices:
          - "Handles brand-new videos using their features alone"
          - "It's free"
          - "It's faster"
        answer: 0
      - type: mcq
        prompt: "Pure COLLABORATIVE filtering. Strength AND weakness?"
        choices:
          - "Strength: discovers new interests via similar users. Weakness: COLD-START on new users/videos"
          - "Strength: handles all cold start"
          - "Strength: cheap features"
        answer: 0
      - type: match
        prompt: "Match each model to its CHARACTERISTIC."
        pairs:
          - { left: "Matrix factorization", right: "Fast to train and serve, no side features" }
          - { left: "Two-tower NN (CF mode)", right: "Embeddings for both user and video; flexible" }
          - { left: "Two-tower NN (content mode)", right: "Uses video features → handles new videos" }
          - { left: "Hybrid filtering", right: "CF candidate-gen → content-based ranking" }
      - type: order
        prompt: "Order training of a TWO-TOWER NN."
        items:
          - "Construct ⟨user, video⟩ pairs labeled positive (engagement) or negative"
          - "Encode user features through user tower; video features through video tower"
          - "Compute dot-product similarity between the two embeddings"
          - "Apply cross-entropy loss vs. the binary label"
          - "Backprop into both towers"
      - type: fill
        prompt: "The optimization algorithm specific to matrix factorization is Weighted ____ Least Squares (WALS)."
        answers: [Alternating, alternating]
      - type: mcq
        prompt: "Why does WALS converge faster than SGD for matrix factorization?"
        choices:
          - "It alternates fixing one matrix and exactly solving the other — closed-form steps + parallelizable"
          - "It uses less memory"
          - "It's a newer algorithm"
        answer: 0
      - type: mcq
        prompt: "Why prefer the COMBINED loss (observed + weighted unobserved) over observed-only?"
        choices:
          - "Observed-only ignores all the negatives — embeddings can collapse to 'all 1s' with zero loss"
          - "It's faster"
          - "It's required by Postgres"
        answer: 0

  - title: "Serving"
    intro: "Three-stage pipeline: candidate generation → scoring → re-ranking."
    rubric: |
      Stage 1 — Candidate generation (billions → thousands):
        Lightweight model. We tolerate false positives, prioritize speed.
        Use the user-tower embedding + ANN over indexed video embeddings.
        Multiple candidate generators (relevance, popular, trending, location-based).
      Stage 2 — Scoring (thousands → hundreds):
        Heavier model with full features. Two-tower NN with content-mode video tower.
      Stage 3 — Re-ranking (hundreds → dozens):
        Apply business rules: region restrictions, freshness, dedup, fairness, clickbait
        filters.
    prompts:
      - type: mcq
        prompt: "Why is the system MULTI-STAGE instead of one-shot?"
        choices:
          - "Heavy model on 10B videos won't fit a 200ms budget — narrow with cheap, then refine with deep"
          - "It's traditional"
          - "It saves disk"
        answer: 0
      - type: order
        prompt: "Order the request flow."
        items:
          - "User loads homepage"
          - "Candidate generation reduces 10B → ~thousands using ANN over video embeddings"
          - "Scoring stage ranks the candidates with a heavier two-tower NN"
          - "Re-ranking applies business rules (region, freshness, dedup, fairness)"
          - "Top-K videos returned to the user"
      - type: mcq
        prompt: "Why use MULTIPLE candidate generators (relevance + popular + trending + local)?"
        choices:
          - "Different generators surface different kinds of good videos — diversity comes for free"
          - "More servers"
          - "It's a workaround for slow ANN"
        answer: 0
      - type: fill
        prompt: "The component that finds the closest video embeddings to the query user embedding is an Approximate ____ Neighbor (ANN) service."
        answers: [Nearest, nearest]
      - type: mcq
        prompt: "How does this design handle a NEW user (no interaction history)?"
        choices:
          - "Skip them"
          - "Two-tower NN can encode the user using DEMOGRAPHIC features alone, so we still get a usable embedding"
          - "Show only popular videos"
        answer: 1
      - type: mcq
        prompt: "How do we handle a NEW video?"
        choices:
          - "Drop it"
          - "Show it to a random sample of users to gather interactions, then fine-tune; meanwhile its content features (title, tags, language) drive content-based scoring"
          - "Wait a year"
        answer: 1

  - title: "Monitoring & Iteration"
    intro: "Engagement, freshness, fairness, and the slow death of relevance — track them all."
    rubric: |
      Track:
        • Online: CTR, completed videos, total watch time, explicit feedback
        • Diversity in top-K
        • Time-to-index for new videos (cold-start health)
        • Score distribution drift; user/video embedding drift
        • Per-locale relevance (recommendations should work everywhere we operate)
      Cadence:
        • Continuous fine-tuning on fresh interactions
        • Periodic full retrains for the candidate-gen + scoring models
        • Re-embed videos when video tower changes
      Rollouts: shadow → canary → ramp.
    prompts:
      - type: mcq
        prompt: "Watch time drops 10% in EU only. What FIRST?"
        choices:
          - "Roll back globally"
          - "Investigate: language coverage, regional content imbalance, EU-specific rule change?"
          - "Disable the model"
        answer: 1
      - type: order
        prompt: "Order a SAFE rollout for a new scoring model."
        items:
          - "Beat current model on offline mAP / Precision@10"
          - "Re-embed videos if the encoder changed"
          - "Shadow deploy: score in parallel, compare ranking diff"
          - "Canary 1% of traffic; watch CTR + watch time"
          - "Ramp to 10% → 50% → 100%"
      - type: fill
        prompt: "When the video tower changes, all video embeddings must be ____."
        answers: [recomputed, re-embedded, re-encoded]
      - type: mcq
        prompt: "Why monitor TIME-TO-INDEX for new uploads?"
        choices:
          - "If new videos take hours to enter the index, the cold-start workaround stalls; creators see slow distribution"
          - "Disk usage"
          - "Latency"
        answer: 0
      - type: mcq
        prompt: "What does SCORE DRIFT often signal?"
        choices:
          - "Server age"
          - "Input feature distribution has shifted (new content trends, new user mix) — model accuracy may be degrading"
          - "Memory leak"
        answer: 1
      - type: mcq
        prompt: "Why is FAIRNESS / BIAS in re-ranking worth a metric?"
        choices:
          - "Recommenders amplify popularity loops; small bias compounds into large representation gaps"
          - "It's mandated by Kafka"
          - "It's traditional"
        answer: 0
---
