#!/usr/bin/env node
// Pre-generate hero / section images with Gemini 3 Pro Image (a.k.a. "Nano Banana 2").
// Run once (or when you want to refresh): npm run generate-images
// Outputs to public/generated/*.png and is imported by components via <Image src="/generated/X.png" />.

import { writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI } from '@google/genai';
import 'dotenv/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(__dirname, '..', 'public', 'generated');
const MODEL = 'gemini-3-pro-image';

const apiKey = process.env.GOOGLE_AI_API_KEY;
if (!apiKey) {
  console.error('Missing GOOGLE_AI_API_KEY in .env.local');
  process.exit(1);
}
const ai = new GoogleGenAI({ apiKey });

const SHARED_STYLE =
  'cinematic, warm amber lighting, film grain, slight CRT scanlines, dramatic shadows, ' +
  'color palette: deep black, blood red (#c23f32), amber gold (#e8b454), muted white. ' +
  '16:9 aspect ratio. High detail. No text, no logos, no watermarks.';

const PROMPTS = [
  {
    name: 'hero-cybercafe',
    prompt:
      `A nostalgic Cuban cyber-cafe in 2010, dimly lit, row of beige CRT-era PCs ` +
      `running Dota 2, young Cuban players hunched over keyboards with intense focus, ` +
      `Logitech mice glowing faintly, a Cuban flag pinned to the wall, tropical humidity ` +
      `in the air, cigar smoke curling past a desk lamp. ${SHARED_STYLE}`,
  },
  {
    name: 'prize-mouse',
    prompt:
      `Hero product shot of a Logitech G502 HERO gaming mouse on a black marble surface, ` +
      `cyan accent LEDs glowing, volumetric red-amber rim lighting, reflective floor, ` +
      `dramatic spotlight from above, cinematic product photography. ${SHARED_STYLE}`,
  },
  {
    name: 'history-havana',
    prompt:
      `A LAN tournament scene in a classroom in La Habana around 2012, ten CRT monitors ` +
      `packed tight, spectators crowded behind players, handwritten bracket sheet taped to ` +
      `the blackboard, afternoon tropical sun through louvered windows. ${SHARED_STYLE}`,
  },
  {
    name: 'history-provinces',
    prompt:
      `A stylized map of Cuba at dusk, each province marked with a glowing red pin, ` +
      `subtle circuit-board pattern overlaid on the island, faint silhouettes of players ` +
      `at keyboards floating above pins for Camaguey, Matanzas, Las Tunas, La Habana. ${SHARED_STYLE}`,
  },
];

async function run() {
  if (!existsSync(OUT_DIR)) await mkdir(OUT_DIR, { recursive: true });

  for (const { name, prompt } of PROMPTS) {
    const outPath = path.join(OUT_DIR, `${name}.png`);
    console.log(`[${name}] generating...`);
    try {
      const response = await ai.models.generateContent({ model: MODEL, contents: prompt });
      const parts = response.candidates?.[0]?.content?.parts ?? [];
      let saved = false;
      for (const part of parts) {
        const inline = part.inlineData;
        if (inline?.data) {
          await writeFile(outPath, Buffer.from(inline.data, 'base64'));
          console.log(`[${name}] saved -> ${outPath}`);
          saved = true;
          break;
        }
      }
      if (!saved) console.warn(`[${name}] no image in response`);
    } catch (err) {
      console.error(`[${name}] error:`, err instanceof Error ? err.message : err);
    }
  }
}

run();
