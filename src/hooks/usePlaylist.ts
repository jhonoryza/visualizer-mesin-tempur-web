import { useState, useCallback, useEffect, useRef } from 'react';
import type { Track, RepeatMode } from '../types';
import { saveTrack, removeTrack as dbRemove, loadAllTracks, clearAllTracks } from '../lib/trackStorage';

let trackIdCounter = 0;

function blobToUrl(blob: Blob): string {
  return URL.createObjectURL(blob);
}

export function usePlaylist() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('all');
  const [loaded, setLoaded] = useState(false);
  const tracksRef = useRef(tracks);
  tracksRef.current = tracks;

  const currentTrack = currentIndex >= 0 && currentIndex < tracks.length ? tracks[currentIndex] : null;

  // Load persisted tracks from IndexedDB on mount
  useEffect(() => {
    loadAllTracks().then((stored) => {
      if (stored.length === 0) {
        setLoaded(true);
        return;
      }
      const restored: Track[] = stored.map((s) => ({
        id: s.id,
        file: new File([s.blob], s.fileName, { type: s.mimeType }),
        name: s.name,
        url: blobToUrl(s.blob),
        duration: s.duration,
      }));
      trackIdCounter = Math.max(trackIdCounter, ...restored.map((t) => parseInt(t.id.split('-')[1]) || 0));
      setTracks(restored);
      setCurrentIndex(-1);
      setLoaded(true);
    });
  }, []);

  const addFiles = useCallback(async (files: FileList | File[]) => {
    const audioFiles = Array.from(files).filter((f) => /\.(mp3|wav|m4a|ogg|flac|aac)$/i.test(f.name));
    if (audioFiles.length === 0) return;

    const newTracks: Track[] = audioFiles.map((file) => ({
      id: `track-${++trackIdCounter}`,
      file,
      name: file.name.replace(/\.[^.]+$/, ''),
      url: blobToUrl(file),
      duration: 0,
    }));

    // Save each to IndexedDB
    for (const t of newTracks) {
      await saveTrack({ id: t.id, name: t.name, file: t.file, duration: t.duration });
    }

    setTracks((prev) => {
      const updated = [...prev, ...newTracks];
      if (prev.length === 0 && newTracks.length > 0) {
        setTimeout(() => setCurrentIndex(0), 0);
      }
      return updated;
    });
  }, []);

  const playTrack = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  const removeTrack = useCallback(async (id: string) => {
    await dbRemove(id);
    setTracks((prev) => {
      const idx = prev.findIndex((t) => t.id === id);
      const track = prev.find((t) => t.id === id);
      if (track) URL.revokeObjectURL(track.url);
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
      setCurrentIndex((ci) => {
        if (tracks.length <= 1) return ci;
        let nextIdx: number;
        do { nextIdx = Math.floor(Math.random() * tracks.length); } while (nextIdx === ci);
        return nextIdx;
      });
    } else {
      setCurrentIndex((ci) => {
        if (ci < tracks.length - 1) return ci + 1;
        if (repeatMode === 'all') return 0;
        return ci;
      });
    }
  }, [tracks.length, repeatMode]);

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

  const clearAll = useCallback(async () => {
    await clearAllTracks();
    tracksRef.current.forEach((t) => URL.revokeObjectURL(t.url));
    setTracks([]);
    setCurrentIndex(-1);
  }, []);

  const updateTrackDuration = useCallback((id: string, duration: number) => {
    setTracks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, duration } : t))
    );
    // Update duration in IndexedDB
    const track = tracksRef.current.find((t) => t.id === id);
    if (track && duration > 0) {
      saveTrack({ id: track.id, name: track.name, file: track.file, duration });
    }
  }, []);

  return {
    tracks,
    currentIndex,
    currentTrack,
    repeatMode,
    loaded,
    addFiles,
    playTrack,
    removeTrack,
    next,
    prev,
    cycleRepeat,
    clearAll,
    updateTrackDuration,
    setCurrentIndex,
  };
}
