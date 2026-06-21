import { z } from "zod";

const baseFields = { explanation: z.string().optional() };

const mcqSchema = z.object({
  type: z.literal("mcq"),
  prompt: z.string(),
  choices: z.array(z.string()).min(2),
  answer: z.number().int().min(0),
  multi: z.boolean().optional(),
  ...baseFields,
});

const fillSchema = z.object({
  type: z.literal("fill"),
  prompt: z.string(),
  answers: z.array(z.string()).min(1),
  ...baseFields,
});

const orderSchema = z.object({
  type: z.literal("order"),
  prompt: z.string(),
  items: z.array(z.string()).min(2),
  ...baseFields,
});

const matchSchema = z.object({
  type: z.literal("match"),
  prompt: z.string(),
  pairs: z.array(z.object({ left: z.string(), right: z.string() })).min(2),
  ...baseFields,
});

export const promptSchema = z.discriminatedUnion("type", [
  mcqSchema,
  fillSchema,
  orderSchema,
  matchSchema,
]);

const mentalMapSchema = z.object({
  summary: z.string().optional(),
  diagram: z.string().min(1),
  concepts: z
    .array(
      z.object({
        title: z.string(),
        body: z.string(),
      }),
    )
    .default([]),
});

export const topicSchema = z.object({
  slug: z.string(),
  title: z.string(),
  order: z.number().int(),
  prereq_slugs: z.array(z.string()).default([]),
  intro: z.string().optional(),
  mental_map: mentalMapSchema.optional(),
  lessons: z
    .array(
      z.object({
        order: z.number().int(),
        title: z.string(),
        prompts: z.array(promptSchema).min(1),
      }),
    )
    .min(1),
});

export const caseSchema = z.object({
  slug: z.string(),
  title: z.string(),
  difficulty: z.number().int(),
  prerequisites: z.array(z.string()).default([]),
  xp: z.number().int(),
  summary: z.string().optional(),
  stages: z
    .array(
      z.object({
        title: z.string(),
        intro: z.string().optional(),
        rubric: z.string().optional(),
        prompts: z.array(promptSchema).min(1),
      }),
    )
    .min(1),
});

export const frameworkSchema = z.object({
  title: z.string(),
  intro: z.string(),
  stages: z
    .array(
      z.object({
        title: z.string(),
        goal: z.string(),
        prompts: z.array(z.string()).min(1),
        rubric: z.string(),
      }),
    )
    .min(1),
});

export type TopicData = z.infer<typeof topicSchema>;
export type CaseData = z.infer<typeof caseSchema>;
export type FrameworkData = z.infer<typeof frameworkSchema>;
export type PromptData = z.infer<typeof promptSchema>;
