"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const [evt, setEvt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (!evt || dismissed) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-40 max-w-sm mx-auto card p-4 flex items-center gap-3 shadow-lg">
      <div className="text-2xl">📲</div>
      <div className="flex-1 text-sm">
        <p className="font-bold">Install ML SysDesign</p>
        <p className="text-duo-gray text-xs">Practice on the go, even offline.</p>
      </div>
      <button
        onClick={async () => {
          await evt.prompt();
          await evt.userChoice;
          setDismissed(true);
        }}
        className="btn-primary text-sm py-2 px-3"
      >
        Install
      </button>
      <button onClick={() => setDismissed(true)} className="text-duo-gray text-xs px-1">
        ×
      </button>
    </div>
  );
}
