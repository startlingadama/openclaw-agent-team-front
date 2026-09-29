// UI state that must survive page changes (route components unmount on navigation).
// Values live in a module-level store, so they outlive any route component, and are
// read through useSyncExternalStore. Use only primitives or module-level constants as
// `initial` (the snapshot must be referentially stable).
import { useCallback, useSyncExternalStore } from "react";

const store = new Map<string, unknown>();
const listeners = new Map<string, Set<() => void>>();

function notify(key: string) {
  listeners.get(key)?.forEach((listener) => listener());
}

export function usePersistentState<T>(key: string, initial: T) {
  const subscribe = useCallback(
    (listener: () => void) => {
      let set = listeners.get(key);
      if (!set) listeners.set(key, (set = new Set()));
      set.add(listener);
      return () => {
        set.delete(listener);
      };
    },
    [key],
  );

  const value = useSyncExternalStore(
    subscribe,
    () => (store.has(key) ? (store.get(key) as T) : initial),
    () => initial,
  );

  const setValue = useCallback(
    (next: T | ((previous: T) => T)) => {
      const previous = store.has(key) ? (store.get(key) as T) : initial;
      const resolved = typeof next === "function" ? (next as (previous: T) => T)(previous) : next;
      if (Object.is(resolved, previous)) return;
      store.set(key, resolved);
      notify(key);
    },
    // `initial` is a constant by contract
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key],
  );

  return [value, setValue] as const;
}

/** Drop every persisted UI value (called on logout so nothing leaks to the next user). */
export function resetPersistentState() {
  const keys = [...store.keys()];
  store.clear();
  keys.forEach(notify);
}
