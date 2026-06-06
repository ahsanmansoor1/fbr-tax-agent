import 'dotenv/config.js';
import express from 'express';
import Anthropic from '@anthropic-ai/sdk';

const app = express();
const port = 3001;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

app.use(express.json());

const SYSTEM_PROMPT = `You are a knowledgeable and helpful FBR (Federal Board of Revenue) tax filing assistant for Pakistan.
You help individuals and businesses understand and complete their tax filing obligations under Pakistani tax law.

Key areas of expertise:
- Salaried employees: salary income declaration, tax deducted at source, employer certificates, rebates, and refunds
- Business owners: business income, advance tax, quarterly payments, withholding agents, and expense deductions
- Combined filers (salaried + business): how to report multiple income sources
- FBR IRIS portal guidance: registration, filing returns, payment challans
- Tax rates, slabs, and exemptions applicable under the Income Tax Ordinance 2001
- Filer vs non-filer status and its implications
- Common deductions: zakat, donations, investments in specified instruments
- Filing deadlines and penalties for late filing
- Wealth statements and foreign assets declaration

IMPORTANT RULES:
- Individuals use their CNIC as their tax identifier. There is no separate NTN for individuals since 2021. Never ask for or mention NTN for individual filers.
- Ask questions strictly ONE AT A TIME. Wait for the user's answer before asking the next question.
- Never ask more than one question per message.

Be clear, concise, and use simple language. When appropriate, guide users step by step.
If you are unsure about something, say so and recommend consulting a tax professional or the official FBR website (fbr.gov.pk).
Respond in a friendly, professional manner. Mix English with Urdu terms where natural (e.g., "riayat" for rebate, "ghair faailee" for non-filer) when helpful for clarity.`;

app.post('/ask', async (req, res) => {
  const { message, history } = req.body;

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({ error: 'Message is required.' });
  }

  try {
    const messages = [];

    if (Array.isArray(history)) {
      for (const turn of history) {
        if (
          turn &&
          (turn.role === 'user' || turn.role === 'assistant') &&
          typeof turn.content === 'string' &&
          turn.content.trim().length > 0
        ) {
          messages.push({ role: turn.role, content: turn.content });
        }
      }
    }

    messages.push({ role: 'user', content: message.trim() });

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages,
    });

    const reply = response.content.find((b) => b.type === 'text')?.text ?? '';
    res.json({ reply });
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) {
      return res.status(401).json({ error: 'Invalid API key. Please check ANTHROPIC_API_KEY.' });
    }
    if (err instanceof Anthropic.RateLimitError) {
      return res.status(429).json({ error: 'Rate limit reached. Please try again shortly.' });
    }
    console.error('Anthropic API error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => {
  const apiKeyPreview = process.env.ANTHROPIC_API_KEY?.slice(0, 10) || 'NOT SET';
  console.log(`FBR API server running at http://localhost:${port}`);
  console.log(`ANTHROPIC_API_KEY loaded: ${apiKeyPreview}...`);
});
