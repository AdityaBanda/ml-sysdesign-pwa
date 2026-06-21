---
slug: visual-search
title: "Visual Search (Pinterest-style)"
difficulty: 3
prerequisites: [framing, metrics, data, model, serving, monitoring]
xp: 180
summary: "User taps an image — the system shows visually similar images from billions on the platform. How would we design that?"
stages:
  - title: "Problem Framing"
    intro: "Pin down what the system actually does before any ML talk."
    rubric: |
      Goal: given a query image, return a ranked list of visually similar images.
      Scope: images only (no video). No personalization (same query → same results).
      No metadata used (rely only on pixels). No content moderation in scope.
      Scale: ~100B images on the platform → retrieval has to be FAST.
    prompts:
      - type: mcq
        prompt: "What does the user give us, and what do we return?"
        choices:
          - "Text query → list of images"
          - "Query IMAGE → list of visually similar images, ranked"
          - "User profile → list of friends"
        answer: 1
        explanation: "Visual search is image-in, image-list-out, ranked by similarity."
      - type: mcq
        prompt: "What's IN scope?"
        choices:
          - "Personalizing results per user"
          - "Returning visually similar images for an image query"
          - "Moderating unsafe content"
        answer: 1
      - type: match
        prompt: "Sort each item: in scope or out of scope."
        pairs:
          - { left: "Image query → similar images", right: "In scope" }
          - { left: "Personalization per user", right: "Out of scope" }
          - { left: "Video search", right: "Out of scope" }
          - { left: "Crop selection on the query image", right: "In scope" }
      - type: mcq
        prompt: "Why are we relying ONLY on pixels (not tags, not metadata)?"
        choices:
          - "Pixels are cheaper to store"
          - "We chose to keep the design simple — focus on visual similarity, not editorial signals"
          - "Tags don't exist"
        answer: 1
      - type: fill
        prompt: "We have around 100–200 ____ images on the platform — search has to be sub-linear."
        answers: [billion, billions]
      - type: mcq
        prompt: "Why CAN'T we just compare the query to every image one-by-one?"
        choices:
          - "Comparing every image at billions-scale would take far too long for a real-time response"
          - "It would be too cheap"
          - "Nothing — linear search works fine"
        answer: 0

  - title: "Metrics"
    intro: "Rank quality is the main game. Use ranking-aware metrics."
    rubric: |
      Offline: nDCG (since the eval set has graded similarity scores, not just yes/no).
      mAP only fits binary relevance. MRR ignores all but the first hit. Recall@k and
      Precision@k each miss either ranking quality or recall at scale.
      Online: CTR on suggested images; average time spent on the result page.
    prompts:
      - type: mcq
        prompt: "We have GRADED similarity scores (0–5) per query/result pair. Which OFFLINE metric fits best?"
        choices:
          - "MRR — only the first relevant item matters"
          - "nDCG — handles graded relevance and rewards better ordering"
          - "Plain accuracy"
        answer: 1
        explanation: "nDCG uses the actual relevance score and discounts items lower in the list."
      - type: mcq
        prompt: "Why is RECALL@k often a poor metric for a huge image database?"
        choices:
          - "If millions of images are 'relevant', the denominator explodes — recall stays tiny no matter what"
          - "Recall is patented"
          - "It can't be computed"
        answer: 0
      - type: mcq
        prompt: "Why is mAP not ideal here?"
        choices:
          - "It's slow to compute"
          - "mAP assumes BINARY relevance — but we have graded similarity scores 0–5"
          - "It's deprecated"
        answer: 1
      - type: match
        prompt: "Sort each metric into its bucket."
        pairs:
          - { left: "nDCG@10 on graded eval set", right: "Offline" }
          - { left: "Click-through rate on results", right: "Online" }
          - { left: "Average time spent on results page", right: "Online" }
          - { left: "P99 retrieval latency", right: "Guardrail" }
      - type: fill
        prompt: "MRR's weakness: it ONLY considers the rank of the first ____ item."
        answers: [relevant, correct]
      - type: mcq
        prompt: "Why ALSO watch CTR online when we already evaluate nDCG offline?"
        choices:
          - "Offline metrics use frozen labels; CTR shows whether REAL users actually engage with the results"
          - "CTR is required by law"
          - "It's faster"
        answer: 0

  - title: "Data"
    intro: "Pixels in, embeddings out. The hard part is getting clean training pairs."
    rubric: |
      Available data: images + metadata, users, user-image interactions (clicks, impressions).
      Preprocess images: resize (224×224), scale to [0,1], normalize, ensure RGB.
      Training pair construction: for each query image, you need 1 similar (positive) +
      n−1 dissimilar (negative). Three options for the positive:
        1. Human labels — accurate but expensive
        2. Click data — cheap but noisy + sparse
        3. Self-supervision (augment the query) — cheap, clean, but synthetic
      We start with self-supervision (SimCLR/MoCo style).
    prompts:
      - type: mcq
        prompt: "Each training data point contains: a query image, ONE similar image, and...?"
        choices:
          - "Just the user ID"
          - "n−1 dissimilar images (negatives)"
          - "The image's tags"
        answer: 1
        explanation: "Contrastive training learns from comparisons — query, one positive, many negatives."
      - type: match
        prompt: "Match each labeling option to its biggest TRADEOFF."
        pairs:
          - { left: "Human-labeled positives", right: "Accurate but expensive and slow" }
          - { left: "User clicks as 'similar'", right: "Cheap but noisy and sparse" }
          - { left: "Augmented query (self-supervision)", right: "Cheap and clean, but synthetic" }
      - type: mcq
        prompt: "We CHOSE self-supervision (augment the query) for the first version. Why?"
        choices:
          - "It's the only legal option"
          - "It scales for free, has no human cost, and works well on big datasets like SimCLR showed"
          - "It's slower"
        answer: 1
      - type: order
        prompt: "Order the standard image preprocessing steps."
        items:
          - "Resize to fixed dimensions (e.g. 224×224)"
          - "Scale pixel values to [0, 1]"
          - "Z-score normalize (mean 0, std 1)"
          - "Ensure consistent color mode (RGB)"
      - type: fill
        prompt: "Creating fake similar images by rotating/cropping the query is called data ____."
        answers: [augmentation, augmenting]
      - type: mcq
        prompt: "How might LEAKAGE sneak into a click-based labeling approach?"
        choices:
          - "Using clicks that occurred AFTER the moment we'd be predicting on"
          - "Using too few negatives"
          - "Resizing images"
        answer: 0
      - type: mcq
        prompt: "Why is CLICK-based labeling considered 'sparse'?"
        choices:
          - "Most images shown are never clicked, so we have very few labeled examples per image"
          - "Clicks are encrypted"
          - "Clicks happen too fast"
        answer: 0

  - title: "Model"
    intro: "Representation learning: train an encoder that maps similar images close in embedding space."
    rubric: |
      Architecture: a CNN (e.g. ResNet) or Transformer (e.g. ViT) that outputs a fixed-size
      embedding vector. Train with contrastive loss:
        1. Encode query, positive, and negatives.
        2. Compute dot products / cosine similarity between query and each.
        3. Softmax → cross-entropy with the positive index as the label.
      Pre-trained backbones (ResNet, CLIP) speed this up massively.
    prompts:
      - type: mcq
        prompt: "What is an EMBEDDING in this system?"
        choices:
          - "A copy of the original image"
          - "A fixed-size numerical vector that summarizes the image so similar images have nearby vectors"
          - "The image's tags"
        answer: 1
      - type: order
        prompt: "Order the contrastive loss computation."
        items:
          - "Encode query, positive, and all negatives into embedding vectors"
          - "Compute similarity (dot product) between query and each other vector"
          - "Apply softmax over those similarities"
          - "Cross-entropy with label = index of the positive"
      - type: mcq
        prompt: "Which model family fits IMAGE inputs best for this?"
        choices:
          - "Logistic regression"
          - "CNN (e.g. ResNet) or Transformer (ViT)"
          - "Decision trees"
        answer: 1
      - type: match
        prompt: "Match each similarity measure to its NOTE."
        pairs:
          - { left: "Dot product", right: "Common for embedding similarity" }
          - { left: "Cosine similarity", right: "Magnitude-invariant, very common" }
          - { left: "Euclidean distance", right: "Suffers from the curse of dimensionality" }
      - type: fill
        prompt: "Starting from a model that's already trained on a huge dataset and just adapting it is called ____ tuning."
        answers: [fine, fine-tuning]
      - type: mcq
        prompt: "Why even consider a PRE-TRAINED backbone?"
        choices:
          - "It's free RAM"
          - "It already learned strong general visual features — saves training time and usually improves quality"
          - "It avoids feature engineering"
        answer: 1
      - type: mcq
        prompt: "What's a sensible BASELINE before training a fancy contrastive model?"
        choices:
          - "Show the same images to everyone"
          - "Use a pre-trained CNN's features off-the-shelf with a nearest-neighbor search"
          - "Random ordering"
        answer: 1

  - title: "Serving"
    intro: "At billions-scale, exact nearest neighbor is too slow. ANN is your friend."
    rubric: |
      Two pipelines:
        Indexing pipeline: when an image is uploaded, generate its embedding and add to the
          ANN index.
        Prediction pipeline: query image → preprocess → embedding → ANN lookup → re-rank
          (filters: NSFW, duplicates, private images) → return ranked list.
      Exact NN: O(N×D) — too slow at N=billions.
      ANN families: tree-based (Annoy), LSH, clustering. Libraries: FAISS, ScaNN.
    prompts:
      - type: mcq
        prompt: "What's wrong with EXACT nearest-neighbor at our scale?"
        choices:
          - "It returns wrong results"
          - "Comparing the query to billions of vectors per request is too slow"
          - "It needs a GPU"
        answer: 1
      - type: mcq
        prompt: "What does ANN trade for speed?"
        choices:
          - "Memory for exactness"
          - "A small bit of accuracy (it returns approximately the nearest neighbors) for huge speed gains"
          - "Latency for cost"
        answer: 1
      - type: order
        prompt: "Order the PREDICTION pipeline at request time."
        items:
          - "User submits a query image"
          - "Preprocess the image (resize / normalize)"
          - "Generate an embedding using the trained model"
          - "ANN service returns nearest neighbors from the index"
          - "Re-ranking service applies filters (NSFW, duplicates, privacy)"
          - "Return the final ranked list"
      - type: order
        prompt: "Order the INDEXING pipeline (runs when new images are uploaded)."
        items:
          - "New image lands in object storage"
          - "Indexing service computes its embedding"
          - "Embedding added to the ANN index table"
          - "Image becomes discoverable by search"
      - type: match
        prompt: "Match the ANN family to its IDEA."
        pairs:
          - { left: "Tree-based (Annoy, KD-tree)", right: "Recursively partition the space, search only the relevant branch" }
          - { left: "Locality-sensitive hashing (LSH)", right: "Hash close points into the same bucket" }
          - { left: "Clustering-based", right: "Search only inside the closest cluster" }
      - type: fill
        prompt: "Two well-known ANN libraries: FAISS (Meta) and ____ (Google)."
        answers: [ScaNN, scann]
      - type: mcq
        prompt: "What does the RE-RANKING service do?"
        choices:
          - "Re-trains the model live"
          - "Applies business rules: filter NSFW, remove duplicates, hide private images, etc."
          - "Computes new embeddings"
        answer: 1

  - title: "Monitoring & Iteration"
    intro: "Embeddings drift; new content arrives daily; users change. Watch and retrain."
    rubric: |
      Track:
        • Input drift (image preprocessing pipeline distributions)
        • Embedding distribution drift
        • CTR and time-on-page (online quality)
        • Index freshness — how stale are embeddings for recent uploads
      Cadence: re-embed new uploads continuously; retrain the encoder periodically (weekly
      or monthly). New encoders go shadow → canary → ramp.
    prompts:
      - type: mcq
        prompt: "If we ship a new ENCODER, what has to happen to existing embeddings?"
        choices:
          - "Nothing"
          - "All existing image embeddings need to be RE-COMPUTED with the new encoder so they live in the same space"
          - "Only the query gets re-encoded"
        answer: 1
        explanation: "Embeddings from different encoders are NOT comparable — you can't mix them."
      - type: mcq
        prompt: "CTR on results drops 10% week-over-week. The model didn't change. FIRST hypothesis?"
        choices:
          - "Retrain immediately"
          - "Check upstream: did the indexing pipeline break, did image preprocessing change, did a feature pipeline shift?"
          - "Buy GPUs"
        answer: 1
      - type: order
        prompt: "Order a SAFE rollout for a new encoder."
        items:
          - "Beat the current encoder on offline nDCG"
          - "Re-index a sample of images with the new encoder"
          - "Shadow deploy: compute new embeddings in parallel, compare retrieval results"
          - "Canary 1% of traffic and watch CTR + complaints"
          - "Ramp to 10% → 50% → 100% as guardrails stay green"
      - type: fill
        prompt: "Periodically retraining the encoder on fresh data is called the retraining ____."
        answers: [cadence, schedule, frequency]
      - type: mcq
        prompt: "Why monitor INDEX FRESHNESS?"
        choices:
          - "If the index lags far behind uploads, new images won't be findable — users see only stale catalog"
          - "Memory"
          - "Latency"
        answer: 0
      - type: mcq
        prompt: "What's a good FALLBACK if the ANN service is unavailable?"
        choices:
          - "Crash the search page"
          - "Fall back to a cached recent-popular set or a smaller secondary index"
          - "Block the user"
        answer: 1
---
