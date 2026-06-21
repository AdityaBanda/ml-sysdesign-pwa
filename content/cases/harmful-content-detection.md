---
slug: harmful-content-detection
title: "Harmful Content Detection (Multimodal)"
difficulty: 4
prerequisites: [framing, metrics, data, model, serving, monitoring]
xp: 200
summary: "Posts contain text, images, and video — sometimes all three. Detect violence, hate, nudity, misinformation, and act before they spread."
stages:
  - title: "Problem Framing"
    intro: "Define what 'harmful' means precisely, and what action follows the prediction."
    rubric: |
      Goal: protect users from harmful content (violence, hate, nudity, misinformation, …).
      Inputs: a multimodal post (text + image + video, any combination).
      Outputs: per-class probabilities + an aggregate harm score → action.
      Actions: take down, demote, or send to human review.
      Volume: ~500M posts/day, multiple languages.
      Latency: near-real-time, but a human-review queue is fine.
    prompts:
      - type: mcq
        prompt: "What does the SYSTEM produce?"
        choices:
          - "A summary of the post"
          - "Per-class probabilities (violence, hate, nudity, …) used to take down, demote, or send to human review"
          - "A friend recommendation"
        answer: 1
      - type: mcq
        prompt: "Why is this a MULTIMODAL problem?"
        choices:
          - "Posts can be text, image, video, or any combination — we must handle all together"
          - "We use multiple servers"
          - "Multiple users"
        answer: 0
      - type: match
        prompt: "Match each ACTION to the score range."
        pairs:
          - { left: "Very high harm score", right: "Take down (auto-enforce)" }
          - { left: "Medium harm score", right: "Demote in feed / send to human review" }
          - { left: "Low harm score", right: "Allow normally" }
      - type: fill
        prompt: "We see roughly ____ million new posts every day."
        answers: ["500", "500M"]
      - type: mcq
        prompt: "Why does latency matter here, even if not as tight as fraud?"
        choices:
          - "Harmful content spreads quickly — every minute it stays up adds harm"
          - "Storage is expensive"
          - "Users will close the app"
        answer: 0
      - type: mcq
        prompt: "Why is this BOTH harder and easier than fraud?"
        choices:
          - "Harder: subjective definitions, multilingual, multimodal. Easier: humans can review borderline cases asynchronously."
          - "Same difficulty"
          - "Easier across the board"
        answer: 0

  - title: "Metrics"
    intro: "Class imbalance + asymmetric costs. Recall on the truly harmful classes matters most."
    rubric: |
      Class imbalance: harmful posts are a TINY fraction of all posts.
      Offline:
        • PR-AUC per class
        • ROC-AUC for class-balanced views
        • Recall at fixed precision target
      Online:
        • Prevalence: % of harmful content actually showing on the platform
        • Harmful impressions: volume of impressions on harmful content
        • Valid appeals: % of takedowns the user successfully appeals (FALSE positives)
        • Proactive rate: % of harmful content caught before user reports
    prompts:
      - type: mcq
        prompt: "Why is plain ACCURACY useless here?"
        choices:
          - "Almost all posts are benign — a 'never flag' model gets ~99.9% accuracy and catches nothing"
          - "Accuracy is illegal"
          - "It's hard to compute"
        answer: 0
      - type: mcq
        prompt: "Which OFFLINE metric is best for the IMBALANCED harmful classes?"
        choices:
          - "Plain accuracy"
          - "PR-AUC (Precision–Recall AUC) — focuses on the rare positive class"
          - "F1 at default threshold"
        answer: 1
      - type: match
        prompt: "Sort each metric into its bucket."
        pairs:
          - { left: "PR-AUC per class", right: "Offline" }
          - { left: "Prevalence (% harmful on platform)", right: "Online (north star)" }
          - { left: "Valid appeals rate", right: "Online (false-positive guardrail)" }
          - { left: "Proactive rate", right: "Online (operational)" }
      - type: mcq
        prompt: "What does PROACTIVE RATE measure?"
        choices:
          - "% of harmful content caught BEFORE users report it"
          - "% of users who proactively log in"
          - "Latency"
        answer: 0
      - type: fill
        prompt: "We don't ship a model on recall alone — we report recall at a fixed ____ target."
        answers: [precision]
      - type: mcq
        prompt: "Why watch BOTH false-positive rate (appeals) AND recall?"
        choices:
          - "Aggressive recall yields too many wrongful takedowns; aggressive precision misses real harm"
          - "Just one is enough"
          - "Appeals are unrelated"
        answer: 0
      - type: mcq
        prompt: "What's a SLOW but trustworthy ground-truth signal here?"
        choices:
          - "Human moderator decisions on a sampled audit set"
          - "Disk usage"
          - "User clicks"
        answer: 0

  - title: "Data"
    intro: "Multimodal features + careful labels. Annotators are precious."
    rubric: |
      Sources:
        • Users (demographics, history)
        • Posts (text, image, video, hashtags, mentions)
        • Interactions (likes, shares, hides, reports)
        • Author features (history of violations)
        • Contextual features (time, geography)
      Text → BERT or similar embedding.
      Image → CNN/ViT (ResNet, CLIP) embedding.
      Video → frame embeddings → temporal aggregation.
      Reactions/hashtags → numeric/encoding.
      Labels: human annotators on a sample. Tradeoff between coverage and cost.
    prompts:
      - type: mcq
        prompt: "Why do we use a PRE-TRAINED text model (BERT) for the text stream?"
        choices:
          - "It already knows language structure across many languages — saves training time and improves quality"
          - "It's free"
          - "Tradition"
        answer: 0
      - type: match
        prompt: "Match each input type to its TYPICAL encoder."
        pairs:
          - { left: "Post text", right: "BERT / multilingual Transformer" }
          - { left: "Post image", right: "CNN (ResNet) or ViT / CLIP" }
          - { left: "Post video", right: "Frame encoder + temporal aggregation" }
          - { left: "Reactions counts", right: "Scaled numeric features" }
      - type: mcq
        prompt: "Why are AUTHOR-history features useful?"
        choices:
          - "Past violation history is a strong signal that future posts may also be harmful"
          - "Authors are easy to spell"
          - "It's a vanity metric"
        answer: 0
      - type: mcq
        prompt: "What's the LABELING strategy for a 500M-posts-a-day system?"
        choices:
          - "Label everything"
          - "Sample posts (often weighted by uncertainty / borderline scores) for human annotation; bootstrap from prior labels and reports"
          - "Don't label anything"
        answer: 1
      - type: fill
        prompt: "Combining text, image, and video signals into one model is called ____ learning."
        answers: [multimodal, multi-modal]
      - type: mcq
        prompt: "What's the difference between EARLY and LATE fusion?"
        choices:
          - "Early fusion combines modalities BEFORE the main model layers; late fusion combines model outputs at the end"
          - "Just timing"
          - "Early fusion is unsupervised"
        answer: 0
      - type: mcq
        prompt: "Why is LANGUAGE COVERAGE a serious data concern here?"
        choices:
          - "Harmful patterns vary by language and culture; under-represented languages get worse detection"
          - "Translation is expensive"
          - "It's not a concern"
        answer: 0

  - title: "Model"
    intro: "Multi-task neural network: shared layers + per-class heads. Borrow strength across rare classes."
    rubric: |
      Multi-task DNN:
        • Shared layers process the multimodal input
        • Per-task heads predict each harm class (binary classification each)
        • Cross-entropy loss per task; combine with weights or gradient blending
      Why multi-task:
        • Some classes are very rare; sharing layers helps them learn from related tasks
        • Cheaper to train and serve one model than N independent ones
      Compare with: N independent DNNs (more accurate per class but expensive and weak on rare classes).
    prompts:
      - type: mcq
        prompt: "What's the SHAPE of a multi-task DNN here?"
        choices:
          - "A few independent models stitched together"
          - "Shared backbone layers feeding multiple task-specific HEADS, one per harm class"
          - "Just one binary classifier"
        answer: 1
      - type: mcq
        prompt: "Why prefer MULTI-TASK over N independent DNNs?"
        choices:
          - "Sharing layers helps RARE classes (less data) by transferring representations from common ones"
          - "It's faster only"
          - "Multi-task models are smaller always"
        answer: 0
      - type: order
        prompt: "Order a multi-task forward pass."
        items:
          - "Encode each modality (text, image, video) separately"
          - "Fuse features"
          - "Pass through shared dense layers"
          - "Each task head produces a probability for its harm class"
          - "Aggregate into an overall harm score and per-class outputs"
      - type: match
        prompt: "Match each loss to its TASK."
        pairs:
          - { left: "Cross-entropy per binary class", right: "Each harm-class head" }
          - { left: "Weighted sum across heads", right: "Overall multi-task loss" }
          - { left: "Class weighting / focal loss", right: "Counter class imbalance" }
      - type: fill
        prompt: "When tasks have very different gradients, a technique called gradient ____ rebalances them so no head dominates."
        answers: [blending, balancing, normalization]
      - type: mcq
        prompt: "What's a downside of multi-task models?"
        choices:
          - "Negative transfer: one head's training can degrade another head's performance"
          - "They're too small"
          - "They train faster always"
        answer: 0
      - type: mcq
        prompt: "Why not start with a HUGE model?"
        choices:
          - "Bigger isn't always better — start with a strong baseline (e.g. a multi-task BERT + ResNet) and only grow if it pays off"
          - "Latency rules"
          - "Big models are illegal"
        answer: 0

  - title: "Serving"
    intro: "Per-post scoring near real-time. Three downstream services act on the score."
    rubric: |
      At post-creation: detection service runs, computes per-class scores.
      Three downstream services consume the scores:
        • Violation enforcement service: high score → take down
        • Demoting service: medium score → reduce reach in feed
        • Harmful content service: borderline → human review queue
      Inference: GPU service, batched. Stream of new posts via Kafka/Pubsub.
      Feature store: author history, recent reaction velocity, etc.
    prompts:
      - type: mcq
        prompt: "How many DOWNSTREAM services consume the model's score?"
        choices:
          - "One"
          - "Three: enforcement (take down), demote (reduce reach), human review queue"
          - "None"
        answer: 1
      - type: order
        prompt: "Order the request/event flow when a post is created."
        items:
          - "Post is published to a stream (Kafka/Pubsub)"
          - "Detection service consumes the post and reads features from feature store"
          - "Multi-task model scores the post for each harm class"
          - "Aggregate harm score is computed"
          - "Score routed to enforcement / demote / review services per thresholds"
      - type: mcq
        prompt: "Why route MEDIUM scores to a HUMAN review queue?"
        choices:
          - "Borderline cases benefit from human judgment, and labeled outcomes feed the next training round"
          - "Humans are cheaper"
          - "Tradition"
        answer: 0
      - type: fill
        prompt: "A streaming bus like Kafka delivers each new post as an ____ to consumers."
        answers: [event, message]
      - type: mcq
        prompt: "What if the model service is DOWN momentarily?"
        choices:
          - "Drop posts"
          - "Apply a conservative rule-based fallback (block obvious patterns, hold rest in a queue) and replay events when service returns"
          - "Auto-block everything"
        answer: 1
      - type: mcq
        prompt: "Why a FEATURE STORE here?"
        choices:
          - "Author-history and rolling reaction features need millisecond reads at scoring time — a key-value store is much faster than recomputing"
          - "It's an industry trend"
          - "It's free"
        answer: 0

  - title: "Monitoring & Iteration"
    intro: "Adversaries adapt. Track per-class metrics and review-queue health."
    rubric: |
      Track:
        • Per-class precision/recall on audit samples
        • Prevalence trend per category
        • Appeal-success rate (false positives)
        • Review queue size and SLA breach rate
        • Drift: input feature drift and score drift
      Cadence: retrain frequently for adversarial classes (hate speech, scam patterns).
      Rollouts: shadow → canary → ramp, with humans in the loop on sensitive thresholds.
    prompts:
      - type: mcq
        prompt: "Hate-speech recall drops 10% in a non-English locale. What FIRST?"
        choices:
          - "Push a global threshold change"
          - "Investigate: is the language under-represented in the model? New slang? A pipeline bug?"
          - "Roll back"
        answer: 1
      - type: order
        prompt: "Order a SAFE rollout for a new harmful-content model."
        items:
          - "Beat current model on PR-AUC and recall@precision per class offline"
          - "Shadow deploy: score all posts with both, compare disagreement"
          - "Canary at 1% of traffic; watch appeal rate and prevalence"
          - "Ramp to 10% → 50% → 100%"
          - "Keep an audit slice on the old model for ongoing comparison"
      - type: fill
        prompt: "% of takedowns that the user successfully overturns is the ____ rate (a key false-positive signal)."
        answers: [appeal, valid appeals, valid-appeal]
      - type: mcq
        prompt: "Why is concept DRIFT especially aggressive here?"
        choices:
          - "Bad actors actively adapt to evade detection — yesterday's patterns may not match today's"
          - "Servers age"
          - "Users grow up"
        answer: 0
      - type: mcq
        prompt: "What does REVIEW QUEUE SIZE tell you?"
        choices:
          - "Whether thresholds are routing too much to humans (queue blows up) or too little (humans starve)"
          - "Server health"
          - "Disk usage"
        answer: 0
      - type: mcq
        prompt: "Why keep an OLD-model holdout slice after rollout?"
        choices:
          - "Honest ongoing comparison: 'is the new model still winning?' over time"
          - "Costs less"
          - "Required by Postgres"
        answer: 0
---
