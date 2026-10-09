'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
export function LiveRefresh() {
  const router = useRouter();
  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === 'visible') router.refresh();
    };
    // Voting actions refresh immediately. Background ranking updates need not
    // re-render the entire page twice a minute for every open browser tab.
    const timer = setInterval(refresh, 120000);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [router]);
  return null;
}
