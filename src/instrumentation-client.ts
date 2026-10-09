import { createRecoveryFetch } from './lib/request-recovery';

try {
  window.fetch = createRecoveryFetch(window.fetch.bind(window), window.location.origin);
} catch {
  // Recovery setup must not prevent the app from starting.
}
