import express from 'express';
import dotenv from 'dotenv';
// import jobsRouter from './routes/jobs.js';
import fetch from 'node-fetch'; // if using CommonJS use dynamic import instead

dotenv.config();

const app = express();
app.use(express.json());

// Existing jobs API
// app.use('/jobs', jobsRouter);

// New /extract endpoint for the extension
app.post('/extract', async (req, res) => {
  const { prompt } = req.body;
  console.log(prompt);

  if (!prompt) {
    return res.status(400).json({ error: 'Missing prompt' });
  }

  try {
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama3-70b-8192',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    if (!groqRes.ok) {
      const errorText = await groqRes.text();
      return res.status(500).json({ error: `Groq API error: ${errorText}` });
    }

    const json = await groqRes.json();
    const result = json.choices?.[0]?.message?.content;
    console.log(result);

    res.json({ result });
  } catch (err) {
    console.error('Groq error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/send-to-sheet', async (req, res) => {
  const sheetWebhookUrl = process.env.SHEET_WEBHOOK_URL;
  if (!sheetWebhookUrl) {
    return res.status(500).json({ error: "Missing SHEET_WEBHOOK_URL in environment" });
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
