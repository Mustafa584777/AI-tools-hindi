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

// Most efficient, lowest cost model according to Google Gemini guidelines
const PRIMARY_MODEL = "gemini-3.1-flash-lite";
const FALLBACK_MODEL = "gemini-flash-latest";

async function generateWithFallback(params: { prompt: string; schema?: any; isJson?: boolean }) {
  const models = [PRIMARY_MODEL, FALLBACK_MODEL];
  let lastError: any = null;

  for (const model of models) {
    try {
      const config: any = {};
      if (params.isJson && params.schema) {
        config.responseMimeType = "application/json";
        config.responseSchema = params.schema;
      }
      const response = await ai.models.generateContent({
        model,
        contents: params.prompt,
        config: Object.keys(config).length > 0 ? config : undefined,
      });
      if (response && response.text) {
        return response.text;
      }
    } catch (err: any) {
      console.warn(`Model ${model} failed:`, err?.message || err);
      lastError = err;
    }
  }

  throw lastError || new Error("All AI models failed");
}

function parseJsonSafe(text: string, fallback: any) {
  if (!text) return fallback;
  try {
    let clean = text.trim();
    if (clean.startsWith('```json')) {
      clean = clean.replace(/^```json/, '').replace(/```$/, '').trim();
    } else if (clean.startsWith('```')) {
      clean = clean.replace(/^```/, '').replace(/```$/, '').trim();
    }
    return JSON.parse(clean);
  } catch (e) {
    console.warn('JSON parse failed for text:', text, e);
    return fallback;
  }
}

function cleanHtmlToText(html: string): string {
  if (!html) return '';
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<figcaption[^>]*>.*?<\/figcaption>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, keywordOrTitle, content, question } = body;

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

      const schema = {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          slug: { type: Type.STRING },
          category: { type: Type.STRING },
          excerpt: { type: Type.STRING },
          content: { type: Type.STRING }
        },
        required: ["title", "slug", "category", "excerpt", "content"]
      };

      const resultText = await generateWithFallback({ prompt, schema, isJson: true });
      const json = parseJsonSafe(resultText, {});
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

      const schema = {
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
      };

      const resultText = await generateWithFallback({ prompt, schema, isJson: true });
      const json = parseJsonSafe(resultText, {});
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

      const schema = {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          excerpt: { type: Type.STRING },
          content: { type: Type.STRING }
        },
        required: ["title", "excerpt", "content"]
      };

      const resultText = await generateWithFallback({ prompt, schema, isJson: true });
      const json = parseJsonSafe(resultText, {});
      return NextResponse.json(json);
    }

    if (action === 'summarize') {
      const plainText = cleanHtmlToText(content).substring(0, 20000);
      const prompt = `You are a master content writer for Aitoolhindi.online.
Carefully read and analyze the following Hindi article:
Article Title: ${keywordOrTitle}
Full Article Text:
${plainText}

TASK:
Generate a thorough, practical, and highly engaging real-time summary of this specific article in natural Hindi.
Analyze what the author is teaching, which tools/features are discussed, and what practical advice is provided.
Structure your response strictly using clean HTML:
1. <p class="mb-3 leading-relaxed text-slate-800"> (2-3 sentences introducing the article's core topic, why it matters, and the primary tool or solution discussed)</p>
2. <h4 class="font-bold text-base mt-4 mb-2 text-slate-900">मुख्य बिंदु और टेकअवे (Key Takeaways):</h4>
3. <ul class="list-disc pl-5 space-y-2 text-slate-800">
   (Include 4 to 6 specific, actionable takeaways directly extracted from the article's real content with <strong>topics in bold</strong>)
   </ul>
4. <p class="mt-3 leading-relaxed text-slate-800"> (1-2 sentences concluding advice for the reader)</p>

DO NOT output any markdown backticks like \`\`\`html. Return ONLY the HTML tags.`;

      try {
        const text = await generateWithFallback({ prompt });
        let cleanHtml = (text || '').trim();
        if (cleanHtml.startsWith('```html')) {
          cleanHtml = cleanHtml.replace(/^```html/, '').replace(/```$/, '').trim();
        } else if (cleanHtml.startsWith('```')) {
          cleanHtml = cleanHtml.replace(/^```/, '').replace(/```$/, '').trim();
        }

        if (cleanHtml) {
          return NextResponse.json({ summary: cleanHtml });
        }
      } catch (err: any) {
        console.error('Summarize error:', err);
      }

      // If AI fails completely due to unexpected network issue, build a summary directly from the article's text
      const articleSnippets = plainText.split(/[।.\n]/).filter(s => s.trim().length > 25).slice(0, 4);
      const contextualSummary = `
        <p class="mb-3 leading-relaxed text-slate-800"><strong>${keywordOrTitle}</strong> के इस विस्तृत लेख में लेखक ने मुख्य रूप से निम्नलिखित व्यावहारिक जानकारियों को साझा किया है:</p>
        <h4 class="font-bold text-base mt-4 mb-2 text-slate-900">लेख से मुख्य बिंदु:</h4>
        <ul class="list-disc pl-5 space-y-2 text-slate-800">
          ${articleSnippets.map(s => `<li>${s.trim()}।</li>`).join('')}
        </ul>
        <p class="mt-3 leading-relaxed text-slate-800">इस तकनीक को अपने दैनिक कार्यों में अपनाकर आप अपनी कार्यक्षमता को कई गुना बढ़ा सकते हैं।</p>
      `;
      return NextResponse.json({ summary: contextualSummary });
    }

    if (action === 'question') {
      const plainText = cleanHtmlToText(content).substring(0, 15000);
      const prompt = `You are a helpful AI assistant for readers of Aitoolhindi.online.
The user is reading the following article:
Article Title: ${keywordOrTitle}
Article Context:
${plainText}

User's Question: "${question || ''}"

Answer the user's question accurately, helpfully, and in easy natural Hindi based on the article's contents whenever relevant.
Format cleanly with HTML tags like <p>, <strong>, and <ul><li>. Return ONLY the HTML snippet, no markdown code fences.`;

      try {
        const text = await generateWithFallback({ prompt });
        let cleanHtml = (text || '').trim();
        if (cleanHtml.startsWith('```html')) {
          cleanHtml = cleanHtml.replace(/^```html/, '').replace(/```$/, '').trim();
        } else if (cleanHtml.startsWith('```')) {
          cleanHtml = cleanHtml.replace(/^```/, '').replace(/```$/, '').trim();
        }

        if (cleanHtml) {
          return NextResponse.json({ answer: cleanHtml });
        }
      } catch (err: any) {
        console.error('Question AI error:', err);
      }

      return NextResponse.json({
        answer: `<p>आपके प्रश्न "<strong>${question || ''}</strong>" के अनुसार, इस लेख में बताए गए सुझावों और तकनीकों का पालन करके आप इसे आसानी से सीख सकते हैं।</p>`
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('AI Supervisor error:', error);
    return NextResponse.json({ 
      summary: '<p>एआई सारांश उत्पन्न करने में समस्या आई। कृपया पुनः प्रयास करें।</p>',
      answer: '<p>क्षमा करें, उत्तर प्राप्त करने में समस्या आई।</p>',
      error: error?.message || 'Internal server error' 
    }, { status: 200 });
  }
}
