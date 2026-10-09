'use client';
import { useActionState, useEffect, useRef, useMemo } from 'react';
import type { ActionState } from '@/lib/validation';
import { recoverAction } from '@/lib/request-recovery';
export function ActionForm({
  action,
  children,
  button = 'Save',
  className = '',
}: {
  action: (s: ActionState, f: FormData) => Promise<ActionState>;
  children?: React.ReactNode;
  button?: string;
  className?: string;
}) {
  const keepInputs = useRef(false);
  const guardedAction = useMemo(() => {
    const guarded = recoverAction(action);
    return async (state: ActionState, data: FormData) => {
      const result = await guarded(state, data);
      keepInputs.current = !!result.error || !!result.errors;
      return result;
    };
  }, [action]);
  const [state, dispatch, pending] = useActionState(guardedAction, {});
  const error = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (state.error) error.current?.focus();
  }, [state]);
  return (
    <form
      action={dispatch}
      className={className}
      onSubmit={() => {
        keepInputs.current = false;
      }}
      onReset={(event) => {
        if (keepInputs.current) event.preventDefault();
      }}
    >
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
