"use client";

interface SolutionRevealProps {
  rubric?: string;
  onContinue: () => void;
  isFinal?: boolean;
}

export function SolutionReveal({ rubric, onContinue, isFinal }: SolutionRevealProps) {
  return (
    <div className="card p-6 space-y-4">
      <div className="flex items-center gap-2 text-duo-green font-extrabold">
        <span>✅ Stage complete</span>
      </div>
      {rubric && (
        <div className="bg-duo-bg rounded-2xl p-4 border border-duo-border">
          <p className="text-xs uppercase tracking-wider text-duo-gray mb-2">
            Reference solution
          </p>
          <p className="whitespace-pre-line text-sm leading-relaxed">{rubric}</p>
        </div>
      )}
      <button onClick={onContinue} className="btn-primary w-full">
        {isFinal ? "Finish case" : "Next stage"}
      </button>
    </div>
  );
}
