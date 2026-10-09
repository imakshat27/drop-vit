// Browser-only recovery state. Never replay writes: only failed RSC GETs wait for retry.
import type { ActionState } from './validation';

const listeners = new Set<() => void>();
const retries = new Set<() => void>();
let message = '';
let retrying = false;
let snapshot = { message, retrying, canRetry: false };
const emptySnapshot = snapshot;

function publish() {
  snapshot = { message, retrying, canRetry: retries.size > 0 };
  listeners.forEach((listener) => listener());
}
export const recoveryStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  getSnapshot: () => snapshot,
  getServerSnapshot: () => emptySnapshot,
  retry() {
    if (retrying) return;
    retrying = true;
    publish();
    // Resolve waiting reads together; each resumes just once per explicit click.
    [...retries].forEach((retry) => retry());
  },
  dismiss() {
    if (retries.size) return;
    message = '';
    publish();
  },
};

export function recoverAction(
  action: (state: ActionState, data: FormData) => Promise<ActionState>,
) {
  return async (state: ActionState, data: FormData): Promise<ActionState> => {
    try {
      return await action(state, data);
    } catch {
      message = 'Couldn’t confirm your change. Check before trying again in a moment.';
      publish();
      return { error: message };
    }
  };
}

function waitForRetry(signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const cleanup = () => {
      retries.delete(resume);
      signal.removeEventListener('abort', abort);
      retrying = false;
      if (!retries.size) message = '';
      publish();
    };
    const resume = () => {
      cleanup();
      resolve();
    };
    const abort = () => {
      cleanup();
      reject(signal.reason);
    };
    retries.add(resume);
    signal.addEventListener('abort', abort, { once: true });
    message = 'Drop hit a hiccup. Try again in a moment.';
    retrying = false;
    publish();
    if (signal.aborted) abort();
  });
}

export function createRecoveryFetch(fetcher: typeof fetch, origin: string): typeof fetch {
  return async (input, init) => {
    const original = input instanceof Request ? input : undefined;
    const url = new URL(original?.url ?? String(input), origin);
    const method = (init?.method ?? original?.method ?? 'GET').toUpperCase();
    const headers = new Headers(init?.headers ?? original?.headers);
    if (method !== 'GET' || url.origin !== origin || headers.get('rsc') !== '1') {
      return fetcher(input, init);
    }
    const request = new Request(input, init);
    for (;;) {
      request.signal.throwIfAborted();
      try {
        const response = await fetcher(request.clone());
        if (response.status !== 429 && response.status < 500) return response;
        await response.body?.cancel();
      } catch (error) {
        if (request.signal.aborted) throw error;
      }
      // Do not give Next a proxy error's HTML: it would navigate to the error document.
      await waitForRetry(request.signal);
    }
  };
}
