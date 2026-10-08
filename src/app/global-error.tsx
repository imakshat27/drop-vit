'use client';
export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          padding: '64px 24px',
          fontFamily: 'Arial, sans-serif',
          background: '#f8f7f2',
          color: '#20221f',
        }}
      >
        <main>
          <h1 style={{ fontSize: 40 }}>A little workshop hiccup.</h1>
          <p>Drop couldn’t load. Please try again in a moment.</p>
          <button
            onClick={reset}
            style={{
              font: 'inherit',
              background: '#20221f',
              color: '#f8f7f2',
              padding: '14px 24px',
              border: 0,
              borderRadius: 6,
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
