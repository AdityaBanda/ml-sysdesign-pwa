// Hand-written types until you run `supabase gen types typescript`.
// These mirror the SQL migration in supabase/migrations/0001_init.sql.

export type PromptType = "mcq" | "fill" | "order" | "match";

export interface McqPrompt {
  type: "mcq";
  prompt: string;
  choices: string[];
  answer: number; // index into choices
  explanation?: string;
  multi?: boolean;
}

export interface FillPrompt {
  type: "fill";
  prompt: string;
  answers: string[]; // any of these acceptable, case-insensitive
  explanation?: string;
}

export interface OrderPrompt {
  type: "order";
  prompt: string;
  items: string[]; // correct order
  explanation?: string;
}

export interface MatchPrompt {
  type: "match";
  prompt: string;
  pairs: Array<{ left: string; right: string }>;
  explanation?: string;
}

export type Prompt = McqPrompt | FillPrompt | OrderPrompt | MatchPrompt;

export interface CaseStage {
  title: string;
  intro?: string;
  prompts: Prompt[];
  rubric?: string; // canonical solution for the stage
}

export interface CaseDoc {
  slug: string;
  title: string;
  difficulty: number;
  prerequisites: string[];
  xp: number;
  summary?: string;
  stages: CaseStage[];
}

export interface TopicDoc {
  slug: string;
  title: string;
  order: number;
  prereq_slugs: string[];
  intro?: string;
  lessons: Array<{
    order: number;
    title: string;
    prompts: Prompt[];
  }>;
}

export interface FrameworkStage {
  title: string;
  goal: string;
  prompts: string[];
  rubric: string;
}

export interface FrameworkDoc {
  title: string;
  intro: string;
  stages: FrameworkStage[];
}

export interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  level: number;
  total_xp: number;
  current_streak: number;
  longest_streak: number;
  hearts: number;
  hearts_refilled_at: string;
  last_active_date: string | null;
  daily_xp_goal: number;
  created_at: string;
}
