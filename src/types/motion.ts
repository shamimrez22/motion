export type BackgroundType = 'white' | 'green' | 'transparent' | 'custom';

export type AspectRatioType = '16:9' | '9:16' | '1:1';

export type ResolutionPreset = '720p' | '1080p' | '4k';

export type ExportFormat = 'mp4' | 'webm_transparent';

export interface ColorPalette {
  primary: string;
  secondary?: string;
  accent: string;
  background: string;
  text?: string;
  neutral?: string;
}

export type LayerType =
  | 'container'
  | 'button'
  | 'icon'
  | 'text'
  | 'cursor'
  | 'chart_bar'
  | 'progress_ring'
  | 'path_trajectory'
  | 'particle_emitter'
  | 'device_frame'
  | 'floating_item'
  | 'message_bubble'
  | 'reference_hero_graphic'
  | 'infinity_snake_stream'
  | 'snake_path';

export interface LayerBounds {
  x: number; // 0 - 100% of canvas width
  y: number; // 0 - 100% of canvas height
  width: number; // 0 - 100%
  height: number; // 0 - 100%
}

export interface LayerStyling {
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  borderRadius?: number;
  text?: string;
  fontSize?: number;
  iconType?: string; // e.g. 'thumbs_up', 'bell', 'mail', 'check', 'arrow', 'chart', 'phone'
  glowColor?: string;
  glowBlur?: number;
  opacity?: number;
  textColor?: string;
  subText?: string;
  secondaryFill?: string;
}

export interface LayerAnimation {
  entrance: {
    type: 'slide_up' | 'slide_down' | 'slide_left' | 'slide_right' | 'pop_spring' | 'fade' | 'draw_stroke' | 'none';
    startTime: number;
    duration: number;
  };
  loop?: {
    type: 'pulse' | 'bell_ring' | 'bounce' | 'float' | 'orbit' | 'glow_sweep' | 'bar_grow' | 'orbit_dash' | 'snake_slither' | 'sine_wave' | 'wave' | 'spotlight' | 'camera_glide' | 'none';
    speed?: number;
    amplitude?: number;
  };
  interaction?: {
    triggerTime: number;
    action: 'click_burst' | 'color_morph' | 'bell_vibrate' | 'fly_across' | 'text_change' | 'none';
    targetValue?: string;
  };
}

export interface AnimationLayer {
  id: string;
  name: string;
  type: LayerType;
  layerOrder: number;
  bounds: LayerBounds;
  styling: LayerStyling;
  animation: LayerAnimation;
  customRenderKey?: string;
  sourceCrop?: LayerBounds; // Exact percentage crop [x, y, width, height] from uploaded reference image
  useImageCutout?: boolean; // When true, renders the exact cropped visual slice of user's uploaded image
  imageCutoutDataUrl?: string; // Sliced base64 image sprite of this specific element
  hidden?: boolean; // When true, layer is hidden from display & rendering
}

export type ContinuousMotionType =
  | 'wave_flow' // Continuous fluid undulating wave across cards
  | 'spotlight_carousel' // Sequential step spotlight with elevation and shine
  | 'camera_pan' // Continuous horizontal camera glide & tracking
  | 'energy_signal' // Continuous glowing laser signal flowing through connector lines
  | 'ambient_float'; // Smooth floating breathing

export interface AnimationPlan {
  title: string;
  category: 'youtube_interaction' | 'device_multiscreen' | 'chart_analytics' | 'neon_tech' | 'notification_badge' | 'custom_motion';
  palette: ColorPalette;
  aspectRatio: AspectRatioType;
  recommendedDuration: number;
  description?: string;
  layers: AnimationLayer[];
  referenceImageDataUrl?: string; // Full original reference image data URL
  referenceFidelity?: 'exact_image_cutout' | 'hybrid_motion' | 'vector_interpretation';
  continuousMotionMode?: ContinuousMotionType;
}

export interface ExportSettings {
  duration: number; // seconds
  fps: number; // 24, 30, 60
  resolution: ResolutionPreset;
  aspectRatio: AspectRatioType;
  background: BackgroundType;
  customColor: string;
  format: ExportFormat;
  speed?: number; // 1.0 = normal speed, 0.5 = slow motion video, 0.25 = super slow
  continuousMotionMode?: ContinuousMotionType;
}

export interface ApiKeySlot {
  id: number; // 1 - 10
  label: string;
  key: string;
  status: 'unconfigured' | 'testing' | 'valid' | 'invalid' | 'quota_exceeded';
  models: string[];
  latencyMs?: number;
  lastTested?: number;
  errorMsg?: string;
}

export interface RenderProgress {
  isRendering: boolean;
  currentFrame: number;
  totalFrames: number;
  percentage: number;
  etaSeconds: number;
  statusText: string;
  error?: string;
  downloadUrl?: string;
  fileName?: string;
  fileSizeBytes?: number;
  actualDurationSeconds?: number;
  verifiedPlayable?: boolean;
  fileSignatureHex?: string;
  codecUsed?: string;
}
