import { ApiKeySlot, AnimationPlan } from '../types/motion';

const STORAGE_KEY = 'ss_icon_motion_api_keys_v1';
const ACTIVE_KEY_ID = 'ss_icon_motion_active_key_id';
const ROTATION_ENABLED_KEY = 'ss_icon_motion_auto_rotate';

export class ApiClient {
  /**
   * Initialize or retrieve 10 API key slots
   */
  public static getSlots(): ApiKeySlot[] {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length === 10) {
          return parsed;
        }
      } catch (e) {
        console.error('Failed to parse stored API keys:', e);
      }
    }

    // Default 10 slots
    const defaults: ApiKeySlot[] = Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      label: i === 0 ? 'Primary Production Key' : `Backup Key Slot #${i + 1}`,
      key: '',
      status: 'unconfigured',
      models: [],
    }));
    this.saveSlots(defaults);
    return defaults;
  }

  public static saveSlots(slots: ApiKeySlot[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(slots));
  }

  public static getActiveSlotId(): number {
    const val = localStorage.getItem(ACTIVE_KEY_ID);
    return val ? parseInt(val, 10) : 1;
  }

  public static setActiveSlotId(id: number) {
    localStorage.setItem(ACTIVE_KEY_ID, id.toString());
  }

  public static isAutoRotateEnabled(): boolean {
    const val = localStorage.getItem(ROTATION_ENABLED_KEY);
    return val !== 'false'; // default true
  }

  public static setAutoRotateEnabled(enabled: boolean) {
    localStorage.setItem(ROTATION_ENABLED_KEY, enabled ? 'true' : 'false');
  }

  /**
   * Check server configuration (built-in Gemini API key status)
   */
  public static async getServerConfig(): Promise<{ hasServerKey: boolean; defaultModel: string }> {
    try {
      const res = await fetch('/api/config');
      const data = await res.json();
      return {
        hasServerKey: !!data.hasServerKey,
        defaultModel: data.defaultModel || 'gemini-2.5-flash',
      };
    } catch {
      return { hasServerKey: false, defaultModel: 'gemini-2.5-flash' };
    }
  }

  /**
   * Test an individual key against Google GenAI API
   */
  public static async testKey(slotId: number, key: string): Promise<{
    valid: boolean;
    models: string[];
    latencyMs?: number;
    message: string;
    errorType?: string;
  }> {
    try {
      const res = await fetch('/api/keys/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: key }),
      });

      const data = await res.json();
      return data;
    } catch (err: any) {
      return {
        valid: false,
        models: [],
        message: err.message || 'Network request to server failed.',
        errorType: 'NETWORK_ERROR',
      };
    }
  }

  /**
   * Rotate to next valid key slot
   */
  public static rotateToNextValidKey(): ApiKeySlot | null {
    const slots = this.getSlots();
    const currentId = this.getActiveSlotId();
    // Look for next configured slot that hasn't hit quota
    for (let offset = 1; offset <= 10; offset++) {
      const idx = (currentId - 1 + offset) % 10;
      const slot = slots[idx];
      if (slot.key && slot.key.trim() !== '' && slot.status !== 'quota_exceeded' && slot.status !== 'invalid') {
        this.setActiveSlotId(slot.id);
        return slot;
      }
    }
    return null;
  }

  /**
   * Analyze image with Gemini model with automatic key rotation
   */
  public static async analyzeImage(
    imageBase64: string,
    mimeType: string,
    modelName: string = 'gemini-2.5-flash',
    stylePreference: string = 'auto',
    userInstruction: string = 'saper moto animated'
  ): Promise<{ success: boolean; animationPlan?: AnimationPlan; error?: string; keyRotated?: boolean }> {
    const slots = this.getSlots();
    const activeSlot = slots.find((s) => s.id === this.getActiveSlotId());
    const apiKey = activeSlot?.key || '';

    try {
      const res = await fetch('/api/analyze-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64,
          mimeType,
          apiKey,
          modelName,
          stylePreference,
          userInstruction,
        }),
      });

      const data = await res.json();

      if (data.success && data.animationPlan) {
        return { success: true, animationPlan: data.animationPlan };
      }

      // Check if should rotate key
      if (data.shouldRotateKey && this.isAutoRotateEnabled()) {
        const nextSlot = this.rotateToNextValidKey();
        if (nextSlot) {
          // Retry once with rotated key
          const retryRes = await fetch('/api/analyze-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              imageBase64,
              mimeType,
              apiKey: nextSlot.key,
              modelName,
              stylePreference,
              userInstruction,
            }),
          });
          const retryData = await retryRes.json();
          if (retryData.success && retryData.animationPlan) {
            return { success: true, animationPlan: retryData.animationPlan, keyRotated: true };
          }
        }
      }

      return {
        success: false,
        error: data.message || 'Image analysis failed.',
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Network request to analyze image failed.',
      };
    }
  }
}
