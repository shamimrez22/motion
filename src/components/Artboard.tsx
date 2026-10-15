import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Repeat,
  Eye,
  EyeOff,
  Filter,
  Upload,
  Layers,
  Sparkles,
  Zap,
  Clock,
  ArrowRight,
  FileImage,
  RefreshCw,
} from 'lucide-react';
import { AnimationPlan, ExportSettings, ContinuousMotionType } from '../types/motion';
import { ProceduralEngine } from '../engine/proceduralEngine';
import { PartDecompositionType } from '../engine/localAnalyzer';

interface ArtboardProps {
  plan: AnimationPlan | null;
  settings: ExportSettings;
  currentTime: number;
  setCurrentTime: (t: number) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  onToggleLayerVisibility?: (layerId: string) => void;
  onRemoveLayer?: (layerId: string) => void;
  onKeepOnlySnakeMotion?: () => void;
  onFocusReferenceArtwork?: () => void;
  onImageUploaded?: (file: File) => void;
  onLoadSampleGraphic?: (type: 'infographic' | 'tech') => void;
  onResetPlan?: () => void;
  decompositionMode?: PartDecompositionType;
  onChangeDecompositionMode?: (mode: PartDecompositionType) => void;
  onChangeSpeed?: (speed: number) => void;
  continuousMotion?: ContinuousMotionType;
  onChangeContinuousMotion?: (mode: ContinuousMotionType) => void;
}

export const Artboard: React.FC<ArtboardProps> = ({
  plan,
  settings,
  currentTime,
  setCurrentTime,
  isPlaying,
  setIsPlaying,
  onToggleLayerVisibility,
  onRemoveLayer,
  onImageUploaded,
  onLoadSampleGraphic,
  onResetPlan,
  decompositionMode = 'auto',
  onChangeDecompositionMode,
  onChangeSpeed,
  continuousMotion = 'wave_flow',
  onChangeContinuousMotion,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [zoomLevel, setZoomLevel] = useState<'fit' | 0.5 | 0.75 | 1>('fit');
  const [isLooping, setIsLooping] = useState<boolean>(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(settings.speed || 1);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const animFrameRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number | null>(null);

  // Sync playback speed when settings.speed updates
  useEffect(() => {
    if (settings.speed) {
      setPlaybackSpeed(settings.speed);
    }
  }, [settings.speed]);

  // Determine aspect ratio canvas dimensions (virtual 1080p preview)
  const is16x9 = settings.aspectRatio === '16:9';
  const is9x16 = settings.aspectRatio === '9:16';
  const canvasWidth = is16x9 ? 1920 : is9x16 ? 1080 : 1080;
  const canvasHeight = is16x9 ? 1080 : is9x16 ? 1920 : 1080;

  // Render current frame onto the preview canvas
  const renderCurrent = useCallback(
    (time: number) => {
      if (!plan) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ProceduralEngine.renderFrame(
        ctx,
        plan,
        time,
        canvasWidth,
        canvasHeight,
        settings.background,
        settings.customColor
      );
    },
    [plan, canvasWidth, canvasHeight, settings.background, settings.customColor]
  );

  // Render when time or plan changes
  useEffect(() => {
    if (plan) {
      renderCurrent(currentTime);
    }
  }, [plan, currentTime, renderCurrent]);

  // Animation playback loop
  useEffect(() => {
    if (!plan || !isPlaying) {
      lastTimestampRef.current = null;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    const animate = (timestamp: number) => {
      if (lastTimestampRef.current !== null) {
        const deltaSeconds = ((timestamp - lastTimestampRef.current) / 1000) * playbackSpeed;
        let nextTime = currentTime + deltaSeconds;

        if (nextTime >= settings.duration) {
          if (isLooping) {
            nextTime = nextTime % settings.duration;
          } else {
            nextTime = settings.duration;
            setIsPlaying(false);
          }
        }
        setCurrentTime(nextTime);
      }
      lastTimestampRef.current = timestamp;
      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [plan, isPlaying, currentTime, settings.duration, playbackSpeed, isLooping, setIsPlaying, setCurrentTime]);

  const handleRestart = () => {
    setCurrentTime(0);
    renderCurrent(0);
  };

  const handleScrubberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setCurrentTime(val);
    renderCurrent(val);
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0] && onImageUploaded) {
      onImageUploaded(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && onImageUploaded) {
      onImageUploaded(e.target.files[0]);
    }
  };

  const currentFrame = Math.floor(currentTime * settings.fps);
  const totalFrames = Math.round(settings.duration * settings.fps);

  // 1. EMPTY STATE: NO SAMPLE VIDEO BEFOREHAND
  // "EIKHANE AGEY SAMPLE KONO VIDEO THAKBE NA - SHUDHU EI IMAGE TAGGE KORE EITER PROTTEKTA PAT ALADA ALA ANIMATION HOBE"
  if (!plan) {
    return (
      <div
        className={`flex-1 flex flex-col bg-[#070D18] relative overflow-hidden select-none transition-colors ${
          isDragOver ? 'bg-[#0B1A2F]' : ''
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleFileDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/mp4,video/webm,video/*"
          className="hidden"
          onChange={handleFileInputChange}
        />

        {/* Clean Top Bar */}
        <div className="h-11 border-b border-[#1A263A] px-5 flex items-center justify-between bg-[#0A1220] text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-200 flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#31AAA9]" />
              Multi-Part Reference Motion Studio
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 font-medium">
              Ready for Reference
            </span>
          </div>
          <span className="text-[11px] text-slate-400">
            No preset video beforehand • Pure reference animation
          </span>
        </div>

        {/* Center Stage: Upload Workspace */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-2xl w-full">
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-3xl p-10 text-center cursor-pointer transition-all duration-300 relative group overflow-hidden ${
                isDragOver
                  ? 'border-[#31AAA9] bg-[#31AAA9]/15 shadow-2xl shadow-[#31AAA9]/20 scale-[1.01]'
                  : 'border-[#1E314D] hover:border-[#31AAA9] bg-[#0C1626]/80 hover:bg-[#0E1B2E] shadow-xl'
              }`}
            >
              {/* Subtle Ambient Glow */}
              <div className="absolute inset-0 bg-gradient-to-b from-[#31AAA9]/5 via-transparent to-transparent pointer-events-none" />

              <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-[#1A2D45] to-[#122033] flex items-center justify-center text-[#31AAA9] shadow-inner border border-[#274062] mb-6 group-hover:scale-105 group-hover:border-[#31AAA9]/50 transition-transform">
                <Upload className="w-9 h-9" />
              </div>

              <h2 className="text-xl font-bold text-white mb-2 tracking-tight">
                Upload Reference Graphic or Image
              </h2>

              <p className="text-sm font-medium text-slate-300 mb-1 max-w-lg mx-auto">
                এখানে আগে কোনো স্যাম্পল ভিডিও নেই — শুধু আপনার ইমেজ আপলোড করুন, এটার প্রত্যেকটা পার্ট আলাদা আলাদা অ্যানিমেশন হবে!
              </p>

              <p className="text-xs text-slate-400 mb-6 max-w-md mx-auto">
                Each segment (central hub, side branches, cards, icons, nodes) will animate independently with fluid After Effects spring & float motion.
              </p>

              <div className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#31AAA9] to-[#258584] text-white font-bold text-sm shadow-lg shadow-[#31AAA9]/30 group-hover:from-[#39C4C3] group-hover:to-[#2AA1A0] transition-all">
                <FileImage className="w-4 h-4" />
                <span>Choose Image from Computer</span>
              </div>

              <div className="mt-4 text-[11px] text-slate-400">
                Supports PNG, JPG, WebP, SVG, and video frames
              </div>
            </div>

            {/* Quick 1-Click Test Options */}
            <div className="mt-6 p-4 rounded-2xl bg-[#0D1829] border border-[#1A2C44] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-300 font-medium">
                <Sparkles className="w-4 h-4 text-[#31AAA9]" />
                <span>Or test immediately with 1-click reference:</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onLoadSampleGraphic && onLoadSampleGraphic('infographic')}
                  className="px-3.5 py-2 rounded-xl bg-[#16273E] hover:bg-[#1E3555] text-slate-200 hover:text-white border border-[#274064] font-semibold flex items-center gap-1.5 transition-all"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>Infographic Reference (Screenshot 3)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. ACTIVE STATE: UPLOADED IMAGE WITH INDIVIDUAL ANIMATED PARTS
  return (
    <div
      className={`flex-1 flex flex-col bg-[#080D16] relative overflow-hidden select-none ${
        isDragOver ? 'ring-2 ring-[#31AAA9]' : ''
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleFileDrop}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/mp4,video/webm,video/*"
        className="hidden"
        onChange={handleFileInputChange}
      />

      {/* Top Preview Bar with Stats */}
      <div className="h-10 border-b border-[#1A2538] px-4 flex items-center justify-between bg-[#0B121E] text-xs text-slate-400">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-slate-200">{plan.title}</span>
          <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-[#162236] text-[#31AAA9] border border-[#31AAA9]/30">
            {settings.aspectRatio} • {canvasWidth}×{canvasHeight}
          </span>
          <span className="text-[10px] text-slate-400">
            Background: <strong className="text-slate-200 capitalize">{settings.background}</strong>
          </span>

          {/* Parts Count Badge */}
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 flex items-center gap-1">
            ✓ {plan.layers.length} Parts Animating Separately
          </span>

          {/* Speed Indicator */}
          {settings.speed && settings.speed < 1.0 ? (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-950/70 text-amber-300 border border-amber-600/50 flex items-center gap-1">
              🐢 Slow Video ({settings.speed}x)
            </span>
          ) : (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950/50 text-emerald-300 border border-emerald-700/40">
              ⚡ 1.0x Normal Speed
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Replace / Reset Image Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-2.5 py-1 rounded-lg bg-[#142338] hover:bg-[#1E3250] text-slate-300 hover:text-white border border-[#233854] text-[11px] font-medium flex items-center gap-1.5 transition-colors"
            title="Upload a different reference image"
          >
            <Upload className="w-3 h-3 text-[#31AAA9]" />
            <span>Upload New Image</span>
          </button>

          {onResetPlan && (
            <button
              onClick={onResetPlan}
              className="px-2 py-1 rounded-lg bg-[#141C2B] hover:bg-rose-950/50 text-slate-400 hover:text-rose-300 border border-[#1E2B3E] hover:border-rose-800/50 text-[11px] font-medium transition-colors"
              title="Clear artboard back to upload screen"
            >
              Clear
            </button>
          )}

          {/* Zoom controls */}
          <div className="flex items-center gap-1 bg-[#141F32] rounded-lg p-0.5 border border-[#1E2E48]">
            <button
              onClick={() => setZoomLevel('fit')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                zoomLevel === 'fit' ? 'bg-[#31AAA9] text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Fit
            </button>
            <button
              onClick={() => setZoomLevel(0.5)}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                zoomLevel === 0.5 ? 'bg-[#31AAA9] text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              50%
            </button>
            <button
              onClick={() => setZoomLevel(1)}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                zoomLevel === 1 ? 'bg-[#31AAA9] text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              100%
            </button>
          </div>
        </div>
      </div>

      {/* Decomposition Mode & Speed Bar */}
      <div className="bg-[#0C1422] border-b border-[#18263B] px-4 py-1.5 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-[#31AAA9]" />
            Parts Split Mode:
          </span>
          <div className="flex items-center gap-1 bg-[#121E31] p-0.5 rounded-lg border border-[#1F304B]">
            {[
              { id: 'step_cards_4', label: '4 Step Cards (Step 01-04)' },
              { id: 'step_cards_3', label: '3 Step Cards' },
              { id: 'step_cards_5', label: '5 Step Cards' },
              { id: 'infographic_9part', label: 'Hub & Branches' },
              { id: 'semantic_5part', label: '5-Part Semantic' },
              { id: 'quadrant_4part', label: '4-Quadrant' },
              { id: 'single_hero', label: 'Whole Uncut' },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => onChangeDecompositionMode && onChangeDecompositionMode(m.id as PartDecompositionType)}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                  decompositionMode === m.id
                    ? 'bg-[#31AAA9] text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Speed Quick Selector */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-400" />
            Motion Speed:
          </span>
          <div className="flex items-center gap-1 bg-[#121E31] p-0.5 rounded-lg border border-[#1F304B]">
            {[
              { spd: 1.0, label: '1.0x Normal' },
              { spd: 0.5, label: '0.5x Slow Video' },
              { spd: 0.25, label: '0.25x Super Slow' },
            ].map((s) => (
              <button
                key={s.spd}
                onClick={() => {
                  setPlaybackSpeed(s.spd);
                  if (onChangeSpeed) onChangeSpeed(s.spd);
                }}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                  playbackSpeed === s.spd
                    ? s.spd < 1
                      ? 'bg-amber-500 text-slate-900 font-bold'
                      : 'bg-[#31AAA9] text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Continuous Motion Style Selector (চলমান অ্যানিমেশন ভিডিও মোড) */}
      <div className="bg-[#09101C] border-b border-[#141F32] px-4 py-1.5 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            চলমান অ্যানিমেশন (Continuous Motion):
          </span>
          <div className="flex items-center gap-1 bg-[#10192A] p-0.5 rounded-lg border border-[#1A2A44]">
            {[
              { id: 'wave_flow', label: '🌊 চলমান ওয়েভ মোশন (Wave Flow)' },
              { id: 'spotlight_carousel', label: '🎬 চলমান স্পটলাইট (Spotlight)' },
              { id: 'energy_signal', label: '⚡ চলমান লাইট সিগন্যাল (Signal)' },
              { id: 'camera_pan', label: '🎥 চলমান ক্যামেরা প্যান (Glide)' },
            ].map((cm) => (
              <button
                key={cm.id}
                onClick={() => onChangeContinuousMotion && onChangeContinuousMotion(cm.id as ContinuousMotionType)}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
                  (continuousMotion || 'wave_flow') === cm.id
                    ? 'bg-emerald-600 text-white font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {cm.label}
              </button>
            ))}
          </div>
        </div>

        <span className="text-[10px] text-slate-400 hidden sm:inline">
          ✓ Non-stop kinetic motion graphics • Never stays static
        </span>
      </div>

      {/* Layer Parts Display Strip */}
      <div className="bg-[#09101B] border-b border-[#162234] px-4 py-1.5 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 overflow-x-auto py-0.5 max-w-full">
          <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1 shrink-0">
            <Filter className="w-3 h-3 text-[#31AAA9]" />
            Parts on Display:
          </span>

          {plan.layers.map((layer) => {
            const isVisible = !layer.hidden;
            return (
              <div
                key={layer.id}
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] border transition-all shrink-0 ${
                  isVisible
                    ? 'bg-[#142338] border-[#2A4263] text-slate-200'
                    : 'bg-[#0E1724] border-[#182333] text-slate-500 line-through'
                }`}
              >
                <button
                  type="button"
                  onClick={() => onToggleLayerVisibility && onToggleLayerVisibility(layer.id)}
                  className="hover:text-[#31AAA9] transition-colors"
                  title={isVisible ? 'Click to hide this part from video' : 'Click to show this part'}
                >
                  {isVisible ? <Eye className="w-3 h-3 text-[#31AAA9]" /> : <EyeOff className="w-3 h-3 text-slate-500" />}
                </button>

                <span className="font-medium max-w-[140px] truncate">{layer.name}</span>

                {onRemoveLayer && plan.layers.length > 1 && (
                  <button
                    type="button"
                    onClick={() => onRemoveLayer(layer.id)}
                    className="hover:text-red-400 text-slate-500 transition-colors ml-0.5"
                    title="Remove this part"
                  >
                    ×
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Artboard Canvas Stage */}
      <div
        ref={containerRef}
        className="flex-1 flex items-center justify-center p-6 overflow-hidden relative"
      >
        <div
          className={`relative transition-all duration-200 shadow-2xl rounded-xl overflow-hidden border border-[#1E2E48] ${
            settings.background === 'white' ? 'bg-white' : 'bg-slate-900'
          }`}
          style={{
            aspectRatio: is16x9 ? '16/9' : is9x16 ? '9/16' : '1/1',
            maxHeight: 'calc(100% - 10px)',
            maxWidth: 'calc(100% - 10px)',
            width: is16x9 ? '88%' : is9x16 ? '45%' : '65%',
          }}
        >
          <canvas
            ref={canvasRef}
            width={canvasWidth}
            height={canvasHeight}
            className="w-full h-full object-contain block"
          />
        </div>
      </div>

      {/* Bottom Playback & Scrubber Controls */}
      <div className="h-20 bg-[#0B121E] border-t border-[#1A2538] px-6 flex flex-col justify-center gap-2">
        {/* Scrubber Bar */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-[#31AAA9] font-bold w-16">
            {currentTime.toFixed(2)}s
          </span>

          <input
            type="range"
            min={0}
            max={settings.duration}
            step={0.01}
            value={currentTime}
            onChange={handleScrubberChange}
            className="flex-1 h-2 bg-[#1A263B] rounded-lg appearance-none cursor-pointer accent-[#31AAA9]"
          />

          <span className="text-xs font-mono text-slate-400 w-16 text-right">
            {settings.duration.toFixed(2)}s
          </span>
        </div>

        {/* Buttons Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Play / Pause */}
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-9 h-9 rounded-lg bg-[#31AAA9] hover:bg-[#2A9594] text-white flex items-center justify-center shadow-md shadow-[#31AAA9]/20 transition-all"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            </button>

            {/* Restart */}
            <button
              onClick={handleRestart}
              className="w-8 h-8 rounded-lg bg-[#162236] hover:bg-[#1E2D48] text-slate-300 hover:text-white flex items-center justify-center border border-[#233550] transition-colors"
              title="Restart from beginning"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {/* Loop Toggle */}
            <button
              onClick={() => setIsLooping(!isLooping)}
              className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-colors ${
                isLooping
                  ? 'bg-[#142B3C] text-[#31AAA9] border-[#31AAA9]/50'
                  : 'bg-[#162236] text-slate-400 border-[#233550] hover:text-slate-200'
              }`}
              title="Toggle looping"
            >
              <Repeat className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Frame count & Playback Speed */}
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <span className="font-mono">
              Frame <strong className="text-slate-200">{currentFrame}</strong> / {totalFrames}
            </span>

            <div className="flex items-center gap-1 bg-[#141F32] rounded-lg p-0.5 border border-[#1E2E48]">
              {[0.25, 0.5, 1, 2].map((spd) => (
                <button
                  key={spd}
                  onClick={() => {
                    setPlaybackSpeed(spd);
                    if (onChangeSpeed) onChangeSpeed(spd);
                  }}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                    playbackSpeed === spd
                      ? spd < 1
                        ? 'bg-amber-500 text-slate-900 font-bold'
                        : 'bg-[#31AAA9] text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
