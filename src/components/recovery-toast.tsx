'use client';
import { useSyncExternalStore } from 'react';
import { recoveryStore } from '@/lib/request-recovery';

export function RecoveryToast() {
  const state = useSyncExternalStore(
    recoveryStore.subscribe,
    recoveryStore.getSnapshot,
    recoveryStore.getServerSnapshot,
  );
  if (!state.message) return null;
  return (
    <aside className="recovery-toast" aria-label="Connection notification">
      <p role="status" aria-live="polite">
        {state.message}
      </p>
      {state.canRetry ? (
        <button onClick={recoveryStore.retry} disabled={state.retrying}>
          {state.retrying ? 'Retrying…' : 'Try again'}
        </button>
      ) : (
        <button onClick={recoveryStore.dismiss} aria-label="Dismiss notification">
          Dismiss
        </button>
      )}
    </aside>
  );
}
