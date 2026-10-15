import { AnimationPlan, AnimationLayer, ColorPalette } from '../types/motion';

export type PartDecompositionType =
  | 'auto'
  | 'step_cards_4' // 4 Step Process Cards (Step 01, Step 02, Step 03, Step 04) - NO center box!
  | 'step_cards_3' // 3 Step Process Cards
  | 'step_cards_5' // 5 Step Process Cards
  | 'infographic_9part' // Central Hub + 8 Ribbon Branches (Only for Screenshot 3 style hub diagrams)
  | 'semantic_5part' // Center Core + Top + Left + Right + Base
  | 'grid_6part' // 6-Part Grid
  | 'quadrant_4part' // 4 Quadrants
  | 'single_hero'; // Whole uncut graphic

export interface LocalAnalysisOptions {
  mode?: 'auto' | 'snake_motion' | 'hero_and_snake' | 'pure_hero' | 'chart_motion' | 'particle_motion';
  userInstruction?: string;
  includeArtwork?: boolean;
  decompositionMode?: PartDecompositionType;
}

/**
 * Intelligent Decomposition Engine: Slices any uploaded reference image or diagram
 * into distinct, independently animated motion graphic layers.
 * ZERO UNWANTED BOXES in the middle: Clean, pure, authentic step cards.
 */
export function buildDecomposedParts(
  dataUrl: string,
  imgWidth: number,
  imgHeight: number,
  mode: PartDecompositionType = 'auto',
  primaryColor: string = '#00E5FF',
  userInstruction: string = ''
): { layers: AnimationLayer[]; activeMode: PartDecompositionType } {
  const instruction = userInstruction.toLowerCase();
  const aspect = imgWidth / (imgHeight || 1);

  // Determine active decomposition mode
  let activeMode: PartDecompositionType = mode;
  if (mode === 'auto') {
    if (
      instruction.includes('hub') ||
      instruction.includes('circle') ||
      instruction.includes('ribbon') ||
      instruction.includes('screenshot 3') ||
      instruction.includes('screenshot_3')
    ) {
      activeMode = 'infographic_9part';
    } else if (instruction.includes('4 step') || instruction.includes('4 card')) {
      activeMode = 'step_cards_4';
    } else if (instruction.includes('3 step') || instruction.includes('3 card')) {
      activeMode = 'step_cards_3';
    } else if (instruction.includes('5 step') || instruction.includes('5 card')) {
      activeMode = 'step_cards_5';
    } else if (instruction.includes('grid') || instruction.includes('tile')) {
      activeMode = 'grid_6part';
    } else if (instruction.includes('quadrant') || instruction.includes('corner')) {
      activeMode = 'quadrant_4part';
    } else {
      // DEFAULT: 100% INTACT COMPLETE GRAPHIC!
      // "SOB VIDEO TOMARE JETA DICI EITER MOTO HOBE" - NO slicing into 4 swinging strips!
      activeMode = 'single_hero';
    }
  }

  const layers: AnimationLayer[] = [];

  // Canvas fitting (16:9 virtual artboard)
  const canvasRatio = 16 / 9;
  let fullW = 90;
  let fullH = (fullW / aspect) * canvasRatio;
  if (fullH > 84) {
    fullH = 84;
    fullW = (fullH * aspect) / canvasRatio;
  }
  const fullX = (100 - fullW) / 2;
  const fullY = (100 - fullH) / 2;

  switch (activeMode) {
    // 1. 4-STEP HORIZONTAL PROCESS CARDS (Step 01, Step 02, Step 03, Step 04)
    // NO CENTER BOX! Completely removes the box in the middle.
    case 'step_cards_4': {
      const stepCount = 4;
      const cardWidthPct = 100 / stepCount; // 25% of image width

      for (let i = 0; i < stepCount; i++) {
        const cropX = i * cardWidthPct;
        const bx = fullX + (cropX / 100) * fullW;
        const bw = (cardWidthPct / 100) * fullW;
        const by = fullY;
        const bh = fullH;

        layers.push({
          id: `step_card_${i + 1}`,
          name: `Step 0${i + 1} Process Card`,
          type: 'reference_hero_graphic',
          layerOrder: i + 1,
          bounds: { x: bx, y: by, width: bw, height: bh },
          useImageCutout: true,
          imageCutoutDataUrl: dataUrl,
          sourceCrop: { x: cropX, y: 0, width: cardWidthPct, height: 100 },
          styling: {
            stroke: 'transparent',
            strokeWidth: 0,
            borderRadius: 0,
          },
          animation: {
            entrance: { type: 'slide_up', startTime: 0.15 + i * 0.3, duration: 0.8 },
            loop: { type: 'camera_glide', speed: 0.8, amplitude: 0.02 },
          },
        });
      }
      break;
    }

    // 2. 3-STEP HORIZONTAL PROCESS CARDS
    case 'step_cards_3': {
      const stepCount = 3;
      const cardWidthPct = 100 / stepCount;

      for (let i = 0; i < stepCount; i++) {
        const cropX = i * cardWidthPct;
        const bx = fullX + (cropX / 100) * fullW;
        const bw = (cardWidthPct / 100) * fullW;
        const by = fullY;
        const bh = fullH;

        layers.push({
          id: `step_card_${i + 1}`,
          name: `Step 0${i + 1} Card`,
          type: 'reference_hero_graphic',
          layerOrder: i + 1,
          bounds: { x: bx, y: by, width: bw, height: bh },
          useImageCutout: true,
          imageCutoutDataUrl: dataUrl,
          sourceCrop: { x: cropX, y: 0, width: cardWidthPct, height: 100 },
          styling: { stroke: 'transparent', strokeWidth: 0, borderRadius: 0 },
          animation: {
            entrance: { type: 'slide_up', startTime: 0.2 + i * 0.35, duration: 0.8 },
            loop: { type: 'wave', speed: 1.0, amplitude: 0.05 },
          },
        });
      }
      break;
    }

    // 3. 5-STEP HORIZONTAL PROCESS CARDS
    case 'step_cards_5': {
      const stepCount = 5;
      const cardWidthPct = 100 / stepCount;

      for (let i = 0; i < stepCount; i++) {
        const cropX = i * cardWidthPct;
        const bx = fullX + (cropX / 100) * fullW;
        const bw = (cardWidthPct / 100) * fullW;
        const by = fullY;
        const bh = fullH;

        layers.push({
          id: `step_card_${i + 1}`,
          name: `Step 0${i + 1} Card`,
          type: 'reference_hero_graphic',
          layerOrder: i + 1,
          bounds: { x: bx, y: by, width: bw, height: bh },
          useImageCutout: true,
          imageCutoutDataUrl: dataUrl,
          sourceCrop: { x: cropX, y: 0, width: cardWidthPct, height: 100 },
          styling: { stroke: 'transparent', strokeWidth: 0, borderRadius: 0 },
          animation: {
            entrance: { type: 'slide_up', startTime: 0.15 + i * 0.25, duration: 0.8 },
            loop: { type: 'wave', speed: 1.0, amplitude: 0.05 },
          },
        });
      }
      break;
    }

    // 4. RADIAL HUB & 8 BRANCHES (Only used when explicit hub/Screenshot 3 is loaded)
    case 'infographic_9part': {
      layers.push({
        id: 'part_center_hub',
        name: 'Central Core Hub',
        type: 'reference_hero_graphic',
        layerOrder: 10,
        bounds: { x: 35.5, y: 16, width: 29, height: 68 },
        useImageCutout: true,
        imageCutoutDataUrl: dataUrl,
        sourceCrop: { x: 35.5, y: 16, width: 29, height: 68 },
        styling: {
          stroke: 'transparent',
          strokeWidth: 0,
          borderRadius: 0,
        },
        animation: {
          entrance: { type: 'pop_spring', startTime: 0.1, duration: 0.9 },
          loop: { type: 'pulse', speed: 0.6, amplitude: 0.015 },
        },
      });

      const leftBranches = [
        { id: 'part_left_1', name: 'Left Branch 1 (01)', y: 8.5, h: 21.5, start: 0.35, speed: 0.45 },
        { id: 'part_left_2', name: 'Left Branch 2 (02)', y: 28.5, h: 21.0, start: 0.60, speed: 0.52 },
        { id: 'part_left_3', name: 'Left Branch 3 (03)', y: 48.5, h: 21.0, start: 0.85, speed: 0.58 },
        { id: 'part_left_4', name: 'Left Branch 4 (04)', y: 68.5, h: 23.0, start: 1.10, speed: 0.64 },
      ];

      leftBranches.forEach((b, idx) => {
        layers.push({
          id: b.id,
          name: b.name,
          type: 'reference_hero_graphic',
          layerOrder: idx + 2,
          bounds: { x: 2, y: b.y, width: 45, height: b.h },
          useImageCutout: true,
          imageCutoutDataUrl: dataUrl,
          sourceCrop: { x: 2, y: b.y, width: 45, height: b.h },
          styling: { stroke: 'transparent', strokeWidth: 0, borderRadius: 0 },
          animation: {
            entrance: { type: 'slide_left', startTime: b.start, duration: 0.75 },
            loop: { type: 'float', speed: b.speed, amplitude: 0.012 },
          },
        });
      });

      const rightBranches = [
        { id: 'part_right_1', name: 'Right Branch 1 (05)', y: 8.5, h: 21.5, start: 0.45, speed: 0.48 },
        { id: 'part_right_2', name: 'Right Branch 2 (06)', y: 28.5, h: 21.0, start: 0.70, speed: 0.55 },
        { id: 'part_right_3', name: 'Right Branch 3 (07)', y: 48.5, h: 21.0, start: 0.95, speed: 0.62 },
        { id: 'part_right_4', name: 'Right Branch 4 (08)', y: 68.5, h: 23.0, start: 1.20, speed: 0.68 },
      ];

      rightBranches.forEach((b, idx) => {
        layers.push({
          id: b.id,
          name: b.name,
          type: 'reference_hero_graphic',
          layerOrder: idx + 6,
          bounds: { x: 53, y: b.y, width: 45, height: b.h },
          useImageCutout: true,
          imageCutoutDataUrl: dataUrl,
          sourceCrop: { x: 53, y: b.y, width: 45, height: b.h },
          styling: { stroke: 'transparent', strokeWidth: 0, borderRadius: 0 },
          animation: {
            entrance: { type: 'slide_right', startTime: b.start, duration: 0.75 },
            loop: { type: 'float', speed: b.speed, amplitude: 0.012 },
          },
        });
      });
      break;
    }

    // 5. 5-PART SEMANTIC
    case 'semantic_5part': {
      layers.push({
        id: 'part_core_center',
        name: 'Center Core Subject',
        type: 'reference_hero_graphic',
        layerOrder: 5,
        bounds: { x: 25, y: 22, width: 50, height: 56 },
        useImageCutout: true,
        imageCutoutDataUrl: dataUrl,
        sourceCrop: { x: 25, y: 22, width: 50, height: 56 },
        styling: { stroke: 'transparent', strokeWidth: 0, borderRadius: 0 },
        animation: {
          entrance: { type: 'pop_spring', startTime: 0.15, duration: 0.85 },
          loop: { type: 'pulse', speed: 0.7, amplitude: 0.018 },
        },
      });

      layers.push({
        id: 'part_top_header',
        name: 'Top Header / Upper Section',
        type: 'reference_hero_graphic',
        layerOrder: 2,
        bounds: { x: 10, y: 4, width: 80, height: 20 },
        useImageCutout: true,
        imageCutoutDataUrl: dataUrl,
        sourceCrop: { x: 10, y: 4, width: 80, height: 20 },
        styling: { stroke: 'transparent', strokeWidth: 0, borderRadius: 0 },
        animation: {
          entrance: { type: 'slide_down', startTime: 0.35, duration: 0.75 },
          loop: { type: 'float', speed: 0.5, amplitude: 0.012 },
        },
      });

      layers.push({
        id: 'part_left_wing',
        name: 'Left Wing / Element',
        type: 'reference_hero_graphic',
        layerOrder: 3,
        bounds: { x: 5, y: 22, width: 22, height: 56 },
        useImageCutout: true,
        imageCutoutDataUrl: dataUrl,
        sourceCrop: { x: 5, y: 22, width: 22, height: 56 },
        styling: { stroke: 'transparent', strokeWidth: 0, borderRadius: 0 },
        animation: {
          entrance: { type: 'slide_left', startTime: 0.55, duration: 0.75 },
          loop: { type: 'float', speed: 0.6, amplitude: 0.014 },
        },
      });

      layers.push({
        id: 'part_right_wing',
        name: 'Right Wing / Element',
        type: 'reference_hero_graphic',
        layerOrder: 4,
        bounds: { x: 73, y: 22, width: 22, height: 56 },
        useImageCutout: true,
        imageCutoutDataUrl: dataUrl,
        sourceCrop: { x: 73, y: 22, width: 22, height: 56 },
        styling: { stroke: 'transparent', strokeWidth: 0, borderRadius: 0 },
        animation: {
          entrance: { type: 'slide_right', startTime: 0.75, duration: 0.75 },
          loop: { type: 'float', speed: 0.65, amplitude: 0.014 },
        },
      });

      layers.push({
        id: 'part_bottom_base',
        name: 'Bottom Base / Footer',
        type: 'reference_hero_graphic',
        layerOrder: 1,
        bounds: { x: 10, y: 76, width: 80, height: 20 },
        useImageCutout: true,
        imageCutoutDataUrl: dataUrl,
        sourceCrop: { x: 10, y: 76, width: 80, height: 20 },
        styling: { stroke: 'transparent', strokeWidth: 0, borderRadius: 0 },
        animation: {
          entrance: { type: 'slide_up', startTime: 0.95, duration: 0.75 },
          loop: { type: 'bounce', speed: 0.45, amplitude: 0.01 },
        },
      });
      break;
    }

    // 6. 6-PART GRID
    case 'grid_6part': {
      const gridItems = [
        { id: 'grid_r1_c1', name: 'Top-Left Segment', bx: 6, by: 10, cx: 0, cy: 0, entrance: 'slide_left', start: 0.2 },
        { id: 'grid_r1_c2', name: 'Top-Center Segment', bx: 36, by: 10, cx: 33.3, cy: 0, entrance: 'slide_down', start: 0.4 },
        { id: 'grid_r1_c3', name: 'Top-Right Segment', bx: 66, by: 10, cx: 66.6, cy: 0, entrance: 'slide_right', start: 0.6 },
        { id: 'grid_r2_c1', name: 'Bottom-Left Segment', bx: 6, by: 52, cx: 0, cy: 50, entrance: 'slide_left', start: 0.8 },
        { id: 'grid_r2_c2', name: 'Bottom-Center Segment', bx: 36, by: 52, cx: 33.3, cy: 50, entrance: 'slide_up', start: 1.0 },
        { id: 'grid_r2_c3', name: 'Bottom-Right Segment', bx: 66, by: 52, cx: 66.6, cy: 50, entrance: 'slide_right', start: 1.2 },
      ];

      gridItems.forEach((g, idx) => {
        layers.push({
          id: g.id,
          name: g.name,
          type: 'reference_hero_graphic',
          layerOrder: idx + 1,
          bounds: { x: g.bx, y: g.by, width: 28, height: 38 },
          useImageCutout: true,
          imageCutoutDataUrl: dataUrl,
          sourceCrop: { x: g.cx, y: g.cy, width: 33.4, height: 50 },
          styling: { stroke: 'transparent', strokeWidth: 0, borderRadius: 0 },
          animation: {
            entrance: { type: g.entrance as any, startTime: g.start, duration: 0.75 },
            loop: { type: 'float', speed: 0.45 + idx * 0.07, amplitude: 0.012 },
          },
        });
      });
      break;
    }

    // 7. 4 QUADRANTS
    case 'quadrant_4part': {
      const quads = [
        { id: 'quad_tl', name: 'Top-Left Quadrant', bx: 8, by: 10, cx: 0, cy: 0, start: 0.2 },
        { id: 'quad_tr', name: 'Top-Right Quadrant', bx: 51, by: 10, cx: 50, cy: 0, start: 0.45 },
        { id: 'quad_bl', name: 'Bottom-Left Quadrant', bx: 8, by: 51, cx: 0, cy: 50, start: 0.7 },
        { id: 'quad_br', name: 'Bottom-Right Quadrant', bx: 51, by: 51, cx: 50, cy: 50, start: 0.95 },
      ];

      quads.forEach((q, idx) => {
        layers.push({
          id: q.id,
          name: q.name,
          type: 'reference_hero_graphic',
          layerOrder: idx + 1,
          bounds: { x: q.bx, y: q.by, width: 41, height: 39 },
          useImageCutout: true,
          imageCutoutDataUrl: dataUrl,
          sourceCrop: { x: q.cx, y: q.cy, width: 50, height: 50 },
          styling: { stroke: 'transparent', strokeWidth: 0, borderRadius: 0 },
          animation: {
            entrance: { type: 'pop_spring', startTime: q.start, duration: 0.8 },
            loop: { type: 'float', speed: 0.5 + idx * 0.08, amplitude: 0.015 },
          },
        });
      });
      break;
    }

    // 8. WHOLE UNCUT GRAPHIC
    case 'single_hero':
    default: {
      const imgAspect = aspect || 1;
      let bw = 70;
      let bh = 70;
      if (imgAspect >= 1) {
        bw = Math.min(88, 70 * Math.min(1.4, imgAspect));
        bh = bw / imgAspect;
        if (bh > 84) {
          bh = 84;
          bw = bh * imgAspect;
        }
      } else {
        bh = Math.min(88, 70 / Math.min(1.4, 1 / imgAspect));
        bw = bh * imgAspect;
        if (bw > 88) {
          bw = 88;
          bh = bw / imgAspect;
        }
      }
      const bx = Math.max(4, (100 - bw) / 2);
      const by = Math.max(4, (100 - bh) / 2);

      layers.push({
        id: 'ae_hero_graphic',
        name: 'Reference Graphic (Hero Subject)',
        type: 'reference_hero_graphic',
        layerOrder: 1,
        bounds: { x: bx, y: by, width: bw, height: bh },
        useImageCutout: true,
        imageCutoutDataUrl: dataUrl,
        sourceCrop: { x: 0, y: 0, width: 100, height: 100 },
        styling: {
          stroke: 'transparent',
          strokeWidth: 0,
          borderRadius: 0,
        },
        animation: {
          entrance: { type: 'pop_spring', startTime: 0.2, duration: 1.0 },
          loop: { type: 'float', speed: 0.8, amplitude: 0.015 },
        },
      });
      break;
    }
  }

  return { layers, activeMode };
}

/**
 * Synthesizes an AnimationPlan directly from an image Data URL
 */
export async function synthesizePlanFromDataUrl(
  dataUrl: string,
  title: string,
  options: LocalAnalysisOptions = {}
): Promise<AnimationPlan> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const width = img.naturalWidth || 1200;
        const height = img.naturalHeight || 600;
        const primaryColor = '#00B4D8';
        const secondaryColor = '#023E8A';
        const accentColor = '#F59E0B';

        const palette: ColorPalette = {
          primary: primaryColor,
          secondary: secondaryColor,
          accent: accentColor,
          background: '#FFFFFF',
          text: '#0F172A',
        };

        const { layers } = buildDecomposedParts(
          dataUrl,
          width,
          height,
          options.decompositionMode || 'auto',
          primaryColor,
          options.userInstruction || ''
        );

        const plan: AnimationPlan = {
          title: `After Effects: ${title}`,
          category: 'custom_motion',
          aspectRatio: width / height > 1.2 ? '16:9' : height / width > 1.2 ? '9:16' : '1:1',
          recommendedDuration: 10,
          palette,
          description: `Direct motion graphics animation of "${title}" where each part animates individually with zero middle box clutter.`,
          layers,
          referenceImageDataUrl: dataUrl,
          referenceFidelity: 'exact_image_cutout',
        };

        resolve(plan);
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = () => reject(new Error('Failed to load image from dataUrl'));
    img.src = dataUrl;
  });
}

/**
 * Intelligent client-side After Effects motion graphics synthesizer.
 * Dynamically analyzes the reference image and breaks it down into individual parts
 * WITHOUT ANY UNWANTED BOX IN THE MIDDLE.
 */
export async function analyzeImageLocally(
  file: File,
  options: LocalAnalysisOptions = {}
): Promise<AnimationPlan> {
  const fileReader = new FileReader();
  const dataUrlPromise = new Promise<string>((res) => {
    fileReader.onload = () => res(fileReader.result as string);
    fileReader.readAsDataURL(file);
  });
  const dataUrl = await dataUrlPromise;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('Failed to create canvas context for local analysis.');
        }

        const width = img.naturalWidth || 800;
        const height = img.naturalHeight || 450;
        canvas.width = Math.min(width, 400);
        canvas.height = Math.min(height, 225);

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;

        // Color extraction & palette detection from the reference image
        const colorCounts: { [hex: string]: number } = {};

        for (let i = 0; i < data.length; i += 16) {
          const a = data[i + 3];
          if (a > 35) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            const qr = Math.round(r / 24) * 24;
            const qg = Math.round(g / 24) * 24;
            const qb = Math.round(b / 24) * 24;
            const hex = `#${((1 << 24) + (qr << 16) + (qg << 8) + qb).toString(16).slice(1).toUpperCase()}`;
            colorCounts[hex] = (colorCounts[hex] || 0) + 1;
          }
        }

        const sortedColors = Object.entries(colorCounts).sort((a, b) => b[1] - a[1]);
        const primaryColor = sortedColors[0]?.[0] || '#00E5FF';
        const secondaryColor = sortedColors[1]?.[0] || '#6366F1';
        const accentColor = sortedColors[2]?.[0] || '#E000FF';

        const aspectRatio = width / height > 1.2 ? '16:9' : height / width > 1.2 ? '9:16' : '1:1';
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');

        const palette: ColorPalette = {
          primary: primaryColor,
          secondary: secondaryColor,
          accent: accentColor,
          background: '#FFFFFF',
          text: '#0F172A',
        };

        // Decompose the uploaded image into individual parts:
        // Defaults to 4 Step Cards for wide infographics - ZERO BOX IN THE MIDDLE!
        const { layers } = buildDecomposedParts(
          dataUrl,
          width,
          height,
          options.decompositionMode || 'auto',
          primaryColor,
          options.userInstruction || ''
        );

        const plan: AnimationPlan = {
          title: `After Effects: ${cleanName}`,
          category: 'custom_motion',
          aspectRatio,
          recommendedDuration: 10,
          palette,
          description: `After Effects motion graphics synthesized from "${file.name}" with independent animated parts.`,
          layers,
          referenceImageDataUrl: dataUrl,
          referenceFidelity: 'exact_image_cutout',
        };

        URL.revokeObjectURL(objectUrl);
        resolve(plan);
      } catch (err) {
        URL.revokeObjectURL(objectUrl);
        reject(err);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image file for analysis.'));
    };

    img.src = objectUrl;
  });
}
