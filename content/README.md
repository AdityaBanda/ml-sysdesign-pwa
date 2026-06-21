# Content authoring

All learning content lives here as `.md` files with YAML frontmatter. The ingest
script (`pnpm ingest`) parses these files and seeds Supabase.

## Files

- `framework.md` — the ML system design framework: stages, prompts, rubric.
- `topics/<order>-<slug>.md` — skill-tree topics; each has a sequence of short lessons.
- `cases/<slug>.md` — full case studies; walked through stage by stage.

## Schema

Each file uses gray-matter style frontmatter (`---` delimited YAML) followed by
optional markdown body. Lessons, cases, and the framework all share the same
**Prompt** vocabulary so the renderer can be reused.

### Prompt types

```yaml
# multiple choice
- type: mcq
  prompt: "What is the primary metric for a recommendation system?"
  choices: [CTR, Watch time, Click-through]
  answer: 1                  # index into choices
  explanation: "Watch time better captures..."

# fill-in-the-blank (any of `answers` accepted, case-insensitive trim)
- type: fill
  prompt: "The two stages of a typical recsys are candidate generation and ____."
  answers: [ranking, re-ranking]

# put items in correct order
- type: order
  prompt: "Order the steps of model training."
  items: [data, features, train, evaluate, deploy]

# match left side to right side
- type: match
  prompt: "Match the metric to the use case."
  pairs:
    - { left: "Precision@K", right: "Recommendations" }
    - { left: "PR-AUC", right: "Imbalanced classification" }
```

### Topic file

```yaml
---
slug: framing
title: "Problem Framing"
order: 1
prereq_slugs: []
intro: "Every system starts with the why. Let's frame the problem."
lessons:
  - order: 1
    title: "What is a model trying to do?"
    prompts:
      - type: mcq
        prompt: "..."
        choices: ["...", "..."]
        answer: 0
---
```

### Case file

```yaml
---
slug: youtube-recsys
title: "YouTube Recommendation System"
difficulty: 3
prerequisites: [framing, metrics]
xp: 120
summary: "Design YouTube's home feed recommender."
stages:
  - title: "Problem Framing"
    intro: "Clarify scope and success."
    rubric: "We optimize for long-term watch time..."
    prompts:
      - type: mcq
        prompt: "..."
        choices: ["...", "..."]
        answer: 1
---
```

## Workflow

1. Edit / add `.md` files.
2. Run `pnpm ingest` (requires `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`).
3. The app picks up new content immediately — no code changes needed.
