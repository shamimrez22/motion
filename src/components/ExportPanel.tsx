import React from 'react';
import { Download, CheckCircle, AlertTriangle, Film, XCircle, FileVideo, HardDrive } from 'lucide-react';
import { RenderProgress, ExportSettings } from '../types/motion';
import { VideoExporter } from '../engine/videoExporter';

interface ExportPanelProps {
  progress: RenderProgress;
  settings: ExportSettings;
  onClear: () => void;
}

export const ExportPanel: React.FC<ExportPanelProps> = ({ progress, settings, onClear }) => {
  if (!progress.isRendering && !progress.downloadUrl && !progress.error) {
    return null;
  }

  const handleDownload = () => {
    if (!progress.downloadUrl || !progress.fileName) return;
    const a = document.createElement('a');
    a.href = progress.downloadUrl;
    a.download = progress.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCancel = () => {
    VideoExporter.cancel();
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="w-80 bg-[#0E1524] border-l border-[#1C2A3E] p-4 flex flex-col justify-between h-[calc(100vh-4rem)] text-slate-200 select-none overflow-y-auto">
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-[#1A263A] pb-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <Film className="w-4 h-4 text-[#31AAA9]" />
            Video Export Station
          </h3>
          {progress.downloadUrl && (
            <button
              onClick={onClear}
              className="text-[11px] text-slate-400 hover:text-slate-200"
            >
              Close
            </button>
          )}
        </div>

        {/* Rendering Active View */}
        {progress.isRendering && (
          <div className="p-4 rounded-xl bg-[#121D2E] border border-[#20324B] space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-200">Encoding Video Frames</span>
              <span className="text-[#31AAA9] font-mono">{progress.percentage}%</span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-2.5 bg-[#17253A] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#31AAA9] to-[#48C3C2] transition-all duration-150"
                style={{ width: `${progress.percentage}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span>
                Frame {progress.currentFrame} / {progress.totalFrames}
              </span>
              <span>ETA: {progress.etaSeconds}s</span>
            </div>

            <p className="text-[11px] text-slate-300 italic">{progress.statusText}</p>

            <button
              onClick={handleCancel}
              className="w-full mt-2 py-1.5 rounded-lg bg-[#202B3E] hover:bg-rose-950/60 hover:text-rose-300 text-xs text-slate-400 border border-[#2D3E56] transition-colors"
            >
              Cancel Render
            </button>
          </div>
        )}

        {/* Render Completed View */}
        {progress.downloadUrl && (
          <div className="space-y-4">
            {/* Video preview player */}
            <div className="rounded-xl overflow-hidden border border-[#24354D] bg-black aspect-video relative group">
              <video
                src={progress.downloadUrl}
                controls
                autoPlay
                loop
                muted
                className="w-full h-full object-contain"
              />
            </div>

            {/* Verification Stats */}
            <div className="p-3.5 rounded-xl bg-[#121F32] border border-[#20334E] space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Status:</span>
                <span className="flex items-center gap-1 font-semibold text-emerald-400">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Verified Playable Video
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">Codec / Format:</span>
                <span className="font-mono text-slate-200">{progress.codecUsed || 'H.264 (AVC)'}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">File Size:</span>
                <span className="font-mono text-slate-200">{formatFileSize(progress.fileSizeBytes)}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">Target Duration:</span>
                <span className="font-mono text-slate-200">{settings.duration}s @ {settings.fps} FPS</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">Motion Speed:</span>
                <span className="font-mono text-slate-200">
                  {(settings.speed || 1.0) < 1.0 ? (
                    <span className="text-amber-400 font-bold">🐢 {settings.speed}x Slow Motion Video</span>
                  ) : (
                    <span className="text-emerald-400 font-medium">⚡ 1.0x Normal Speed</span>
                  )}
                </span>
              </div>

              {progress.fileSignatureHex && (
                <div className="pt-2 border-t border-[#1C2C42]">
                  <span className="text-[10px] text-slate-400 block mb-1">Container Signature Hex:</span>
                  <p className="font-mono text-[10px] text-slate-300 bg-[#0C1420] p-1.5 rounded border border-[#1A283C] break-all">
                    {progress.fileSignatureHex}
                  </p>
                </div>
              )}
            </div>

            {/* Direct Download Button */}
            <button
              onClick={handleDownload}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#31AAA9] to-[#248B8A] hover:from-[#38BDBD] hover:to-[#2AA3A2] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#31AAA9]/25 transition-all active:scale-[0.99]"
            >
              <Download className="w-4 h-4" />
              <span>Download {progress.fileName?.endsWith('.webm') ? 'Transparent WebM' : 'Playable MP4'}</span>
            </button>
          </div>
        )}

        {/* Error View */}
        {progress.error && (
          <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/50 space-y-2 text-xs">
            <div className="flex items-center gap-2 text-rose-400 font-bold">
              <AlertTriangle className="w-4 h-4" />
              <span>Render Error</span>
            </div>
            <p className="text-slate-300 text-[11px]">{progress.error}</p>
          </div>
        )}
      </div>

      <div className="pt-4 border-t border-[#1A263A] text-[10px] text-slate-500 text-center">
        SS ICON MOTION STUDIO • Frame-Accurate Clock
      </div>
    </div>
  );
};
