import { useRef, useState, useEffect } from 'react';

export function useFps() {
  const framesRef = useRef<number[]>([]);
  const [fps, setFps] = useState(0);

  const tick = () => {
    const now = performance.now();
    framesRef.current.push(now);
    while (framesRef.current.length > 0 && framesRef.current[0] <= now - 1000) {
      framesRef.current.shift();
    }
    setFps(framesRef.current.length);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => { framesRef.current = []; };
  }, []);

  return { fps, tick };
}
