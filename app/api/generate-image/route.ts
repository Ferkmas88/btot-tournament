import { NextResponse } from 'next/server';
import { generateImage } from '@/lib/gemini';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const { prompt } = (await request.json()) as { prompt?: string };
    if (!prompt || typeof prompt !== 'string' || prompt.length > 2000) {
      return NextResponse.json({ error: 'invalid prompt' }, { status: 400 });
    }
    const image = await generateImage(prompt);
    return NextResponse.json({
      dataUrl: `data:${image.mimeType};base64,${image.base64}`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
