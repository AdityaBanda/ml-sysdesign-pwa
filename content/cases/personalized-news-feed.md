---
slug: personalized-news-feed
title: "Personalized News Feed"
difficulty: 4
prerequisites: [framing, metrics, data, model, serving, monitoring]
xp: 200
summary: "User refreshes their feed — out of all the unseen posts, which order makes them stay engaged? Multi-task DNN over many reaction types."
stages:
  - title: "Problem Framing"
    intro: "Define ENGAGEMENT precisely. Different reactions carry different weight."
    rubric: |
      Goal: rank unseen posts (or posts with unseen comments) by predicted engagement.
      Inputs: user + posts.
      Output: ranked list of posts.
      Latency: < 200ms after refresh.
      Scale: ~3B total users, ~2B daily-active checking feed twice a day.
      ML objective: maximize a WEIGHTED engagement score that combines explicit
      (likes, shares, comments, hides, blocks) and implicit (clicks, dwell-time, skip)
      reactions, with per-reaction weights chosen by business.
    prompts:
      - type: mcq
        prompt: "What does the SYSTEM produce on each refresh?"
        choices:
          - "A summary of the news"
          - "A ranked list of unseen posts (or posts with unseen comments) ordered by predicted engagement"
          - "A list of friends"
        answer: 1
      - type: match
        prompt: "Match each ML objective to its KEY DRAWBACK."
        pairs:
          - { left: "Maximize specific implicit reactions (clicks/dwell)", right: "Implicit ≠ true opinion; clicks aren't satisfaction" }
          - { left: "Maximize specific explicit reactions (likes/shares)", right: "Explicit signals are SPARSE — most users don't react" }
          - { left: "Maximize WEIGHTED score across reactions", right: "Best — encodes business priorities, uses all signals" }
      - type: mcq
        prompt: "Why does ordering matter so much in a feed?"
        choices:
          - "Users interact most with the FIRST few posts; ranking is the product"
          - "Storage is cheap"
          - "Latency"
        answer: 0
      - type: fill
        prompt: "We have around ____ billion daily active users."
        answers: ["2", "two"]
      - type: mcq
        prompt: "Why ASSIGN different weights to different reactions?"
        choices:
          - "A SHARE is more valuable than a click; HIDES and BLOCKS should weigh negative — weights encode this"
          - "Tradition"
          - "It's faster"
        answer: 0
      - type: mcq
        prompt: "Why include implicit reactions like dwell-time AND skip?"
        choices:
          - "Many users are passive — they rarely click or like; dwell/skip captures their engagement"
          - "It's free"
          - "Required by Postgres"
        answer: 0

  - title: "Metrics"
    intro: "Per-reaction classification offline; aggregate engagement online; passive users covered by time-spent."
    rubric: |
      Offline:
        • Per-reaction precision / recall / ROC-AUC (one binary classifier per reaction)
        • Regression error for dwell-time
      Online:
        • CTR — fast but clickbait-prone
        • Reaction rates: like rate, share rate, comment rate, hide rate, block rate, skip rate
        • Total time spent — captures passive users
        • User satisfaction surveys — explicit ground truth
    prompts:
      - type: mcq
        prompt: "Which OFFLINE metric summarizes a binary classifier across thresholds?"
        choices:
          - "Plain accuracy"
          - "ROC-AUC"
          - "BLEU"
        answer: 1
      - type: match
        prompt: "Sort each metric into its bucket."
        pairs:
          - { left: "ROC-AUC per reaction head", right: "Offline" }
          - { left: "Like rate / share rate", right: "Online" }
          - { left: "Total time spent in feed", right: "Online (covers passive users)" }
          - { left: "User satisfaction survey", right: "Online (explicit ground truth)" }
      - type: mcq
        prompt: "Why is CTR alone an INSUFFICIENT online metric here?"
        choices:
          - "CTR rises on clickbait; users click, regret, and leave — engagement actually drops"
          - "CTR is hard to compute"
          - "It's deprecated"
        answer: 0
      - type: fill
        prompt: "Total time ____ captures engagement of PASSIVE users who rarely react."
        answers: [spent]
      - type: mcq
        prompt: "Why is a SATISFACTION SURVEY worth running despite its small N?"
        choices:
          - "It's the most direct ground truth — users telling you whether the feed is any good"
          - "It's cheap"
          - "It's free"
        answer: 0
      - type: mcq
        prompt: "Which metric would BEST detect a regression that hurts only PASSIVE users?"
        choices:
          - "Like rate"
          - "Total time spent in feed"
          - "Share rate"
        answer: 1

  - title: "Data"
    intro: "Users, posts, interactions, friendship. Engineer features for each side AND for the user-author relationship."
    rubric: |
      Sources:
        • Users (id, age, gender, language, location)
        • Posts (text, images, video, hashtags, mentions, timestamp)
        • User-post interactions (clicks, likes, shares, comments, hides, blocks, dwell-time)
        • Friendship (close-friend / family flags, length of friendship)
      Post features:
        - Text → BERT embedding
        - Images/video → ResNet/CLIP embedding
        - Hashtags → tokenize ("lifeisgood" → ["life","is","good"]) → TF-IDF or word2vec
        - Reactions count → scaled numeric
        - Post age → bucketize → one-hot
      User features: demographics + context + historical interactions + 'is mentioned' flag.
      User-author affinity: like-rate, click-rate, share-rate, friendship length, close-friend
      flag — these are STRONGEST signals on Facebook.
    prompts:
      - type: mcq
        prompt: "What's the most predictive FAMILY of features here, per Facebook research?"
        choices:
          - "Post text alone"
          - "USER-AUTHOR AFFINITY (like rate to this author, friendship length, close friend flag)"
          - "Color of the image"
        answer: 1
      - type: match
        prompt: "Match each feature to its TYPICAL encoder."
        pairs:
          - { left: "Post text", right: "BERT" }
          - { left: "Post image / video", right: "ResNet / CLIP" }
          - { left: "Hashtags", right: "Tokenize (Viterbi) → TF-IDF or word2vec" }
          - { left: "Post age", right: "Bucketize → one-hot" }
          - { left: "User country", right: "Embedding layer" }
      - type: mcq
        prompt: "Why use Viterbi / segmentation for HASHTAGS?"
        choices:
          - "'lifeisgood' is one token but contains useful words 'life is good' — splitting helps the embedder"
          - "Required by Postgres"
          - "It's faster"
        answer: 0
      - type: mcq
        prompt: "Why use TF-IDF or word2vec on hashtags instead of BERT?"
        choices:
          - "Hashtags are usually a single word/phrase with no surrounding context — heavyweight contextual models add cost without payoff"
          - "BERT can't process hashtags"
          - "Tradition"
        answer: 0
      - type: fill
        prompt: "Aggregating a user's liked-post embeddings into a fixed-size vector usually means taking their ____."
        answers: [average, mean]
      - type: mcq
        prompt: "Why is the BINARY 'user is mentioned in post' feature useful?"
        choices:
          - "Users pay disproportionate attention to posts that tag them"
          - "It's free"
          - "Required by Kafka"
        answer: 0
      - type: mcq
        prompt: "Why is the 'close friends and family' flag worth a feature?"
        choices:
          - "Posts from close ties drive far higher engagement than posts from acquaintances"
          - "Mandatory by RLS"
          - "It saves storage"
        answer: 0

  - title: "Model"
    intro: "Multi-task DNN: shared layers + per-reaction heads. Add SKIP and DWELL heads for passive users."
    rubric: |
      Architecture: ONE multi-task DNN.
        Shared layers (process input features) → multiple task-specific heads:
          - Click classification head
          - Like classification head
          - Comment classification head
          - Share classification head
          - Hide / block classification heads
          - SKIP classification head (binary: dwell < 0.5s?)
          - DWELL-TIME regression head
      Why multi-task:
        • Cheaper to train and serve than N independent DNNs
        • RARE reactions (block, friendship-request) borrow signal from common ones
      Loss = weighted sum of per-task losses (binary cross-entropy per classification head,
      MAE/MSE/Huber for the dwell-time regression).
      Final ranking score = weighted sum of head probabilities × business weights.
    prompts:
      - type: mcq
        prompt: "Why MULTI-TASK over N independent DNNs?"
        choices:
          - "Cheaper to train and serve; rare reactions piggyback on the shared representation"
          - "It's free"
          - "Multi-task is always more accurate"
        answer: 0
      - type: order
        prompt: "Order a multi-task forward pass at inference."
        items:
          - "Encode user / post / affinity features"
          - "Pass through shared layers"
          - "Each head outputs its prediction (probabilities for click/like/share/...; predicted dwell-time)"
          - "Combine head outputs × business weights into an engagement score"
          - "Rank posts by engagement score"
      - type: mcq
        prompt: "Why ADD a SKIP head and a DWELL-TIME head?"
        choices:
          - "Passive users rarely click/like — without SKIP and DWELL, the model has no signal for them"
          - "Tradition"
          - "Latency"
        answer: 0
      - type: match
        prompt: "Match each head to its LOSS."
        pairs:
          - { left: "Click / Like / Share / Comment / Hide / Block / Skip", right: "Binary cross-entropy" }
          - { left: "Dwell-time", right: "Regression loss (MAE / MSE / Huber)" }
          - { left: "Overall multi-task loss", right: "Weighted sum across heads" }
      - type: fill
        prompt: "If a user spends less than 0.5 seconds on a post, we label it as a ____."
        answers: [skip]
      - type: mcq
        prompt: "What's a downside of multi-task models we should watch for?"
        choices:
          - "Negative transfer — one head's training can degrade another head"
          - "Multi-task is always slower"
          - "Multi-task is illegal"
        answer: 0
      - type: mcq
        prompt: "How are LIKE labels constructed for training?"
        choices:
          - "Every impression with a like = positive; equally-sized random sample of impressions WITHOUT a like = negatives"
          - "Like everything"
          - "Use only likes"
        answer: 0

  - title: "Serving"
    intro: "Retrieval → ranking → re-ranking. Same shape as recsys, but feeds blend topical filters too."
    rubric: |
      Pipeline:
        1. Retrieval service: fetch unseen posts (or posts with unseen comments). Read [14]
           in the textbook for efficient strategies.
        2. Ranking service: multi-task DNN scores each retrieved post. Online features
           computed at request time; precomputed features pulled from a feature store.
        3. Re-ranking service: apply user filters (interest in a topic), promote/demote based
           on policy (sponsored, fairness, freshness).
      Final ranked list returned in <200ms.
    prompts:
      - type: mcq
        prompt: "What's the FIRST stage of the pipeline?"
        choices:
          - "Ranking"
          - "Retrieval — fetch the candidate posts (unseen, or with unseen comments)"
          - "Re-ranking"
        answer: 1
      - type: order
        prompt: "Order the request flow on a feed refresh."
        items:
          - "User refreshes feed"
          - "Retrieval service fetches unseen posts"
          - "Ranking service runs multi-task DNN — predicts each reaction probability"
          - "Engagement score = sum of (probability × business weight) per head"
          - "Re-ranking applies filters (topic interest, fairness, freshness)"
          - "Top-K posts returned in <200ms"
      - type: mcq
        prompt: "Why TWO feature paths into the ranker (online + feature store)?"
        choices:
          - "Online features change per-request (e.g. time of day); precomputed features (user history, author affinity) are too heavy to recompute"
          - "It's a vendor pattern"
          - "Latency"
        answer: 0
      - type: fill
        prompt: "We must respond within ____ milliseconds, end to end."
        answers: ["200", "200ms"]
      - type: mcq
        prompt: "Why have a SEPARATE re-ranking step vs. baking everything into the model?"
        choices:
          - "Re-ranking handles policy/fairness/freshness rules that change OFTEN — easier to tweak rules than retrain a model"
          - "Tradition"
          - "Saves disk"
        answer: 0
      - type: mcq
        prompt: "Cold start: a newly-friended user with no interaction data. What carries the rank?"
        choices:
          - "Random ordering"
          - "User demographics + author affinity (length of friendship, close-friend flag) + post features"
          - "Show only ads"
        answer: 1

  - title: "Monitoring & Iteration"
    intro: "Lots of heads, lots of ways to drift. Track per-reaction quality and the survey number."
    rubric: |
      Track:
        • Per-head ROC-AUC on audit slices
        • Reaction rates trend (like, share, hide, skip) per cohort
        • Total time spent (passive engagement)
        • Survey satisfaction
        • Feed staleness: % of impressions on posts older than X
        • Score / feature drift
      Retrain frequently — the platform is non-stationary (trends, slang, events).
      Rollouts: shadow → canary → ramp; monitor HIDE/BLOCK rates as guardrails.
    prompts:
      - type: mcq
        prompt: "HIDE rate jumps 30% after a model rollout. What FIRST?"
        choices:
          - "Push it harder"
          - "Treat as guardrail breach: roll back and investigate which head shifted"
          - "Disable hides"
        answer: 1
      - type: order
        prompt: "Order a SAFE rollout for a new ranker."
        items:
          - "Beat the current model on per-head ROC-AUC offline"
          - "Shadow deploy: rank in parallel, compare engagement-score distributions"
          - "Canary 1% of traffic; watch reaction rates AND total time spent AND hide/block"
          - "Ramp to 10% → 50% → 100%"
          - "Keep the previous model warm for instant rollback"
      - type: fill
        prompt: "Aggressive rises in HIDE and BLOCK rates are negative ____ that the new model is hurting users."
        answers: [signals, signal]
      - type: mcq
        prompt: "Why monitor RATES PER COHORT, not just global?"
        choices:
          - "A regression on a single language or age group can hide inside a stable global average"
          - "It's free"
          - "Tradition"
        answer: 0
      - type: mcq
        prompt: "Why retrain FREQUENTLY in this domain?"
        choices:
          - "Trends, news cycles, and slang shift fast — yesterday's signals decay quickly"
          - "Disk fills up"
          - "GPUs cool down"
        answer: 0
      - type: mcq
        prompt: "Why specifically watch TOTAL TIME SPENT alongside reaction rates?"
        choices:
          - "Reaction rates can rise even as passive users disengage; time-spent catches that"
          - "It's free"
          - "Required by Postgres"
        answer: 0
---
