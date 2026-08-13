import express from 'express';
const app = express();
app.use(express.json());
app.get('/', (req, res) => res.json({ status: 'ok', message: 'API is running' }));
export default app;
