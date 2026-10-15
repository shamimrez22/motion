import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { LeftSidebar } from './components/LeftSidebar';
import { Artboard } from './components/Artboard';
import { ExportPanel } from './components/ExportPanel';
import { ApiKeyModal } from './components/ApiKeyModal';
import { TestSuiteModal } from './components/TestSuiteModal';
import { PresetsModal } from './components/PresetsModal';
import { AnimationPlan, ExportSettings, ApiKeySlot, RenderProgress, ContinuousMotionType } from './types/motion';
import { SAMPLE_PRESETS } from './data/samplePresets';
import { INFOGRAPHIC_ELEMENTS_SVG_DATA_URL } from './data/infographicSvgData';
import { ApiClient } from './services/apiClient';
import {
  analyzeImageLocally,
  buildDecomposedParts,
  synthesizePlanFromDataUrl,
  PartDecompositionType,
} from './engine/localAnalyzer';
import { VideoExporter, validateVideoPlayback } from './engine/videoExporter';
import { extractFrameFromVideoFile } from './engine/videoReferenceHelper';

export default function App() {
  // 1. Scene & Animation Plan State (Starts NULL: NO pre-baked sample video beforehand)
  // "EIKHANE AGEY SAMPLE KONO VIDEO THAKBE NA - SHUDHU EI IMAGE TAGGE KORE EITER PROTTEKTA PAT ALADA ALA ANIMATION HOBE"
  const [currentPlan, setCurrentPlan] = useState<AnimationPlan | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [uploadedImageName, setUploadedImageName] = useState<string | undefined>(undefined);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [decompositionMode, setDecompositionMode] = useState<PartDecompositionType>('step_cards_4');
  const [continuousMotion, setContinuousMotion] = useState<ContinuousMotionType>('wave_flow');

  // 2. Export & Video Settings (Default: 10s, 30 FPS, 1080p, 16:9, White Background, MP4)
  const [exportSettings, setExportSettings] = useState<ExportSettings>({
    duration: 10,
    fps: 30,
    resolution: '1080p',
    aspectRatio: '16:9',
    background: 'white', // Default is WHITE as required
    customColor: '#1E293B',
    format: 'mp4',
    speed: 1.0,
    continuousMotionMode: 'wave_flow',
  });

  // 3. 10 API Keys Pool State
  const [keySlots, setKeySlots] = useState<ApiKeySlot[]>([]);
  const [activeSlotId, setActiveSlotId] = useState<number>(1);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [selectedModel, setSelectedModel] = useState<string>('gemini-2.5-flash');

  // 4. Modals State
  const [isKeyModalOpen, setIsKeyModalOpen] = useState<boolean>(false);
  const [isTestSuiteOpen, setIsTestSuiteOpen] = useState<boolean>(false);
  const [isPresetsOpen, setIsPresetsOpen] = useState<boolean>(false);

  // 5. Video Rendering & Export State
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [renderProgress, setRenderProgress] = useState<RenderProgress>({
    isRendering: false,
    currentFrame: 0,
    totalFrames: 0,
    percentage: 0,
    etaSeconds: 0,
    statusText: '',
  });

  // Server configuration
  const [hasServerKey, setHasServerKey] = useState<boolean>(false);

  // User Instruction & Pure Display Control
  const [userInstruction, setUserInstruction] = useState<string>(
    'Choloman continuous wave animation video across all step cards'
  );
  const [includeSnake, setIncludeSnake] = useState<boolean>(false);
  const [includeArtwork, setIncludeArtwork] = useState<boolean>(true);

  // Initialize API Keys from storage on mount & check server config
  useEffect(() => {
    const slots = ApiClient.getSlots();
    setKeySlots(slots);
    setActiveSlotId(ApiClient.getActiveSlotId());
    setAutoRotate(ApiClient.isAutoRotateEnabled());

    ApiClient.getServerConfig().then((cfg) => {
      setHasServerKey(cfg.hasServerKey);
    });
  }, []);

  const activeSlot = keySlots.find((s) => s.id === activeSlotId) || {
    id: 1,
    label: 'Primary Key',
    key: '',
    status: 'unconfigured' as const,
    models: [],
  };

  // Helper to apply continuous motion loop onto layers
  const applyContinuousMotionToLayers = (layers: any[], motionMode: ContinuousMotionType) => {
    let loopType: 'wave' | 'spotlight' | 'camera_glide' | 'float' = 'wave';
    if (motionMode === 'spotlight_carousel') loopType = 'spotlight';
    else if (motionMode === 'camera_pan') loopType = 'camera_glide';
    else loopType = 'wave';

    return layers.map((l) => ({
      ...l,
      animation: {
        ...l.animation,
        loop: {
          type: loopType,
          speed: 1.0,
          amplitude: 0.05,
        },
      },
    }));
  };

  // Handle Reference (Image or Video) Upload & Motion Synthesis Pipeline
  const handleImageUploaded = async (file: File) => {
    setUploadedFile(file);
    setUploadedImageName(file.name);
    setIsGenerating(true);
    setCurrentTime(0);

    try {
      const isVideo = file.type.startsWith('video/') || /\.(mp4|webm|mov|mkv)$/i.test(file.name);
      let base64Data: string;
      let mimeType = 'image/png';

      if (isVideo) {
        // Extract vibrant reference frame from uploaded video
        const extracted = await extractFrameFromVideoFile(file);
        base64Data = extracted.dataUrl;
        if (extracted.duration && extracted.duration > 2) {
          setExportSettings((prev) => ({
            ...prev,
            duration: Math.min(15, Math.max(3, Math.round(extracted.duration))),
          }));
        }
      } else {
        // Standard image file reader
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        base64Data = await base64Promise;
        mimeType = file.type || 'image/png';
      }

      // Check if AI analysis is available
      const hasSlotKey = !!(activeSlot.key && activeSlot.key.trim().length > 0);
      const canUseAI = (hasSlotKey || hasServerKey) && selectedModel !== 'local_procedural';

      let plan: AnimationPlan;

      if (canUseAI) {
        const aiResult = await ApiClient.analyzeImage(
          base64Data,
          mimeType,
          selectedModel,
          'motion_graphics',
          userInstruction
        );

        if (aiResult.success && aiResult.animationPlan && aiResult.animationPlan.layers?.length > 0) {
          plan = aiResult.animationPlan;
          plan.referenceImageDataUrl = base64Data;
          plan.referenceFidelity = 'exact_image_cutout';
        } else {
          // Local fallback synthesizer with multi-part decomposition
          plan = await analyzeImageLocally(file, {
            userInstruction,
            includeArtwork,
            decompositionMode,
          });
        }
      } else {
        plan = await analyzeImageLocally(file, {
          userInstruction,
          includeArtwork,
          decompositionMode,
        });
      }

      // Filter out unsolicited dummy buttons or random device frames
      let cleanedLayers = (plan.layers || []).filter((l) => {
        if (l.type === 'path_trajectory') {
          return userInstruction.toLowerCase().includes('orbit') || userInstruction.toLowerCase().includes('trajectory');
        }
        if (l.type === 'button' && (!l.styling?.text || l.styling.text === 'Button' || l.styling.text === 'Subscribe')) {
          return userInstruction.toLowerCase().includes('button') || userInstruction.toLowerCase().includes('subscribe');
        }
        if (l.type === 'container' && !l.styling?.fill?.startsWith('rgba(0,0,0,0') && l.bounds.width > 70 && l.bounds.height > 60) {
          return false;
        }
        return true;
      });

      // Add snake stream ONLY if explicitly requested by user
      const wantsSnake =
        includeSnake &&
        (userInstruction.toLowerCase().includes('saper') ||
          userInstruction.toLowerCase().includes('snake') ||
          userInstruction.toLowerCase().includes('slither'));

      const hasSnakeLayer = cleanedLayers.some(
        (l) => l.type === 'infinity_snake_stream' || l.type === 'snake_path'
      );

      if (wantsSnake && !hasSnakeLayer) {
        cleanedLayers.unshift({
          id: 'ae_snake_light_stream',
          name: 'Glowing Neon Snake Stream',
          type: 'infinity_snake_stream',
          layerOrder: 1,
          bounds: { x: 8, y: 8, width: 84, height: 84 },
          styling: {
            stroke: plan.palette.primary,
            strokeWidth: 6,
            glowColor: plan.palette.primary,
            glowBlur: 28,
            secondaryFill: plan.palette.accent,
          },
          animation: {
            entrance: { type: 'draw_stroke', startTime: 0.1, duration: 1.2 },
            loop: { type: 'snake_slither', speed: 1.2, amplitude: 0.05 },
          },
          hidden: false,
        });
      }

      // Ensure all segmented parts receive the base64Data
      cleanedLayers = cleanedLayers.map((l) =>
        l.type === 'reference_hero_graphic'
          ? {
              ...l,
              hidden: false,
              useImageCutout: true,
              imageCutoutDataUrl: base64Data,
            }
          : l
      );

      // Apply continuous motion (চলমান অ্যানিমেশন)
      const animatedContinuousLayers = applyContinuousMotionToLayers(cleanedLayers, continuousMotion);

      plan.layers = animatedContinuousLayers.length > 0 ? animatedContinuousLayers : plan.layers;
      plan.referenceImageDataUrl = base64Data;
      plan.continuousMotionMode = continuousMotion;
      setCurrentPlan(plan);
    } catch (err: any) {
      console.error('Analysis error:', err);
      const localPlan = await analyzeImageLocally(file, {
        userInstruction,
        includeArtwork,
        decompositionMode,
      });
      setCurrentPlan(localPlan);
    } finally {
      setIsGenerating(false);
      setIsPlaying(true);
    }
  };

  // 1-Click Load Example Reference Graphic (Infographic Screenshot 3)
  const handleLoadSampleGraphic = async (type: 'infographic' | 'tech') => {
    setIsGenerating(true);
    setCurrentTime(0);
    try {
      const plan = await synthesizePlanFromDataUrl(
        INFOGRAPHIC_ELEMENTS_SVG_DATA_URL,
        'Infographic Elements (Screenshot 3)',
        {
          decompositionMode: 'infographic_9part',
          userInstruction,
          includeArtwork: true,
        }
      );
      setUploadedImageName('Infographic_Elements_Screenshot_3.svg');
      setDecompositionMode('infographic_9part');
      plan.continuousMotionMode = continuousMotion;
      plan.layers = applyContinuousMotionToLayers(plan.layers, continuousMotion);
      setCurrentPlan(plan);
      setIsPlaying(true);
    } catch (err) {
      console.error('Failed to load sample graphic:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Change Decomposition Mode on the fly for the active uploaded image
  const handleChangeDecompositionMode = (newMode: PartDecompositionType) => {
    setDecompositionMode(newMode);
    if (!currentPlan || !currentPlan.referenceImageDataUrl) return;

    const { layers } = buildDecomposedParts(
      currentPlan.referenceImageDataUrl,
      1200,
      600,
      newMode,
      currentPlan.palette.primary,
      userInstruction
    );

    const continuousLayers = applyContinuousMotionToLayers(layers, continuousMotion);

    setCurrentPlan((prev) => (prev ? { ...prev, layers: continuousLayers } : null));
    setCurrentTime(0);
  };

  // Change Continuous Motion Style on the fly (চলমান অ্যানিমেশন ভিডিও মোড)
  const handleChangeContinuousMotion = (mode: ContinuousMotionType) => {
    setContinuousMotion(mode);
    setExportSettings((prev) => ({ ...prev, continuousMotionMode: mode }));
    if (!currentPlan) return;

    setCurrentPlan((prev) => {
      if (!prev) return null;
      const continuousLayers = applyContinuousMotionToLayers(prev.layers, mode);
      return {
        ...prev,
        continuousMotionMode: mode,
        layers: continuousLayers,
      };
    });
  };

  // Reset Plan to empty state
  const handleResetPlan = () => {
    setCurrentPlan(null);
    setUploadedFile(null);
    setUploadedImageName(undefined);
  };

  // Handle Generate Animation from Uploaded Reference
  const handleGenerateFromReference = async () => {
    if (uploadedFile) {
      await handleImageUploaded(uploadedFile);
    } else if (currentPlan?.referenceImageDataUrl) {
      handleChangeDecompositionMode(decompositionMode);
    } else {
      handleLoadSampleGraphic('infographic');
    }
  };

  // Focus exclusively on Reference Artwork Graphic
  const handleFocusReferenceArtwork = () => {
    if (!currentPlan) return;
    setIncludeArtwork(true);
    setIncludeSnake(false);
    setCurrentPlan((prev) =>
      prev
        ? {
            ...prev,
            layers: prev.layers.map((l) =>
              l.type === 'reference_hero_graphic'
                ? { ...l, hidden: false }
                : { ...l, hidden: true }
            ),
          }
        : null
    );
  };

  // Toggle layer visibility on Artboard
  const handleToggleLayerVisibility = (layerId: string) => {
    if (!currentPlan) return;
    setCurrentPlan((prev) =>
      prev
        ? {
            ...prev,
            layers: prev.layers.map((l) =>
              l.id === layerId ? { ...l, hidden: !l.hidden } : l
            ),
          }
        : null
    );
  };

  // Remove layer completely from Artboard
  const handleRemoveLayer = (layerId: string) => {
    if (!currentPlan) return;
    setCurrentPlan((prev) =>
      prev
        ? {
            ...prev,
            layers: prev.layers.filter((l) => l.id !== layerId),
          }
        : null
    );
  };

  // Handle Video Rendering and Direct Export
  const handleGenerateVideo = async () => {
    if (!currentPlan) {
      await handleLoadSampleGraphic('infographic');
      return;
    }

    setIsPlaying(false);
    setIsGenerating(true);

    try {
      const result = await VideoExporter.renderAndExport(
        currentPlan,
        exportSettings,
        (progress) => {
          setRenderProgress(progress);
        }
      );

      // Verify playback in HTML5 video
      const playbackCheck = await validateVideoPlayback(result.blob);
      const downloadUrl = URL.createObjectURL(result.blob);

      setRenderProgress({
        isRendering: false,
        currentFrame: Math.round(exportSettings.duration * exportSettings.fps),
        totalFrames: Math.round(exportSettings.duration * exportSettings.fps),
        percentage: 100,
        etaSeconds: 0,
        statusText: 'Encoding complete and verified!',
        downloadUrl,
        fileName: result.fileName,
        fileSizeBytes: result.blob.size,
        verifiedPlayable: playbackCheck.playable,
        fileSignatureHex: result.signatureHex,
        codecUsed: result.format,
      });
    } catch (err: any) {
      console.error('Video export error:', err);
      setRenderProgress({
        isRendering: false,
        currentFrame: 0,
        totalFrames: 0,
        percentage: 0,
        etaSeconds: 0,
        statusText: '',
        error: err?.message || 'Video export failed.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#070B12] text-slate-100 overflow-hidden font-sans">
      {/* Top Header */}
      <Header
        activeSlot={activeSlot}
        onOpenKeyModal={() => setIsKeyModalOpen(true)}
        onOpenTestSuite={() => setIsTestSuiteOpen(true)}
        onOpenPresets={() => setIsPresetsOpen(true)}
      />

      {/* Main Studio Body: Left Sidebar, Centered Artboard, Right Export Panel */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Control Panel */}
        <LeftSidebar
          settings={exportSettings}
          setSettings={setExportSettings}
          onImageUploaded={handleImageUploaded}
          onSelectPreset={(plan) => {
            setCurrentPlan(plan);
            setCurrentTime(0);
            setIsPlaying(true);
          }}
          onGenerateVideo={handleGenerateVideo}
          onGenerateFromReference={handleGenerateFromReference}
          isGenerating={isGenerating}
          selectedModel={selectedModel}
          setSelectedModel={setSelectedModel}
          uploadedImageName={uploadedImageName}
          referenceImageDataUrl={currentPlan?.referenceImageDataUrl}
          userInstruction={userInstruction}
          setUserInstruction={setUserInstruction}
          includeSnake={includeSnake}
          setIncludeSnake={setIncludeSnake}
          includeArtwork={includeArtwork}
          setIncludeArtwork={setIncludeArtwork}
          decompositionMode={decompositionMode}
          onChangeDecompositionMode={handleChangeDecompositionMode}
          continuousMotion={continuousMotion}
          onChangeContinuousMotion={handleChangeContinuousMotion}
        />

        {/* Center Artboard Area */}
        <Artboard
          plan={currentPlan}
          settings={exportSettings}
          currentTime={currentTime}
          setCurrentTime={setCurrentTime}
          isPlaying={isPlaying}
          setIsPlaying={setIsPlaying}
          onToggleLayerVisibility={handleToggleLayerVisibility}
          onRemoveLayer={handleRemoveLayer}
          onFocusReferenceArtwork={handleFocusReferenceArtwork}
          onImageUploaded={handleImageUploaded}
          onLoadSampleGraphic={handleLoadSampleGraphic}
          onResetPlan={handleResetPlan}
          decompositionMode={decompositionMode}
          onChangeDecompositionMode={handleChangeDecompositionMode}
          onChangeSpeed={(spd) => setExportSettings((s) => ({ ...s, speed: spd }))}
          continuousMotion={continuousMotion}
          onChangeContinuousMotion={handleChangeContinuousMotion}
        />

        {/* Right Export Station & Diagnostics Panel */}
        <ExportPanel
          progress={renderProgress}
          settings={exportSettings}
          onClear={() =>
            setRenderProgress({
              isRendering: false,
              currentFrame: 0,
              totalFrames: 0,
              percentage: 0,
              etaSeconds: 0,
              statusText: '',
            })
          }
        />
      </div>

      {/* 10 API Key Pool Modal */}
      <ApiKeyModal
        isOpen={isKeyModalOpen}
        onClose={() => setIsKeyModalOpen(false)}
        slots={keySlots}
        setSlots={setKeySlots}
        activeSlotId={activeSlotId}
        setActiveSlotId={setActiveSlotId}
        autoRotate={autoRotate}
        setAutoRotate={setAutoRotate}
        onSelectModel={(m) => setSelectedModel(m)}
      />

      {/* Interactive Compliance Test Suite Modal */}
      <TestSuiteModal
        isOpen={isTestSuiteOpen}
        onClose={() => setIsTestSuiteOpen(false)}
      />

      {/* Reference Motion Styles Presets Modal */}
      <PresetsModal
        isOpen={isPresetsOpen}
        onClose={() => setIsPresetsOpen(false)}
        onSelectPlan={(plan) => {
          setCurrentPlan(plan);
          setCurrentTime(0);
          setIsPlaying(true);
        }}
        currentPlanTitle={currentPlan?.title || 'No Project Active'}
      />
    </div>
  );
}
