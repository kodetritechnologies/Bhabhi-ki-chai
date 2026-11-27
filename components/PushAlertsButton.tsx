'use client';

import React, { useState, useEffect } from 'react';
import { LuBellRing as BellRing, LuCheck as Check } from 'react-icons/lu';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function PushAlertsButton({ userEmail }: { userEmail?: string }) {
  const [supported, setSupported] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
      return;
    }
    setSupported(true);

    navigator.serviceWorker
      .register('/sw.js')
      .then(async (reg) => {
        const sub = await reg.pushManager.getSubscription();
        if (sub && Notification.permission === 'granted') {
          setEnabled(true);
        }
      })
      .catch(() => {
        // ignore registration errors in unsupported contexts
      });
  }, []);

  if (!supported || !userEmail) return null;

  const handleEnablePush = async () => {
    setBusy(true);
    setStatusMsg('');
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setStatusMsg('Chrome notification permission denied');
        return;
      }

      const reg = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        setStatusMsg('VAPID key missing');
        return;
      }

      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
        });
      }

      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail,
          subscription: sub.toJSON(),
          userAgent: navigator.userAgent,
          sendTest: true,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setEnabled(true);
        setStatusMsg('Alerts active!');
      } else {
        setStatusMsg(json.error || 'Failed');
      }
    } catch {
      setStatusMsg('Push setup failed');
    } finally {
      setBusy(false);
    }
  };

  const handleDisablePush = async () => {
    setBusy(true);
    setStatusMsg('');
    try {
      const reg = await navigator.serviceWorker.getRegistration('/sw.js');
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setEnabled(false);
      setStatusMsg('Alerts off');
    } catch {
      setStatusMsg('Error disabling');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-3 pt-2.5 border-t border-[#4A2412] flex items-center justify-between gap-2">
      <div className="min-w-0">
        <p className="text-[11px] font-bold text-[#FFF4DF] flex items-center gap-1.5">
          <BellRing className="w-3.5 h-3.5 text-[#F4B52E] shrink-0" />
          <span>Chrome Push Alerts</span>
        </p>
        {statusMsg && <p className="text-[10px] text-[#CDB29B] mt-0.5 truncate">{statusMsg}</p>}
      </div>

      {enabled ? (
        <button
          type="button"
          disabled={busy}
          onClick={handleDisablePush}
          className="px-2.5 py-1 rounded-lg bg-[#10B981]/20 border border-[#10B981]/40 text-[#6EE7B7] text-[10px] font-bold flex items-center gap-1 cursor-pointer shrink-0"
          title="Click to disable Chrome alerts"
        >
          <Check className="w-3 h-3" />
          <span>{busy ? '...' : 'On'}</span>
        </button>
      ) : (
        <button
          type="button"
          disabled={busy}
          onClick={handleEnablePush}
          className="px-2.5 py-1 rounded-lg bg-[#F4B52E] hover:bg-[#ECA318] text-[#281308] text-[10px] font-extrabold cursor-pointer shrink-0 disabled:opacity-60"
        >
          {busy ? 'Enabling...' : 'Enable'}
        </button>
      )}
    </div>
  );
}
