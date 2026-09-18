import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Lazy initialize GenAI client
let genAIClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!genAIClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured in the environment.');
    }
    genAIClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return genAIClient;
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'SahajForm API',
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
  });
});

// Translation & Generation API
app.post('/api/generate', async (req, res) => {
  try {
    const { formType, description } = req.body;

    if (!description || typeof description !== 'string' || !description.trim()) {
      return res.status(400).json({
        error: 'Problem description is required.',
      });
    }

    const selectedType = formType || 'General Administrative';
    const ai = getGenAI();

    const systemInstruction = `You are "SahajForm" — an expert administrative letter drafting assistant specialized in Indian governance and citizen grievance redressing.
Indian citizens frequently speak or write their grievances informally in casual Hindi, Hinglish, regional dialects (Bhojpuri, Maithili, Haryanvi, Rajasthani, Awadhi, Marathi-Hindi mix, colloquial street speech, or broken English).
Your mission is to understand their informal problem description and translate/restructure it into two pristine, dignified, highly polite, formal official application/complaint letters:
1. One in formal British/Indian administrative English.
2. One in formal Devanagari Hindi (शुद्ध शासकीय एवं शिष्टाचारयुक्त प्रशासनिक हिंदी).

CRITICAL RULES:
- STRICT FIDELITY TO FACTS: NEVER invent or hallucinate facts, dates, ticket numbers, meter numbers, or addresses that the user did not specify.
- BILINGUAL UNIFIED PLACEHOLDERS: Whenever crucial official information is missing (such as applicant full name, specific residential address, consumer/meter number, ration card number, FIR reference, date of incident, contact phone), ALWAYS use clear bracketed placeholders with concise English labels in BOTH letters: e.g., [Full Name], [Complete Address], [Consumer Number], [Contact Number], [Date of Incident]. In the Hindi letter, use the exact same English bracket labels (e.g., मैं, [Full Name], निवासी [Complete Address], दूरभाष [Contact Number]...) so that when the citizen provides a value, it seamlessly replaces the placeholder across BOTH the English and Hindi letters simultaneously.
- TONE: Respectful, humble yet firm, clear, polite, and adhering to Indian bureaucratic conventions (To, Designation, Department, Subject, Salutation, Facts, Hardship, Humble Prayer/Remedy sought, Closing, Enclosures).
- ACCURATE RECIPIENT: Choose the standard Indian department designation based on the form type (e.g. The Sub-Divisional Magistrate, The Station House Officer (SHO), The Executive Engineer / Assistant Engineer (Electricity Distribution), The District Supply Officer / Food & Civil Supplies, The Public Information Officer (PIO under RTI Act 2005), The Principal / Headmaster).
- STRICT JSON OUTPUT matching the response schema exactly.`;

    const userPrompt = `Form Type / Category: ${selectedType}
User's Informal Description:
"""
${description.trim()}
"""

Analyze the user's text and return:
1. detected_language: Exact dialect or language detected (e.g., "Hinglish (Colloquial Hindi in Roman script)", "Bhojpuri-inflected Hindi", "Colloquial Devanagari Hindi", "Haryanvi Hindi dialect", "Informal Broken English", etc.)
2. summary: A crisp one-sentence factual summary of the core grievance or application.
3. formal_english: The full formal administrative application letter in English, ready to be printed or submitted.
4. formal_hindi: The full formal administrative application letter in Hindi (औपचारिक शासकीय प्रार्थना पत्र), ready to be printed or submitted.
5. missing_info: An array of strings listing the exact bracket tags used in the letters that the citizen must fill in (e.g., ["Full Name", "Complete Address", "Consumer Number", "Contact Number"]).`;

    const candidateModels = ['gemini-3.5-flash', 'gemini-3.8-flash', 'gemini-flash-latest'];
    let lastError: any = null;
    let responseText: string | undefined = undefined;

    for (const modelName of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: userPrompt,
          config: {
            systemInstruction,
            temperature: 0.2,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                detected_language: {
                  type: Type.STRING,
                  description: 'The detected dialect or language of the user input.',
                },
                summary: {
                  type: Type.STRING,
                  description: 'Crisp one-line summary of the core issue.',
                },
                formal_english: {
                  type: Type.STRING,
                  description: 'Full formal English application letter with proper layout and bracketed placeholders.',
                },
                formal_hindi: {
                  type: Type.STRING,
                  description: 'Full formal Hindi application letter with proper Devanagari layout and bracketed placeholders.',
                },
                missing_info: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.STRING,
                  },
                  description: 'List of key missing pieces of information that citizen must fill in.',
                },
              },
              required: [
                'detected_language',
                'summary',
                'formal_english',
                'formal_hindi',
                'missing_info',
              ],
            },
          },
        });

        if (response && response.text) {
          responseText = response.text;
          break;
        }
      } catch (err: any) {
        console.warn(`Model ${modelName} failed or busy, trying fallback:`, err.message);
        lastError = err;
      }
    }

    if (!responseText) {
      throw lastError || new Error('All candidate Gemini models were unavailable. Please try again in a moment.');
    }

    const parsedData = JSON.parse(responseText);
    return res.json(parsedData);
  } catch (error: any) {
    console.error('Error generating official form:', error);
    return res.status(500).json({
      error: error.message || 'An error occurred while generating the letter. Please try again.',
    });
  }
});

// Vite or static serving
async function setupServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SahajForm server running at http://0.0.0.0:${PORT}`);
  });
}

setupServer();
