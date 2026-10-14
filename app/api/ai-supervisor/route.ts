import { GoogleGenAI, Type } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

export async function POST(req: NextRequest) {
  try {
    const { action, keywordOrTitle, content } = await req.json();

    if (action === 'generate') {
      const prompt = `You are a professional Hindi AI content writer and SEO expert for Aitoolhindi.online. 
Write a comprehensive, high-quality, SEO-optimized Hindi tutorial post about: "${keywordOrTitle}".
Return ONLY a valid JSON object with the following properties:
- title: catchy Hindi tutorial title
- slug: url slug (hyphen-separated lowercase english or transliterated slug)
- category: category name (e.g. AI Guides, ChatGPT Tutorials, AI Image Generation)
- excerpt: 2 sentence summary in Hindi
- content: full HTML formatted article content in Hindi with headings (<h1>, <h2>, <h3>), paragraphs (<p>), bullet points (<ul><li>), and bold text (<strong>).
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              slug: { type: Type.STRING },
              category: { type: Type.STRING },
              excerpt: { type: Type.STRING },
              content: { type: Type.STRING }
            },
            required: ["title", "slug", "category", "excerpt", "content"]
          }
        }
      });

      const json = JSON.parse(response.text || '{}');
      return NextResponse.json(json);
    }

    if (action === 'analyze') {
      const prompt = `You are an expert AI SEO Supervisor and E-E-A-T Auditor. 
Analyze the following Hindi article content:
Title: ${keywordOrTitle}
Content: ${content}

Provide a detailed SEO and quality analysis in JSON format with:
- seoScore: number between 0 and 100
- eeatScore: number between 0 and 100
- rankingChances: string (e.g. "High (85%)", "Medium (60%)")
- mistakes: array of strings pointing out SEO, grammar, or formatting mistakes
- competitorComparison: a brief comparison text explaining how this article compares to top competitors and how to outrank them.
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              seoScore: { type: Type.INTEGER },
              eeatScore: { type: Type.INTEGER },
              rankingChances: { type: Type.STRING },
              mistakes: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              competitorComparison: { type: Type.STRING }
            },
            required: ["seoScore", "eeatScore", "rankingChances", "mistakes", "competitorComparison"]
          }
        }
      });

      const json = JSON.parse(response.text || '{}');
      return NextResponse.json(json);
    }

    if (action === 'optimize') {
      const prompt = `You are a professional Hindi AI content writer and SEO optimization expert for Aitoolhindi.online.
Review and fully optimize the following Hindi article title and content to fix all SEO, grammar, and formatting mistakes, improve readability, maximize EEAT score, and ensure top Google ranking in India.
Title: ${keywordOrTitle}
Content: ${content}

Return ONLY a valid JSON object with:
- title: optimized Hindi title
- excerpt: optimized 2-sentence summary in Hindi
- content: fully optimized HTML formatted article content in Hindi with proper headings (<h1>, <h2>, <h3>), paragraphs (<p> with proper spacing classes or clean HTML tags), and bold text (<strong>).
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              excerpt: { type: Type.STRING },
              content: { type: Type.STRING }
            },
            required: ["title", "excerpt", "content"]
          }
        }
      });

      const json = JSON.parse(response.text || '{}');
      return NextResponse.json(json);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('AI Supervisor error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
