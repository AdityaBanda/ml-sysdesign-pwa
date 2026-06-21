"use client";

import { useEffect, useId, useState } from "react";
import mermaid from "mermaid";

mermaid.initialize({
  startOnLoad: false,
  theme: "dark",
  themeVariables: {
    background: "#0f1115",
    primaryColor: "#1a1d24",
    primaryTextColor: "#e6e8ec",
    primaryBorderColor: "#2a2f3a",
    lineColor: "#4a5161",
    fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto",
  },
  flowchart: { htmlLabels: true, curve: "basis" },
  securityLevel: "loose",
});

export function MermaidDiagram({ chart }: { chart: string }) {
  const id = useId().replace(/[:]/g, "");
  const [svg, setSvg] = useState<string>("");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    mermaid
      .render(`m-${id}`, chart)
      .then((r) => {
        if (!cancelled) setSvg(r.svg);
      })
      .catch((e) => {
        if (!cancelled) setErr(String(e));
      });
    return () => {
      cancelled = true;
    };
  }, [chart, id]);

  if (err) {
    return (
      <pre className="text-xs text-duo-red whitespace-pre-wrap p-3 rounded-xl bg-duo-card border border-duo-border">
        Diagram failed: {err}
        {"\n\n"}
        {chart}
      </pre>
    );
  }

  return (
    <div
      className="overflow-x-auto rounded-2xl bg-duo-card border border-duo-border p-4 [&_svg]:max-w-full [&_svg]:h-auto [&_svg]:mx-auto"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
