import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Mic,
  Square,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  User,
} from 'lucide-react';
import { uploadVoiceProfile } from '../services/voiceProfileService';

const MAX_SECONDS = 30;

type Status =
  | { kind: 'idle' }
  | { kind: 'recording' }
  | { kind: 'uploading' }
  | { kind: 'success'; transcript: string; schema: string }
  | { kind: 'error'; message: string };

function pad(n: number) {
  return n.toString().padStart(2, '0');
}

function formatDuration(seconds: number) {
  return `00:${pad(seconds)} / 00:${pad(MAX_SECONDS)}`;
}

interface WaveBarProps {
  delay: string;
  height: string;
}
function WaveBar({ delay, height }: WaveBarProps) {
  return (
    <div
      className="w-1 rounded-full bg-burnt-orange animate-bounce"
      style={{
        height,
        animationDelay: delay,
        animationDuration: '0.8s',
      }}
    />
  );
}

export default function VoiceProfileCapture() {
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const [elapsed, setElapsed] = useState(0);
  const [expanded, setExpanded] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedRef = useRef(0);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => () => clearTimer(), [clearTimer]);

  const stopRecording = useCallback(() => {
    clearTimer();
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== 'inactive'
    ) {
      mediaRecorderRef.current.stop();
    }
    setElapsed(0);
    elapsedRef.current = 0;
  }, [clearTimer]);

  const startRecording = async () => {
    chunksRef.current = [];
    setStatus({ kind: 'recording' });
    setElapsed(0);
    elapsedRef.current = 0;

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setStatus({
        kind: 'error',
        message: 'Microphone access was denied. Please allow microphone permissions and try again.',
      });
      return;
    }

    const recorder = new MediaRecorder(stream);
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop());
      const blob = new Blob(chunksRef.current, { type: 'audio/wav' });
      const duration = elapsedRef.current;

      setStatus({ kind: 'uploading' });

      try {
        const result = await uploadVoiceProfile(blob, duration);
        setStatus({
          kind: 'success',
          transcript: result.transcript ?? '',
          schema: result.toneProfileSchema ?? '',
        });
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : 'Network error. Check your connection.';
        setStatus({ kind: 'error', message: msg });
      }
    };

    recorder.start(250);

    timerRef.current = setInterval(() => {
      elapsedRef.current += 1;
      setElapsed(elapsedRef.current);
      if (elapsedRef.current >= MAX_SECONDS) {
        stopRecording();
      }
    }, 1000);
  };

  const reset = () => {
    stopRecording();
    setStatus({ kind: 'idle' });
  };

  const isRecording = status.kind === 'recording';
  const isUploading = status.kind === 'uploading';
  const isSuccess = status.kind === 'success';
  const isError = status.kind === 'error';
  const isIdle = status.kind === 'idle';

  const progress = (elapsed / MAX_SECONDS) * 100;

  return (
    <div className="card overflow-hidden">
      {/* Header toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-cream-fill/50 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div
            className={`w-6 h-6 rounded-md flex items-center justify-center ${
              isSuccess
                ? 'bg-green-100'
                : isError
                ? 'bg-red-50'
                : 'bg-burnt-orange/10'
            }`}
          >
            {isSuccess ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
            ) : isError ? (
              <AlertCircle className="w-3.5 h-3.5 text-red-500" />
            ) : (
              <User className="w-3.5 h-3.5 text-burnt-orange" />
            )}
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-charcoal leading-tight">
              Voice Profile
            </p>
            <p className="text-xs text-slate leading-tight">
              {isSuccess
                ? 'Tone locked in. AI coach is calibrated.'
                : isError
                ? 'Capture failed — tap to retry'
                : isRecording
                ? `Recording ${formatDuration(elapsed)}`
                : isUploading
                ? 'Processing your voice...'
                : 'Teach CLNCH your writing voice'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isRecording && (
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          )}
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-slate" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate" />
          )}
        </div>
      </button>

      {/* Expanded body */}
      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-card-border">
          {/* Description */}
          {(isIdle || isError) && (
            <p className="text-xs text-slate leading-relaxed pt-3">
              Speak for up to 30 seconds about your career goals or a recent application. CLNCH
              uses your voice pattern to draft responses that sound exactly like you.
            </p>
          )}

          {/* Recording state — waveform + countdown */}
          {isRecording && (
            <div className="pt-3 space-y-3">
              <div className="flex items-end justify-center gap-1.5 h-10">
                <WaveBar delay="0ms" height="16px" />
                <WaveBar delay="100ms" height="28px" />
                <WaveBar delay="180ms" height="20px" />
                <WaveBar delay="60ms" height="36px" />
                <WaveBar delay="240ms" height="24px" />
                <WaveBar delay="120ms" height="32px" />
                <WaveBar delay="200ms" height="18px" />
                <WaveBar delay="80ms" height="28px" />
                <WaveBar delay="160ms" height="22px" />
              </div>

              {/* Progress bar */}
              <div>
                <div className="h-1 bg-cream rounded-full overflow-hidden">
                  <div
                    className="h-full bg-burnt-orange rounded-full transition-all duration-1000"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-xs font-mono text-slate">
                    {formatDuration(elapsed)}
                  </span>
                  <span className="text-xs text-slate/60">
                    {MAX_SECONDS - elapsed}s remaining
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Uploading state */}
          {isUploading && (
            <div className="pt-3 flex flex-col items-center gap-2 py-4">
              <Loader2 className="w-6 h-6 text-burnt-orange animate-spin" />
              <p className="text-xs text-slate animate-pulse-subtle text-center">
                Transcribing and profiling your voice...
              </p>
            </div>
          )}

          {/* Success state */}
          {isSuccess && status.kind === 'success' && (
            <div className="pt-3 space-y-3">
              {status.transcript && (
                <div className="bg-cream rounded-lg p-3">
                  <p className="text-xs font-medium text-slate uppercase tracking-wide mb-1.5">
                    Transcript
                  </p>
                  <p className="text-xs text-charcoal leading-relaxed line-clamp-3">
                    {status.transcript}
                  </p>
                </div>
              )}
              {status.schema && (
                <div className="bg-green-50 border border-green-100 rounded-lg p-3">
                  <p className="text-xs font-medium text-green-700 uppercase tracking-wide mb-1.5">
                    Styling Prompt Schema
                  </p>
                  <p className="text-xs text-charcoal leading-relaxed">
                    {status.schema.replace('STYLING PROMPT SCHEMA:', '').replace('STYLING PROMPT SCHEMA', '').trim()}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Error state */}
          {isError && status.kind === 'error' && (
            <div className="pt-1 flex items-start gap-2 bg-red-50 border border-red-100 rounded-lg p-3">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-700 leading-relaxed">{status.message}</p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 pt-1">
            {(isIdle || isError) && (
              <button
                onClick={startRecording}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-burnt-orange text-white text-sm font-semibold rounded-lg hover:bg-burnt-orange/90 active:scale-[0.98] transition-all"
              >
                <Mic className="w-4 h-4" />
                Tap to Record
              </button>
            )}

            {isRecording && (
              <button
                onClick={stopRecording}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 active:scale-[0.98] transition-all"
              >
                <Square className="w-4 h-4 fill-white" />
                Stop Recording
              </button>
            )}

            {isSuccess && (
              <>
                <button
                  onClick={reset}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg bg-cream-fill text-sm font-medium text-charcoal hover:bg-cream-fill/80 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Re-record
                </button>
                <div className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg bg-green-50 border border-green-200">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-700">Coach Ready</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
