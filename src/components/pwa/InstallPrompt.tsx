"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Download, Share, X } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "wg-install-banner-dismissed";
const DISMISS_EVENT = "wg-install-banner-dismissed-change";

const noopSubscribe = () => () => {};

function useStandalone() {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia("(display-mode: standalone)");
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    () =>
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone ===
        true,
    () => false
  );
}

function useIsIOS() {
  return useSyncExternalStore(
    noopSubscribe,
    () =>
      /iphone|ipad|ipod/i.test(window.navigator.userAgent) &&
      !("MSStream" in window),
    () => false
  );
}

function useBannerDismissed() {
  return useSyncExternalStore(
    (onChange) => {
      window.addEventListener(DISMISS_EVENT, onChange);
      return () => window.removeEventListener(DISMISS_EVENT, onChange);
    },
    () => {
      try {
        return window.localStorage.getItem(DISMISS_KEY) === "1";
      } catch {
        return false;
      }
    },
    () => true
  );
}

export function InstallPrompt({
  variant = "card",
}: {
  variant?: "card" | "banner";
}) {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  const standalone = useStandalone();
  const isIOS = useIsIOS();
  const dismissed = useBannerDismissed();

  useEffect(() => {
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setDeferred(null);
      setInstalled(true);
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function handleInstall() {
    if (!deferred) return;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    setDeferred(null);
    if (choice.outcome === "accepted") setInstalled(true);
  }

  function dismissBanner() {
    try {
      window.localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
    window.dispatchEvent(new Event(DISMISS_EVENT));
  }

  const canPrompt = deferred !== null;

  // ---- Banner: compact, dismissible, only when there's something to do ----
  if (variant === "banner") {
    if (standalone || installed || dismissed) return null;
    if (!canPrompt && !isIOS) return null;

    return (
      <div className="animate-pop-in mb-4 flex items-center gap-3 rounded-blob border-2 border-ink bg-sunny p-3 shadow-sticker-sm">
        <span className="text-xl">📲</span>
        <p className="flex-1 text-sm font-bold leading-tight">
          {canPrompt
            ? "Install WG App on your home screen"
            : "Add WG App to your home screen from Safari's share menu"}
        </p>
        {canPrompt && (
          <button
            onClick={handleInstall}
            className="shrink-0 rounded-full border-2 border-ink bg-white px-3 py-1 font-display text-sm font-bold shadow-sticker-sm transition-all hover:-translate-y-0.5 active:scale-95"
          >
            Install
          </button>
        )}
        <button
          onClick={dismissBanner}
          aria-label="Dismiss"
          className="shrink-0 rounded-full border-2 border-ink bg-white p-1 transition-all active:scale-90"
        >
          <X size={16} strokeWidth={3} />
        </button>
      </div>
    );
  }

  // ---- Card: always informative, lives in Settings ----
  if (standalone) {
    return (
      <Card className="flex items-center gap-3 p-4">
        <span className="text-2xl">📱</span>
        <div>
          <h2 className="font-display text-lg font-bold">Running as an app ✅</h2>
          <p className="text-sm font-semibold text-ink/60">
            WG App is installed on this device.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col items-start gap-3 p-4">
      <div>
        <h2 className="font-display text-lg font-bold">Install WG App 📲</h2>
        <p className="text-sm font-semibold text-ink/60">
          Put it on your home screen and open it like a real app, no browser tab
          needed.
        </p>
      </div>

      {installed ? (
        <p className="font-semibold text-mint-dark">
          Installed! Check your home screen 🎉
        </p>
      ) : canPrompt ? (
        <Button
          onClick={handleInstall}
          variant="coral"
          className="flex items-center gap-2"
        >
          <Download size={18} strokeWidth={2.5} />
          Add to home screen
        </Button>
      ) : isIOS ? (
        <div className="text-sm font-semibold text-ink/70">
          <p className="font-bold">On iPhone or iPad, in Safari:</p>
          <ol className="mt-1 list-decimal space-y-0.5 pl-5">
            <li>
              Tap the Share button{" "}
              <Share
                size={13}
                strokeWidth={2.5}
                className="inline align-[-1px]"
              />
            </li>
            <li>Pick &ldquo;Add to Home Screen&rdquo;</li>
            <li>Tap &ldquo;Add&rdquo;</li>
          </ol>
        </div>
      ) : (
        <p className="text-sm font-semibold text-ink/70">
          Open this page in Chrome, Edge or Safari and choose &ldquo;Install
          app&rdquo; / &ldquo;Add to Home screen&rdquo; from the browser menu. An
          install button appears here as soon as your browser offers it.
        </p>
      )}
    </Card>
  );
}
