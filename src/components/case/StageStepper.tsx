"use client";

export interface StageStepperProps {
  stages: Array<{ title: string }>;
  currentIndex: number;
}

export function StageStepper({ stages, currentIndex }: StageStepperProps) {
  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        {stages.map((_, i) => (
          <div
            key={i}
            className={`h-2 flex-1 rounded-full transition ${
              i < currentIndex
                ? "bg-duo-green"
                : i === currentIndex
                ? "bg-duo-blue"
                : "bg-duo-border"
            }`}
          />
        ))}
      </div>
      <div className="flex items-center justify-between text-xs text-duo-gray">
        <span>
          Stage {currentIndex + 1} / {stages.length}
        </span>
        <span className="font-semibold text-white">{stages[currentIndex]?.title}</span>
      </div>
    </div>
  );
}
