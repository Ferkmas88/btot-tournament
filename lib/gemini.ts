import { GoogleGenAI } from '@google/genai';

// "Nano Banana 2" is the community nickname for Gemini 3 Pro Image.
// Model id per Google AI docs. If the id ever changes, update here only.
export const NANO_BANANA_2_MODEL = 'gemini-3-pro-image';

let client: GoogleGenAI | null = null;

export function getGemini() {
  if (client) return client;
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) throw new Error('GOOGLE_AI_API_KEY not set');
  client = new GoogleGenAI({ apiKey });
  return client;
}

export type GeneratedImage = {
  mimeType: string;
  base64: string;
};

export async function generateImage(prompt: string): Promise<GeneratedImage> {
  const ai = getGemini();
  const response = await ai.models.generateContent({
    model: NANO_BANANA_2_MODEL,
    contents: prompt,
  });

  const parts = response.candidates?.[0]?.content?.parts ?? [];
  for (const part of parts) {
    const inline = (part as { inlineData?: { mimeType?: string; data?: string } }).inlineData;
    if (inline?.data) {
      return {
        mimeType: inline.mimeType ?? 'image/png',
        base64: inline.data,
      };
    }
  }
  throw new Error('Gemini returned no image');
}
