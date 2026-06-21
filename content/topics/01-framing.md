---
slug: framing
title: "Problem Framing"
order: 1
prereq_slugs: []
intro: "Every ML system design starts here: take a vague business goal, ask the right clarifying questions, then turn it into a sharp ML task. Get this wrong and the rest is wasted effort."
mental_map:
  summary: "Two halves. First, ask clarifying questions until you and the interviewer agree on scope. Then translate the agreed business goal into a concrete ML task with crisp inputs/outputs and the right ML category."
  diagram: |
    flowchart TD
      A[Vague prompt<br/>e.g. 'design video recsys'] --> B[Clarifying Questions]
      B --> B1[Business objective]
      B --> B2[Features to support]
      B --> B3[Data available]
      B --> B4[Constraints]
      B --> B5[Scale]
      B --> B6[Performance / latency]
      B1 & B2 & B3 & B4 & B5 & B6 --> C[Agreed scope]
      C --> D[Frame as ML Task]
      D --> D1[ML objective]
      D --> D2[Inputs & outputs<br/>per model]
      D --> D3[ML category]
      D3 --> D3a[Supervised]
      D3 --> D3b[Unsupervised]
      D3 --> D3c[Reinforcement]
      D3a --> D3aa[Classification<br/>binary / multiclass]
      D3a --> D3ab[Regression]
      D1 & D2 & D3 --> E[Ready to design data + model]
  concepts:
    - title: "Clarifying questions buckets"
      body: "Always ask about business objective, supported features, data, constraints, scale, and performance. These six buckets cover ~90% of what changes the design."
    - title: "Business objective vs ML objective"
      body: "Business objective is the dollar / engagement goal ('increase watch time'). ML objective is what the model can actually optimize ('predict watch-time per video'). Translate one to the other."
    - title: "Inputs & outputs of each model"
      body: "Multiple models often combine in a system (e.g. violence-detector + nudity-detector → harmful). Specify the input and output of each separately."
    - title: "Picking the ML category"
      body: "Supervised dominates real systems. Inside supervised: classification (binary or multiclass), regression, ranking, detection, representation. The category is a design choice, not an automatic answer."
    - title: "Be flexible"
      body: "The framework is a scaffold, not a script. If the interviewer cares only about model development, spend your time there."
lessons:
  - order: 1
    title: "Clarifying requirements"
    prompts:
      - type: mcq
        prompt: "Your interviewer says 'design a video recommendation system.' What's the FIRST thing to do?"
        choices:
          - "Pick a model architecture"
          - "Ask clarifying questions about business goal, scale, latency, and what's in scope"
          - "Talk about GPUs"
        answer: 1
        explanation: "ML system design questions are intentionally vague. Step 1 is always: ask, scope, agree."
      - type: match
        prompt: "Match each clarifying question to the BUCKET it lives in."
        pairs:
          - { left: "Are we maximizing engagement or revenue?", right: "Business objective" }
          - { left: "How many videos? How many users?", right: "Scale" }
          - { left: "How fast must each prediction return?", right: "Performance / latency" }
          - { left: "Can users like / dislike?", right: "Features the system must support" }
          - { left: "Cloud or on-device?", right: "Constraints" }
      - type: mcq
        prompt: "We're designing a homepage video feed. Why does 'how many videos exist' matter?"
        choices:
          - "It changes the office layout"
          - "10 BILLION videos can't be scored exhaustively in 200ms — scale forces multi-stage retrieval"
          - "It doesn't"
        answer: 1
      - type: fill
        prompt: "End the clarifying step by writing down the agreed list of requirements and ____ so everyone is on the same page."
        answers: [constraints, scope]
      - type: mcq
        prompt: "Why is it OK to declare some things OUT OF SCOPE?"
        choices:
          - "It's required by law"
          - "Scope creep ruins designs — explicit boundaries (e.g. 'no personalization', 'English only') focus the work"
          - "Tradition"
        answer: 1
      - type: mcq
        prompt: "The interviewer is mainly interested in how you'd train the model. What should you do?"
        choices:
          - "Stick to the framework rigidly"
          - "Be flexible — abridge requirements, spend most time where they care"
          - "Refuse"
        answer: 1
      - type: mcq
        prompt: "Which is a STRONG framing answer to 'design a personalized news feed'?"
        choices:
          - "Use BERT for everything"
          - "Rank unseen posts by predicted engagement (weighted reactions); 200ms latency; 2B daily-active users — multi-task DNN per reaction"
          - "Try a few models"
        answer: 1

  - order: 2
    title: "Framing the problem as an ML task"
    prompts:
      - type: mcq
        prompt: "A business goal is 'increase user engagement'. Why isn't that an ML objective?"
        choices:
          - "It is"
          - "Models can't optimize a vague goal — we must translate it to something measurable like 'maximize predicted relevance score per ⟨user, video⟩'"
          - "It's against company policy"
        answer: 1
      - type: match
        prompt: "Match each business objective to a SHARP ML objective."
        pairs:
          - { left: "Increase video engagement", right: "Maximize predicted relevance (mix of explicit + implicit signals)" }
          - { left: "Improve platform safety", right: "Predict probability that a post is harmful" }
          - { left: "Increase ad revenue", right: "Maximize predicted click-through rate" }
          - { left: "Grow user network", right: "Predict probability of forming a connection" }
      - type: mcq
        prompt: "We're building harmful content detection. What's the INPUT and OUTPUT of the system?"
        choices:
          - "Input: user. Output: a friend list"
          - "Input: a post (text + image + video). Output: per-class probabilities + an aggregate harm score"
          - "Input: random. Output: random"
        answer: 1
      - type: order
        prompt: "Order the three steps of 'frame the problem as an ML task'."
        items:
          - "Define the ML objective (translate the fuzzy business goal)"
          - "Specify the system's input and output"
          - "Choose the right ML category (classification / regression / ranking / representation)"
      - type: match
        prompt: "Match each problem to its ML CATEGORY."
        pairs:
          - { left: "Visual search: find similar images", right: "Representation learning + ranking" }
          - { left: "Detect faces & plates in Street View", right: "Object detection (classification + box regression)" }
          - { left: "Personalized feed ranking", right: "Multi-task pointwise learning-to-rank" }
          - { left: "Predict if a post is hateful", right: "Binary classification" }
      - type: fill
        prompt: "If we can't describe the model's output as a concrete prediction (a number, label, or list), the problem isn't well ____."
        answers: [framed, defined, scoped]
      - type: mcq
        prompt: "Why might one ML system contain MULTIPLE models with different inputs/outputs?"
        choices:
          - "Models are decorative"
          - "Different sub-tasks (e.g. detect violence, detect nudity) often need different models, then combine outputs"
          - "It's a bug"
        answer: 1
---
