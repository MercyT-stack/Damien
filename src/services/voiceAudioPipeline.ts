/**
 * ANGEL REAL-TIME AUDIO PIPELINE
 * High-performance Web Audio API manager for:
 * - 16kHz PCM microphone audio capture for Gemini Live
 * - 24kHz PCM model playback with gapless scheduling
 * - Fast interruption cancellation (<10ms)
 * - Real-time frequency / volume analysis for the Angel Star visualizer
 */

export class VoiceAudioPipeline {
  private inputAudioCtx: AudioContext | null = null;
  private outputAudioCtx: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private scriptProcessor: ScriptProcessorNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private activeSources: AudioBufferSourceNode[] = [];
  private nextStartTime: number = 0;
  private onAudioDataCallback?: (base64Pcm: string) => void;
  private onVolumeCallback?: (volume: number) => void;
  private isMuted: boolean = false;
  private animationFrameId: number | null = null;
  private recentAudioRingBuffer: number[] = [];

  /**
   * Initialize microphone capture (16kHz PCM)
   */
  async startRecording(
    onAudioData: (base64Pcm: string) => void,
    onVolume?: (volume: number) => void
  ): Promise<void> {
    this.onAudioDataCallback = onAudioData;
    this.onVolumeCallback = onVolume;
    this.recentAudioRingBuffer = [];

    // 1. Request microphone access
    this.mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        sampleRate: 16000,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    // 2. Setup 16kHz Input AudioContext
    const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
    this.inputAudioCtx = new AudioCtxClass({ sampleRate: 16000 });

    if (this.inputAudioCtx.state === "suspended") {
      await this.inputAudioCtx.resume();
    }

    this.sourceNode = this.inputAudioCtx.createMediaStreamSource(this.mediaStream);
    
    // Analyser for input audio level
    this.analyserNode = this.inputAudioCtx.createAnalyser();
    this.analyserNode.fftSize = 256;
    this.sourceNode.connect(this.analyserNode);

    // Script Processor for raw PCM extraction (buffer size 4096)
    this.scriptProcessor = this.inputAudioCtx.createScriptProcessor(4096, 1, 1);
    this.analyserNode.connect(this.scriptProcessor);
    this.scriptProcessor.connect(this.inputAudioCtx.destination);

    this.scriptProcessor.onaudioprocess = (e) => {
      if (this.isMuted) return;
      const inputChannelData = e.inputBuffer.getChannelData(0);
      
      // Store in rolling ring buffer (max ~3 seconds @ 16kHz = 48,000 samples)
      for (let i = 0; i < inputChannelData.length; i++) {
        this.recentAudioRingBuffer.push(inputChannelData[i]);
      }
      if (this.recentAudioRingBuffer.length > 48000) {
        this.recentAudioRingBuffer.splice(0, this.recentAudioRingBuffer.length - 48000);
      }

      const base64Pcm = this.convertFloat32To16BitPCMBase64(inputChannelData);
      if (this.onAudioDataCallback) {
        this.onAudioDataCallback(base64Pcm);
      }
    };

    // Start volume measurement loop for visualizer
    this.startVolumeLoop();
  }

  /**
   * Retrieve recent raw PCM Float32Array for speaker verification & feature extraction
   */
  getRecentPcm(): Float32Array {
    return new Float32Array(this.recentAudioRingBuffer);
  }

  /**
   * Convert Float32Array audio buffer (-1.0 to 1.0) to 16-bit PCM Little Endian base64 string
   */
  private convertFloat32To16BitPCMBase64(input: Float32Array): string {
    const pcm16 = new Int16Array(input.length);
    for (let i = 0; i < input.length; i++) {
      const s = Math.max(-1, Math.min(1, input[i]));
      pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    const uint8 = new Uint8Array(pcm16.buffer);
    let binary = "";
    const len = uint8.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(uint8[i]);
    }
    return btoa(binary);
  }

  /**
   * Convert Base64 16-bit PCM into Float32Array for AudioBuffer
   */
  private base64ToFloat32(base64: string): Float32Array {
    const binary = atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const int16Array = new Int16Array(bytes.buffer);
    const float32 = new Float32Array(int16Array.length);
    for (let i = 0; i < int16Array.length; i++) {
      float32[i] = int16Array[i] / 32768.0;
    }
    return float32;
  }

  /**
   * Initialize output audio context (24kHz for Gemini model audio)
   */
  private ensureOutputAudioContext(): AudioContext {
    if (!this.outputAudioCtx || this.outputAudioCtx.state === "closed") {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      this.outputAudioCtx = new AudioCtxClass({ sampleRate: 24000 });
    }
    if (this.outputAudioCtx.state === "suspended") {
      this.outputAudioCtx.resume();
    }
    return this.outputAudioCtx;
  }

  /**
   * Schedule gapless playback of incoming 24kHz PCM chunk
   */
  playAudioChunk(base64Pcm: string): void {
    try {
      const ctx = this.ensureOutputAudioContext();
      const float32Data = this.base64ToFloat32(base64Pcm);
      if (float32Data.length === 0) return;

      const audioBuffer = ctx.createBuffer(1, float32Data.length, 24000);
      audioBuffer.copyToChannel(float32Data, 0);

      const sourceNode = ctx.createBufferSource();
      sourceNode.buffer = audioBuffer;
      sourceNode.connect(ctx.destination);

      const currentTime = ctx.currentTime;
      if (this.nextStartTime < currentTime) {
        this.nextStartTime = currentTime;
      }

      sourceNode.start(this.nextStartTime);
      this.nextStartTime += audioBuffer.duration;

      this.activeSources.push(sourceNode);

      sourceNode.onended = () => {
        const index = this.activeSources.indexOf(sourceNode);
        if (index > -1) {
          this.activeSources.splice(index, 1);
        }
      };
    } catch (err) {
      console.error("[VoicePipeline] Playback error:", err);
    }
  }

  /**
   * Stop all playing audio instantly (e.g. When user interrupts)
   */
  interruptPlayback(): void {
    for (const source of this.activeSources) {
      try {
        source.stop();
        source.disconnect();
      } catch (e) {
        // already stopped
      }
    }
    this.activeSources = [];
    if (this.outputAudioCtx) {
      this.nextStartTime = this.outputAudioCtx.currentTime;
    }
  }

  /**
   * Toggle mute state of microphone
   */
  setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (this.mediaStream) {
      this.mediaStream.getAudioTracks().forEach((track) => {
        track.enabled = !muted;
      });
    }
  }

  getMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Continuous volume analysis loop
   */
  private startVolumeLoop(): void {
    const checkVolume = () => {
      if (this.analyserNode && this.onVolumeCallback && !this.isMuted) {
        const dataArray = new Uint8Array(this.analyserNode.frequencyBinCount);
        this.analyserNode.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const average = sum / dataArray.length;
        const normalized = Math.min(1, average / 128); // 0 to 1
        this.onVolumeCallback(normalized);
      }
      this.animationFrameId = requestAnimationFrame(checkVolume);
    };

    this.animationFrameId = requestAnimationFrame(checkVolume);
  }

  /**
   * Teardown all audio contexts and streams
   */
  stopRecording(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    this.interruptPlayback();

    if (this.scriptProcessor) {
      this.scriptProcessor.disconnect();
      this.scriptProcessor = null;
    }

    if (this.analyserNode) {
      this.analyserNode.disconnect();
      this.analyserNode = null;
    }

    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    if (this.inputAudioCtx && this.inputAudioCtx.state !== "closed") {
      this.inputAudioCtx.close();
      this.inputAudioCtx = null;
    }
  }
}
