import { AnimationPlan, AnimationLayer, BackgroundType } from '../types/motion';

/**
 * Spring / elastic easing function for realistic pop and bounce
 */
function easeOutBack(x: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
}

function easeInOutCubic(x: number): number {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

function easeOutQuad(x: number): number {
  return 1 - (1 - x) * (1 - x);
}

/**
 * Procedural 2D Motion Graphics Engine for SS ICON MOTION STUDIO.
 * Deterministically renders any scene at exact timestamp `t`.
 */
export class ProceduralEngine {
  private static imageCache: Map<string, HTMLImageElement> = new Map();

  /**
   * Preloads or retrieves an HTMLImageElement for an image data URL
   */
  public static getCachedImage(dataUrl?: string): HTMLImageElement | null {
    if (!dataUrl) return null;
    let img = this.imageCache.get(dataUrl);
    if (!img) {
      img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = dataUrl;
      this.imageCache.set(dataUrl, img);
    }
    return img;
  }
  public static renderFrame(
    ctx: CanvasRenderingContext2D,
    plan: AnimationPlan,
    time: number, // In seconds (0 <= time <= duration)
    width: number,
    height: number,
    background: BackgroundType,
    customColor: string = '#1E293B'
  ) {
    // 1. Background layer
    if (background === 'transparent') {
      // Clear with true alpha transparency
      ctx.clearRect(0, 0, width, height);
    } else {
      ctx.save();
      if (background === 'white') {
        ctx.fillStyle = '#FFFFFF';
      } else if (background === 'green') {
        ctx.fillStyle = '#00FF00'; // Pure chroma green
      } else if (background === 'custom') {
        ctx.fillStyle = customColor;
      }
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    }

    // 2. Sort layers by layerOrder
    const sortedLayers = [...plan.layers].sort((a, b) => a.layerOrder - b.layerOrder);

    // 3. Render each layer
    for (const layer of sortedLayers) {
      if (layer.hidden) continue;
      this.renderLayer(ctx, layer, plan, time, width, height);
    }

    // 4. Continuous Dynamic Flow (চলমান এনার্জি ও লাইট সিগন্যাল)
    const hasSegments = sortedLayers.some(
      (l) => l.sourceCrop && (l.sourceCrop.width < 98 || l.sourceCrop.height < 98)
    );
    if (hasSegments && time > 0.4) {
      this.drawContinuousSignalFlow(ctx, width, height, time, plan);
    }
  }

  /**
   * Continuous glowing light flow packet that races across the steps
   */
  private static drawContinuousSignalFlow(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    time: number,
    plan: AnimationPlan
  ) {
    ctx.save();
    const cycle = (time * 0.4) % 1; // Smooth 2.5s loop
    const px = (0.05 + cycle * 0.9) * width;
    const py = 0.20 * height;

    const rad = 12 + Math.sin(time * 8) * 3;
    const grad = ctx.createRadialGradient(px, py, 2, px, py, rad * 2.2);
    const col = plan.palette?.primary || '#00E5FF';
    grad.addColorStop(0, '#FFFFFF');
    grad.addColorStop(0.3, col);
    grad.addColorStop(1, 'rgba(0, 229, 255, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(px, py, rad * 2.2, 0, Math.PI * 2);
    ctx.fill();

    // Trailing comet tail
    const trailLen = width * 0.09;
    const trailGrad = ctx.createLinearGradient(px - trailLen, py, px, py);
    trailGrad.addColorStop(0, 'rgba(0, 229, 255, 0)');
    trailGrad.addColorStop(1, 'rgba(255, 255, 255, 0.7)');
    ctx.strokeStyle = trailGrad;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(px - trailLen, py);
    ctx.lineTo(px, py);
    ctx.stroke();

    ctx.restore();
  }

  /**
   * Render individual animated layer
   */
  private static renderLayer(
    ctx: CanvasRenderingContext2D,
    layer: AnimationLayer,
    plan: AnimationPlan,
    time: number,
    w: number,
    h: number
  ) {
    const { bounds, animation, styling, type } = layer;

    // Calculate base pixel bounds
    const bx = (bounds.x / 100) * w;
    const by = (bounds.y / 100) * h;
    const bw = (bounds.width / 100) * w;
    const bh = (bounds.height / 100) * h;

    const { entrance, loop, interaction } = animation;

    // Check entrance visibility
    if (time < entrance.startTime) {
      return; // Not yet visible
    }

    const entranceProgress = Math.min(1, Math.max(0, (time - entrance.startTime) / (entrance.duration || 0.001)));
    const easedEntrance = easeOutBack(entranceProgress);

    ctx.save();

    // Transformation calculations
    let transX = bx + bw / 2;
    let transY = by + bh / 2;
    let scaleX = 1;
    let scaleY = 1;
    let alpha = 1;
    let rotation = 0;

    // Handle Entrance Type
    switch (entrance.type) {
      case 'pop_spring':
        scaleX = easedEntrance;
        scaleY = easedEntrance;
        alpha = Math.min(1, entranceProgress * 1.5);
        break;
      case 'slide_up':
        transY += (1 - easeOutQuad(entranceProgress)) * (h * 0.25);
        alpha = easeOutQuad(entranceProgress);
        break;
      case 'slide_down':
        transY -= (1 - easeOutQuad(entranceProgress)) * (h * 0.25);
        alpha = easeOutQuad(entranceProgress);
        break;
      case 'slide_left':
        transX -= (1 - easeOutQuad(entranceProgress)) * (w * 0.25);
        alpha = easeOutQuad(entranceProgress);
        break;
      case 'slide_right':
        transX += (1 - easeOutQuad(entranceProgress)) * (w * 0.25);
        alpha = easeOutQuad(entranceProgress);
        break;
      case 'fade':
        alpha = easeOutQuad(entranceProgress);
        break;
    }

    // Handle Continuous Loop
    // Handle Continuous Motion Loop (চলমান অ্যানিমেশন ভিডিও)
    if (loop && loop.type !== 'none' && entranceProgress >= 1) {
      const loopTime = time - (entrance.startTime + entrance.duration);
      const speed = loop.speed || 1;
      const amp = loop.amplitude || 0.05;

      switch (loop.type) {
        case 'wave': {
          // Continuous undulating fluid wave across cards
          const wavePhase = (layer.layerOrder || 1) * 1.25;
          const waveVal = Math.sin(time * 3.2 * speed - wavePhase);
          transY += waveVal * (bh * 0.045);
          rotation += Math.cos(time * 3.2 * speed - wavePhase) * 0.02;
          scaleX += waveVal * 0.03;
          scaleY += waveVal * 0.03;
          break;
        }

        case 'spotlight': {
          // Sequential continuous spotlight across steps
          const totalCards = 4;
          const cycleDuration = 10;
          const cardSlot = cycleDuration / totalCards;
          const cardIdx = Math.max(0, (layer.layerOrder || 1) - 1);
          const activeIdx = Math.floor((time % cycleDuration) / cardSlot);
          const activeP = ((time % cycleDuration) % cardSlot) / cardSlot;

          if (cardIdx === activeIdx) {
            const lift = Math.sin(activeP * Math.PI);
            transY -= lift * (bh * 0.06);
            scaleX += lift * 0.08;
            scaleY += lift * 0.08;
          } else {
            transY += Math.sin(time * 2.5 + cardIdx) * (bh * 0.012);
          }
          break;
        }

        case 'camera_glide': {
          const glide = Math.sin(time * 1.5 * speed) * (w * 0.03);
          transX += glide;
          transY += Math.cos(time * 2.0 * speed) * (bh * 0.02);
          break;
        }

        case 'pulse': {
          const pulse = Math.sin(loopTime * Math.PI * 2 * speed) * amp;
          scaleX += pulse;
          scaleY += pulse;
          break;
        }

        case 'float': {
          const floatOffset = Math.sin(loopTime * Math.PI * 2 * speed) * (bh * amp * 3.5);
          transY += floatOffset;
          rotation += Math.cos(loopTime * Math.PI * 2 * speed) * 0.015;
          break;
        }

        case 'bounce': {
          const bounce = Math.abs(Math.sin(loopTime * Math.PI * 2 * speed)) * (bh * amp * 2.5);
          transY -= bounce;
          break;
        }
      }
    }

    // Apply Transformation
    ctx.translate(transX, transY);
    ctx.rotate(rotation);
    ctx.scale(scaleX, scaleY);
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha));

    // Handle Glow (Only apply shadow blur if this layer is NOT a cropped image slice)
    const isSegmentLayer = !!(layer.sourceCrop && (layer.sourceCrop.width < 98 || layer.sourceCrop.height < 98));
    if (styling.glowColor && styling.glowBlur && !isSegmentLayer) {
      ctx.shadowColor = styling.glowColor;
      ctx.shadowBlur = styling.glowBlur;
    }

    const lx = -bw / 2;
    const ly = -bh / 2;

    // Check if this layer renders an authentic cutout from the user's reference image
    const cutoutUrl =
      layer.imageCutoutDataUrl ||
      (layer.useImageCutout && plan.referenceImageDataUrl ? plan.referenceImageDataUrl : null) ||
      (type === 'reference_hero_graphic' ? plan.referenceImageDataUrl : null);

    if (cutoutUrl && type !== 'cursor' && type !== 'path_trajectory') {
      const cachedImg = this.getCachedImage(cutoutUrl);
      if (cachedImg && cachedImg.complete && cachedImg.naturalWidth > 0) {
        this.drawImageCutoutLayer(ctx, lx, ly, bw, bh, layer, cachedImg, time);
        ctx.restore();
        return;
      } else if (type === 'reference_hero_graphic') {
        // Draw energetic glowing placeholder frame while image completes initial decode
        this.drawReferenceGraphicPlaceholder(ctx, lx, ly, bw, bh, plan, time);
        ctx.restore();
        return;
      }
    }

    // Draw specific object types
    switch (type) {
      case 'container':
        this.drawCard(ctx, lx, ly, bw, bh, styling);
        break;

      case 'button':
        this.drawInteractiveButton(ctx, lx, ly, bw, bh, layer, time);
        break;

      case 'icon':
        this.drawIconLayer(ctx, lx, ly, bw, bh, layer, time);
        break;

      case 'cursor':
        this.drawCursorLayer(ctx, lx, ly, bw, bh, plan, time, w, h);
        break;

      case 'device_frame':
        this.drawDeviceFrame(ctx, lx, ly, bw, bh, layer, time);
        break;

      case 'path_trajectory':
        // Suppress circular rotating trajectory rings to keep artboard clean and pure
        break;

      case 'floating_item':
        this.drawFloatingItem(ctx, lx, ly, bw, bh, layer, time, w, h);
        break;

      case 'chart_bar':
        this.drawChartBars(ctx, lx, ly, bw, bh, styling, time);
        break;

      case 'progress_ring':
        this.drawProgressRing(ctx, lx, ly, bw, bh, styling, time);
        break;

      case 'infinity_snake_stream':
      case 'snake_path':
        this.drawInfinitySnakeStream(ctx, lx, ly, bw, bh, styling, time, plan);
        break;

      case 'reference_hero_graphic':
        // Rendered via drawImageCutoutLayer above. If not yet loaded, avoid drawing opaque gray placeholder boxes.
        break;

      default:
        this.drawGenericCard(ctx, lx, ly, bw, bh, styling);
        break;
    }

    ctx.restore();
  }

  // --- DRAWING SPECIALIZED COMPONENTS ---

  /**
   * Renders the authentic visual slice of the user's uploaded reference image
   * with smooth clipping, spring physics, button clicks, and bell vibrations
   */
  /**
   * Renders the authentic visual slice of the user's uploaded reference image
   * with aspect ratio fitting, chromatic glow aura, spring physics, and specular sheen
   */
  private static drawImageCutoutLayer(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    layer: AnimationLayer,
    img: HTMLImageElement,
    time: number
  ) {
    const { styling, animation, sourceCrop, type } = layer;
    const triggerTime = animation.interaction?.triggerTime || 999;

    ctx.save();

    // Determine source crop coordinates inside original image
    let sx = 0;
    let sy = 0;
    let sw = img.naturalWidth;
    let sh = img.naturalHeight;

    if (sourceCrop) {
      sx = Math.max(0, (sourceCrop.x / 100) * img.naturalWidth);
      sy = Math.max(0, (sourceCrop.y / 100) * img.naturalHeight);
      sw = Math.min(img.naturalWidth - sx, (sourceCrop.width / 100) * img.naturalWidth);
      sh = Math.min(img.naturalHeight - sy, (sourceCrop.height / 100) * img.naturalHeight);
    }

    // Preserve natural aspect ratio for the reference hero graphic
    let drawX = x;
    let drawY = y;
    let drawW = w;
    let drawH = h;

    const isSegment = !!(sourceCrop && (sourceCrop.width < 98 || sourceCrop.height < 98));

    if (type === 'reference_hero_graphic' && sw > 0 && sh > 0) {
      if (!isSegment) {
        const imgRatio = sw / sh;
        const boxRatio = w / h;
        if (imgRatio > boxRatio) {
          drawW = w;
          drawH = w / imgRatio;
          drawY = y + (h - drawH) / 2;
        } else {
          drawH = h;
          drawW = h * imgRatio;
          drawX = x + (w - drawW) / 2;
        }

        // Only draw background ambient glow aura for single unsegmented hero
        if (styling.glowBlur && styling.glowBlur > 0) {
          const pulse = Math.sin(time * 3) * 0.15 + 0.85;
          const glowGrad = ctx.createRadialGradient(
            drawX + drawW / 2, drawY + drawH / 2, Math.min(drawW, drawH) * 0.25,
            drawX + drawW / 2, drawY + drawH / 2, Math.max(drawW, drawH) * 0.72
          );
          const hue1 = (time * 45) % 360;
          const hue2 = (hue1 + 80) % 360;
          glowGrad.addColorStop(0, `hsla(${hue1}, 100%, 65%, ${0.25 * pulse})`);
          glowGrad.addColorStop(0.5, `hsla(${hue2}, 100%, 55%, ${0.12 * pulse})`);
          glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

          ctx.save();
          ctx.fillStyle = glowGrad;
          ctx.fillRect(drawX - drawW * 0.35, drawY - drawH * 0.35, drawW * 1.7, drawH * 1.7);
          ctx.restore();
        }
      }
    }

    // Button click bounce
    if (type === 'button' && time >= triggerTime && time < triggerTime + 0.4) {
      const clickProgress = (time - triggerTime) / 0.4;
      const bScale = 1 - Math.sin(clickProgress * Math.PI) * 0.12;
      ctx.scale(bScale, bScale);
    }

    // Bell oscillatory rotation
    if (type === 'icon' && animation.interaction?.action === 'bell_vibrate' && time >= triggerTime && time < triggerTime + 1.8) {
      const ringTime = (time - triggerTime) * 16;
      const bellAngle = Math.sin(ringTime) * Math.exp(-(time - triggerTime) * 1.5) * 0.35;
      ctx.rotate(bellAngle);
    }

    // Clip to rounded border (for segmented parts, default to 0 so they connect seamlessly)
    const defaultRadius = isSegment ? 0 : 16;
    const radius = Math.min(styling.borderRadius ?? defaultRadius, Math.min(drawW, drawH) / 2);
    ctx.save();
    if (radius > 0) {
      ctx.beginPath();
      ctx.roundRect(drawX, drawY, drawW, drawH, radius);
      ctx.clip();
    }

    // Draw the authentic reference image slice
    ctx.drawImage(img, sx, sy, sw, sh, drawX, drawY, drawW, drawH);

    // Continuous dynamic specular sheen sweep across assembled cards and elements (চলমান লাইট সুইপ)
    const sweepPhase = (layer.layerOrder || 1) * 0.45;
    const cycleTime = (time * 0.8 + sweepPhase) % 2.8;
    if (cycleTime > 0.3 && cycleTime < 1.8) {
      const sheenP = (cycleTime - 0.3) / 1.5;
      const sheenX = drawX - drawW * 0.6 + sheenP * (drawW * 2.2);
      const grad = ctx.createLinearGradient(sheenX, drawY, sheenX + drawW * 0.35, drawY + drawH);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0)');
      grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.35)');
      grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(drawX, drawY, drawW, drawH);
    }

    ctx.restore();

    // Vibrant chromatic rim border ONLY for single uncut reference graphic
    if (type === 'reference_hero_graphic' && !isSegment && styling.strokeWidth) {
      const rimHue = (time * 60) % 360;
      ctx.save();
      ctx.strokeStyle = `hsla(${rimHue}, 95%, 65%, 0.75)`;
      ctx.lineWidth = styling.strokeWidth || 2.5;
      ctx.beginPath();
      ctx.roundRect(drawX, drawY, drawW, drawH, radius);
      ctx.stroke();
      ctx.restore();
    }

    // Optional border stroke
    if (styling.stroke && styling.strokeWidth && type !== 'reference_hero_graphic') {
      ctx.strokeStyle = styling.stroke;
      ctx.lineWidth = styling.strokeWidth;
      ctx.beginPath();
      ctx.roundRect(drawX, drawY, drawW, drawH, styling.borderRadius || 0);
      ctx.stroke();
    }

    // Click Ripple Burst for interactive buttons
    if (type === 'button' && time >= triggerTime && time < triggerTime + 0.6) {
      const rippleProgress = (time - triggerTime) / 0.6;
      ctx.beginPath();
      ctx.arc(drawX + drawW / 2, drawY + drawH / 2, (drawW * 0.6) * rippleProgress, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(49, 170, 169, ${1 - rippleProgress})`;
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    // Bell vibrating sound waves
    if (type === 'icon' && animation.interaction?.action === 'bell_vibrate' && time >= triggerTime && time < triggerTime + 1.8) {
      const waveProgress = ((time - triggerTime) * 2.5) % 1;
      ctx.beginPath();
      ctx.arc(drawX + drawW / 2, drawY + drawH / 2, (Math.min(drawW, drawH) / 2) + waveProgress * 16, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(49, 170, 169, ${0.8 * (1 - waveProgress)})`;
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }

    ctx.restore();
  }

  /**
   * Animated shimmering placeholder while reference image is being decoded
   */
  private static drawReferenceGraphicPlaceholder(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    plan: AnimationPlan,
    time: number
  ) {
    ctx.save();
    const radius = 16;
    const pulse = Math.sin(time * 4) * 0.15 + 0.85;
    const hue = (time * 60) % 360;

    // Outer glow
    ctx.shadowColor = `hsla(${hue}, 100%, 60%, 0.8)`;
    ctx.shadowBlur = 30 * pulse;

    // Card background
    ctx.fillStyle = '#0F172A';
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, radius);
    ctx.fill();

    // Vibrant border
    ctx.strokeStyle = `hsla(${hue}, 100%, 65%, 0.8)`;
    ctx.lineWidth = 3;
    ctx.stroke();

    // Inner loading text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Preparing Reference Video...', x + w / 2, y + h / 2);

    ctx.restore();
  }

  /**
   * Rounded Card Container
   */
  private static drawCard(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    styling: any
  ) {
    const radius = Math.min(styling.borderRadius || 24, h / 2);
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, radius);
    ctx.fillStyle = styling.fill || '#FFFFFF';
    ctx.fill();

    if (styling.stroke && styling.strokeWidth) {
      ctx.strokeStyle = styling.stroke;
      ctx.lineWidth = styling.strokeWidth;
      ctx.stroke();
    }
  }

  /**
   * Interactive Button (Like & Subscribe with state changes & click ripple)
   */
  private static drawInteractiveButton(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    layer: AnimationLayer,
    time: number
  ) {
    const { styling, animation } = layer;
    const triggerTime = animation.interaction?.triggerTime || 999;
    const isClicked = time >= triggerTime;

    let fill = styling.fill || '#F1F5F9';
    let text = styling.text || '';
    let textColor = styling.textColor || '#0F0F0F';
    let buttonScale = 1;

    // Click bounce reaction
    if (time >= triggerTime && time < triggerTime + 0.4) {
      const clickProgress = (time - triggerTime) / 0.4;
      buttonScale = 1 - Math.sin(clickProgress * Math.PI) * 0.15;
    }

    // Subscribe Button state morph
    if (text === 'Subscribe' || animation.interaction?.action === 'text_change') {
      if (isClicked) {
        fill = '#E5E7EB'; // Morph to subtle grey
        text = 'Subscribed ✓';
        textColor = '#1E293B';
      } else {
        fill = '#FF0000'; // Vibrant red
        text = 'Subscribe';
        textColor = '#FFFFFF';
      }
    }

    // Like Button state morph
    if (styling.iconType === 'thumbs_up' && isClicked) {
      fill = '#DBEAFE'; // Light blue pill
      textColor = '#065FD4';
    }

    ctx.save();
    ctx.scale(buttonScale, buttonScale);

    // Draw Button Body
    const radius = Math.min(styling.borderRadius || 24, h / 2);
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, radius);
    ctx.fillStyle = fill;
    ctx.fill();

    // Click Ripple Burst
    if (time >= triggerTime && time < triggerTime + 0.6) {
      const rippleProgress = (time - triggerTime) / 0.6;
      ctx.beginPath();
      ctx.arc(x + w / 2, y + h / 2, (w * 0.7) * rippleProgress, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(6, 95, 212, ${1 - rippleProgress})`;
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    // Icon & Text
    if (styling.iconType === 'thumbs_up') {
      this.drawThumbsUpIcon(ctx, x + h * 0.35, y + h * 0.25, h * 0.5, isClicked ? '#065FD4' : '#475569');
      ctx.font = `600 ${Math.round(h * 0.4)}px sans-serif`;
      ctx.fillStyle = textColor;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(isClicked ? 'Liked' : 'Like', x + h * 0.85, y + h / 2);
    } else {
      // Normal Text
      ctx.font = `700 ${Math.round(h * 0.42)}px sans-serif`;
      ctx.fillStyle = textColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, x + w / 2, y + h / 2);
    }

    ctx.restore();
  }

  /**
   * Notification Bell with oscillatory rotation and vibration waves
   */
  private static drawIconLayer(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    layer: AnimationLayer,
    time: number
  ) {
    const { styling, animation } = layer;
    const triggerTime = animation.interaction?.triggerTime || 999;
    const isRinging = time >= triggerTime && time < triggerTime + 1.8;

    let bellAngle = 0;
    if (isRinging) {
      const ringTime = (time - triggerTime) * 16;
      bellAngle = Math.sin(ringTime) * Math.exp(-(time - triggerTime) * 1.5) * 0.4;
    }

    // Circular background pill
    const radius = Math.min(w, h) / 2;
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h / 2, radius, 0, Math.PI * 2);
    ctx.fillStyle = styling.fill || '#F1F5F9';
    ctx.fill();

    // Radiating soundwave rings if ringing
    if (isRinging) {
      const waveProgress = ((time - triggerTime) * 2.5) % 1;
      ctx.save();
      ctx.beginPath();
      ctx.arc(x + w / 2, y + h / 2, radius + waveProgress * 18, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(49, 170, 169, ${0.8 * (1 - waveProgress)})`;
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.restore();
    }

    // Draw Bell
    ctx.save();
    ctx.translate(x + w / 2, y + h * 0.3);
    ctx.rotate(bellAngle);
    this.drawBellShape(ctx, 0, 0, h * 0.55, isRinging ? '#31AAA9' : '#1E293B');
    ctx.restore();
  }

  /**
   * Hand Pointer Cursor that travels between elements and clicks
   */
  private static drawCursorLayer(
    ctx: CanvasRenderingContext2D,
    lx: number,
    ly: number,
    bw: number,
    bh: number,
    plan: AnimationPlan,
    time: number,
    w: number,
    h: number
  ) {
    // In YouTube Subscribe Pill style, the cursor moves:
    // t=0-1.2: offscreen
    // t=1.2-2.2: moves to Like Button (x ~ 31%, y ~ 48%), clicks at 2.2
    // t=2.6-4.5: moves to Subscribe Button (x ~ 52%, y ~ 48%), clicks at 4.5
    // t=4.9-6.8: moves to Bell Button (x ~ 70%, y ~ 48%), clicks at 6.8
    // t=7.2-9.0: glides offscreen to bottom-right
    let targetX = 0.85 * w;
    let targetY = 1.1 * h;
    let isClicking = false;

    if (time >= 1.0 && time < 2.5) {
      // Approach Like button
      const p = easeInOutCubic(Math.min(1, Math.max(0, (time - 1.0) / 1.0)));
      targetX = (0.75 * (1 - p) + 0.31 * p) * w;
      targetY = (1.1 * (1 - p) + 0.50 * p) * h;
      if (Math.abs(time - 2.2) < 0.15) isClicking = true;
    } else if (time >= 2.5 && time < 4.8) {
      // Move from Like to Subscribe
      const p = easeInOutCubic(Math.min(1, Math.max(0, (time - 2.6) / 1.4)));
      targetX = (0.31 * (1 - p) + 0.52 * p) * w;
      targetY = (0.50 * (1 - p) + 0.50 * p) * h;
      if (Math.abs(time - 4.5) < 0.15) isClicking = true;
    } else if (time >= 4.8 && time < 7.2) {
      // Move from Subscribe to Bell
      const p = easeInOutCubic(Math.min(1, Math.max(0, (time - 4.9) / 1.4)));
      targetX = (0.52 * (1 - p) + 0.70 * p) * w;
      targetY = (0.50 * (1 - p) + 0.50 * p) * h;
      if (Math.abs(time - 6.8) < 0.15) isClicking = true;
    } else if (time >= 7.2) {
      // Exit offscreen
      const p = easeInOutCubic(Math.min(1, Math.max(0, (time - 7.2) / 1.5)));
      targetX = (0.70 * (1 - p) + 0.85 * p) * w;
      targetY = (0.50 * (1 - p) + 1.15 * p) * h;
    }

    // Reset local context back to canvas absolute for smooth pointer tracking
    ctx.restore();
    ctx.save();
    ctx.translate(targetX, targetY);

    if (isClicking) {
      ctx.scale(0.85, 0.85);
    }

    // Render Hand Cursor SVG
    this.drawHandCursorIcon(ctx);
  }

  /**
   * Multi-Device Screen Frames (Desktop, Mobile, Tablet) inspired by Ref Video 1
   */
  private static drawDeviceFrame(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    layer: AnimationLayer,
    time: number
  ) {
    const { styling, id } = layer;
    const isDesktop = id.includes('desktop');
    const isMobile = id.includes('mobile');
    const isTablet = id.includes('tablet');

    // Outer bezel
    const radius = isMobile ? 24 : isTablet ? 18 : 12;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, radius);
    ctx.fillStyle = styling.fill || '#1A1829';
    ctx.fill();
    ctx.strokeStyle = styling.stroke || '#2D2947';
    ctx.lineWidth = styling.strokeWidth || 4;
    ctx.stroke();

    // Desktop Stand
    if (isDesktop) {
      ctx.fillStyle = '#0F0D1B';
      ctx.fillRect(x + w * 0.42, y + h, w * 0.16, h * 0.15);
      ctx.beginPath();
      ctx.roundRect(x + w * 0.28, y + h + h * 0.14, w * 0.44, h * 0.05, 4);
      ctx.fill();
    }

    // Inner Screen Content
    const innerPad = 8;
    const sx = x + innerPad;
    const sy = y + innerPad;
    const sw = w - innerPad * 2;
    const sh = h - innerPad * 2;

    ctx.beginPath();
    ctx.roundRect(sx, sy, sw, sh, radius - 4);
    ctx.fillStyle = styling.secondaryFill || '#241438';
    ctx.fill();

    // Add UI Widgets on Desktop
    if (isDesktop) {
      // Modal / email box sliding in
      const modalW = sw * 0.6;
      const modalH = sh * 0.75;
      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      ctx.beginPath();
      ctx.roundRect(sx + 8, sy + 10, modalW, modalH, 6);
      ctx.fill();

      // Form header
      ctx.fillStyle = '#6366F1';
      ctx.fillRect(sx + 8, sy + 10, modalW, 16);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 8px sans-serif';
      ctx.fillText('COMPOSE', sx + 14, sy + 22);

      // Form lines
      ctx.fillStyle = '#64748B';
      ctx.font = '6px sans-serif';
      ctx.fillText('From: mark.popov@mail.com', sx + 14, sy + 38);
      ctx.fillText('To: dfr@mailpost.com', sx + 14, sy + 50);
      ctx.fillText('Subject: Motion Studio Launch', sx + 14, sy + 62);

      // Send Button
      ctx.fillStyle = '#31AAA9';
      ctx.beginPath();
      ctx.roundRect(sx + 14, sy + modalH - 18, 36, 12, 3);
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 6px sans-serif';
      ctx.fillText('Send', sx + 25, sy + modalH - 10);

      // Right-side widgets: 25% Progress Circle & Clock
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(sx + sw * 0.8, sy + 28, 14, 0, Math.PI * 0.5);
      ctx.stroke();
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 9px sans-serif';
      ctx.fillText('25%', sx + sw * 0.8 - 8, sy + 31);
    }

    // Add Chat Bubbles on Mobile & Tablet
    if (isMobile) {
      // Top Notch
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(sx + sw / 2, sy + 6, 3, 0, Math.PI * 2);
      ctx.fill();

      // Message bubble 1
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.roundRect(sx + 6, sy + 20, sw * 0.7, 18, 6);
      ctx.fill();
      ctx.fillStyle = '#1E293B';
      ctx.font = '7px sans-serif';
      ctx.fillText('Hi! How are you?', sx + 10, sy + 32);

      // Reply bubble
      if (time > 3.0) {
        ctx.fillStyle = '#31AAA9';
        ctx.beginPath();
        ctx.roundRect(sx + sw * 0.28, sy + 44, sw * 0.65, 18, 6);
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText('Fine, thanks!', sx + sw * 0.32, sy + 56);
      }
    }

    if (isTablet) {
      // Tablet header
      ctx.fillStyle = '#0F766E';
      ctx.fillRect(sx, sy, sw, 18);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 7px sans-serif';
      ctx.fillText('New Message • John Smith', sx + 8, sy + 12);

      // Incoming reply
      if (time > 4.5) {
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.roundRect(sx + 10, sy + 28, sw * 0.75, 22, 6);
        ctx.fill();
        ctx.fillStyle = '#0F172A';
        ctx.font = '7px sans-serif';
        ctx.fillText('Envelope received successfully!', sx + 14, sy + 42);
      }
    }
  }

  /**
   * Orbit Trajectory Dashed Path with continuous rotation (Ref Video 1)
   */
  private static drawTrajectoryOrbit(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    styling: any,
    time: number
  ) {
    const rx = w / 2;
    const ry = h / 2;
    ctx.save();
    ctx.setLineDash([12, 8]);
    ctx.lineDashOffset = -time * 30; // Continuous orbital rotation
    ctx.strokeStyle = styling.stroke || 'rgba(255,255,255,0.4)';
    ctx.lineWidth = styling.strokeWidth || 3;
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  /**
   * Flying Email Envelope traversing between screens (Ref Video 1)
   */
  private static drawFloatingItem(
    ctx: CanvasRenderingContext2D,
    lx: number,
    ly: number,
    bw: number,
    bh: number,
    layer: AnimationLayer,
    time: number,
    canvasW: number,
    canvasH: number
  ) {
    const { styling, animation } = layer;
    const triggerTime = animation.interaction?.triggerTime || 1.5;

    // Smooth Bezier path starting at desktop monitor (t ~ 2.0),
    // flying upwards in an arc to central mobile (t ~ 4.0),
    // and flying over to tablet (t ~ 6.0)
    let currentX = lx;
    let currentY = ly;

    if (time >= triggerTime) {
      const flightDuration = 4.5;
      const progress = Math.min(1, (time - triggerTime) / flightDuration);

      // Bezier waypoint curve across screen
      const p0 = { x: -canvasW * 0.25, y: -canvasH * 0.05 };
      const p1 = { x: 0, y: -canvasH * 0.25 }; // Peak of arc above mobile
      const p2 = { x: canvasW * 0.28, y: -canvasH * 0.02 }; // Tablet destination

      const t = easeInOutCubic(progress);
      currentX = (1 - t) * (1 - t) * p0.x + 2 * (1 - t) * t * p1.x + t * t * p2.x;
      currentY = (1 - t) * (1 - t) * p0.y + 2 * (1 - t) * t * p1.y + t * t * p2.y;
    }

    ctx.save();
    ctx.translate(currentX, currentY);

    // Envelope body
    const ew = 38;
    const eh = 26;
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.roundRect(-ew / 2, -eh / 2, ew, eh, 4);
    ctx.fill();
    ctx.strokeStyle = styling.stroke || '#31AAA9';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Envelope Flap
    ctx.beginPath();
    ctx.moveTo(-ew / 2, -eh / 2);
    ctx.lineTo(0, 2);
    ctx.lineTo(ew / 2, -eh / 2);
    ctx.stroke();

    // Trailing particles
    const trailCount = 3;
    for (let i = 1; i <= trailCount; i++) {
      ctx.beginPath();
      ctx.arc(-ew / 2 - i * 8, Math.sin(time * 8 + i) * 3, 2.5 - i * 0.6, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(49, 170, 169, ${0.7 - i * 0.2})`;
      ctx.fill();
    }

    ctx.restore();
  }

  /**
   * Bar Chart with smooth column growth
   */
  /**
   * Bar Chart with smooth column growth and vibrant multi-color styling
   */
  private static drawChartBars(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    styling: any,
    time: number
  ) {
    // 1. Vertical Histogram Bars with Vibrant Multi-Color Palette (Sob Colouring)
    const barRatios = [0.46, 0.74, 0.95, 0.58, 0.88, 0.52, 0.76, 0.92, 0.62, 0.84, 0.56, 0.90, 0.98, 0.82];
    const barCount = barRatios.length;
    const barWidth = Math.max(8, (w / (barCount * 1.6)));
    const totalBarsWidth = barCount * barWidth + (barCount - 1) * (barWidth * 0.55);
    const startX = x + (w - totalBarsWidth) / 2;

    // Vibrant chromatic spectrum for each bar - no single color!
    const vibrantGradients: [string, string][] = [
      ['#FF2A6D', '#FF6584'], // Neon Crimson / Rose
      ['#FF6F00', '#FFA040'], // Vivid Orange
      ['#FFB703', '#FFD166'], // Golden Sun Amber
      ['#06D6A0', '#10B981'], // Vibrant Emerald
      ['#00E5FF', '#38BDF8'], // Electric Cyan
      ['#3B82F6', '#60A5FA'], // Vibrant Blue
      ['#6366F1', '#818CF8'], // Rich Indigo
      ['#8B5CF6', '#A78BFA'], // Deep Violet
      ['#D946EF', '#E879F9'], // Neon Fuchsia
      ['#F43F5E', '#FDA4AF'], // Coral Pink
      ['#14B8A6', '#2DD4BF'], // Mint Teal
      ['#EAB308', '#FACC15'], // Bright Gold
      ['#2563EB', '#93C5FD'], // Royal Electric Blue
      ['#A855F7', '#C084FC'], // Vivid Purple
    ];

    for (let i = 0; i < barCount; i++) {
      const targetHeight = barRatios[i] * (h * 0.7);
      const barEntrance = Math.min(1, Math.max(0, (time - 0.2 - i * 0.05) / 0.65));
      const currentH = targetHeight * easeOutBack(barEntrance);

      const bx = startX + i * (barWidth * 1.55);
      const by = y + h * 0.85 - currentH;

      const [cTop, cBottom] = vibrantGradients[i % vibrantGradients.length];

      ctx.save();
      // Smooth vertical linear gradient for rich multi-color saturation
      const barGrad = ctx.createLinearGradient(bx, by, bx, by + currentH);
      barGrad.addColorStop(0, cTop);
      barGrad.addColorStop(1, cBottom);

      ctx.beginPath();
      ctx.roundRect(bx, by, barWidth, currentH, [barWidth / 2, barWidth / 2, 3, 3]);
      ctx.fillStyle = barGrad;
      ctx.shadowColor = cTop;
      ctx.shadowBlur = 10;
      ctx.fill();

      // Top glossy highlight cap
      ctx.beginPath();
      ctx.arc(bx + barWidth / 2, by + barWidth / 2, barWidth * 0.35, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.fill();

      // Subtle light sheen sweep
      if (time > 2.0) {
        const sheenProgress = ((time - 2.0) * 0.8 + (i / barCount) * 0.3) % 1.5;
        if (sheenProgress >= 0 && sheenProgress <= 0.3) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
          ctx.beginPath();
          ctx.roundRect(bx, by, barWidth, currentH, [barWidth / 2, barWidth / 2, 3, 3]);
          ctx.fill();
        }
      }
      ctx.restore();
    }

    // 2. Connected Zigzag Trend Line with Multi-Color Gradient across nodes
    const nodePoints = [
      { rx: 0.06, ry: 0.72, color: '#FF2A6D' },
      { rx: 0.24, ry: 0.44, color: '#FFB703' },
      { rx: 0.43, ry: 0.64, color: '#06D6A0' },
      { rx: 0.62, ry: 0.36, color: '#00E5FF' },
      { rx: 0.76, ry: 0.48, color: '#8B5CF6' },
      { rx: 0.94, ry: 0.22, color: '#D946EF' },
    ];

    const lineWidth = Math.max(9, w * 0.03);
    const nodeRadius = Math.max(12, w * 0.038);

    // Calculate line tracing progress (between t=0.8s and t=2.6s)
    const traceStart = 0.8;
    const traceDuration = 1.8;
    const traceProgress = Math.min(1, Math.max(0, (time - traceStart) / traceDuration));

    if (traceProgress > 0) {
      const totalSegments = nodePoints.length - 1;
      const currentSegment = Math.min(totalSegments - 1, Math.floor(traceProgress * totalSegments));
      const segmentProgress = (traceProgress * totalSegments) - currentSegment;

      ctx.save();
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Vibrant multi-stop gradient for the trend line
      const lineGrad = ctx.createLinearGradient(x, y, x + w, y);
      lineGrad.addColorStop(0.0, '#FF2A6D');
      lineGrad.addColorStop(0.25, '#FFB703');
      lineGrad.addColorStop(0.5, '#00E5FF');
      lineGrad.addColorStop(0.75, '#8B5CF6');
      lineGrad.addColorStop(1.0, '#D946EF');

      ctx.strokeStyle = lineGrad;
      ctx.shadowColor = '#00E5FF';
      ctx.shadowBlur = 14;

      ctx.beginPath();
      const p0 = nodePoints[0];
      ctx.moveTo(x + p0.rx * w, y + p0.ry * h);

      for (let s = 0; s < currentSegment; s++) {
        const p = nodePoints[s + 1];
        ctx.lineTo(x + p.rx * w, y + p.ry * h);
      }

      // Current moving line tip
      const startP = nodePoints[currentSegment];
      const endP = nodePoints[currentSegment + 1];
      const interpX = startP.rx + (endP.rx - startP.rx) * segmentProgress;
      const interpY = startP.ry + (endP.ry - startP.ry) * segmentProgress;
      ctx.lineTo(x + interpX * w, y + interpY * h);
      ctx.stroke();

      // Glowing tip trail
      ctx.beginPath();
      ctx.arc(x + interpX * w, y + interpY * h, lineWidth * 0.7, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();

      ctx.restore();
    }

    // Draw Circular Nodes in sequence with unique vibrant colors (No spinning rings!)
    for (let i = 0; i < nodePoints.length; i++) {
      const p = nodePoints[i];
      const nodeAppearanceTime = traceStart + (i / (nodePoints.length - 1)) * traceDuration;
      
      if (time >= nodeAppearanceTime) {
        const popProgress = Math.min(1, (time - nodeAppearanceTime) / 0.4);
        const nodeScale = easeOutBack(popProgress);

        const nx = x + p.rx * w;
        const ny = y + p.ry * h;

        ctx.save();
        ctx.translate(nx, ny);
        ctx.scale(nodeScale, nodeScale);

        // Circular Node Outer Fill with its vibrant color
        ctx.beginPath();
        ctx.arc(0, 0, nodeRadius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 12;
        ctx.fill();

        // White border ring matching AE graphics
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 3.5;
        ctx.stroke();

        // Inner glowing white core
        ctx.beginPath();
        ctx.arc(0, 0, nodeRadius * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();

        ctx.restore();
      }
    }
  }

  /**
   * Renders a glowing neon snake / fiber-optic light stream traveling around
   * an infinity lemniscate loop, inspired by Adobe After Effects trim paths.
   */
  private static drawInfinitySnakeStream(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    styling: any,
    time: number,
    plan?: AnimationPlan
  ) {
    const cx = x + w / 2;
    const cy = y + h / 2;
    const a = w * 0.44;
    const b = h * 0.42;

    // Parametric Lemniscate formula: x(t) = a * sin(t), y(t) = b * sin(t) * cos(t)
    const getPoint = (theta: number, scaleFactor: number = 1.0, yOffset: number = 0) => {
      const px = cx + (a * scaleFactor) * Math.sin(theta);
      const py = cy + (b * scaleFactor) * Math.sin(theta) * Math.cos(theta) + yOffset;
      return { x: px, y: py };
    };

    const hexToRgb = (hex?: string) => {
      if (!hex) return '49, 170, 169';
      const c = hex.replace('#', '');
      if (c.length === 6) {
        return `${parseInt(c.slice(0, 2), 16)}, ${parseInt(c.slice(2, 4), 16)}, ${parseInt(c.slice(4, 6), 16)}`;
      }
      return '49, 170, 169';
    };

    const primaryRgb = hexToRgb(plan?.palette?.primary || styling.stroke || '#00E5FF');
    const accentRgb = hexToRgb(plan?.palette?.accent || styling.secondaryFill || '#E000FF');

    // Full chromatic multi-color spectrum (Cyan -> Blue -> Violet -> Fuchsia -> Crimson -> Orange -> Gold -> Emerald)
    const chromaticStops: [number, number, number][] = [
      [0, 229, 255],   // Electric Cyan
      [59, 130, 246],  // Vibrant Blue
      [139, 92, 246],  // Deep Violet
      [224, 0, 255],   // Vivid Fuchsia
      [255, 42, 109],  // Neon Crimson
      [255, 111, 0],   // Bright Orange
      [255, 209, 0],   // Golden Yellow
      [6, 214, 160],   // Emerald Green
    ];

    const getColor = (theta: number, alpha: number, strandOffset: number = 0) => {
      const norm = (((theta / (Math.PI * 2)) + time * 0.12 + strandOffset) % 1 + 1) % 1;
      const pos = norm * chromaticStops.length;
      const idx1 = Math.floor(pos) % chromaticStops.length;
      const idx2 = (idx1 + 1) % chromaticStops.length;
      const frac = pos - Math.floor(pos);

      const r = Math.round(chromaticStops[idx1][0] * (1 - frac) + chromaticStops[idx2][0] * frac);
      const g = Math.round(chromaticStops[idx1][1] * (1 - frac) + chromaticStops[idx2][1] * frac);
      const b = Math.round(chromaticStops[idx1][2] * (1 - frac) + chromaticStops[idx2][2] * frac);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    ctx.save();

    // 1. Ghost Path (Faint background infinity loop indicating the track)
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (let s = 0; s < 100; s++) {
      const t0 = (s / 100) * Math.PI * 2;
      const t1 = ((s + 1) / 100) * Math.PI * 2;
      const p0 = getPoint(t0);
      const p1 = getPoint(t1);

      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.strokeStyle = getColor(t0, 0.12);
      ctx.stroke();
    }

    // 2. Multi-Strand Snake Stream (5 glowing fiber lines)
    const strands = [
      { scale: 1.0, offset: 0, width: 8, speedMult: 1.0 },
      { scale: 1.02, offset: -2, width: 5, speedMult: 1.05 },
      { scale: 0.98, offset: 2, width: 5, speedMult: 0.96 },
      { scale: 1.04, offset: -4, width: 3, speedMult: 1.08 },
      { scale: 0.96, offset: 4, width: 3, speedMult: 0.93 },
    ];

    const snakeLength = 1.35; // Length of snake body in radians (approx 25% of loop)

    strands.forEach((strand, strandIdx) => {
      const currentSpeed = 1.2 * strand.speedMult;
      const headTheta = (time * currentSpeed + strandIdx * 0.05) % (Math.PI * 2);

      const segments = 36;
      for (let i = 0; i < segments; i++) {
        const u0 = i / segments; // 0 (tail) -> 1 (head)
        const u1 = (i + 1) / segments;

        const theta0 = headTheta - snakeLength * (1 - u0);
        const theta1 = headTheta - snakeLength * (1 - u1);

        const pt0 = getPoint(theta0, strand.scale, strand.offset);
        const pt1 = getPoint(theta1, strand.scale, strand.offset);

        // Opacity and line width taper from tail to head
        const alpha = Math.pow(u1, 1.6);
        const curWidth = Math.max(1, strand.width * Math.pow(u1, 1.2));

        ctx.beginPath();
        ctx.moveTo(pt0.x, pt0.y);
        ctx.lineTo(pt1.x, pt1.y);
        ctx.lineWidth = curWidth;
        ctx.strokeStyle = getColor(theta1, alpha * 0.95);
        ctx.shadowColor = getColor(theta1, 1);
        ctx.shadowBlur = 18 * u1;
        ctx.stroke();

        // Bright white fiber core
        if (strandIdx === 0 && u1 > 0.4) {
          ctx.beginPath();
          ctx.moveTo(pt0.x, pt0.y);
          ctx.lineTo(pt1.x, pt1.y);
          ctx.lineWidth = Math.max(1, curWidth * 0.35);
          ctx.strokeStyle = `rgba(255, 255, 255, ${u1 * 0.9})`;
          ctx.shadowBlur = 6;
          ctx.stroke();
        }
      }

      // 3. Glowing Snake Head Flare
      if (strandIdx === 0) {
        const headPt = getPoint(headTheta, 1.0, 0);
        ctx.shadowBlur = 32;
        ctx.shadowColor = getColor(headTheta, 1);

        // Head bright orb
        ctx.beginPath();
        ctx.arc(headPt.x, headPt.y, 9, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();

        // Outer glow burst
        ctx.beginPath();
        ctx.arc(headPt.x, headPt.y, 16, 0, Math.PI * 2);
        ctx.fillStyle = getColor(headTheta, 0.4);
        ctx.fill();
      }
    });

    // 4. Trailing Sparkle Particles
    const particleCount = 18;
    for (let p = 0; p < particleCount; p++) {
      const pOffset = ((time * 1.5 + (p / particleCount) * 1.2) % 1.2);
      const headTheta = (time * 1.2) % (Math.PI * 2);
      const pTheta = headTheta - pOffset;
      const pt = getPoint(pTheta, 1.0 + Math.sin(p * 2 + time * 3) * 0.05);

      const pAlpha = 1 - (pOffset / 1.2);
      const pRadius = (1 - (pOffset / 1.2)) * 3.5;

      ctx.beginPath();
      ctx.arc(pt.x + Math.sin(p * 5 + time * 4) * 4, pt.y + Math.cos(p * 3 + time * 4) * 4, Math.max(0.5, pRadius), 0, Math.PI * 2);
      ctx.fillStyle = getColor(pTheta, pAlpha * 0.85);
      ctx.shadowColor = getColor(pTheta, 1);
      ctx.shadowBlur = 8;
      ctx.fill();
    }

    ctx.restore();
  }

  /**
   * Circular Progress Ring with animated stroke
   */
  private static drawProgressRing(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    styling: any,
    time: number
  ) {
    const radius = Math.min(w, h) / 2 - 8;
    const cx = x + w / 2;
    const cy = y + h / 2;

    // Track
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = styling.strokeWidth || 8;
    ctx.stroke();

    // Animated Ring
    const ringProgress = Math.min(0.85, time * 0.3);
    ctx.beginPath();
    ctx.arc(cx, cy, radius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * ringProgress);
    ctx.strokeStyle = styling.stroke || '#10B981';
    ctx.lineWidth = styling.strokeWidth || 8;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Center percentage text
    if (styling.text) {
      ctx.font = 'bold 18px sans-serif';
      ctx.fillStyle = styling.textColor || '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(styling.text, cx, cy);
    }
  }

  /**
   * Generic rounded card fallback
   */
  private static drawGenericCard(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    styling: any
  ) {
    const radius = Math.min(styling.borderRadius || 16, h / 2);
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, radius);
    ctx.fillStyle = styling.fill || '#31AAA9';
    ctx.fill();
    if (styling.text) {
      ctx.font = 'bold 16px sans-serif';
      ctx.fillStyle = styling.textColor || '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(styling.text, x + w / 2, y + h / 2);
    }
  }

  // --- ICON PRIMITIVES ---

  private static drawThumbsUpIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, color: string) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    // Hand cuff
    ctx.roundRect(-size * 0.45, -size * 0.1, size * 0.2, size * 0.5, 2);
    ctx.fill();
    // Thumb and fist
    ctx.beginPath();
    ctx.moveTo(-size * 0.2, size * 0.4);
    ctx.lineTo(size * 0.35, size * 0.4);
    ctx.quadraticCurveTo(size * 0.45, size * 0.4, size * 0.45, size * 0.2);
    ctx.lineTo(size * 0.45, 0);
    ctx.lineTo(size * 0.15, -size * 0.25);
    ctx.quadraticCurveTo(size * 0.1, -size * 0.45, 0, -size * 0.45);
    ctx.quadraticCurveTo(-size * 0.1, -size * 0.4, -size * 0.1, -size * 0.2);
    ctx.lineTo(-size * 0.2, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  private static drawBellShape(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, color: string) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.fillStyle = color;
    // Bell Dome
    ctx.beginPath();
    ctx.arc(0, -size * 0.2, size * 0.12, Math.PI, 0); // Top ring
    ctx.moveTo(-size * 0.35, size * 0.25);
    ctx.quadraticCurveTo(-size * 0.3, -size * 0.25, 0, -size * 0.25);
    ctx.quadraticCurveTo(size * 0.3, -size * 0.25, size * 0.35, size * 0.25);
    ctx.quadraticCurveTo(size * 0.4, size * 0.32, size * 0.4, size * 0.35);
    ctx.lineTo(-size * 0.4, size * 0.35);
    ctx.quadraticCurveTo(-size * 0.4, size * 0.32, -size * 0.35, size * 0.25);
    ctx.fill();
    // Clapper
    ctx.beginPath();
    ctx.arc(0, size * 0.42, size * 0.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private static drawHandCursorIcon(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    // Stylized pointing hand cursor path
    ctx.beginPath();
    ctx.moveTo(0, 0); // Index fingertip
    ctx.lineTo(0, 18);
    ctx.lineTo(4, 20);
    ctx.lineTo(8, 22);
    ctx.lineTo(13, 21);
    ctx.lineTo(16, 17);
    ctx.lineTo(16, 10);
    ctx.lineTo(12, 8);
    ctx.lineTo(12, 4);
    ctx.quadraticCurveTo(12, 0, 8, 0);
    ctx.lineTo(4, 0);
    ctx.quadraticCurveTo(0, -1, 0, 0);
    ctx.closePath();

    ctx.fill();
    ctx.stroke();

    // Finger lines
    ctx.beginPath();
    ctx.moveTo(4, 5);
    ctx.lineTo(4, 15);
    ctx.moveTo(8, 7);
    ctx.lineTo(8, 16);
    ctx.strokeStyle = '#94A3B8';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.restore();
  }
}
