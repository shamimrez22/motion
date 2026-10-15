import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const app = express();
const port = 3000;

// Allow large payloads for base64 image reference uploads
app.use(express.json({ limit: '60mb' }));
app.use(express.urlencoded({ extended: true, limit: '60mb' }));

// Helper to instantiate Gemini client with required User-Agent
function getGeminiClient(key?: string) {
  const apiKey = key || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('No API key provided or configured.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// 1. Test API Key and List Authorized Models
app.post('/api/keys/test', async (req, res) => {
  const { apiKey } = req.body;
  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim() === '') {
    return res.status(400).json({
      valid: false,
      errorType: 'INVALID_INPUT',
      message: 'API Key is empty or invalid format.',
    });
  }

  const cleanKey = apiKey.trim();
  const startTime = Date.now();

  try {
    const ai = getGeminiClient(cleanKey);
    // Fetch available models to verify authentication and project authorization
    const modelsPager = await ai.models.list();
    const modelList: string[] = [];
    
    // Iterate through available models
    for await (const model of modelsPager) {
      if (model.name) {
        modelList.push(model.name.replace(/^models\//, ''));
      }
    }

    const latencyMs = Date.now() - startTime;
    return res.json({
      valid: true,
      latencyMs,
      models: modelList.slice(0, 30),
      message: `Authentication successful! Found ${modelList.length} accessible models.`,
    });
  } catch (err: any) {
    const latencyMs = Date.now() - startTime;
    const errMsg = err?.message || String(err);
    const status = err?.status || (errMsg.includes('403') ? 403 : errMsg.includes('401') ? 401 : errMsg.includes('429') ? 429 : 500);

    let errorType = 'UNKNOWN_ERROR';
    let userMessage = 'Failed to connect to Google GenAI API.';

    if (status === 400 || errMsg.includes('API_KEY_INVALID') || errMsg.includes('API key not valid')) {
      errorType = 'AUTHENTICATION_ERROR';
      userMessage = 'Invalid API key. Please check the key characters and try again.';
    } else if (status === 403 || errMsg.includes('PERMISSION_DENIED')) {
      errorType = 'PERMISSION_DENIED';
      userMessage = 'Permission denied. Ensure the Generative Language API is enabled in your Google Cloud Console project.';
    } else if (status === 429 || errMsg.includes('RESOURCE_EXHAUSTED')) {
      errorType = 'QUOTA_EXCEEDED';
      userMessage = 'Rate limit or quota exceeded for this API key.';
    } else if (errMsg.includes('ENOTFOUND') || errMsg.includes('fetch failed')) {
      errorType = 'NETWORK_ERROR';
      userMessage = 'Network connection to Google GenAI endpoints failed.';
    }

    return res.status(200).json({
      valid: false,
      errorType,
      message: userMessage,
      latencyMs,
      details: errMsg,
    });
  }
});

// 2. Discover Models Endpoint
app.post('/api/models/list', async (req, res) => {
  const { apiKey } = req.body;
  try {
    const ai = getGeminiClient(apiKey);
    const pager = await ai.models.list();
    const models: { name: string; displayName?: string; description?: string }[] = [];

    for await (const m of pager) {
      const cleanName = (m.name || '').replace(/^models\//, '');
      // Filter for generative flash and pro models
      if (cleanName.includes('gemini') || cleanName.includes('flash')) {
        models.push({
          name: cleanName,
          displayName: m.displayName || cleanName,
          description: m.description,
        });
      }
    }

    return res.json({ success: true, models });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to list models',
    });
  }
});

// 0. Configuration Status
app.get('/api/config', (req, res) => {
  res.json({
    hasServerKey: !!process.env.GEMINI_API_KEY,
    defaultModel: 'gemini-3.8-flash',
  });
});

// 3. Analyze Reference Image and Generate Structured Animation Plan
app.post('/api/analyze-image', async (req, res) => {
  const {
    imageBase64,
    mimeType = 'image/png',
    apiKey,
    modelName = 'gemini-3.8-flash',
    stylePreference = 'auto',
    userInstruction = 'Choloman continuous animation video of reference',
  } = req.body;

  if (!imageBase64) {
    return res.status(400).json({ success: false, message: 'Missing imageBase64 data.' });
  }

  // Strip possible data URI header
  const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');

  try {
    const ai = getGeminiClient(apiKey);
    const targetModel = modelName || 'gemini-3.8-flash';

    const systemPrompt = `You are an elite Adobe After Effects Motion Graphics Director and Creative Animator for "SS ICON MOTION STUDIO".
The user uploads a reference image or video frame and requests a high-fidelity continuous motion graphics video ("চলমান অ্যানিমেশন ভিডিও"): "${userInstruction || 'Animate this reference into a stunning continuous motion graphics video'}".

CRITICAL CORE DIRECTIVES (USER MANDATE: "SOB VIDEO TOMARE JETA DICI EITER MOTO HOBE" & "4 TA ANSKHSHEY BAG HOYE DULTECEY EI ROKOM CAINAI"):
1. THE REFERENCE IS THE ABSOLUTE INTACT HERO OF THE VIDEO:
   - The animation video MUST be created directly from the user's uploaded reference!
   - DO NOT arbitrarily chop or slice the image into 4 swinging strips or pendulum dangling parts!
   - By default, provide the complete, uncut hero layer:
     * 'type': 'reference_hero_graphic'
     * 'useImageCutout': true
     * 'sourceCrop': { x: 0, y: 0, width: 100, height: 100 }
     * 'bounds': { x, y, width, height } fitting beautifully on a 16:9 canvas (approx width: 75-85, height: 75-85, centered).
     * 'animation': { entrance: { type: 'pop_spring', startTime: 0.15, duration: 0.9 }, loop: { type: 'camera_glide', speed: 0.8, amplitude: 0.02 } }
   - Only decompose into multiple parts if the user explicitly requests decomposition in their prompt.
   - When layers animate, they must NEVER swing, tilt, or oscillate like dangling pendulums (NO rotational wobbling)!

2. CONTINUOUS MOTION GRAPHICS FLOW (চলমান অ্যানিমেশন ভিডিও):
   - Enhance the scene with smooth, fluid continuous motion:
     * Gentle cinematic camera drift and slow breathing zoom.
     * Radiant specular light sweep across the surface.
     * Vibrant multi-color background palette matching the graphic.
   - NO spinning dashed rings ('path_trajectory') or synthetic bar charts on top unless explicitly requested.

3. RETURN STRICTLY VALID JSON matching the schema.`;

    const userPrompt = userInstruction && userInstruction.trim().length > 0
      ? `Create a continuous motion graphics video ("চলমান অ্যানিমেশন ভিডিও") for this uploaded reference graphic to fulfill instruction: "${userInstruction}". The reference graphic MUST be the central hero of the animation video, kept intact and animated with fluid cinematic motion graphics. Return valid JSON.`
      : `Create a continuous motion graphics video ("চলমান অ্যানিমেশন ভিডিও") for this uploaded reference graphic. The reference graphic MUST be the central animated hero of the video, enhanced with vibrant multi-color harmony, smooth spring entrance, and continuous cinematic drift. Return valid JSON.`;

    const response = await ai.models.generateContent({
      model: targetModel,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType || 'image/png',
              data: cleanBase64,
            },
          },
          { text: userPrompt },
        ],
      },
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        temperature: 0.4,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            category: { 
              type: Type.STRING, 
              enum: ['youtube_interaction', 'device_multiscreen', 'chart_analytics', 'neon_tech', 'notification_badge', 'custom_motion'] 
            },
            palette: {
              type: Type.OBJECT,
              properties: {
                primary: { type: Type.STRING },
                secondary: { type: Type.STRING },
                accent: { type: Type.STRING },
                background: { type: Type.STRING },
                text: { type: Type.STRING },
              },
              required: ['primary', 'accent', 'background'],
            },
            aspectRatio: { type: Type.STRING, enum: ['16:9', '9:16', '1:1'] },
            recommendedDuration: { type: Type.NUMBER },
            description: { type: Type.STRING },
            layers: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  name: { type: Type.STRING },
                  type: { 
                    type: Type.STRING, 
                    enum: [
                      'container',
                      'button',
                      'icon',
                      'text',
                      'cursor',
                      'chart_bar',
                      'progress_ring',
                      'path_trajectory',
                      'particle_emitter',
                      'device_frame',
                      'floating_item',
                      'infinity_snake_stream',
                      'snake_path',
                      'reference_hero_graphic'
                    ] 
                  },
                  layerOrder: { type: Type.NUMBER },
                  bounds: {
                    type: Type.OBJECT,
                    properties: {
                      x: { type: Type.NUMBER, description: 'Percentage 0-100' },
                      y: { type: Type.NUMBER, description: 'Percentage 0-100' },
                      width: { type: Type.NUMBER, description: 'Percentage 0-100' },
                      height: { type: Type.NUMBER, description: 'Percentage 0-100' },
                    },
                    required: ['x', 'y', 'width', 'height'],
                  },
                  sourceCrop: {
                    type: Type.OBJECT,
                    properties: {
                      x: { type: Type.NUMBER, description: 'Source crop X percentage 0-100 in uploaded image' },
                      y: { type: Type.NUMBER, description: 'Source crop Y percentage 0-100 in uploaded image' },
                      width: { type: Type.NUMBER, description: 'Source crop width percentage 0-100' },
                      height: { type: Type.NUMBER, description: 'Source crop height percentage 0-100' },
                    },
                  },
                  useImageCutout: { type: Type.BOOLEAN },
                  styling: {
                    type: Type.OBJECT,
                    properties: {
                      fill: { type: Type.STRING },
                      stroke: { type: Type.STRING },
                      strokeWidth: { type: Type.NUMBER },
                      borderRadius: { type: Type.NUMBER },
                      text: { type: Type.STRING },
                      fontSize: { type: Type.NUMBER },
                      iconType: { type: Type.STRING },
                      glowColor: { type: Type.STRING },
                      glowBlur: { type: Type.NUMBER },
                    },
                  },
                  animation: {
                    type: Type.OBJECT,
                    properties: {
                      entrance: {
                        type: Type.OBJECT,
                        properties: {
                          type: { type: Type.STRING, enum: ['slide_up', 'slide_down', 'slide_left', 'slide_right', 'pop_spring', 'fade', 'draw_stroke', 'none'] },
                          startTime: { type: Type.NUMBER },
                          duration: { type: Type.NUMBER },
                        },
                        required: ['type', 'startTime', 'duration'],
                      },
                      loop: {
                        type: Type.OBJECT,
                        properties: {
                          type: { type: Type.STRING, enum: ['pulse', 'bell_ring', 'bounce', 'float', 'orbit', 'glow_sweep', 'bar_grow', 'orbit_dash', 'snake_slither', 'sine_wave', 'none'] },
                          speed: { type: Type.NUMBER },
                          amplitude: { type: Type.NUMBER },
                        },
                      },
                      interaction: {
                        type: Type.OBJECT,
                        properties: {
                          triggerTime: { type: Type.NUMBER },
                          action: { type: Type.STRING, enum: ['click_burst', 'color_morph', 'bell_vibrate', 'fly_across', 'text_change', 'none'] },
                          targetValue: { type: Type.STRING },
                        },
                      },
                    },
                    required: ['entrance'],
                  },
                },
                required: ['id', 'name', 'type', 'layerOrder', 'bounds', 'animation'],
              },
            },
          },
          required: ['title', 'category', 'palette', 'layers'],
        },
      },
    });

    const rawText = response.text || '';
    let parsedPlan;
    try {
      parsedPlan = JSON.parse(rawText);
    } catch (parseErr) {
      const match = rawText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (match) {
        parsedPlan = JSON.parse(match[1]);
      } else {
        throw new Error('Invalid JSON received from AI model.');
      }
    }

    return res.json({
      success: true,
      modelUsed: targetModel,
      animationPlan: parsedPlan,
    });
  } catch (err: any) {
    console.error('Error analyzing image with Gemini:', err);
    const errMsg = err?.message || String(err);
    const isQuota = errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED');
    const isAuth = errMsg.includes('401') || errMsg.includes('403') || errMsg.includes('API_KEY_INVALID');

    return res.status(200).json({
      success: false,
      errorType: isQuota ? 'QUOTA_EXCEEDED' : isAuth ? 'AUTHENTICATION_ERROR' : 'API_ERROR',
      message: errMsg,
      shouldRotateKey: isQuota,
    });
  }
});

// Mount Vite or serve static build
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(process.cwd(), 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(process.cwd(), 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`[SS ICON MOTION STUDIO] Dev server active on http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
