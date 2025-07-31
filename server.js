const express = require('express');
const Mercury = require('@postlight/mercury-parser');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.post('/parse', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'Missing URL' });

  try {
    const result = await Mercury.parse(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    });

    res.json({
      title: result.title,
      text: result.textContent
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to parse', details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
