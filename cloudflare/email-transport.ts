import { connect } from 'cloudflare:sockets';
import { Duplex } from 'node:stream';
import type { Socket } from 'node:net';
import { createEmailTransport } from '../src/lib/email';

/** Use Workers' native TLS socket; Node's SMTP socket upgrade closes prematurely here. */
export function createWorkerEmailTransport(settings: Parameters<typeof createEmailTransport>[0]) {
  if (!settings?.SMTP_HOST) throw new Error('SMTP_HOST is required');
  if (settings.SMTP_PORT !== '465') throw new Error('Worker SMTP requires TLS port 465');
  return createEmailTransport(settings, {
    getSocket(_options, callback) {
      const socket = connect(
        { hostname: settings.SMTP_HOST!, port: 465 },
        { secureTransport: 'on' },
      );
      let timer: ReturnType<typeof setTimeout> | undefined;
      const deadline = setTimeout(() => {
        void socket.close().catch(() => {});
      }, 15000);
      socket.opened.then(
        () => {
          clearTimeout(deadline);
          const stream = Duplex.fromWeb({ readable: socket.readable, writable: socket.writable });
          // Nodemailer expects the idle-timeout methods from a Node socket.
          const connection = Object.assign(stream, {
            setTimeout(milliseconds: number) {
              clearTimeout(timer);
              if (milliseconds) timer = setTimeout(() => stream.emit('timeout'), milliseconds);
              return stream;
            },
          });
          stream.pause();
          stream.on('data', () => timer?.refresh());
          stream.once('close', () => {
            clearTimeout(timer);
            void socket.close().catch(() => {});
          });
          void socket.closed.catch((error: Error) => stream.destroy(error));
          callback(null, { connection: connection as unknown as Socket, secured: true });
        },
        (error: Error) => {
          clearTimeout(deadline);
          void socket.close().catch(() => {});
          callback(error, false);
        },
      );
    },
  });
}
