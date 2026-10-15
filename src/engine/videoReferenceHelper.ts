/**
 * Video Reference Processing Utility
 * Extracts high-resolution frame from user-uploaded video files (mp4, webm, mov)
 * to synthesize After Effects motion graphics from video references.
 */
export async function extractFrameFromVideoFile(
  file: File
): Promise<{ dataUrl: string; width: number; height: number; duration: number }> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'auto';
    video.muted = true;
    video.playsInline = true;
    const url = URL.createObjectURL(file);
    video.src = url;

    const timeout = setTimeout(() => {
      URL.revokeObjectURL(url);
      reject(new Error('Video frame extraction timed out.'));
    }, 12000);

    video.onloadedmetadata = () => {
      // Seek to 1 second or 25% through video to get a vibrant representative frame
      const targetTime = Math.min(1.2, Math.max(0.1, (video.duration || 2) * 0.25));
      video.currentTime = targetTime;
    };

    video.onseeked = () => {
      clearTimeout(timeout);
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 1280;
        canvas.height = video.videoHeight || 720;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          URL.revokeObjectURL(url);
          reject(new Error('Could not create 2D canvas context for video frame extraction.'));
          return;
        }

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/png');
        const duration = video.duration || 10;
        URL.revokeObjectURL(url);
        resolve({
          dataUrl,
          width: canvas.width,
          height: canvas.height,
          duration,
        });
      } catch (err) {
        URL.revokeObjectURL(url);
        reject(err);
      }
    };

    video.onerror = () => {
      clearTimeout(timeout);
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load video file for motion analysis.'));
    };
  });
}
