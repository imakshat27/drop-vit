'use client';
import { useActionState } from 'react';
import Link from 'next/link';
import { ArrowUp, Check } from 'lucide-react';
import { supportAction } from '@/app/actions';
import { recoverAction } from '@/lib/request-recovery';
const guardedSupport = recoverAction(supportAction);
export function Support({
  projectId,
  title,
  periodId,
  count,
  supported = false,
  locked = false,
  compact = false,
  upcoming = false,
}: {
  projectId: string;
  title: string;
  periodId: string;
  count: number;
  supported?: boolean;
  locked?: boolean;
  compact?: boolean;
  upcoming?: boolean;
}) {
  const [state, action, pending] = useActionState(guardedSupport, {});
  const done = supported || !!state.success;
  return (
    <div className={`support-wrap ${compact ? 'compact' : ''}`}>
      <form action={action}>
        <input type="hidden" name="projectId" value={projectId} />
        <input type="hidden" name="periodId" value={periodId} />
        <button
          className={`support ${done ? 'backed' : ''}`}
          disabled={pending || done || locked || upcoming}
          aria-label={`${upcoming ? 'Voting has not opened' : locked ? 'Final supports' : done ? 'Supported' : 'Support project'}: ${title} · ${count} supports`}
          aria-pressed={done}
        >
          <span>
            {done ? <Check size={16} aria-hidden /> : <ArrowUp size={16} aria-hidden />}
            {compact
              ? ''
              : upcoming
                ? 'Opens soon'
                : locked
                  ? 'Final supports'
                  : done
                    ? 'Supported'
                    : 'Support'}
          </span>
          <b>{count.toLocaleString('en-IN')}</b>
        </button>
      </form>
      {state.error && (
        <p className="support-error" role="alert">
          {state.error}
          {state.error.startsWith('Sign in') && (
            <>
              {' '}
              <Link href="/signin">Sign in →</Link>
            </>
          )}
        </p>
      )}
      {state.success && (
        <span className="sr-only" role="status">
          {title}: {state.success}
        </span>
      )}
    </div>
  );
}
