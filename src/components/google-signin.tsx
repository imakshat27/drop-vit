import { googleConfigured } from '@/lib/google-oauth';
export function GoogleSignin() {
  if (!googleConfigured())
    return (
      <>
        <button className="button google-signin" disabled>
          Continue with Google
        </button>
        <p className="understated" role="status">
          Google sign-in is temporarily unavailable. Please try again later.
        </p>
      </>
    );
  return (
    <>
      <a className="button google-signin" href="/auth/google">
        <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24">
          <path
            fill="#4285f4"
            d="M21.6 12.2c0-.7-.1-1.4-.2-2.2H12v4.2h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.8 3-4.4 3-7.5Z"
          />
          <path
            fill="#34a853"
            d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 .9-3.4.9-2.6 0-4.8-1.7-5.6-4H3.1v2.6A10 10 0 0 0 12 22Z"
          />
          <path fill="#fbbc05" d="M6.4 14a6 6 0 0 1 0-4V7.4H3.1a10 10 0 0 0 0 9.2L6.4 14Z" />
          <path
            fill="#ea4335"
            d="M12 6c1.5 0 2.8.5 3.8 1.5l2.9-2.9A9.6 9.6 0 0 0 12 2a10 10 0 0 0-8.9 5.4L6.4 10c.8-2.3 3-4 5.6-4Z"
          />
        </svg>
        Continue with Google
      </a>
      <p className="understated">
        Use your personal or college Google account.
        <br />
        Your email is verified automatically.
      </p>
    </>
  );
}
