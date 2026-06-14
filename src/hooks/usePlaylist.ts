import { useState, useCallback, useRef } from 'react';
import type { Track, RepeatMode } from '../types';

let trackIdCounter = 0;

function createTrack(file: File): Track {
  return {
    id: `track-${++trackIdCounter}`,
    file,
    name: file.name.replace(/\.[^.]+$/, ''),
    url: URL.createObjectURL(file),
    duration: 0,
  };
}

export function usePlaylist() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('all');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentTrack = currentIndex >= 0 && currentIndex < tracks.length ? tracks[currentIndex] : null;

  const addFiles = useCallback((files: FileList | File[]) => {
    const newTracks = Array.from(files)
      .filter((f) => /\.(mp3|wav|m4a|ogg|flac|aac)$/i.test(f.name))
      .map(createTrack);

    setTracks((prev) => {
      const updated = [...prev, ...newTracks];
      // Auto-play first track if nothing is playing
      if (prev.length === 0 && newTracks.length > 0) {
        setTimeout(() => setCurrentIndex(0), 0);
      }
      return updated;
    });
  }, []);

  const playTrack = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  const removeTrack = useCallback((id: string) => {
    setTracks((prev) => {
      const idx = prev.findIndex((t) => t.id === id);
      const next = prev.filter((t) => t.id !== id);

      setCurrentIndex((ci) => {
        if (next.length === 0) return -1;
        if (ci === idx) return Math.min(idx, next.length - 1);
        if (ci > idx) return ci - 1;
        return ci;
      });

      return next;
    });
  }, []);

  const next = useCallback(() => {
    if (tracks.length === 0) return;
    if (repeatMode === 'shuffle') {
      let nextIdx: number;
      do {
        nextIdx = Math.floor(Math.random() * tracks.length);
      } while (nextIdx === currentIndex && tracks.length > 1);
      setCurrentIndex(nextIdx);
    } else {
      setCurrentIndex((ci) => {
        if (ci < tracks.length - 1) return ci + 1;
        if (repeatMode === 'all') return 0;
        return ci;
      });
    }
  }, [tracks.length, currentIndex, repeatMode]);

  const prev = useCallback(() => {
    if (tracks.length === 0) return;
    setCurrentIndex((ci) => {
      if (ci > 0) return ci - 1;
      if (repeatMode === 'all') return tracks.length - 1;
      return ci;
    });
  }, [tracks.length, repeatMode]);

  const cycleRepeat = useCallback(() => {
    setRepeatMode((prev) => {
      const modes: RepeatMode[] = ['all', 'one', 'shuffle', 'none'];
      const idx = modes.indexOf(prev);
      return modes[(idx + 1) % modes.length];
    });
  }, []);

  const clearAll = useCallback(() => {
    tracks.forEach((t) => URL.revokeObjectURL(t.url));
    setTracks([]);
    setCurrentIndex(-1);
  }, [tracks]);

  const updateTrackDuration = useCallback((id: string, duration: number) => {
    setTracks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, duration } : t))
    );
  }, []);

  // Expose audio element ref for external use
  const setAudioRef = useCallback((el: HTMLAudioElement | null) => {
    audioRef.current = el;
  }, []);

  return {
    tracks,
    currentIndex,
    currentTrack,
    repeatMode,
    addFiles,
    playTrack,
    removeTrack,
    next,
    prev,
    cycleRepeat,
    clearAll,
    updateTrackDuration,
    setCurrentIndex,
    audioRef,
    setAudioRef,
  };
}
