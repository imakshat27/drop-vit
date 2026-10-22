/** The native Workers socket surface used by the SMTP adapter. */
declare module 'cloudflare:sockets' {
  import type { ReadableStream, WritableStream } from 'node:stream/web';
  export function connect(
    address: { hostname: string; port: number },
    options: { secureTransport: 'on' },
  ): {
    readable: ReadableStream<Uint8Array>;
    writable: WritableStream<Uint8Array>;
    opened: Promise<unknown>;
    closed: Promise<void>;
    close(): Promise<void>;
  };
}
