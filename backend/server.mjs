import express from 'express';
import dotenv from 'dotenv';
// import jobsRouter from './routes/jobs.js';
import fetch from 'node-fetch'; // if using CommonJS use dynamic import instead
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const app = express();
app.use(express.json({ limit: '5mb' }));

const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/New_York',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
const dateString = formatter.format(new Date());

// Existing jobs API
// app.use('/jobs', jobsRouter);

app.post('/extract', async (req, res) => {
  const prompt = `You are a precise job posting parser. Extract the following fields from the provided HTML snippet of a job posting:
- "position": The job title (e.g., "Software Engineer II").
- "company": The company name. Ensure all proper nouns are correctly capitalized.
- "location": The location in "City, State Abbreviation" format (e.g., "Seattle, WA"). If remote, use "Remote". For international, use "City, Country".
- "requisition_id": The job requisition number or ID, if present. Extract only the ID itself (e.g., "JR12345").
- "date_posted": The date the job was posted, converted to MM/DD/YYYY format. If a relative date is given (e.g., "3 days ago" or "Yesterday"), calculate the absolute date based on the current date: ${dateString}.

Rules:
1. If any field is not found or cannot be determined from the content, use an empty string "" for that field.
2. Do not infer or guess information not present in the HTML snippet.

HTML snippet:
${req.body.pageContents}`;
  
  console.log('Sending to Gemini!');

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'object',
          properties: {
            company: { type: 'string' },
            position: { type: 'string' },
            location: { type: 'string' },
            date_posted: { type: 'string' },
            requisition_id: { type: 'string' }
          },
          required: ['company', 'position', 'location', 'date_posted', 'requisition_id']
        }
      }
    });

    const result = response.text;
    console.log(result);

    res.json({ result });
  } catch (err) {
    console.error('LLM parsing error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/send-to-sheet', async (req, res) => {
  const sheetWebhookUrl = process.env.SHEET_WEBHOOK_URL;
  if (!sheetWebhookUrl) {
    return res.status(500).json({ error: 'Missing SHEET_WEBHOOK_URL in environment' });
  }

  try {
    const response = await fetch(sheetWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Sheet webhook error:', errorText);
      return res.status(500).json({ error: `Sheet webhook failed: ${errorText}` });
    }

    const text = await response.text();
    res.json({ success: true, message: text });
  } catch (err) {
    console.error('Error sending to sheet:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
