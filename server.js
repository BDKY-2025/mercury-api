// Imports and Setup
const express = require("express");
const puppeteer = require("puppeteer");
const { Readability } = require("@mozilla/readability");
const { JSDOM } = require("jsdom");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Endpoint: POST /scrape
app.post("/scrape", async (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: "URL is required" });
  }

  try {
    // Launch Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      executablePath: "/opt/render/.cache/puppeteer/chrome/linux-138.0.7204.168/chrome-linux64/chrome",
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    // Navigate and Scrape
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });

    // Extract Content
    const html = await page.content();
    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    await browser.close();

    if (!article) {
      return res.status(500).json({ error: "Could not extract article" });
    }

    // Respond with Parsed Content
    res.json({
      title: article.title,
      content: article.textContent
    });

  } catch (err) {
    console.error("Scraping error:", err);
    res.status(500).json({ error: "Failed to scrape the page" });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
