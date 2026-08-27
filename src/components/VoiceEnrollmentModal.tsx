import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Mic,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Volume2,
  Lock,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  Activity,
  Fingerprint,
} from "lucide-react";
import {
  ENROLLMENT_STEPS,
  voiceIdentityService,
  voiceEngineRegistry,
} from "../services/voiceIdentityService";
import {
  VoiceCharacteristics,
  VoiceProfileRole,
  VoiceIdentityProfile,
} from "../types/voiceIdentityTypes";

interface VoiceEnrollmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEnrollmentComplete: (profile: VoiceIdentityProfile) => void;
  initialRole?: VoiceProfileRole;
  initialName?: string;
}

export const VoiceEnrollmentModal: React.FC<VoiceEnrollmentModalProps> = ({
  isOpen,
  onClose,
  onEnrollmentComplete,
  initialRole = "owner",
  initialName = "",
}) => {
  const [profileName, setProfileName] = useState<string>(initialName || (initialRole === "owner" ? "My Voice" : "Trusted User"));
  const [role, setRole] = useState<VoiceProfileRole>(initialRole);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingProgress, setRecordingProgress] = useState<number>(0);
  const [currentVolume, setCurrentVolume] = useState<number>(0);
  const [collectedSamples, setCollectedSamples] = useState<VoiceCharacteristics[]>([]);
  const [currentExtracted, setCurrentExtracted] = useState<VoiceCharacteristics | null>(null);
  const [isFinalizing, setIsFinalizing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const pcmBufferRef = useRef<number[]>([]);
  const progressTimerRef = useRef<any>(null);

  const currentStep = ENROLLMENT_STEPS[currentStepIndex];

  useEffect(() => {
    if (isOpen) {
      setCurrentStepIndex(0);
      setCollectedSamples([]);
      setCurrentExtracted(null);
      setErrorMessage(null);
      setIsFinalizing(false);
      if (initialName) setProfileName(initialName);
      if (initialRole) setRole(initialRole);
    } else {
      cleanupAudio();
    }
  }, [isOpen, initialName, initialRole]);

  const cleanupAudio = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setIsRecording(false);
    setCurrentVolume(0);
  };

  const startStepRecording = async () => {
    setErrorMessage(null);
    pcmBufferRef.current = [];
    setRecordingProgress(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: false,
          autoGainControl: true,
          sampleRate: 16000,
        },
      });

      mediaStreamRef.current = stream;
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx({ sampleRate: 16000 });
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 1024;
      analyserRef.current = analyser;

      const scriptProcessor = audioCtx.createScriptProcessor(2048, 1, 1);
      scriptProcessor.onaudioprocess = (e) => {
        const channelData = e.inputBuffer.getChannelData(0);
        for (let i = 0; i < channelData.length; i++) {
          pcmBufferRef.current.push(channelData[i]);
        }
      };

      source.connect(analyser);
      analyser.connect(scriptProcessor);
      scriptProcessor.connect(audioCtx.destination);

      setIsRecording(true);

      // Visualizer loop
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateVolume = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        setCurrentVolume(Math.min(1, avg / 80));
        animationFrameRef.current = requestAnimationFrame(updateVolume);
      };
      updateVolume();

      // Progress timer (4 seconds)
      const durationMs = currentStep.targetDurationSeconds * 1000;
      const startMs = Date.now();

      progressTimerRef.current = setInterval(() => {
        const elapsed = Date.now() - startMs;
        const pct = Math.min(100, (elapsed / durationMs) * 100);
        setRecordingProgress(pct);

        if (elapsed >= durationMs) {
          finishStepRecording();
        }
      }, 50);
    } catch (err: any) {
      console.error("[VoiceEnrollment] Mic error:", err);
      setErrorMessage(
        err.name === "NotAllowedError"
          ? "Microphone access was denied. Please allow microphone permissions."
          : "Could not access microphone."
      );
      cleanupAudio();
    }
  };

  const finishStepRecording = async () => {
    if (!isRecording) return;
    cleanupAudio();

    const engine = voiceEngineRegistry.getEngine();
    const rawPcm = new Float32Array(pcmBufferRef.current);

    if (rawPcm.length < 16000 * 1.5) {
      setErrorMessage("The recording was too short. Please speak clearly for the full phrase.");
      return;
    }

    try {
      const extracted = await engine.extractVoiceCharacteristics(rawPcm, 16000);
      setCurrentExtracted(extracted);

      const nextSamples = [...collectedSamples, extracted];
      setCollectedSamples(nextSamples);

      if (currentStepIndex < ENROLLMENT_STEPS.length - 1) {
        // Advance to next step
        setCurrentStepIndex((prev) => prev + 1);
      } else {
        // All 3 steps complete! Finalize profile
        finalizeProfile(nextSamples);
      }
    } catch (err: any) {
      setErrorMessage("Could not analyze vocal characteristics. Please retry.");
    }
  };

  const finalizeProfile = async (allSamples: VoiceCharacteristics[]) => {
    setIsFinalizing(true);
    try {
      const finalName = profileName.trim() || "My Voice";
      const created = await voiceIdentityService.enrollProfile(finalName, role, allSamples);
      setTimeout(() => {
        setIsFinalizing(false);
        onEnrollmentComplete(created);
        onClose();
      }, 1200);
    } catch (err) {
      console.error("[VoiceEnrollment] Finalize error:", err);
      setErrorMessage("Failed to save voice profile. Please try again.");
      setIsFinalizing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="modal-voice-enrollment-backdrop"
      className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isRecording) onClose();
      }}
    >
      <div
        id="modal-voice-enrollment-card"
        className="w-full max-w-xl rounded-3xl bg-neutral-900 border border-neutral-800 shadow-2xl overflow-hidden flex flex-col animate-scaleUp"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Fingerprint className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Voice Identity Enrollment
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Biometric Calibration
                </span>
              </h2>
              <p className="text-xs text-neutral-400">
                Train Angel to recognize your unique vocal timbre and resonance
              </p>
            </div>
          </div>

          <button
            id="btn-close-enrollment-modal"
            type="button"
            disabled={isRecording}
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition disabled:opacity-30"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {/* Profile Name & Role Configuration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-neutral-950/40 border border-neutral-800/80">
            <div>
              <label className="text-[11px] font-medium text-neutral-400 block mb-1">
                Profile Name
              </label>
              <input
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                placeholder="e.g. Mercy, Alex, Dad"
                disabled={isRecording}
                className="w-full px-3 py-1.5 text-xs rounded-xl bg-neutral-800/70 border border-neutral-700/70 text-white placeholder-neutral-500 focus:outline-hidden focus:border-amber-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-medium text-neutral-400 block mb-1">
                Trust Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                disabled={isRecording}
                className="w-full px-3 py-1.5 text-xs rounded-xl bg-neutral-800/70 border border-neutral-700/70 text-white focus:outline-hidden focus:border-amber-500"
              >
                <option value="owner">Primary Owner (Full Access)</option>
                <option value="partner">Partner (Trusted)</option>
                <option value="family">Family Member</option>
                <option value="colleague">Colleague / Team</option>
                <option value="guest">Guest</option>
              </select>
            </div>
          </div>

          {/* Stepper Indicator */}
          <div className="flex items-center justify-between gap-2 px-1">
            {ENROLLMENT_STEPS.map((step, idx) => {
              const isDone = idx < currentStepIndex;
              const isCurrent = idx === currentStepIndex;
              return (
                <div key={step.id} className="flex-1 flex items-center gap-2">
                  <div
                    className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${
                      isDone
                        ? "bg-amber-400"
                        : isCurrent
                        ? "bg-amber-500/70 ring-2 ring-amber-500/30"
                        : "bg-neutral-800"
                    }`}
                  />
                  <span
                    className={`text-[10px] font-bold ${
                      isDone
                        ? "text-amber-400"
                        : isCurrent
                        ? "text-white"
                        : "text-neutral-500"
                    }`}
                  >
                    {step.id}/3
                  </span>
                </div>
              );
            })}
          </div>

          {/* Current Step Card */}
          <div className="p-5 rounded-2xl bg-neutral-950/70 border border-neutral-800 flex flex-col items-center text-center space-y-4">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold tracking-wider text-amber-400 uppercase">
                Step {currentStep.id}: {currentStep.title}
              </span>
              <p className="text-xs text-neutral-400">{currentStep.description}</p>
            </div>

            {/* Prompt reading phrase box */}
            <div className="w-full p-4 rounded-xl bg-neutral-900 border border-amber-500/30 shadow-inner">
              <p className="text-sm sm:text-base font-semibold text-neutral-100 italic tracking-wide leading-relaxed">
                "{currentStep.promptPhrase}"
              </p>
            </div>

            {/* Audio Wave / Pulse Visualizer */}
            <div className="w-full flex flex-col items-center gap-2">
              <div className="w-full h-12 rounded-xl bg-neutral-900/90 border border-neutral-800 flex items-center justify-center gap-1.5 px-4 overflow-hidden">
                {Array.from({ length: 24 }).map((_, i) => {
                  const barHeight = isRecording
                    ? Math.max(10, Math.sin((i / 24) * Math.PI) * currentVolume * 100)
                    : 12;
                  return (
                    <div
                      key={i}
                      style={{ height: `${barHeight}%` }}
                      className={`w-1.5 rounded-full transition-all duration-75 ${
                        isRecording ? "bg-amber-400 shadow-sm" : "bg-neutral-700"
                      }`}
                    />
                  );
                })}
              </div>

              {/* Progress Bar when recording */}
              {isRecording && (
                <div className="w-full h-1.5 rounded-full bg-neutral-800 overflow-hidden">
                  <div
                    className="h-full bg-amber-400 transition-all duration-75"
                    style={{ width: `${recordingProgress}%` }}
                  />
                </div>
              )}
            </div>

            {/* Action Trigger Button */}
            {!isFinalizing ? (
              <button
                id={`btn-enroll-step-${currentStep.id}`}
                type="button"
                onClick={startStepRecording}
                disabled={isRecording}
                className={`px-6 py-3 rounded-2xl text-xs font-bold flex items-center gap-2.5 shadow-lg transition-all active:scale-95 ${
                  isRecording
                    ? "bg-amber-500 text-neutral-950 animate-pulse"
                    : "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-black shadow-amber-500/20"
                }`}
              >
                <Mic className="w-4 h-4 stroke-[2.5]" />
                <span>
                  {isRecording ? "Listening & Extracting Voiceprint..." : `Read Phrase ${currentStep.id}`}
                </span>
              </button>
            ) : (
              <div className="flex items-center gap-2 text-amber-400 text-xs font-bold py-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Synthesizing Voice Signature & Enrolling Profile...</span>
              </div>
            )}
          </div>

          {/* Live Feature Diagnostics (Pitch, Resonance, Formants) */}
          {currentExtracted && (
            <div className="grid grid-cols-3 gap-2 text-center text-xs p-3 rounded-xl bg-neutral-950/40 border border-neutral-800">
              <div>
                <span className="text-neutral-500 text-[10px] block">Fundamental Pitch</span>
                <strong className="text-amber-400 font-bold">{currentExtracted.pitchAvgHz} Hz</strong>
              </div>
              <div>
                <span className="text-neutral-500 text-[10px] block">Spectral Resonance</span>
                <strong className="text-amber-400 font-bold">{currentExtracted.spectralCentroidAvg} Hz</strong>
              </div>
              <div>
                <span className="text-neutral-500 text-[10px] block">Harmonic Ratio</span>
                <strong className="text-emerald-400 font-bold">
                  {Math.round(currentExtracted.harmonicRatio * 100)}%
                </strong>
              </div>
            </div>
          )}

          {/* Error notice */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-6 py-4 border-t border-neutral-800 bg-neutral-950/60 flex items-center justify-between text-xs text-neutral-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Biometrics stored securely on-device with zero-leakage encryption</span>
          </div>

          <button
            type="button"
            disabled={isRecording}
            onClick={onClose}
            className="text-neutral-400 hover:text-white transition font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
