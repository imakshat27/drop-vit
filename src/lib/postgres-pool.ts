import { Pool } from 'pg';

export function reportPoolError(error: unknown, phase: 'idle' | 'cleanup') {
  // pg attaches the client (including credentials) to pool errors. Never log that object.
  const name = error instanceof Error ? error.name : 'UnknownError';
  const code =
    error && typeof error === 'object' && 'code' in error && typeof error.code === 'string'
      ? error.code
      : undefined;
  console.warn('Database connection error', { phase, name, code });
}

export function createPostgresPool(connectionString: string) {
  const client = new Pool({ connectionString, connectionTimeoutMillis: 15000, max: 5 });
  // Idle/closing socket errors use EventEmitter rather than a query promise.
  // Without this listener, pg-cloudflare's socket catch handler can itself throw.
  client.on('error', (error) => reportPoolError(error, 'idle'));
  let closing: Promise<void> | undefined;
  return { client, close: () => (closing ??= client.end()) };
}
