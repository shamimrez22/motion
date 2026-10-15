import React, { useRef, useState } from 'react';
import { Upload, Sparkles, Layers, Check, Palette, Clock, Video, Zap } from 'lucide-react';
import { ExportSettings, BackgroundType, AspectRatioType, ResolutionPreset, ExportFormat, AnimationPlan, ContinuousMotionType } from '../types/motion';
import { SAMPLE_PRESETS } from '../data/samplePresets';
import { PartDecompositionType } from '../engine/localAnalyzer';

interface LeftSidebarProps {
  settings: ExportSettings;
  setSettings: React.Dispatch<React.SetStateAction<ExportSettings>>;
  onImageUploaded: (file: File) => void;
  onSelectPreset: (plan: AnimationPlan) => void;
  onGenerateVideo: () => void;
  onGenerateFromReference?: () => void;
  isGenerating: boolean;
  selectedModel: string;
  setSelectedModel: (m: string) => void;
  uploadedImageName?: string;
  referenceImageDataUrl?: string;
  onToggleVariant?: (variant: 'mint' | 'dark') => void;
  userInstruction: string;
  setUserInstruction: (val: string) => void;
  includeSnake: boolean;
  setIncludeSnake: (val: boolean) => void;
  includeArtwork: boolean;
  setIncludeArtwork: (val: boolean) => void;
  decompositionMode?: PartDecompositionType;
  onChangeDecompositionMode?: (mode: PartDecompositionType) => void;
  continuousMotion?: ContinuousMotionType;
  onChangeContinuousMotion?: (mode: ContinuousMotionType) => void;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  settings,
  setSettings,
  onImageUploaded,
  onSelectPreset,
  onGenerateVideo,
  onGenerateFromReference,
  isGenerating,
  selectedModel,
  setSelectedModel,
  uploadedImageName,
  referenceImageDataUrl,
  userInstruction,
  setUserInstruction,
  includeSnake,
  setIncludeSnake,
  includeArtwork,
  setIncludeArtwork,
  decompositionMode = 'auto',
  onChangeDecompositionMode,
  continuousMotion = 'wave_flow',
  onChangeContinuousMotion,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      validateAndUpload(file);
    }
  };

  const validateAndUpload = (file: File) => {
    const isImage = file.type.startsWith('image/') || /\.(png|jpe?g|webp|gif|svg)$/i.test(file.name);
    const isVideo = file.type.startsWith('video/') || /\.(mp4|webm|mov|mkv)$/i.test(file.name);

    if (!isImage && !isVideo) {
      console.warn('Unsupported file format:', file.type, file.name);
      return;
    }
    setIncludeArtwork(true);
    onImageUploaded(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <aside className="w-84 bg-[#0B111D] border-r border-[#1A2538] flex flex-col h-[calc(100vh-4rem)] overflow-y-auto select-none text-slate-200">
      <div className="p-4 space-y-5">
        {/* Section 1: Reference Image Upload */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5 text-[#31AAA9]" />
              Reference Graphic / Image
            </label>
            <span className="text-[10px] text-slate-400">PNG, JPG, SVG</span>
          </div>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
              dragOver
                ? 'border-[#31AAA9] bg-[#31AAA9]/10'
                : 'border-[#22334A] hover:border-[#31AAA9]/60 bg-[#101826]'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/mp4,video/webm,video/quicktime,video/*"
              className="hidden"
              onChange={handleFileChange}
            />

            <div className="w-10 h-10 mx-auto rounded-full bg-[#18263A] flex items-center justify-center text-[#31AAA9] mb-2">
              <Upload className="w-5 h-5" />
            </div>

            {uploadedImageName ? (
              <div>
                <p className="text-xs font-semibold text-emerald-400 truncate max-w-[200px] mx-auto">
                  ✓ {uploadedImageName}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">Click or drop to replace reference</p>
              </div>
            ) : (
              <div>
                <p className="text-xs font-medium text-slate-300">Click or drop reference image</p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Animate every part separately • Zero sample video beforehand
                </p>
              </div>
            )}
          </div>

          {referenceImageDataUrl && (
            <div className="p-2.5 rounded-xl bg-[#0F1928] border border-[#1E2E48] flex items-center gap-2.5 shadow-sm">
              <img
                src={referenceImageDataUrl}
                alt="Reference Image Preview"
                className="w-12 h-12 object-contain rounded-lg bg-black/50 border border-[#24354D] p-0.5"
              />
              <div className="flex-1 text-left min-w-0">
                <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  Multi-Part Animation Active
                </span>
                <p className="text-[10px] text-slate-400 leading-tight mt-0.5 truncate">
                  Each part animates with independent timing
                </p>
              </div>
            </div>
          )}

          {/* Parts Decomposition Selector */}
          <div className="pt-2 border-t border-[#1C2C42] space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#31AAA9]" />
                Decompose Parts
              </label>
              <span className="text-[10px] text-slate-400">Independent Motion</span>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              {[
                { id: 'step_cards_4', label: '4 Step Cards (01-04)' },
                { id: 'step_cards_3', label: '3 Step Cards' },
                { id: 'step_cards_5', label: '5 Step Cards' },
                { id: 'infographic_9part', label: 'Hub & Branches' },
                { id: 'semantic_5part', label: '5-Part Semantic' },
                { id: 'quadrant_4part', label: '4-Quadrant Pop' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => onChangeDecompositionMode && onChangeDecompositionMode(m.id as PartDecompositionType)}
                  className={`px-2 py-1.5 rounded-lg border text-[11px] font-medium text-left truncate transition-all ${
                    decompositionMode === m.id
                      ? 'bg-[#183246] border-[#31AAA9] text-white shadow-sm'
                      : 'bg-[#101826] border-[#1E2E48] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Continuous Motion Style (চলমান অ্যানিমেশন ভিডিও মোড) */}
          <div className="pt-2 border-t border-[#1C2C42] space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-emerald-400" />
                চলমান মোশন (Continuous Motion)
              </label>
              <span className="text-[10px] text-emerald-400 font-semibold">Live Video</span>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              {[
                { id: 'wave_flow', label: '🌊 Wave Flow' },
                { id: 'spotlight_carousel', label: '🎬 Step Spotlight' },
                { id: 'energy_signal', label: '⚡ Signal Flow' },
                { id: 'camera_pan', label: '🎥 Camera Pan' },
              ].map((cm) => (
                <button
                  key={cm.id}
                  type="button"
                  onClick={() => onChangeContinuousMotion && onChangeContinuousMotion(cm.id as ContinuousMotionType)}
                  className={`px-2 py-1.5 rounded-lg border text-[11px] font-medium text-left truncate transition-all ${
                    (continuousMotion || 'wave_flow') === cm.id
                      ? 'bg-emerald-800/80 border-emerald-400 text-white font-bold shadow-sm'
                      : 'bg-[#101826] border-[#1E2E48] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {cm.label}
                </button>
              ))}
            </div>
          </div>

          {/* Generation Instruction Prompt Section */}
          <div className="space-y-2 pt-2 border-t border-[#1C2C42]">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#31AAA9]" />
                Motion Prompt
              </label>
              <span className="text-[10px] text-emerald-400 font-semibold">Pure Display</span>
            </div>

            <input
              type="text"
              value={userInstruction}
              onChange={(e) => setUserInstruction(e.target.value)}
              placeholder="e.g. Saper moto animated / Choloman animation"
              className="w-full bg-[#101826] border border-[#22334A] focus:border-[#31AAA9] text-xs text-slate-200 rounded-lg px-3 py-2 outline-none transition-colors"
            />

            {/* Quick Motion Style Chips */}
            <div className="flex flex-wrap gap-1">
              <button
                type="button"
                onClick={() => {
                  setUserInstruction('Choloman continuous wave animation video across all step cards');
                  setIncludeArtwork(true);
                  setIncludeSnake(false);
                  if (onChangeContinuousMotion) onChangeContinuousMotion('wave_flow');
                  if (onGenerateFromReference) onGenerateFromReference();
                }}
                className={`text-[10px] px-2 py-1 rounded-md border font-medium transition-all ${
                  (continuousMotion || 'wave_flow') === 'wave_flow'
                    ? 'bg-emerald-900/60 border-emerald-400 text-emerald-300 font-bold shadow-sm'
                    : 'bg-[#121B2B] border-[#1E2D44] text-slate-400 hover:text-slate-200'
                }`}
              >
                🌊 চলমান ওয়েভ ভিডিও
              </button>

              <button
                type="button"
                onClick={() => {
                  setUserInstruction('Sequential active step spotlight continuous video presentation');
                  setIncludeArtwork(true);
                  setIncludeSnake(false);
                  if (onChangeContinuousMotion) onChangeContinuousMotion('spotlight_carousel');
                  if (onGenerateFromReference) onGenerateFromReference();
                }}
                className={`text-[10px] px-2 py-1 rounded-md border font-medium transition-all ${
                  continuousMotion === 'spotlight_carousel'
                    ? 'bg-emerald-900/60 border-emerald-400 text-emerald-300 font-bold shadow-sm'
                    : 'bg-[#121B2B] border-[#1E2D44] text-slate-400 hover:text-slate-200'
                }`}
              >
                🎬 চলমান স্টেপ স্পটলাইট
              </button>

              <button
                type="button"
                onClick={() => {
                  setUserInstruction('Cinematic slow motion continuous video (0.5x Slow Video)');
                  setIncludeArtwork(true);
                  setIncludeSnake(false);
                  setSettings((s) => ({ ...s, speed: 0.5 }));
                  if (onGenerateFromReference) onGenerateFromReference();
                }}
                className={`text-[10px] px-2 py-1 rounded-md border font-medium transition-all ${
                  settings.speed === 0.5
                    ? 'bg-[#183446] border-amber-400 text-amber-300 shadow-sm'
                    : 'bg-[#121B2B] border-[#1E2D44] text-slate-400 hover:text-slate-200'
                }`}
              >
                🐢 চলমান স্লো মোশন (0.5x)
              </button>

              <button
                type="button"
                onClick={() => {
                  setUserInstruction('Cinematic slow motion animation of reference graphic with gentle kinetic float (0.5x Slow Video)');
                  setIncludeArtwork(true);
                  setIncludeSnake(false);
                  setSettings((s) => ({ ...s, speed: 0.5 }));
                  if (onGenerateFromReference) onGenerateFromReference();
                }}
                className={`text-[10px] px-2 py-1 rounded-md border font-medium transition-all ${
                  settings.speed === 0.5
                    ? 'bg-[#183446] border-amber-400 text-amber-300 shadow-sm'
                    : 'bg-[#121B2B] border-[#1E2D44] text-slate-400 hover:text-slate-200'
                }`}
              >
                🐢 Slow Video (0.5x Slow Motion)
              </button>

              <button
                type="button"
                onClick={() => {
                  setUserInstruction('Reference graphic with dynamic chromatic glowing snake trim-path stream');
                  setIncludeArtwork(true);
                  setIncludeSnake(true);
                }}
                className={`text-[10px] px-2 py-1 rounded-md border font-medium transition-all ${
                  includeSnake && includeArtwork
                    ? 'bg-[#183446] border-[#31AAA9] text-[#31AAA9]'
                    : 'bg-[#121B2B] border-[#1E2D44] text-slate-400 hover:text-slate-200'
                }`}
              >
                🐍 Reference + Snake Stream
              </button>
            </div>
          </div>

          {/* Action Buttons: 1.0x Normal Speed vs 0.5x Slow Video */}
          <div className="space-y-2 pt-2">
            <button
              onClick={() => {
                setSettings((s) => ({ ...s, speed: 1.0 }));
                if (onGenerateFromReference) {
                  onGenerateFromReference();
                } else {
                  fileInputRef.current?.click();
                }
              }}
              disabled={isGenerating}
              className={`w-full py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all ${
                isGenerating
                  ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-[#31AAA9] to-[#258584] hover:from-[#38BDBD] hover:to-[#2CA1A0] text-white shadow-[#31AAA9]/30 hover:shadow-[#31AAA9]/50 active:scale-[0.99] border border-[#48C3C2]/40'
              }`}
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Synthesizing Multi-Part Motion...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-white" />
                  <span>Animate Reference (1.0x Normal)</span>
                </>
              )}
            </button>

            {/* Dedicated Slow Video Button */}
            <button
              onClick={() => {
                setSettings((s) => ({ ...s, speed: 0.5 }));
                setUserInstruction('Cinematic slow motion animation of reference graphic (0.5x Slow Motion)');
                if (onGenerateFromReference) {
                  onGenerateFromReference();
                } else {
                  fileInputRef.current?.click();
                }
              }}
              disabled={isGenerating}
              className="w-full py-2.5 px-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 bg-[#172538] hover:bg-[#1E324B] text-amber-300 border border-amber-500/30 transition-all shadow-sm active:scale-[0.99]"
            >
              <Clock className="w-4 h-4 text-amber-400" />
              <span>🐢 Generate Slow Video (0.5x)</span>
            </button>

            {/* Direct Render & Export MP4 Button */}
            <button
              onClick={onGenerateVideo}
              disabled={isGenerating}
              className="w-full py-2.5 px-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 bg-[#121E30] hover:bg-[#1A2C44] text-[#31AAA9] border border-[#203652] transition-all shadow-sm active:scale-[0.99]"
            >
              <Video className="w-4 h-4 text-[#31AAA9]" />
              <span>Render & Export MP4 File</span>
            </button>
          </div>
        </div>

        {/* Section 2: Background Selector (White is DEFAULT) */}
        <div className="space-y-2 pt-2 border-t border-[#182436]">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-[#31AAA9]" />
              Background
            </label>
            <span className="text-[10px] text-slate-400 font-medium">Default: White</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setSettings((s) => ({ ...s, background: 'white' }))}
              className={`p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-between transition-all ${
                settings.background === 'white'
                  ? 'border-[#31AAA9] bg-[#16273B] text-white shadow-sm'
                  : 'border-[#1E2E46] bg-[#101826] text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-white border border-slate-300" />
                <span>White</span>
              </div>
              {settings.background === 'white' && <Check className="w-3.5 h-3.5 text-[#31AAA9]" />}
            </button>

            <button
              onClick={() => setSettings((s) => ({ ...s, background: 'green' }))}
              className={`p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-between transition-all ${
                settings.background === 'green'
                  ? 'border-[#31AAA9] bg-[#16273B] text-white shadow-sm'
                  : 'border-[#1E2E46] bg-[#101826] text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-[#00FF00]" />
                <span>Green Screen</span>
              </div>
              {settings.background === 'green' && <Check className="w-3.5 h-3.5 text-[#31AAA9]" />}
            </button>

            <button
              onClick={() => setSettings((s) => ({ ...s, background: 'transparent', format: 'webm_transparent' }))}
              className={`p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-between transition-all ${
                settings.background === 'transparent'
                  ? 'border-[#31AAA9] bg-[#16273B] text-white shadow-sm'
                  : 'border-[#1E2E46] bg-[#101826] text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-[repeating-conic-gradient(#808080_0%_25%,#fff_0%_50%)] [background-size:6px_6px]" />
                <span>Transparent</span>
              </div>
              {settings.background === 'transparent' && <Check className="w-3.5 h-3.5 text-[#31AAA9]" />}
            </button>

            <button
              onClick={() => setSettings((s) => ({ ...s, background: 'custom', customColor: '#0F172A' }))}
              className={`p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-between transition-all ${
                settings.background === 'custom'
                  ? 'border-[#31AAA9] bg-[#16273B] text-white shadow-sm'
                  : 'border-[#1E2E46] bg-[#101826] text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-[#0F172A] border border-slate-700" />
                <span>Dark Slate</span>
              </div>
              {settings.background === 'custom' && <Check className="w-3.5 h-3.5 text-[#31AAA9]" />}
            </button>
          </div>
        </div>

        {/* Section 3: Video Motion Speed, Resolution & FPS */}
        <div className="space-y-3 pt-2 border-t border-[#182436]">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#31AAA9]" />
              Video Settings
            </label>
          </div>

          {/* Speed Selector */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Motion Speed:</span>
            <div className="flex items-center gap-1 bg-[#131F32] p-1 rounded-lg border border-[#1E2E48]">
              {[
                { label: '0.25x', val: 0.25 },
                { label: '0.5x Slow', val: 0.5 },
                { label: '1.0x Normal', val: 1.0 },
              ].map((item) => (
                <button
                  key={item.val}
                  onClick={() => setSettings((s) => ({ ...s, speed: item.val }))}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                    (settings.speed || 1.0) === item.val
                      ? item.val < 1.0
                        ? 'bg-amber-500 text-slate-900 font-bold'
                        : 'bg-[#31AAA9] text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Duration */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Duration:</span>
            <div className="flex items-center gap-1 bg-[#131F32] p-1 rounded-lg border border-[#1E2E48]">
              {[5, 10, 15, 20].map((dur) => (
                <button
                  key={dur}
                  onClick={() => setSettings((s) => ({ ...s, duration: dur }))}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                    settings.duration === dur
                      ? 'bg-[#31AAA9] text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {dur}s
                </button>
              ))}
            </div>
          </div>

          {/* Resolution */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Resolution:</span>
            <div className="flex items-center gap-1 bg-[#131F32] p-1 rounded-lg border border-[#1E2E48]">
              {(['720p', '1080p', '4k'] as ResolutionPreset[]).map((res) => (
                <button
                  key={res}
                  onClick={() => setSettings((s) => ({ ...s, resolution: res }))}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium uppercase transition-colors ${
                    settings.resolution === res
                      ? 'bg-[#31AAA9] text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {res}
                </button>
              ))}
            </div>
          </div>

          {/* FPS */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Frame Rate:</span>
            <div className="flex items-center gap-1 bg-[#131F32] p-1 rounded-lg border border-[#1E2E48]">
              {[24, 30, 60].map((fps) => (
                <button
                  key={fps}
                  onClick={() => setSettings((s) => ({ ...s, fps }))}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                    settings.fps === fps
                      ? 'bg-[#31AAA9] text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {fps} fps
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
