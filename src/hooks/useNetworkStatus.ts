
import { useEffect, useState } from "react";

/**
 * Hook to detect online/offline state.
 * Returns `isOnline` boolean and triggers a callback when state changes.
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(() => navigator.onLine);

  useEffect(() => {
    const update = () => setIsOnline(navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  return { isOnline };
}
