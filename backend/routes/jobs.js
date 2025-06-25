import express from 'express';
import fetch from 'node-fetch';
import pool from '../db.js';

const router = express.Router();

router.post('/extract', async (req, res) => {
  const { htmlSnippet, userId } = req.body;
  if (!htmlSnippet || !userId) {
    return res.status(400).json({ error: 'Missing htmlSnippet or userId' });
  }

  const prompt = `Extract Job Title, Company Name, Location, Requisition ID, Date Posted as JSON from this HTML snippet:\n${htmlSnippet}`;

  try {
    const response = await fetch('http://localhost:3000/groq', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: errorText });
    }

    const { result } = await response.json();
    const jobData = JSON.parse(result);

    const query = `
      INSERT INTO jobs (title, company, location, requisition_id, date_posted, user_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    const values = [
      jobData.title || null,
      jobData.company || null,
      jobData.location || null,
      jobData.requisitionId || null,
      jobData.datePosted || null,
      userId,
    ];

    const dbRes = await pool.query(query, values);

    res.json(dbRes.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
