import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type GeminiPart = { text?: string };
type GeminiCandidate = { content?: { parts?: GeminiPart[] } };
type GeminiResponse = { candidates?: GeminiCandidate[] };

@Injectable()
export class GeminiProviderService {
  private readonly apiKey?: string;
  private readonly model: string;

  constructor(config: ConfigService) {
    this.apiKey = config.get<string>('GEMINI_API_KEY');
    this.model = config.get<string>('GEMINI_MODEL') ?? 'gemini-1.5-flash';
  }

  get configured() {
    return Boolean(this.apiKey);
  }

  async generateJson(prompt: string): Promise<unknown> {
    if (!this.apiKey) {
      throw new ServiceUnavailableException('GEMINI_API_KEY is not configured.');
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new ServiceUnavailableException(`Gemini generation failed: ${errorText}`);
    }

    const payload = (await response.json()) as GeminiResponse;
    const text = payload.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('').trim();
    if (!text) {
      throw new ServiceUnavailableException('Gemini returned an empty generation.');
    }

    return JSON.parse(text) as unknown;
  }
}
