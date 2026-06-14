import { useRef, useCallback, useState } from 'react';

export function useFps() {
  const framesRef = useRef<number[]>([]);
  const [fps, setFps] = useState(0);

  const tick = useCallback(() => {
    const now = performance.now();
    framesRef.current.push(now);

    while (framesRef.current.length > 0 && framesRef.current[0] <= now - 1000) {
      framesRef.current.shift();
    }

    setFps(framesRef.current.length);
  }, []);

  return { fps, tick };
}
