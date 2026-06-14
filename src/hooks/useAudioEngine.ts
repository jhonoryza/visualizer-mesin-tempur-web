import { useRef, useCallback, useState, useEffect } from 'react';

export interface AudioEngine {
  audioContext: AudioContext | null;
  analyser: AnalyserNode | null;
  source: MediaElementAudioSourceNode | null;
  gainNode: GainNode | null;
  audioElement: HTMLAudioElement | null;
  frequencyData: Uint8Array<ArrayBuffer>;
  timeDomainData: Uint8Array<ArrayBuffer>;
  bassEnergy: number;
  midEnergy: number;
  highEnergy: number;
  peak: number;
  mediaDest: MediaStreamAudioDestinationNode | null;
}

export function useAudioEngine() {
  const engineRef = useRef<AudioEngine>({
    audioContext: null,
    analyser: null,
    source: null,
    gainNode: null,
    audioElement: null,
    frequencyData: new Uint8Array(0),
    timeDomainData: new Uint8Array(0),
    bassEnergy: 0,
    midEnergy: 0,
    highEnergy: 0,
    peak: 0,
    mediaDest: null,
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const initAudio = useCallback(() => {
    if (engineRef.current.audioContext) return engineRef.current;

    const ctx = new AudioContext();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.8;

    const gainNode = ctx.createGain();
    const mediaDest = ctx.createMediaStreamDestination();

    const audio = new Audio();
    audio.crossOrigin = 'anonymous';

    const source = ctx.createMediaElementSource(audio);
    source.connect(gainNode);
    gainNode.connect(analyser);
    analyser.connect(ctx.destination);
    gainNode.connect(mediaDest);

    const bufferLength = analyser.frequencyBinCount;
    engineRef.current = {
      audioContext: ctx,
      analyser,
      source,
      gainNode,
      audioElement: audio,
      frequencyData: new Uint8Array(bufferLength) as Uint8Array<ArrayBuffer>,
      timeDomainData: new Uint8Array(bufferLength) as Uint8Array<ArrayBuffer>,
      bassEnergy: 0,
      midEnergy: 0,
      highEnergy: 0,
      peak: 0,
      mediaDest,
    };

    audio.addEventListener('loadedmetadata', () => setDuration(audio.duration));
    audio.addEventListener('timeupdate', () => setCurrentTime(audio.currentTime));

    return engineRef.current;
  }, []);

  // Creates AudioContext AND resumes it — MUST be called from a user gesture
  const ensureReady = useCallback(async () => {
    const engine = initAudio();
    if (engine.audioContext?.state === 'suspended') {
      await engine.audioContext.resume();
    }
  }, [initAudio]);

  const loadUrl = useCallback((url: string) => {
    const engine = initAudio();
    if (!engine.audioElement) return;
    engine.audioElement.src = url;
    engine.audioElement.load();
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }, [initAudio]);

  const play = useCallback(async () => {
    const engine = engineRef.current;
    if (!engine.audioElement) return;

    if (engine.audioContext?.state === 'suspended') {
      await engine.audioContext.resume();
    }

    try {
      await engine.audioElement.play();
      setIsPlaying(true);
    } catch {
      // Autoplay blocked
    }
  }, []);

  const pause = useCallback(() => {
    engineRef.current.audioElement?.pause();
    setIsPlaying(false);
  }, []);

  const togglePlay = useCallback(async () => {
    if (isPlaying) pause();
    else await play();
  }, [isPlaying, play, pause]);

  const seek = useCallback((time: number) => {
    const engine = engineRef.current;
    if (engine.audioElement) {
      engine.audioElement.currentTime = time;
    }
  }, []);

  const analyze = useCallback(() => {
    const engine = engineRef.current;
    if (!engine.analyser) return engine;

    engine.analyser.getByteFrequencyData(engine.frequencyData);
    engine.analyser.getByteTimeDomainData(engine.timeDomainData);

    const bufLen = engine.frequencyData.length;
    const bassEnd = Math.floor(bufLen * 0.06);
    const midEnd = Math.floor(bufLen * 0.3);

    let bassSum = 0, midSum = 0, highSum = 0, peak = 0;

    for (let i = 0; i < bufLen; i++) {
      const val = engine.frequencyData[i];
      if (val > peak) peak = val;
      if (i < bassEnd) bassSum += val;
      else if (i < midEnd) midSum += val;
      else highSum += val;
    }

    engine.bassEnergy = bassSum / (bassEnd || 1) / 255;
    engine.midEnergy = midSum / ((midEnd - bassEnd) || 1) / 255;
    engine.highEnergy = highSum / ((bufLen - midEnd) || 1) / 255;
    engine.peak = peak / 255;

    return engine;
  }, []);

  useEffect(() => {
    return () => {
      engineRef.current.audioElement?.pause();
      engineRef.current.audioContext?.close();
    };
  }, []);

  return {
    engine: engineRef,
    loadUrl,
    play,
    pause,
    togglePlay,
    seek,
    analyze,
    ensureReady,
    isPlaying,
    setIsPlaying,
    duration,
    currentTime,
  };
}
