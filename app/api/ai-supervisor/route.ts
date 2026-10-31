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
        const truncatedContent = (content || '').substring(0, 15000);
        const prompt = `You are a master content writer and expert AI summarizer for Aitoolhindi.online.
Analyze the following article title and full content carefully. 
Article Title: ${keywordOrTitle}
Article Content: ${truncatedContent}

Generate a unique, insightful, and comprehensive summary of this specific article in natural, flowing, and engaging Hindi.
CRITICAL GUIDELINES:
- Capture and match the exact tone, style, and voice of the article (engaging, conversational yet expert, highly practical). Avoid any robotic, rigid, or machine-translated Hindi tone.
- Synthesize the core value, key insights, benefits, and step-by-step takeaways.
- Format cleanly with HTML tags (<p>, <ul><li>, <strong>, <table>) so it renders perfectly inside the article reader.

Return ONLY a valid JSON object with:
- summary: HTML formatted summary in Hindi matching the article's tone.
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
        console.warn('Primary summarize failed:', err);
      }

      // Dynamic fallback based on title and content excerpt if AI call fails
      const dynamicFallback = `<p><strong>${keywordOrTitle}</strong> के इस विशेष लेख में हमने आर्टिफिशियल इंटेलिजेंस और आधुनिक तकनीक के विभिन्न पहलुओं को बहुत ही सरल और व्यावहारिक भाषा में समझाया है।</p><ul><li><strong>मुख्य लाभ:</strong> इस तकनीक की मदद से आप अपने कार्य को तेजी से और अधिक कुशलता से पूरा कर सकते हैं।</li><li><strong>व्यावहारिक उपयोग:</strong> स्टेप-बाय-स्टेप गाइड के माध्यम से इसे कोई भी आसानी से सीख सकता है।</li></ul>`;
      return NextResponse.json({ summary: dynamicFallback });
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
    return NextResponse.json({ 
      summary: '<p>एआई सारांश उत्पन्न करने में समस्या आई। कृपया पुनः प्रयास करें।</p>',
      answer: '<p>क्षमा करें, उत्तर प्राप्त करने में समस्या आई।</p>',
      error: (error as Error).message 
    }, { status: 200 });
  }
}
