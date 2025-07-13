import express from 'express';
import dotenv from 'dotenv';
// import jobsRouter from './routes/jobs.js';
import fetch from 'node-fetch'; // if using CommonJS use dynamic import instead

dotenv.config();

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
  const prompt = `Extract the following job info from the HTML snippet below: "position", "company", "location" in city, state abbreviation format, 
    "requisition_id", and "date_posted" in DD/MM/YYYY format. If needed, for reference, the current date is ${dateString}. Give response as a JSON.

    If the data is not available, have an empty string for that field. Ensure that all proper nouns are correctly capitalized. 
    
    HTML snippet:
    ${req.body.pageContents}`;
  
  console.log('Sending to Gemini!');

  try {
    const llmRes = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': `${process.env.GEMINI_API_KEY}`
      },
      body: JSON.stringify({
        'contents': [
          {
            'parts': [
              {
                'text': prompt
              }
            ]
          }
        ],
        'generationConfig': {
          'responseMimeType': 'application/json',
          'responseSchema': {
            'type': 'OBJECT',
            'properties': {
              'company': { 'type': 'STRING'},
              'position' : { 'type': 'STRING'},
              'location' : { 'type': 'STRING'},
              'date_posted' : { 'type': 'STRING'},
              'requisition_id' : { 'type': 'STRING'}
            },
            "propertyOrdering": ["company", "position", "location", "date_posted", "requisition_id"]
          }
        }
      })
    });

    if (!llmRes.ok) {
      const errorText = await llmRes.text();
      return res.status(500).json({ error: `LLM API error: ${errorText}` });
    }

    const data = await llmRes.json();
    console.log(data);
    const result = data?.candidates?.[0]?.content?.parts?.[0]?.text;
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
