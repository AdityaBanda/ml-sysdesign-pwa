---
slug: youtube-video-search
title: "YouTube Video Search (Text → Videos)"
difficulty: 3
prerequisites: [framing, metrics, data, model, serving, monitoring]
xp: 170
summary: "User types 'playing guitar at night' — we return the most relevant videos out of a billion. Combine text search with visual representation."
stages:
  - title: "Problem Framing"
    intro: "Text in, ranked videos out. Two pillars: textual match + visual semantic match."
    rubric: |
      Goal: rank videos by relevance to a text query.
      Inputs: text query only (no image/audio queries). English-only for v1.
      Items: ~1B videos. Use BOTH visual content and textual metadata (title, description, tags).
      Out of scope: personalization (every user gets the same results for the same query).
      Training data: 10M ⟨video, text query⟩ pairs.
    prompts:
      - type: mcq
        prompt: "What goes IN, what comes OUT?"
        choices:
          - "Image in → videos out"
          - "Text query in → ranked list of videos out"
          - "Voice in → text out"
        answer: 1
      - type: mcq
        prompt: "Which signal sources do we use for relevance?"
        choices:
          - "Only the title"
          - "BOTH visual content (frames) AND textual metadata (title, description, tags)"
          - "Only watch counts"
        answer: 1
      - type: match
        prompt: "Sort each item: in scope or OUT of scope."
        pairs:
          - { left: "English-only queries", right: "In scope" }
          - { left: "Personalized rankings per user", right: "Out of scope" }
          - { left: "Image queries", right: "Out of scope" }
          - { left: "Visual + text relevance", right: "In scope" }
      - type: fill
        prompt: "We have ____ billion videos on the platform."
        answers: ["1", "one"]
      - type: mcq
        prompt: "Why combine TEXT search with VISUAL search instead of just one?"
        choices:
          - "Text search alone misses videos with poor titles; visual search alone misses what people actually call things in words"
          - "It's required by Elasticsearch"
          - "It's traditional"
        answer: 0
      - type: mcq
        prompt: "Search vs. recommendation — what's the framing difference?"
        choices:
          - "Search: user-driven query at this moment. Recommendation: predict what the user wants without an explicit query."
          - "Search and recommendation are identical"
          - "Recommendation requires text"
        answer: 0

  - title: "Metrics"
    intro: "Ranking is the game. Pick metrics that respect graded relevance and survive scale."
    rubric: |
      Offline: nDCG@K (graded relevance), MRR for fast sanity, mAP if you treat relevance
      as binary.
      Online: video click-through rate, watch time per query, fraction of queries that
      lead to a played video, satisfaction surveys.
      Guardrails: P99 query latency, harmful-content rate among results.
    prompts:
      - type: mcq
        prompt: "Which OFFLINE metric handles graded relevance scores well?"
        choices:
          - "MRR"
          - "nDCG@K"
          - "Plain accuracy"
        answer: 1
      - type: match
        prompt: "Sort each metric into its bucket."
        pairs:
          - { left: "nDCG@10 on labeled queries", right: "Offline" }
          - { left: "Click-through rate of search results", right: "Online" }
          - { left: "P99 query latency", right: "Guardrail" }
          - { left: "Harmful-content rate in top-10", right: "Guardrail" }
      - type: mcq
        prompt: "Why is plain CLICK-THROUGH an imperfect online metric?"
        choices:
          - "Catchy thumbnails win clicks even when the video isn't actually relevant"
          - "Clicks aren't measurable"
          - "CTR is trademarked"
        answer: 0
      - type: fill
        prompt: "We pair CTR with watch ____ to detect clickbait."
        answers: [time, duration, fraction]
      - type: mcq
        prompt: "If offline nDCG goes UP but online watch-time goes DOWN, what's wrong?"
        choices:
          - "Offline metric is misaligned with the online goal — fix it"
          - "Bug in CSS"
          - "Server is down"
        answer: 0
      - type: mcq
        prompt: "What's a useful FRESHNESS-related metric?"
        choices:
          - "Time-to-index for new videos: how long after upload before they appear in search"
          - "GPU temperature"
          - "Disk usage"
        answer: 0

  - title: "Data"
    intro: "Multi-modal preprocessing: turn text and video into vectors a model can compare."
    rubric: |
      Annotated data: 10M ⟨video, query⟩ pairs split into train/val/test.
      Text preprocessing: normalize → tokenize → token IDs.
        Normalization: lowercase, strip punctuation, strip accents, lemmatize.
        Tokenization: word, subword (BPE), or character.
      Video preprocessing: sample frames → resize → scale → normalize. Then encode each
        frame and aggregate (e.g. average pooling) to get one video embedding.
    prompts:
      - type: order
        prompt: "Order the standard text preprocessing pipeline."
        items:
          - "Text normalization (lowercase, strip punctuation, lemmatize)"
          - "Tokenization (word / subword / character)"
          - "Map tokens to integer IDs"
          - "Embed token IDs into vectors via the model's embedding layer"
      - type: match
        prompt: "Match each text-prep step to its EXAMPLE."
        pairs:
          - { left: "Lowercasing", right: "'DOG!' → 'dog'" }
          - { left: "Stripping accents", right: "'Montréal' → 'Montreal'" }
          - { left: "Lemmatization", right: "'walking', 'walked', 'walks' → 'walk'" }
          - { left: "Tokenization", right: "'I have an interview' → ['I','have','an','interview']" }
      - type: mcq
        prompt: "How do we convert a VIDEO into something a model can use?"
        choices:
          - "Extract frames → preprocess each → encode each → aggregate (e.g. average) into a single video embedding"
          - "Send the raw mp4 file to the model"
          - "Use only the title"
        answer: 0
      - type: mcq
        prompt: "Why use SUBWORD tokenization (e.g. BPE)?"
        choices:
          - "It handles rare words and typos better — splits 'guitarrist' into 'guitar' + 'rist'"
          - "It's faster"
          - "It's older"
        answer: 0
      - type: fill
        prompt: "Splitting tokens with a fixed-size vocabulary using techniques like Byte-Pair ____ keeps vocabulary manageable."
        answers: [Encoding, encoding]
      - type: mcq
        prompt: "What's the SPLIT strategy for the 10M pairs?"
        choices:
          - "Random 80/10/10"
          - "Train / validation / test, often time-based to avoid leaking future data"
          - "All in train"
        answer: 1
      - type: mcq
        prompt: "Which augmentation might HELP video features?"
        choices:
          - "Sampling different frame subsets per epoch — exposes the encoder to varied moments"
          - "Inverting subtitles"
          - "Random text"
        answer: 0

  - title: "Model"
    intro: "Hybrid: text-search index for keyword match + a two-encoder visual-semantic model."
    rubric: |
      Two-encoder representation model:
        Text encoder (Transformer, e.g. BERT) → text embedding
        Video encoder (CNN/ViT over frames + pooling) → video embedding
        Similarity = dot product or cosine. Trained with contrastive loss on
        ⟨query, matching video⟩ pairs.
      Plus: an inverted-index text search (Elasticsearch) for fast keyword match.
      Final ranker fuses scores from both.
    prompts:
      - type: order
        prompt: "Order a SINGLE forward pass for the visual-semantic model."
        items:
          - "Encode the text query into an embedding"
          - "Encode the video frames into an embedding"
          - "Compute similarity (dot product / cosine) between the two embeddings"
          - "Output the similarity as the relevance score"
      - type: mcq
        prompt: "What's the POINT of a two-encoder design?"
        choices:
          - "Text and video go through SEPARATE encoders into a SHARED embedding space — video embeddings can be precomputed and indexed"
          - "It's a research trend"
          - "Two encoders is faster"
        answer: 0
      - type: mcq
        prompt: "Why ALSO use an INVERTED-INDEX text search alongside the model?"
        choices:
          - "It handles exact keyword matches and channel/title search blazing fast — pure semantic models can miss literal matches"
          - "It's required by Postgres"
          - "Tradition"
        answer: 0
      - type: match
        prompt: "Match each component to its STRENGTH."
        pairs:
          - { left: "Inverted-index text search (Elasticsearch)", right: "Fast literal keyword match, exact title hits" }
          - { left: "Visual-semantic model", right: "Captures semantic similarity even when titles use different words" }
          - { left: "Final ranker", right: "Fuses signals to produce the displayed order" }
      - type: fill
        prompt: "We train the two-encoder model with ____ loss on ⟨query, matching video⟩ pairs."
        answers: [contrastive]
      - type: mcq
        prompt: "Why are PRE-TRAINED text encoders (BERT) common here?"
        choices:
          - "They already know language structure — saves enormous amounts of training time and improves quality"
          - "They're free"
          - "They don't fit in memory otherwise"
        answer: 0
      - type: mcq
        prompt: "What's a sensible BASELINE before the two-encoder model?"
        choices:
          - "Pure BM25 / Elasticsearch keyword search over titles, descriptions, tags"
          - "Random ordering"
          - "Show only the latest videos"
        answer: 0

  - title: "Serving"
    intro: "Two backends: an inverted text index, and a vector index. Fuse and re-rank at request time."
    rubric: |
      Indexing pipeline (offline):
        • Build inverted index over title/description/tags
        • Compute every video's embedding, store in ANN vector index (FAISS / ScaNN)
      Prediction pipeline (online):
        • Query → text-search candidates + (encoded query → ANN candidates)
        • Merge candidates → ranker scores them with extra features
        • Re-ranking applies policy (harmful, dedup, freshness)
        • Return top-K
      P99 budget: well under a second.
    prompts:
      - type: mcq
        prompt: "Should this be ONLINE or BATCH?"
        choices:
          - "Batch — pre-compute results"
          - "Online — the user is waiting on a search response"
          - "Both"
        answer: 1
      - type: order
        prompt: "Order the request flow."
        items:
          - "User submits text query"
          - "Inverted-index text search returns keyword candidates"
          - "Query is encoded; ANN vector search returns semantic candidates"
          - "Candidates are merged; ranker scores them with extra features"
          - "Re-ranking applies policy/diversity/dedup"
          - "Top-K videos returned to the user"
      - type: mcq
        prompt: "Why pre-compute VIDEO embeddings instead of computing per request?"
        choices:
          - "Encoding billions of videos per request is impossible — we'd never make latency"
          - "It's required by ANN libraries"
          - "Storage is free"
        answer: 0
      - type: fill
        prompt: "Two well-known ANN libraries are FAISS and ____."
        answers: [ScaNN, scann]
      - type: mcq
        prompt: "What if the vector index goes DOWN?"
        choices:
          - "Crash the search page"
          - "Fall back to inverted-index text search alone — degraded but functional"
          - "Show no results"
        answer: 1
      - type: mcq
        prompt: "Why merge candidates from BOTH retrieval paths instead of one?"
        choices:
          - "Each path catches different videos: text catches exact matches, vector catches semantic matches"
          - "It's a load balancer trick"
          - "Latency"
        answer: 0

  - title: "Monitoring & Iteration"
    intro: "Track quality, freshness, and rare-but-important harms (offensive results)."
    rubric: |
      Track:
        • Online quality: CTR, watch time per query, satisfaction
        • Time-to-index for new videos
        • Drift in query distribution (new trends, new terms)
        • Harmful-content rate in top-K (guardrail)
      Cadence: text encoder retrained periodically; video encoder less often (videos are
      more stable). Re-embed videos when the encoder changes.
      Rollouts: shadow → canary → ramp.
    prompts:
      - type: mcq
        prompt: "What does TIME-TO-INDEX measure?"
        choices:
          - "How long after upload before a new video is searchable"
          - "Time it takes to render the page"
          - "Disk seek latency"
        answer: 0
      - type: mcq
        prompt: "Query distribution suddenly shifts toward new slang. What might fail?"
        choices:
          - "Tokenizers may produce many unknown tokens; embeddings become poor for new terms"
          - "Memory leaks"
          - "Disk fills"
        answer: 0
      - type: order
        prompt: "Order a SAFE rollout for a new visual-semantic model."
        items:
          - "Beat the current model on offline nDCG"
          - "Re-embed all videos with the new encoder"
          - "Shadow deploy: compute new rankings in parallel"
          - "Canary 1% of queries; watch CTR and harmful-rate"
          - "Ramp to 10% → 50% → 100%"
      - type: fill
        prompt: "When the encoder changes, all video embeddings must be ____."
        answers: [recomputed, re-embedded, re-encoded]
      - type: mcq
        prompt: "Why retrain TEXT encoder more often than VIDEO encoder?"
        choices:
          - "Language and queries shift quickly; video content distribution is more stable"
          - "It's cheaper"
          - "Tradition"
        answer: 0
      - type: mcq
        prompt: "What's a fast guardrail for catching offensive results?"
        choices:
          - "Sample top-K results from sensitive queries and watch the harmful-content rate"
          - "Disk usage"
          - "Latency"
        answer: 0
---
