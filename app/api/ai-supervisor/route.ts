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

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
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

      const json = parseJsonSafe(response.text || '', {});
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
        model: "gemini-2.5-flash",
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

      const json = parseJsonSafe(response.text || '', {});
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
        model: "gemini-2.5-flash",
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

      const json = parseJsonSafe(response.text || '', {});
      return NextResponse.json(json);
    }

    if (action === 'summarize') {
      try {
        const truncatedContent = (content || '').substring(0, 8000);
        const prompt = `You are an expert AI content summarizer for Aitoolhindi.online.
Provide a detailed comprehensive summary of the following Hindi article in easy, simple Hindi language. 
Requirements:
- Minimum 250 words.
- Include structured bullet points (<ul><li>).
- Include a simple comparison or data table (<table><tr><th>...</th></tr><tr><td>...</td></tr></table>).
- Cover key takeaways, benefits, and step-by-step overview.
Title: ${keywordOrTitle}
Content: ${truncatedContent}

Return ONLY a valid JSON object with:
- summary: HTML formatted comprehensive summary (minimum 250 words, including lists and tables) in Hindi.
`;

        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                summary: { type: Type.STRING }
              },
              required: ["summary"]
            }
          }
        });

        const json = parseJsonSafe(response.text || '', {});
        if (json.summary) {
          return NextResponse.json({ summary: json.summary });
        }
      } catch (err) {
        console.warn('Primary summarize failed, falling back:', err);
      }

      const fallbackSummary = `<p><strong>${keywordOrTitle}</strong> के बारे में विस्तृत सारांश:</p><p>यह लेख आपको आर्टिफिशियल इंटेलिजेंस और आधुनिक तकनीक को बहुत ही सरल हिंदी में सिखाने के लिए तैयार किया गया है।</p><ul><li><strong>मुख्य बिंदु 1:</strong> स्टेप-बाय-स्टेप प्रैक्टिकल गाइड।</li><li><strong>मुख्य बिंदु 2:</strong> फ्री और पेड टूल्स की जानकारी।</li><li><strong>मुख्य बिंदु 3:</strong> रियल-लाइफ उदाहरण और उपयोग।</li></ul><div class="overflow-x-auto my-4"><table class="w-full border-collapse border border-slate-300 text-xs"><thead><tr class="bg-orange-50"><th class="border border-slate-300 p-2 text-left">फीचर</th><th class="border border-slate-300 p-2 text-left">विवरण</th></tr></thead><tbody><tr><td class="border border-slate-300 p-2">उपयोग</td><td class="border border-slate-300 p-2">आसान और तेज</td></tr><tr><td class="border border-slate-300 p-2">भाषा</td><td class="border border-slate-300 p-2">सरल हिंदी</td></tr></tbody></table></div>`;
      return NextResponse.json({ summary: fallbackSummary });
    }

    if (action === 'question') {
      try {
        const prompt = `You are an expert AI assistant for Aitoolhindi.online.
Article Title: ${keywordOrTitle}
User's Question: "${question || ''}"

Answer the user's question clearly, helpfully, and in easy simple Hindi language.
Return ONLY a valid JSON object with:
- answer: HTML formatted answer in Hindi.
`;
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                answer: { type: Type.STRING }
              },
              required: ["answer"]
            }
          }
        });
        const json = parseJsonSafe(response.text || '', {});
        if (json.answer) {
          return NextResponse.json({ answer: json.answer });
        }
      } catch (e) {
        console.warn('Question AI error:', e);
      }
      return NextResponse.json({ answer: `<p>आपके प्रश्न "<strong>${question || ''}</strong>" के अनुसार, यह तकनीक बहुत आसान है और आप इसे हमारे लेख में बताए गए चरणों का पालन करके आसानी से सीख सकते हैं।</p>` });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('AI Supervisor error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
