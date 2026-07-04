"use client";

import { useEffect, useState, useTransition } from "react";
import { savePushSubscription, removePushSubscription } from "./actions";

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(new ArrayBuffer(rawData.length));
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

function isPushSupported(): boolean {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window;
}

export function PushToggle() {
  const [supported] = useState(isPushSupported);
  const [subscribed, setSubscribed] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supported) return;

    navigator.serviceWorker
      .register("/sw.js")
      .then(async (reg) => {
        const sub = await reg.pushManager.getSubscription();
        setSubscribed(Boolean(sub));
      })
      .catch(() => {});
  }, [supported]);

  function subscribe() {
    setError(null);
    startTransition(async () => {
      try {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          setError("Notification permission was denied.");
          return;
        }

        const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!vapidKey) {
          setError("Push notifications aren't configured yet.");
          return;
        }

        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey),
        });
        const json = sub.toJSON();
        if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
          setError("Subscription didn't return the expected data — please try again.");
          return;
        }

        await savePushSubscription({
          endpoint: json.endpoint,
          keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
        });
        setSubscribed(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  function unsubscribe() {
    setError(null);
    startTransition(async () => {
      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await removePushSubscription(sub.endpoint);
          await sub.unsubscribe();
        }
        setSubscribed(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  if (!supported) return null;

  return (
    <div className="mb-7 rounded-2xl border border-border bg-surface px-5 py-4">
      <div className="mb-1 font-display text-[15px] font-semibold text-ink">
        Push notifications
      </div>
      <p className="mb-3 text-[13.5px] text-ink-3">
        Get a browser notification for the same T-7d/T-48h deadline reminders as email.
      </p>
      {error && <p className="mb-2 text-[13px] text-danger-ink">{error}</p>}
      <button
        onClick={subscribed ? unsubscribe : subscribe}
        disabled={pending}
        className="rounded-lg border border-border bg-bg px-3.5 py-2 text-sm font-semibold text-ink-3 hover:text-ink disabled:opacity-60"
      >
        {pending
          ? "Working…"
          : subscribed
            ? "Disable push notifications"
            : "Enable push notifications"}
      </button>
    </div>
  );
}
