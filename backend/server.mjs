import express from 'express';
import dotenv from 'dotenv';
import jobsRouter from './routes/jobs.js';

dotenv.config();

const app = express();
app.use(express.json());

app.use('/jobs', jobsRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});