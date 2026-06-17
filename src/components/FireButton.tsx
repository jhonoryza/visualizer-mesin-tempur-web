import { useState, useCallback, useRef } from 'react';
import { Flame, Loader2, Download } from 'lucide-react';
import type { AudioEngine } from '../hooks/useAudioEngine';
import type { ExportFormat, ExportDuration, AppTheme, Track } from '../types';

interface FireButtonProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  engineRef: React.RefObject<AudioEngine>;
  audioDuration: number;
  appTheme: AppTheme;
  tracks: Track[];
  currentTrackIndex: number;
  onSelectTrack: (index: number) => void;
}

export function FireButton({ canvasRef, engineRef, audioDuration, tracks, currentTrackIndex, onSelectTrack }: FireButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [exportDuration, setExportDuration] = useState<ExportDuration>('full');
  const [exportFormat, setExportFormat] = useState<ExportFormat>('mp4');
  const [showSettings, setShowSettings] = useState(false);
  const [exportTrackIdx, setExportTrackIdx] = useState<number>(currentTrackIndex);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleFire = useCallback(async () => {
    if (isExporting) {
      recorderRef.current?.stop();
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      setIsExporting(false);
      setProgress(0);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      setIsExporting(true);
      setProgress(0);

      // Switch to selected track if different
      if (exportTrackIdx !== currentTrackIndex && tracks[exportTrackIdx]) {
        onSelectTrack(exportTrackIdx);
        await new Promise((r) => setTimeout(r, 500));
      }

      const stream = canvas.captureStream(30);

      const engine = engineRef.current;
      if (engine.mediaDest && engine.mediaDest.stream) {
        engine.mediaDest.stream.getAudioTracks().forEach((track) => stream.addTrack(track));
      }

      const selectedDuration = tracks[exportTrackIdx]?.duration ?? audioDuration;
      const resolvedDuration = exportDuration === 'full'
        ? (selectedDuration > 0 ? selectedDuration : 30)
        : exportDuration;

      let mimeType: string;
      let fileExt: string;

      if (exportFormat === 'mp4') {
        if (MediaRecorder.isTypeSupported('video/mp4;codecs=h264')) {
          mimeType = 'video/mp4;codecs=h264';
          fileExt = 'mp4';
        } else if (MediaRecorder.isTypeSupported('video/webm;codecs=h264')) {
          mimeType = 'video/webm;codecs=h264';
          fileExt = 'webm';
        } else {
          mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
            ? 'video/webm;codecs=vp9' : 'video/webm';
          fileExt = 'webm';
        }
      } else {
        mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
          ? 'video/webm;codecs=vp9' : 'video/webm';
        fileExt = 'webm';
      }

      const chunks: Blob[] = [];
      const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 8000000 });
      recorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const trackName = tracks[exportTrackIdx]?.name ?? 'export';
        const blob = new Blob(chunks, { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${trackName}-${Date.now()}.${fileExt}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setIsExporting(false);
        setProgress(0);
      };

      recorder.start(100);
      const startTime = Date.now();
      const totalMs = resolvedDuration * 1000;

      progressIntervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const pct = Math.min(100, (elapsed / totalMs) * 100);
        setProgress(Math.floor(pct));
        if (elapsed >= totalMs) {
          if (recorder.state === 'recording') recorder.stop();
          if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
        }
      }, 50);
    } catch {
      setIsExporting(false);
      setProgress(0);
    }
  }, [isExporting, canvasRef, engineRef, exportDuration, exportFormat, tracks, exportTrackIdx, currentTrackIndex, audioDuration, onSelectTrack]);

  const formatLabel = (d: ExportDuration) => d === 'full' ? 'FULL' : `${d}s`;

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <button
          className="app-btn text-[8px] py-1 px-2 flex items-center gap-1"
          onClick={() => setShowSettings(!showSettings)}
        >
          <Download className="w-3 h-3" />
          <span className="hidden sm:inline">{formatLabel(exportDuration)} · {exportFormat.toUpperCase()}</span>
          <span className="sm:hidden">EXP</span>
        </button>

        {showSettings && (
          <div
            className="absolute bottom-full right-0 mb-1 p-2 z-50 w-48"
            style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            }}
          >
            {/* Track selector — only if multiple tracks */}
            {tracks.length > 1 && (
              <>
                <label className="text-[8px] block mb-1" style={{ color: 'var(--muted-foreground)' }}>
                  TRACK
                </label>
                <select
                  className="app-select w-full mb-2 text-[9px] py-1"
                  value={exportTrackIdx}
                  onChange={(e) => setExportTrackIdx(Number(e.target.value))}
                >
                  {tracks.map((t, i) => (
                    <option key={t.id} value={i}>{t.name}</option>
                  ))}
                </select>
              </>
            )}

            <label className="text-[8px] block mb-1" style={{ color: 'var(--muted-foreground)' }}>
              DURATION
            </label>
            <div className="grid grid-cols-3 gap-1 mb-2">
              {([5, 10, 15, 30, 'full'] as ExportDuration[]).map((d) => (
                <button
                  key={String(d)}
                  className={`app-btn text-[7px] py-1 px-1 ${exportDuration === d ? 'active' : ''}`}
                  onClick={() => setExportDuration(d)}
                >
                  {formatLabel(d)}
                </button>
              ))}
            </div>

            <label className="text-[8px] block mb-1" style={{ color: 'var(--muted-foreground)' }}>
              FORMAT
            </label>
            <div className="flex gap-1 mb-1">
              {(['mp4', 'webm'] as ExportFormat[]).map((f) => (
                <button
                  key={f}
                  className={`app-btn flex-1 text-[8px] py-1 ${exportFormat === f ? 'active' : ''}`}
                  onClick={() => setExportFormat(f)}
                >
                  {f.toUpperCase()}
                </button>
              ))}
            </div>
            <div className="text-[7px]" style={{ color: 'var(--muted-foreground)' }}>
              MP4: H.264 · WebM: VP9
            </div>
          </div>
        )}
      </div>

      <div className="relative">
        <button
          className={`app-btn fire flex items-center gap-2 px-4 py-2 ${isExporting ? 'active' : ''}`}
          onClick={handleFire}
        >
          {isExporting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="hidden sm:inline">STOP ({progress}%)</span>
              <span className="sm:hidden">{progress}%</span>
            </>
          ) : (
            <>
              <Flame className="w-4 h-4" />
              <span className="hidden sm:inline">FIRE / RENDER</span>
              <span className="sm:hidden">FIRE</span>
            </>
          )}
        </button>

        {isExporting && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#dc2626]/20">
            <div
              className="h-full bg-[#dc2626] transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
