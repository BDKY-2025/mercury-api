// === Imports ===
const express = require("express");
const puppeteer = require("puppeteer");
const { Readability } = require("@mozilla/readability");
const { JSDOM } = require("jsdom");
const path = require("path");

// === Express Setup ===
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// === Scrape Endpoint ===
app.post("/scrape", async (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: "URL is required" });
  }

  try {
    // === Launch Puppeteer ===
    const chromePath = path.join(
      __dirname,
      "chromium",
      "chrome",
      "linux-138.0.7204.168",
      "chrome-linux64",
      "chrome"
    );

    const browser = await puppeteer.launch({
      headless: true,
      executablePath: chromePath,
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    // === Open New Page and Set Headers ===
    const page = await browser.newPage();

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
    );
    await page.setExtraHTTPHeaders({
      "accept-language": "en-US,en;q=0.9"
    });

    // === Navigate to Target URL (extended timeout) ===
    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 60000 // increase timeout to 60 seconds
    });

    // === Extract HTML and Parse with Readability ===
    const html = await page.content();
    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    await browser.close();

    // === Handle Missing Article ===
    if (!article) {
      return res.status(500).json({ error: "Could not extract article" });
    }

    // === Return Cleaned Article ===
    res.json({
      title: article.title,
      content: article.textContent
    });

  } catch (err) {
    // === Error Handling ===
    console.error("Scraping error:", err);
    res.status(500).json({ error: "Failed to scrape the page" });
  }
});

// === Start Server ===
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
