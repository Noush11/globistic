"use client";

import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from "react";

declare global {
  interface Window {
    Square?: any;
  }
}

export interface SquarePaymentFormHandle {
  tokenize: () => Promise<string | null>;
}

const SDK_URL_SANDBOX = "https://sandbox.web.squarecdn.com/v1/square.js";
const SDK_URL_PROD = "https://web.squarecdn.com/v1/square.js";

function loadSdk(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Square) return resolve();
    const isProd = process.env.NEXT_PUBLIC_SQUARE_ENV === "production";
    const script = document.createElement("script");
    script.src = isProd ? SDK_URL_PROD : SDK_URL_SANDBOX;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Square SDK"));
    document.head.appendChild(script);
  });
}

export const SquarePaymentForm = forwardRef<SquarePaymentFormHandle, {}>((_props, ref) => {
  const cardRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "unconfigured" | "error">("loading");

  const appId = process.env.NEXT_PUBLIC_SQUARE_APP_ID;
  const locationId = process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID;

  useEffect(() => {
    if (!appId || !locationId) {
      setStatus("unconfigured");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        await loadSdk();
        if (cancelled) return;
        const payments = window.Square.payments(appId, locationId);
        const card = await payments.card();
        await card.attach(containerRef.current);
        cardRef.current = card;
        setStatus("ready");
      } catch {
        setStatus("error");
      }
    })();
    return () => {
      cancelled = true;
      cardRef.current?.destroy?.();
    };
  }, [appId, locationId]);

  useImperativeHandle(ref, () => ({
    async tokenize() {
      // In a sandbox/dev setup without Square keys, return a test nonce so the
      // checkout flow can be exercised end-to-end.
      if (status === "unconfigured") return "cnon:card-nonce-ok";
      if (!cardRef.current) return null;
      const result = await cardRef.current.tokenize();
      if (result.status === "OK") return result.token as string;
      return null;
    }
  }));

  if (status === "unconfigured") {
    return (
      <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
        Square keys are not configured. Checkout will run in test mode and use a sandbox nonce.
      </div>
    );
  }

  return (
    <div>
      <div ref={containerRef} className="rounded-xl border border-slate-300 p-3 dark:border-slate-700" />
      {status === "loading" && <p className="mt-2 text-xs text-slate-400">Loading secure card field…</p>}
      {status === "error" && <p className="mt-2 text-xs text-red-500">Could not load the payment form.</p>}
    </div>
  );
});
SquarePaymentForm.displayName = "SquarePaymentForm";
