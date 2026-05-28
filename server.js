// server.js — Express application entry point

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const recommendRouter = require('./routes/recommend');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files (HTML, CSS, JS)
app.use(express.static(path.join(__dirname)));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/recommend', recommendRouter);

// Fallback: serve index.html for any unmatched GET
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n✓ Skincare Recommender running at http://localhost:${PORT}\n`);
});
