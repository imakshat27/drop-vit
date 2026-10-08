'use client';
import { useActionState, useEffect, useRef } from 'react';
import type { ActionState } from '@/lib/validation';
export function ActionForm({
  action,
  children,
  button = 'Save',
  className = '',
}: {
  action: (s: ActionState, f: FormData) => Promise<ActionState>;
  children: React.ReactNode;
  button?: string;
  className?: string;
}) {
  const [state, dispatch, pending] = useActionState(action, {});
  const error = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (state.error) error.current?.focus();
  }, [state]);
  return (
    <form action={dispatch} className={className}>
      {children}
      {state.error && (
        <p className="message error" role="alert" tabIndex={-1} ref={error}>
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="message success" role="status">
          {state.success}
        </p>
      )}
      <button className="button" disabled={pending}>
        {pending ? 'Saving…' : button}
      </button>
    </form>
  );
}
