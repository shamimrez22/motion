import { Muxer as Mp4Muxer, ArrayBufferTarget as Mp4ArrayBufferTarget } from 'mp4-muxer';
import { Muxer as WebmMuxer, ArrayBufferTarget as WebmArrayBufferTarget } from 'webm-muxer';
import { AnimationPlan, ExportSettings, RenderProgress } from '../types/motion';
import { ProceduralEngine } from './proceduralEngine';

/**
 * Resolution dimensions mapping
 */
export function getResolutionDimensions(
  resolution: '720p' | '1080p' | '4k',
  aspectRatio: '16:9' | '9:16' | '1:1'
): { width: number; height: number } {
  let baseW = 1920;
  let baseH = 1080;

  if (resolution === '720p') {
    baseW = 1280;
    baseH = 720;
  } else if (resolution === '1080p') {
    baseW = 1920;
    baseH = 1080;
  } else if (resolution === '4k') {
    baseW = 3840;
    baseH = 2160;
  }

  if (aspectRatio === '16:9') {
    // Width and height must be even integers for H.264
    return { width: Math.floor(baseW / 2) * 2, height: Math.floor(baseH / 2) * 2 };
  } else if (aspectRatio === '9:16') {
    return { width: Math.floor(baseH / 2) * 2, height: Math.floor(baseW / 2) * 2 };
  } else {
    // 1:1 square
    const side = Math.floor(baseH / 2) * 2;
    return { width: side, height: side };
  }
}

/**
 * Verifies if the file buffer has a legitimate MP4 or WebM signature
 */
export function verifyVideoFileSignature(buffer: ArrayBuffer): {
  isValid: boolean;
  format: 'mp4' | 'webm' | 'unknown';
  signatureHex: string;
} {
  const bytes = new Uint8Array(buffer.slice(0, 16));
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join(' ');

  // Check MP4 'ftyp' box at index 4-7
  const isMp4 =
    bytes.length >= 8 &&
    bytes[4] === 0x66 && // 'f'
    bytes[5] === 0x74 && // 't'
    bytes[6] === 0x79 && // 'y'
    bytes[7] === 0x70; // 'p'

  // Check WebM EBML header [0x1A, 0x45, 0xDF, 0xA3]
  const isWebm =
    bytes.length >= 4 &&
    bytes[0] === 0x1a &&
    bytes[1] === 0x45 &&
    bytes[2] === 0xdf &&
    bytes[3] === 0xa3;

  return {
    isValid: isMp4 || isWebm,
    format: isMp4 ? 'mp4' : isWebm ? 'webm' : 'unknown',
    signatureHex: hex,
  };
}

/**
 * Validates actual playback of video Blob in an HTML video element
 */
export function validateVideoPlayback(blob: Blob): Promise<{ playable: boolean; duration: number }> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    const url = URL.createObjectURL(blob);

    const cleanup = () => {
      URL.revokeObjectURL(url);
      video.remove();
    };

    video.onloadedmetadata = () => {
      const dur = video.duration;
      cleanup();
      resolve({ playable: dur > 0, duration: dur });
    };

    video.onerror = () => {
      cleanup();
      resolve({ playable: false, duration: 0 });
    };

    // Timeout safety
    setTimeout(() => {
      cleanup();
      resolve({ playable: false, duration: 0 });
    }, 4000);

    video.src = url;
  });
}

/**
 * Deterministic Video Render and Encoding Engine
 */
export class VideoExporter {
  private static cancelRequested = false;

  public static cancel() {
    this.cancelRequested = true;
  }

  public static async renderAndExport(
    plan: AnimationPlan,
    settings: ExportSettings,
    onProgress: (progress: RenderProgress) => void
  ): Promise<{ blob: Blob; fileName: string; signatureHex: string; format: string }> {
    this.cancelRequested = false;

    const { width, height } = getResolutionDimensions(settings.resolution, settings.aspectRatio);
    const totalFrames = Math.round(settings.duration * settings.fps);
    const isTransparent = settings.background === 'transparent';
    const forceWebm = isTransparent || settings.format === 'webm_transparent';

    onProgress({
      isRendering: true,
      currentFrame: 0,
      totalFrames,
      percentage: 0,
      etaSeconds: 0,
      statusText: 'Initializing canvas and video encoder...',
    });

    // Create offscreen rendering canvas
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true, alpha: isTransparent });

    if (!ctx) {
      throw new Error('Could not create offscreen canvas context.');
    }

    const startTime = Date.now();

    // Check if WebCodecs VideoEncoder is available
    const hasWebCodecs = typeof window !== 'undefined' && 'VideoEncoder' in window;

    if (hasWebCodecs) {
      try {
        if (!forceWebm) {
          // --- H.264 MP4 PIPELINE VIA MP4-MUXER ---
          return await this.encodeMp4WithWebCodecs(
            canvas,
            ctx,
            plan,
            settings,
            width,
            height,
            totalFrames,
            startTime,
            onProgress
          );
        } else {
          // --- ALPHA-CAPABLE WEBM PIPELINE VIA WEBM-MUXER ---
          return await this.encodeWebmWithWebCodecs(
            canvas,
            ctx,
            plan,
            settings,
            width,
            height,
            totalFrames,
            startTime,
            onProgress
          );
        }
      } catch (err) {
        console.warn('WebCodecs rendering failed, falling back to MediaRecorder:', err);
        // Fallback to MediaRecorder pipeline
        return await this.encodeViaMediaRecorder(
          canvas,
          ctx,
          plan,
          settings,
          width,
          height,
          totalFrames,
          startTime,
          onProgress
        );
      }
    } else {
      // Fallback for environments lacking WebCodecs
      return await this.encodeViaMediaRecorder(
        canvas,
        ctx,
        plan,
        settings,
        width,
        height,
        totalFrames,
        startTime,
        onProgress
      );
    }
  }

  /**
   * Genuine H.264 MP4 export using mp4-muxer and WebCodecs
   */
  private static async encodeMp4WithWebCodecs(
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    plan: AnimationPlan,
    settings: ExportSettings,
    width: number,
    height: number,
    totalFrames: number,
    startTime: number,
    onProgress: (progress: RenderProgress) => void
  ): Promise<{ blob: Blob; fileName: string; signatureHex: string; format: string }> {
    const muxer = new Mp4Muxer({
      target: new Mp4ArrayBufferTarget(),
      video: {
        codec: 'avc',
        width,
        height,
      },
      fastStart: 'in-memory',
    });

    let encoderError: Error | null = null;
    const encoder = new VideoEncoder({
      output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
      error: (e) => {
        encoderError = e;
      },
    });

    // Check supported AVC configurations (Baseline / High profile)
    encoder.configure({
      codec: 'avc1.42001f', // H.264 Baseline Level 3.1
      width,
      height,
      bitrate: Math.min(8000000, width * height * 5),
      framerate: settings.fps,
    });

    for (let frameIndex = 0; frameIndex < totalFrames; frameIndex++) {
      if (this.cancelRequested) {
        throw new Error('Export was cancelled by user.');
      }
      if (encoderError) {
        throw encoderError;
      }

      const speed = settings.speed || 1.0;
      const frameTime = (frameIndex / settings.fps) * speed;

      // Deterministic render at exact frame timestamp
      ProceduralEngine.renderFrame(
        ctx,
        plan,
        frameTime,
        width,
        height,
        settings.background,
        settings.customColor
      );

      // Create video frame
      const timestampMicros = Math.round((frameIndex * 1000000) / settings.fps);
      const frame = new VideoFrame(canvas, { timestamp: timestampMicros });
      encoder.encode(frame, { keyFrame: frameIndex % 30 === 0 });
      frame.close();

      // Progress reporting
      if (frameIndex % 5 === 0 || frameIndex === totalFrames - 1) {
        const elapsed = (Date.now() - startTime) / 1000;
        const fpsRate = (frameIndex + 1) / Math.max(0.1, elapsed);
        const remainingFrames = totalFrames - (frameIndex + 1);
        const etaSeconds = Math.round(remainingFrames / Math.max(1, fpsRate));
        const percentage = Math.round(((frameIndex + 1) / totalFrames) * 100);

        onProgress({
          isRendering: true,
          currentFrame: frameIndex + 1,
          totalFrames,
          percentage,
          etaSeconds,
          statusText: `Encoding frame ${frameIndex + 1} of ${totalFrames} (${percentage}%)...`,
        });

        // Yield to microtask queue to keep UI responsive
        await new Promise((r) => setTimeout(r, 0));
      }
    }

    onProgress({
      isRendering: true,
      currentFrame: totalFrames,
      totalFrames,
      percentage: 98,
      etaSeconds: 0,
      statusText: 'Finalizing MP4 container and verifying file signature...',
    });

    await encoder.flush();
    muxer.finalize();
    const buffer = muxer.target.buffer;
    const blob = new Blob([buffer], { type: 'video/mp4' });

    const sig = verifyVideoFileSignature(buffer);
    const safeTitle = plan.title.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 30);
    const speedSuffix = settings.speed && settings.speed < 1 ? `_slow_${settings.speed}x` : '';
    const fileName = `${safeTitle}${speedSuffix}_${settings.resolution}_${settings.fps}fps.mp4`;

    return {
      blob,
      fileName,
      signatureHex: sig.signatureHex,
      format: 'MP4 (H.264/AVC)',
    };
  }

  /**
   * Genuine Alpha-Capable WebM export using webm-muxer and VP9
   */
  private static async encodeWebmWithWebCodecs(
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    plan: AnimationPlan,
    settings: ExportSettings,
    width: number,
    height: number,
    totalFrames: number,
    startTime: number,
    onProgress: (progress: RenderProgress) => void
  ): Promise<{ blob: Blob; fileName: string; signatureHex: string; format: string }> {
    const muxer = new WebmMuxer({
      target: new WebmArrayBufferTarget(),
      video: {
        codec: 'V_VP9',
        width,
        height,
        alpha: true, // Alpha transparency enabled!
      },
    });

    let encoderError: Error | null = null;
    const encoder = new VideoEncoder({
      output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
      error: (e) => {
        encoderError = e;
      },
    });

    encoder.configure({
      codec: 'vp09.00.10.08',
      width,
      height,
      bitrate: Math.min(8000000, width * height * 4),
      framerate: settings.fps,
      alpha: 'keep',
    });

    for (let frameIndex = 0; frameIndex < totalFrames; frameIndex++) {
      if (this.cancelRequested) {
        throw new Error('Export was cancelled by user.');
      }
      if (encoderError) {
        throw encoderError;
      }

      const speed = settings.speed || 1.0;
      const frameTime = (frameIndex / settings.fps) * speed;
      ProceduralEngine.renderFrame(
        ctx,
        plan,
        frameTime,
        width,
        height,
        'transparent',
        settings.customColor
      );

      const timestampMicros = Math.round((frameIndex * 1000000) / settings.fps);
      const frame = new VideoFrame(canvas, { timestamp: timestampMicros, alpha: 'keep' });
      encoder.encode(frame, { keyFrame: frameIndex % 30 === 0 });
      frame.close();

      if (frameIndex % 5 === 0 || frameIndex === totalFrames - 1) {
        const elapsed = (Date.now() - startTime) / 1000;
        const fpsRate = (frameIndex + 1) / Math.max(0.1, elapsed);
        const remainingFrames = totalFrames - (frameIndex + 1);
        const etaSeconds = Math.round(remainingFrames / Math.max(1, fpsRate));
        const percentage = Math.round(((frameIndex + 1) / totalFrames) * 100);

        onProgress({
          isRendering: true,
          currentFrame: frameIndex + 1,
          totalFrames,
          percentage,
          etaSeconds,
          statusText: `Encoding alpha frame ${frameIndex + 1} of ${totalFrames} (${percentage}%)...`,
        });

        await new Promise((r) => setTimeout(r, 0));
      }
    }

    await encoder.flush();
    muxer.finalize();
    const buffer = muxer.target.buffer;
    const blob = new Blob([buffer], { type: 'video/webm' });

    const sig = verifyVideoFileSignature(buffer);
    const speedSuffix = settings.speed && settings.speed < 1 ? `_slow_${settings.speed}x` : '';
    const safeTitle = plan.title.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 30);
    const fileName = `${safeTitle}${speedSuffix}_transparent_${settings.resolution}.webm`;

    return {
      blob,
      fileName,
      signatureHex: sig.signatureHex,
      format: 'WebM (VP9 with Alpha Transparency)',
    };
  }

  /**
   * MediaRecorder Fallback for environments lacking WebCodecs
   */
  private static async encodeViaMediaRecorder(
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    plan: AnimationPlan,
    settings: ExportSettings,
    width: number,
    height: number,
    totalFrames: number,
    startTime: number,
    onProgress: (progress: RenderProgress) => void
  ): Promise<{ blob: Blob; fileName: string; signatureHex: string; format: string }> {
    const stream = canvas.captureStream(settings.fps);
    const mimeTypes = [
      'video/mp4;codecs=avc1',
      'video/mp4',
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm',
    ];

    let chosenMime = 'video/webm';
    for (const mime of mimeTypes) {
      if (MediaRecorder.isTypeSupported(mime)) {
        chosenMime = mime;
        break;
      }
    }

    const recorder = new MediaRecorder(stream, {
      mimeType: chosenMime,
      videoBitsPerSecond: Math.min(8000000, width * height * 4),
    });

    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunks.push(e.data);
    };

    recorder.start(100);

    const frameDurationMs = 1000 / settings.fps;

    for (let frameIndex = 0; frameIndex < totalFrames; frameIndex++) {
      if (this.cancelRequested) {
        recorder.stop();
        throw new Error('Export cancelled by user.');
      }

      const speed = settings.speed || 1.0;
      const frameTime = (frameIndex / settings.fps) * speed;
      ProceduralEngine.renderFrame(
        ctx,
        plan,
        frameTime,
        width,
        height,
        settings.background,
        settings.customColor
      );

      const percentage = Math.round(((frameIndex + 1) / totalFrames) * 100);
      onProgress({
        isRendering: true,
        currentFrame: frameIndex + 1,
        totalFrames,
        percentage,
        etaSeconds: Math.round(((totalFrames - frameIndex) * frameDurationMs) / 1000),
        statusText: `Rendering frame ${frameIndex + 1} of ${totalFrames} (${percentage}%)...`,
      });

      await new Promise((r) => setTimeout(r, frameDurationMs));
    }

    const finalBlobPromise = new Promise<Blob>((resolve) => {
      recorder.onstop = () => {
        resolve(new Blob(chunks, { type: chosenMime }));
      };
    });

    recorder.stop();
    const finalBlob = await finalBlobPromise;
    const arrayBuffer = await finalBlob.arrayBuffer();
    const sig = verifyVideoFileSignature(arrayBuffer);

    const isMp4 = chosenMime.includes('mp4');
    const speedSuffix = settings.speed && settings.speed < 1 ? `_slow_${settings.speed}x` : '';
    const safeTitle = plan.title.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 30);
    const ext = isMp4 ? 'mp4' : 'webm';
    const fileName = `${safeTitle}${speedSuffix}_${settings.resolution}.${ext}`;

    return {
      blob: finalBlob,
      fileName,
      signatureHex: sig.signatureHex,
      format: isMp4 ? 'MP4' : 'WebM',
    };
  }
}
