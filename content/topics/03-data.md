---
slug: data
title: "Data Preparation"
order: 3
prereq_slugs: [metrics]
intro: "Data is the textbook the model studies. Clean inputs, smart features, and honest labels matter more than which model architecture you pick."
mental_map:
  summary: "Data preparation has two halves. Data engineering brings raw examples together with labels. Feature engineering turns those examples into model-ready signal — without leaking the answer."
  diagram: |
    flowchart TD
      S[Data sources] --> DE[Data Engineering]
      DE --> DEa[Storage: SQL / NoSQL / warehouse]
      DE --> DEb[ETL pipelines]
      DE --> LBL[Label strategy]
      LBL --> LBL1[Explicit: rating, like]
      LBL --> LBL2[Implicit: click, watch]
      LBL --> LBL3[Hand-labeled sample]
      LBL --> LBL4[Self-supervised augmentation]
      LBL --> IMB[Handle imbalance<br/>resample / class weights / focal]
      DEa & DEb & LBL --> FE[Feature Engineering]
      FE --> FE1[Text → BERT / TF-IDF / CBOW]
      FE --> FE2[Image / Video → CNN / ViT / CLIP]
      FE --> FE3[Categorical → embeddings]
      FE --> FE4[Numeric → bucketize / scale]
      FE --> FE5[Variable-length history → pool]
      FE --> AUG[Augmentation<br/>transform labels too]
      FE --> LEAK[Prevent leakage<br/>time-based split, train-only stats]
      LEAK --> READY[Model-ready features]
  concepts:
    - title: "Label sources are a spectrum"
      body: "Explicit (likes, ratings) is accurate but sparse. Implicit (clicks, watch) is plentiful but noisy. Hand-labeled is gold but expensive. Most systems combine sources."
    - title: "Class imbalance"
      body: "When one class dominates (99% benign), the model can ignore the rare class and still hit 99% accuracy. Use resampling, class weights, or focal loss."
    - title: "Encoders by modality"
      body: "Text → pre-trained transformer (BERT). Short tags → TF-IDF or CBOW (cheaper, no context). Images → CNN/ViT/CLIP. IDs → learned embeddings. Numeric → bucketize or scale."
    - title: "Pooling variable-length inputs"
      body: "Search history, watched videos, comments per post. Encode each item, then average (or attention-pool) into a single fixed-size vector."
    - title: "Augmentation must transform labels too"
      body: "If you rotate an image for detection, you must rotate the bounding boxes. If you mask text, masked spans must update the label. Forgetting this silently corrupts training."
    - title: "Leakage"
      body: "Anything that wouldn't be available at prediction time must not appear in training. Compute statistics on train only; split by time when there's a temporal effect."
lessons:
  - order: 1
    title: "Data engineering: where examples come from"
    prompts:
      - type: mcq
        prompt: "What is a 'label' in supervised ML?"
        choices:
          - "A sticker on the data"
          - "The correct answer for each training example, that teaches the model what to predict"
          - "Another name for a feature"
        answer: 1
      - type: match
        prompt: "Match each label SOURCE to its character."
        pairs:
          - { left: "User clicked / watched", right: "Implicit — plentiful but noisy" }
          - { left: "User pressed 'like' / rated 5★", right: "Explicit — accurate but sparse" }
          - { left: "Human annotator on a sample", right: "Hand-labeled — accurate but expensive" }
          - { left: "Augmentation of the query (rotate, crop)", right: "Self-supervised — cheap but synthetic" }
      - type: mcq
        prompt: "Why does a video recommender combine EXPLICIT and IMPLICIT signals?"
        choices:
          - "Tradition"
          - "Explicit is sparse, implicit is noisy — combined into a relevance score, you get the best of each"
          - "It's a vendor pattern"
        answer: 1
      - type: mcq
        prompt: "We have 500M posts/day. Which labeling strategy fits?"
        choices:
          - "Hand-label everything"
          - "Sample posts (often weighted by uncertainty) for human annotation; bootstrap from prior labels and user reports"
          - "Don't label anything"
        answer: 1
      - type: fill
        prompt: "When labels arrive long after the event (e.g. fraud chargebacks 60 days later), the labels have label ____."
        answers: [delay, latency, lag]
      - type: mcq
        prompt: "Imbalanced data: 99% benign, 1% harmful. How do we keep the model from ignoring the rare class?"
        choices:
          - "Delete the rare class"
          - "Resample (over/under) OR use class weights / focal loss in the loss function"
          - "Add more benign examples"
        answer: 1

  - order: 2
    title: "Feature engineering across modalities"
    prompts:
      - type: match
        prompt: "Match each input to its TYPICAL encoder."
        pairs:
          - { left: "Free-form text (titles, comments)", right: "Pre-trained BERT" }
          - { left: "Hashtags / single-word tags", right: "TF-IDF or word2vec / CBOW (lighter)" }
          - { left: "Image", right: "CNN (ResNet) or ViT / CLIP" }
          - { left: "Video", right: "Frame encoder + temporal aggregation" }
          - { left: "Categorical IDs (user, video)", right: "Learned embedding layer" }
          - { left: "Numeric (age)", right: "Bucketize → one-hot, or scale" }
      - type: mcq
        prompt: "Why use TF-IDF for HASHTAGS instead of a Transformer?"
        choices:
          - "Hashtags are usually one word with no surrounding context — heavyweight contextual models add cost without payoff"
          - "BERT can't read hashtags"
          - "Tradition"
        answer: 0
      - type: order
        prompt: "Order the standard TEXT preprocessing pipeline."
        items:
          - "Normalize (lowercase, strip punctuation, lemmatize)"
          - "Tokenize (word / subword / character)"
          - "Map tokens to integer IDs"
          - "Embed token IDs into vectors"
      - type: mcq
        prompt: "Variable-length history (search queries, liked videos) — how do we get a FIXED-size feature?"
        choices:
          - "Truncate to first 1"
          - "Encode each item and AVERAGE (or attention-pool) the embeddings"
          - "Pad to 1M"
        answer: 1
      - type: fill
        prompt: "Faking similar examples by rotating, cropping, or jittering inputs is called data ____."
        answers: [augmentation, augmenting]
      - type: mcq
        prompt: "Object detection augmentation: when you ROTATE the image, what must happen to the bounding boxes?"
        choices:
          - "Nothing"
          - "Rotate them too — labels must transform with the image"
          - "Delete them"
        answer: 1
      - type: mcq
        prompt: "Data LEAKAGE means..."
        choices:
          - "Disk overflow"
          - "Information from the future or the answer sneaks into your training features"
          - "Encrypted features"
        answer: 1
      - type: mcq
        prompt: "Predicting churn next month, which feature LEAKS?"
        choices:
          - "Days since signup"
          - "Whether the user already cancelled their subscription"
          - "Login frequency"
        answer: 1
      - type: order
        prompt: "Order a leak-free training pipeline."
        items:
          - "Split into train / validation / test (often by TIME)"
          - "Compute statistics (means, encodings) using ONLY the train split"
          - "Apply those statistics to validation and test"
          - "Train and tune the model"
          - "Evaluate on the held-out test set"
---
