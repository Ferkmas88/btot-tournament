#!/usr/bin/env node
// Genera las imagenes hero con Imagen 4 Ultra (modelo mas avanzado de Google para generacion pura).
// Si Ultra no esta disponible en tu cuenta, cae a Imagen 4 Standard, y ultimo recurso a Gemini 3 Pro Image.
// Output: public/generated/*.png

import { writeFile, mkdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI } from '@google/genai';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'public', 'generated');

// --- cargar .env.local manualmente (dotenv/config busca .env, no .env.local) ---
async function loadEnvLocal() {
  const envPath = path.join(ROOT, '.env.local');
  if (!existsSync(envPath)) return;
  const raw = await readFile(envPath, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    const [, key, rawVal] = match;
    const val = rawVal.replace(/^['"]|['"]$/g, '');
    if (!process.env[key]) process.env[key] = val;
  }
}
await loadEnvLocal();

const apiKey = process.env.GOOGLE_AI_API_KEY;
if (!apiKey) {
  console.error('❌ Falta GOOGLE_AI_API_KEY en .env.local');
  process.exit(1);
}
const ai = new GoogleGenAI({ apiKey });

// Modelos en orden de preferencia
const IMAGEN_ULTRA = 'imagen-4.0-ultra-generate-001';
const IMAGEN_STD = 'imagen-4.0-generate-001';
const GEMINI_IMAGE = 'gemini-3-pro-image-preview';

const STYLE =
  'cinematografico, iluminacion calida color ambar y naranja, grano de pelicula 35mm, ' +
  'sombras dramaticas profundas, paleta: negro profundo, rojo sangre (#c23f32), dorado ambar (#e8b454). ' +
  'Composicion editorial, alta calidad, sin texto, sin logos, sin marcas de agua.';

const PROMPTS = [
  {
    name: 'hero-cybercafe',
    aspect: '16:9',
    prompt:
      `Cyber-cafe cubano en el ano 2012, interior penumbroso, fila de PCs beige con monitores CRT corriendo Dota 2, ` +
      `jovenes cubanos concentrados jugando, mouse Logitech brillando suavemente, una bandera cubana en la pared, ` +
      `humedad tropical en el aire, humo de cigarro pasando frente a una lampara de escritorio. ${STYLE}`,
  },
  {
    name: 'prize-mouse',
    aspect: '1:1',
    prompt:
      `Fotografia editorial de un mouse gaming Logitech G502 HERO sobre superficie de marmol negro, ` +
      `LEDs cyan encendidos suavemente, iluminacion volumetrica con rim light rojo y ambar, ` +
      `reflejos en el piso brillante, spotlight dramatico desde arriba, enfoque de producto cinematografico. ${STYLE}`,
  },
  {
    name: 'history-havana',
    aspect: '16:9',
    prompt:
      `Torneo LAN en un aula de La Habana alrededor del 2012, diez monitores CRT amontonados, espectadores apretujados ` +
      `detras de los jugadores, hoja de bracket escrita a mano pegada a la pizarra, sol tropical de tarde entrando por ` +
      `persianas de madera. Caras concentradas, tension competitiva. ${STYLE}`,
  },
  {
    name: 'history-provinces',
    aspect: '16:9',
    prompt:
      `Mapa estilizado de la isla de Cuba al atardecer, cada provincia marcada con un pin rojo brillante, ` +
      `patron sutil de circuito electronico sobre la isla, siluetas tenues de jugadores en teclados flotando sobre los pines ` +
      `en Camaguey, Matanzas, Las Tunas y La Habana. Estetica retrofuturista. ${STYLE}`,
  },
];

async function genWithImagen(model, prompt, aspect) {
  const res = await ai.models.generateImages({
    model,
    prompt,
    config: { numberOfImages: 1, aspectRatio: aspect },
  });
  const img = res?.generatedImages?.[0]?.image;
  if (!img?.imageBytes) throw new Error('Imagen no devolvio bytes');
  return Buffer.from(img.imageBytes, 'base64');
}

async function genWithGemini(prompt) {
  const res = await ai.models.generateContent({
    model: GEMINI_IMAGE,
    contents: prompt,
  });
  const parts = res.candidates?.[0]?.content?.parts ?? [];
  for (const part of parts) {
    const inline = part.inlineData;
    if (inline?.data) return Buffer.from(inline.data, 'base64');
  }
  throw new Error('Gemini no devolvio imagen');
}

async function generate({ name, prompt, aspect }) {
  const outPath = path.join(OUT_DIR, `${name}.png`);

  const attempts = [
    { label: 'Imagen 4 Ultra', fn: () => genWithImagen(IMAGEN_ULTRA, prompt, aspect) },
    { label: 'Imagen 4 Standard', fn: () => genWithImagen(IMAGEN_STD, prompt, aspect) },
    { label: 'Gemini 3 Pro Image', fn: () => genWithGemini(prompt) },
  ];

  for (const { label, fn } of attempts) {
    try {
      console.log(`[${name}] intentando con ${label}...`);
      const buf = await fn();
      await writeFile(outPath, buf);
      console.log(`[${name}] ✓ guardado con ${label} -> ${outPath} (${(buf.length / 1024).toFixed(0)}KB)`);
      return;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`[${name}] ✗ ${label}: ${msg.split('\n')[0]}`);
    }
  }
  console.error(`[${name}] ❌ todos los modelos fallaron`);
}

async function run() {
  if (!existsSync(OUT_DIR)) await mkdir(OUT_DIR, { recursive: true });
  for (const job of PROMPTS) {
    await generate(job);
  }
}

run().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
