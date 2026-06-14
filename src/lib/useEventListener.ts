import { useEffect } from "react";

export function useEventListener<E extends Event = Event>(
  target: EventTarget | null,
  event: string,
  handler: (e: E) => void,
) {
  useEffect(() => {
    if (!target) return;
    target.addEventListener(event, handler as EventListener);
    return () => target.removeEventListener(event, handler as EventListener);
  }, [target, event, handler]);
}
