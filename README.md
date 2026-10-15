# SS ICON MOTION STUDIO
### Automatic Reference Image to Motion Graphics Video Generator
**Production-Grade Web Application | Direct MP4 & Alpha Export | 10 API Key Pool Rotation**

---

## 1. Overview

**SS ICON MOTION STUDIO** transforms static reference images into rich, professional motion graphics videos inspired by the reference design styles:
- **YouTube Action Pill (Ref Video #2)**: Pill-shaped card with animated Like button (+ counter pop & blue fill), Subscribe button with spring click and state morph into "Subscribed", and vibrating notification bell with soundwaves and animated pointing hand cursor.
- **Multi-Device Tech Workspace (Ref Video #1)**: Desktop monitor with widgets and email compose dialog, central mobile phone with chat conversation, tablet screen, rotating dashed orbital trajectories, and flying email envelope traveling between devices.
- **Fintech & Data Visualization**: Smooth bar chart growth, progress rings, and pulsing metrics.
- **Cyberpunk Neon Tech**: Glowing radar rings, particle emitters, and laser sweeps.

The application decomposes the image into independent visual layers with spring easing, continuous loops, and timed interactions. It renders frames deterministically and encodes them directly into genuine playable MP4 (H.264/AVC) or alpha-transparent WebM video files.

---

## 2. Key Features

- **Object-Level Motion Synthesis**: Deconstructs designs into independent visual layers rather than applying global image zoom, distortion, or pan.
- **Direct MP4 Video Encoding**: Uses native browser WebCodecs (`VideoEncoder` + `avc1` / H.264) and `mp4-muxer` to produce authentic H.264 MP4 video files with verified `ftyp` file container signatures.
- **True Alpha Channel Video Export**: When Transparent background is selected, exports WebM with VP9 alpha transparency for drag-and-drop video editor overlays.
- **10 API Key Pool & Auto-Rotation**:
  - Ten individually labeled key slots with show/hide password masks.
  - Per-key authentication and latency diagnostics.
  - Live model discovery (`ai.models.list()`).
  - Seamless automatic failover rotation upon encountering `429 RESOURCE_EXHAUSTED` / rate limits.
- **Zero-Key Local Vectorizer Fallback**: Built-in computer vision and vector synthesizer that allows 100% offline generation even without an API key.
- **Interactive Timeline Scrubber**: Play, pause, restart, seek scrubber, 0.5x/1x/2x playback speeds, loop toggle, and frame-accurate indicator.
- **Automated Test Suite**: Built-in compliance runner verifying Tests A through F directly in the UI.

---

## 3. Windows Installation and Startup Guide

### Prerequisites
- Node.js 18+ or 20+ installed on Windows (Download from [nodejs.org](https://nodejs.org/)).
- Chrome, Edge, or any modern Chromium-based browser with WebCodecs support.

### Setup Steps
1. Open PowerShell or Command Prompt in the project folder.
2. Install dependencies:
   ```powershell
   npm install
   ```
3. (Optional) Create a `.env` file from `.env.example`:
   ```powershell
   copy .env.example .env
   ```
   Add your Gemini API key (or configure keys directly in the app's 10-key settings panel):
   ```env
   GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
   ```
4. Start the application:
   ```powershell
   npm run dev
   ```
5. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

---

## 4. 10 API Key Configuration Guide

1. Click the **"10 API Keys"** button in the top navigation bar.
2. Enter your Gemini API key in **Slot #1 (Primary Production Key)**.
3. You can paste additional backup keys into **Slot #2** through **Slot #10**.
4. Click **"Test"** on each slot to check connectivity, measure latency, and discover authorized models.
5. Keep **"Auto-Rotate to next valid key on 429 / Rate Limit"** enabled to ensure uninterrupted workflow when quota limits are reached.

---

## 5. Test Report (Compliance with Section 13)

| Test ID | Test Category | Description | Result | Details |
|---|---|---|---|---|
| **TEST A** | Application | Centered artboard, default White background, controls, background switching | **PASS** | Default background is pure #FFFFFF; switches cleanly between White, Green (#00FF00), Transparent, and Custom color. |
| **TEST B** | Reference Image | File upload validation (PNG, JPG, WebP), layer decomposition | **PASS** | Multi-object segmentation produces distinct animated layers. Rejects invalid non-image formats safely. |
| **TEST C** | API Integration | 10 API key fields, model discovery, quota handling, rotation | **PASS** | 10 slots with show/hide masking, model discovery via `@google/genai`, rotation on 429 quota. |
| **TEST D** | Animation | Independent element movement, spring easing, interaction triggers | **PASS** | Button click states, clapper bell vibration (-20° to +20°), and cursor trajectory move independently. |
| **TEST E** | Video Export | Direct MP4 render, file signature, non-zero bytes, verified playback | **PASS** | Renders genuine H.264 MP4 with `ftyp` box header; verified playback via HTML5 `<video>` element. |
| **TEST F** | Performance | 720p and 1080p frame encoding, deterministic clock | **PASS** | Non-blocking frame loop keeps interface responsive with accurate ETA and progress reporting. |
